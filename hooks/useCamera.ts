'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { trackEvent } from '@/lib/analytics/posthog'

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'error'
  | 'unavailable'

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '::1' ||
    h.endsWith('.localhost')
  )
}

/**
 * Encapsule toute la logique caméra : support, permissions, contexte sécurisé
 * (HTTPS requis sur iOS Safari), nettoyage et tracking des cas limites.
 */
export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Ref pour toujours stopper le dernier stream (évite le bug de closure
  // périmée dans le cleanup au démontage).
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStream(null)
    setStatus('idle')
    setError(null)
  }, [])

  const requestCamera = useCallback(async () => {
    setError(null)
    setStatus('requesting')
    trackEvent('camera_permission_requested')

    // iOS Safari (et autres) exigent un contexte sécurisé (HTTPS), sauf localhost.
    if (
      typeof window !== 'undefined' &&
      window.isSecureContext === false &&
      !isLocalhost()
    ) {
      trackEvent('camera_https_error')
      setError(
        'La caméra nécessite une connexion sécurisée (HTTPS). Ouvre le site en https://, ou uploade une photo.'
      )
      setStatus('error')
      return
    }

    // Support de l'API.
    if (!navigator.mediaDevices?.getUserMedia) {
      trackEvent('camera_unavailable', { reason: 'unsupported' })
      setError('Aucune caméra détectée')
      setStatus('unavailable')
      return
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          // 4:3 = aspect natif des caméras frontales → champ de vision complet.
          // Forcer du portrait 9:16 recadrait le capteur (effet "zoom" sur mobile).
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      setStatus('active')
      trackEvent('camera_permission_granted')
    } catch (err) {
      const name = err instanceof DOMException ? err.name : 'UnknownError'

      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setStatus('denied')
        setError('Accès caméra refusé')
        trackEvent('camera_permission_denied', { reason: name })
      } else if (
        name === 'NotFoundError' ||
        name === 'DevicesNotFoundError' ||
        name === 'OverconstrainedError'
      ) {
        setStatus('unavailable')
        setError('Aucune caméra détectée')
        trackEvent('camera_unavailable', { reason: name })
      } else {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Erreur caméra')
      }
    }
  }, [])

  // Cleanup au démontage : libère toujours la caméra.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  return { stream, status, error, requestCamera, stopCamera }
}
