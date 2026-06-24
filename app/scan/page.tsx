'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ImageUp, Sun, Sparkles, Wind, X } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/posthog'
import { compressImage, dataUrlByteSize } from '@/lib/image'
import { useCamera } from '@/hooks/useCamera'

const INK = '#1F1B16'
const CREAM = '#FAF6EE'
const TERRACOTTA = '#C8755A'

const RESTART_FLAG = 'scan_camera_restart'

const ANNOTATIONS = [
  'Détection du sous-ton',
  'Analyse de la texture',
  'Évaluation de l’hydratation',
]

const GUIDE_TIPS = [
  { icon: Sun, label: 'Lumière naturelle de face' },
  { icon: Sparkles, label: 'Sans maquillage si possible' },
  { icon: Wind, label: 'Cheveux dégagés du visage' },
]

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display text-[22px] font-medium tracking-tight ${className}`}
    >
      Mira
    </span>
  )
}

export default function ScanPage() {
  const router = useRouter()
  const { stream, status, error, requestCamera, stopCamera } = useCamera()

  const [showInAppWarning, setShowInAppWarning] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showReauthHelp, setShowReauthHelp] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [flash, setFlash] = useState(false)
  const [captured, setCaptured] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const didInit = useRef(false)

  // --- Montage : tracking, détection in-app, redémarrage caméra (retour) ---
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    trackEvent('scan_page_viewed')

    const isInAppBrowser =
      /Instagram|FBAV|FBAN|TikTok|Snapchat|Line|WhatsApp/i.test(
        navigator.userAgent
      )
    if (isInAppBrowser) {
      trackEvent('in_app_browser_detected')
      setShowInAppWarning(true)
      return
    }

    // Retour arrière depuis /analyzing : on relance proprement la caméra.
    if (sessionStorage.getItem(RESTART_FLAG) === '1') {
      sessionStorage.removeItem(RESTART_FLAG)
      requestCamera()
    }
  }, [requestCamera])

  // --- Branche le stream sur la balise video -------------------------------
  useEffect(() => {
    if (status === 'active' && videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [status, stream])

  // --- Au démarrage du scan : guide visuel 3s puis fade out ----------------
  useEffect(() => {
    if (status !== 'active') return
    setShowGuide(true)
    const t = setTimeout(() => setShowGuide(false), 3000)
    return () => clearTimeout(t)
  }, [status])

  // --- Annotations qui s'allument en boucle --------------------------------
  useEffect(() => {
    if (status !== 'active') return
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % ANNOTATIONS.length)
    }, 1200)
    return () => clearInterval(id)
  }, [status])

  // --- Traitement commun : compression + tracking + stockage ---------------
  async function processAndStore(dataUrl: string) {
    const originalSize = dataUrlByteSize(dataUrl)
    let finalUrl = dataUrl
    try {
      finalUrl = await compressImage(dataUrl, { maxWidth: 1024, quality: 0.85 })
    } catch {
      // on garde l'original en cas d'échec
    }
    const compressedSize = dataUrlByteSize(finalUrl)
    trackEvent('photo_compressed', {
      original_size: originalSize,
      compressed_size: compressedSize,
    })
    sessionStorage.setItem('scan_photo', finalUrl)
  }

  // --- Capture depuis la caméra --------------------------------------------
  async function handleCapture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    setFlash(true)
    setCaptured(true)

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Pas de flip : on veut la vraie image pour l'analyse.
    ctx.drawImage(video, 0, 0)
    const raw = canvas.toDataURL('image/jpeg', 0.92)

    trackEvent('scan_captured')

    // Marque pour redémarrer la caméra si l'utilisatrice revient en arrière.
    sessionStorage.setItem(RESTART_FLAG, '1')

    // Compression en parallèle d'un délai mini pour laisser voir le flash.
    await Promise.allSettled([processAndStore(raw), sleep(600)])

    // Le démontage (cleanup du hook) libère la caméra.
    router.push('/analyzing')
  }

  // --- Upload (fallback / choix manuel) ------------------------------------
  function handleFileSelected(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return
      await processAndStore(reader.result)
      trackEvent('scan_fallback_upload')
      router.push('/analyzing')
    }
    reader.readAsDataURL(file)
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleClose() {
    sessionStorage.removeItem(RESTART_FLAG)
    stopCamera()
  }

  function handleReauthorize() {
    setShowReauthHelp(true)
  }

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) handleFileSelected(file)
      }}
    />
  )

  // =========================================================================
  // Écran in-app browser
  // =========================================================================
  if (showInAppWarning) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center px-7 text-center"
        style={{ backgroundColor: INK, color: CREAM }}
      >
        <Wordmark className="mb-12" />
        <div
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(250,246,238,0.08)' }}
        >
          <Camera className="h-9 w-9" strokeWidth={1.5} style={{ color: TERRACOTTA }} />
        </div>
        <h1 className="mb-4 max-w-xs font-display text-[28px] font-medium leading-[1.12] tracking-tight">
          Pour scanner ta peau, ouvre Mira dans ton navigateur
        </h1>
        <p
          className="mb-10 max-w-xs text-[15px] leading-relaxed"
          style={{ color: 'rgba(250,246,238,0.7)' }}
        >
          Tape sur les ⋯ en haut à droite, puis «&nbsp;Ouvrir dans le
          navigateur&nbsp;».
        </p>
        <button
          onClick={() => setShowInAppWarning(false)}
          className="font-mono text-[11px] uppercase tracking-[0.2em] underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: 'rgba(250,246,238,0.65)' }}
        >
          Continuer quand même
        </button>
      </main>
    )
  }

  // =========================================================================
  // Écran scan plein écran
  // =========================================================================
  if (status === 'active') {
    return (
      <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: INK }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(31,27,22,0.55) 0%, rgba(31,27,22,0) 22%, rgba(31,27,22,0) 60%, rgba(31,27,22,0.75) 100%)',
          }}
        />

        {/* Header */}
        <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-6">
          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgba(31,27,22,0.4)' }}
          >
            <X className="h-5 w-5" strokeWidth={1.75} style={{ color: CREAM }} />
          </button>
          <Wordmark className="absolute left-1/2 -translate-x-1/2" />
          <div className="h-10 w-10" />
        </header>

        {/* Overlay ovale + viseur + scan line */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg width="280" height="360" viewBox="0 0 280 360" className="overflow-visible">
            <ellipse
              cx="140"
              cy="180"
              rx="130"
              ry="170"
              fill="none"
              stroke={CREAM}
              strokeOpacity="0.5"
              strokeWidth="2"
              strokeDasharray="10 8"
              className="scan-ellipse"
            />
            {[
              { x: 18, y: 36, dx: 1, dy: 1 },
              { x: 262, y: 36, dx: -1, dy: 1 },
              { x: 18, y: 324, dx: 1, dy: -1 },
              { x: 262, y: 324, dx: -1, dy: -1 },
            ].map((c, i) => (
              <g key={i} stroke={CREAM} strokeWidth="2.5" strokeLinecap="round">
                <line x1={c.x} y1={c.y} x2={c.x + c.dx * 22} y2={c.y} />
                <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + c.dy * 22} />
              </g>
            ))}
          </svg>

          <div className="absolute inset-0 overflow-hidden">
            <div
              className="scan-line absolute inset-x-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${TERRACOTTA}, transparent)`,
                boxShadow: `0 0 12px ${TERRACOTTA}`,
              }}
            />
          </div>
        </div>

        {/* Guide visuel "Pour une meilleure analyse" (3s puis fade) */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-24 flex justify-center transition-opacity duration-700 ${
            showGuide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="rounded-2xl px-5 py-4"
            style={{ backgroundColor: 'rgba(31,27,22,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <p
              className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.22em]"
              style={{ color: 'rgba(250,246,238,0.7)' }}
            >
              Pour une meilleure analyse
            </p>
            <ul className="flex flex-col gap-2">
              {GUIDE_TIPS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 font-sans text-[14px]"
                  style={{ color: CREAM }}
                >
                  <Icon className="h-4 w-4 flex-none" strokeWidth={1.5} style={{ color: TERRACOTTA }} />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Annotations animées */}
        <div className="absolute bottom-44 left-6 flex flex-col gap-2.5">
          {ANNOTATIONS.map((label, i) => {
            const active = i === activeStep
            return (
              <div
                key={label}
                className="flex items-center gap-2 font-mono text-[12px] transition-opacity duration-300"
                style={{ color: CREAM, opacity: active ? 1 : 0.45 }}
              >
                <span style={{ color: active ? TERRACOTTA : CREAM }} className="text-[13px] leading-none">
                  {active ? '●' : '◦'}
                </span>
                {label}
              </div>
            )
          })}
        </div>

        {/* Bouton capture */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 pb-10">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: 'rgba(250,246,238,0.85)' }}
          >
            Positionne ton visage dans le cadre
          </p>
          <button
            onClick={handleCapture}
            aria-label="Capturer"
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full transition-transform active:scale-95"
            style={{ border: `4px solid ${CREAM}` }}
          >
            <span className="h-[52px] w-[52px] rounded-full" style={{ backgroundColor: TERRACOTTA }} />
          </button>
        </div>

        {/* Flash + confirmation */}
        {flash && (
          <div className="capture-flash pointer-events-none absolute inset-0" style={{ backgroundColor: CREAM }} />
        )}
        {captured && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p
              className="font-display text-[24px] font-medium"
              style={{ color: CREAM, textShadow: '0 2px 12px rgba(31,27,22,0.6)' }}
            >
              Capture réussie ✓
            </p>
          </div>
        )}

        <style jsx>{`
          .scan-ellipse {
            animation: pulse-stroke 2.4s ease-in-out infinite;
          }
          @keyframes pulse-stroke {
            0%,
            100% {
              stroke-opacity: 0.5;
            }
            50% {
              stroke-opacity: 0.9;
            }
          }
          .scan-line {
            animation: sweep 3s ease-in-out infinite;
          }
          @keyframes sweep {
            0% {
              top: 12%;
              opacity: 0;
            }
            15% {
              opacity: 0.8;
            }
            85% {
              opacity: 0.8;
            }
            100% {
              top: 88%;
              opacity: 0;
            }
          }
          .capture-flash {
            animation: flash 0.3s ease-out forwards;
          }
          @keyframes flash {
            0% {
              opacity: 0.95;
            }
            100% {
              opacity: 0;
            }
          }
        `}</style>
      </div>
    )
  }

  // =========================================================================
  // Écrans fallback (denied / unavailable / error)
  // =========================================================================
  if (status === 'denied' || status === 'unavailable' || status === 'error') {
    const copy =
      status === 'denied'
        ? {
            title: 'Tu as refusé l’accès caméra',
            message:
              'Pas de souci, tu peux uploader une photo depuis ta galerie.',
          }
        : status === 'unavailable'
          ? {
              title: 'Ta caméra n’est pas disponible',
              message: 'Uploade une photo à la place, on s’occupe du reste.',
            }
          : {
              title: 'Petit souci avec la caméra',
              message:
                error ?? 'Réessaie, ou uploade une photo depuis ta galerie.',
            }

    return (
      <main
        className="flex min-h-screen flex-col items-center px-7 pb-10 pt-14 text-center"
        style={{ backgroundColor: INK, color: CREAM }}
      >
        {hiddenFileInput}
        <Wordmark />

        <div className="flex flex-1 flex-col items-center justify-center">
          <h1 className="mb-4 max-w-sm font-display text-[28px] font-medium leading-[1.12] tracking-tight">
            {copy.title}
          </h1>
          <p
            className="mb-9 max-w-xs text-[15px] leading-relaxed"
            style={{ color: 'rgba(250,246,238,0.72)' }}
          >
            {copy.message}
          </p>

          <button
            onClick={openFilePicker}
            className="group flex w-full max-w-xs flex-col items-center justify-center gap-4 rounded-[28px] border-2 border-dashed px-6 py-12 transition-colors"
            style={{ borderColor: 'rgba(200,117,90,0.5)' }}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full transition-transform group-hover:scale-105"
              style={{ backgroundColor: 'rgba(200,117,90,0.16)' }}
            >
              <ImageUp className="h-7 w-7" strokeWidth={1.5} style={{ color: TERRACOTTA }} />
            </span>
            <span className="font-display text-lg">Uploader une photo</span>
            <span
              className="font-mono text-[11px] uppercase tracking-wide"
              style={{ color: 'rgba(250,246,238,0.55)' }}
            >
              Format JPG, PNG · 5MB max
            </span>
          </button>

          {status === 'denied' && (
            <div className="mt-6 w-full max-w-xs">
              <button
                onClick={handleReauthorize}
                className="font-mono text-[11px] uppercase tracking-[0.18em] underline underline-offset-4 transition-opacity hover:opacity-70"
                style={{ color: 'rgba(250,246,238,0.7)' }}
              >
                Réautoriser la caméra
              </button>
              {showReauthHelp && (
                <div className="mt-3">
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: 'rgba(250,246,238,0.6)' }}
                  >
                    Dans ton navigateur&nbsp;: ouvre les réglages du site (icône à
                    gauche de l&apos;URL ou menu ⋯) → Autorisations → Caméra →
                    «&nbsp;Autoriser&nbsp;», puis réessaie.
                  </p>
                  <button
                    onClick={requestCamera}
                    className="mt-3 rounded-full border px-5 py-2.5 font-sans text-[14px] transition-opacity hover:opacity-80"
                    style={{ borderColor: 'rgba(250,246,238,0.3)', color: CREAM }}
                  >
                    J&apos;ai autorisé · réessayer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p
          className="font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{ color: 'rgba(250,246,238,0.45)' }}
        >
          Analyse 100% privée · RGPD
        </p>
      </main>
    )
  }

  // =========================================================================
  // Écran d'intro permission (idle / requesting)
  // =========================================================================
  const requesting = status === 'requesting'
  return (
    <main
      className="flex min-h-screen flex-col items-center px-7 pb-10 pt-14 text-center"
      style={{ backgroundColor: INK, color: CREAM }}
    >
      {hiddenFileInput}
      <Wordmark />

      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          className="mb-9 flex h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(250,246,238,0.06)' }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(200,117,90,0.16)' }}
          >
            <Camera className="h-8 w-8" strokeWidth={1.5} style={{ color: TERRACOTTA }} />
          </div>
        </div>

        <h1 className="mb-5 max-w-sm font-display text-[32px] font-medium leading-[1.1] tracking-tight">
          Prête à découvrir ta peau&nbsp;?
        </h1>
        <p
          className="mb-10 max-w-xs text-[15px] leading-relaxed"
          style={{ color: 'rgba(250,246,238,0.72)' }}
        >
          Pour analyser ta peau en temps réel, on a besoin d&apos;accéder à ta
          caméra. Tes photos ne sont jamais stockées sans ton accord.
        </p>

        <div className="flex w-full max-w-xs flex-col items-center gap-3">
          <button
            onClick={requestCamera}
            disabled={requesting}
            className="w-full rounded-full py-4 font-sans text-[16px] font-medium transition-transform active:scale-[0.98] disabled:opacity-70"
            style={{ backgroundColor: TERRACOTTA, color: CREAM }}
          >
            {requesting ? 'Activation…' : 'Activer ma caméra'}
          </button>
          <button
            onClick={openFilePicker}
            className="flex w-full items-center justify-center gap-2 rounded-full border py-4 font-sans text-[15px] transition-opacity hover:opacity-80"
            style={{ borderColor: 'rgba(250,246,238,0.25)', color: CREAM }}
          >
            <ImageUp className="h-4 w-4" strokeWidth={1.5} />
            Uploader une photo à la place
          </button>
        </div>
      </div>

      <p
        className="font-mono text-[10px] uppercase tracking-[0.22em]"
        style={{ color: 'rgba(250,246,238,0.45)' }}
      >
        Analyse 100% privée · RGPD
      </p>
    </main>
  )
}
