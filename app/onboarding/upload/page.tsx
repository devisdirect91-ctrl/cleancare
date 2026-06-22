'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AnalyzingOverlay } from '@/components/landing/analyzing-overlay'
import { UploadZone } from '@/components/landing/upload-zone'
import { ANONYMOUS_ANALYSIS_KEY } from '@/components/dashboard/anonymous-paywall'
import { trackEvent } from '@/lib/analytics'

type FlowState = 'idle' | 'analyzing'

export default function UploadStep() {
  const [firstName, setFirstName] = useState<string | null>(null)
  const [flowState, setFlowState] = useState<FlowState>('idle')
  const [image, setImage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('user_first_name')
    if (!stored) {
      router.replace('/onboarding/name')
      return
    }
    setFirstName(stored)
    trackEvent('onboarding_upload_viewed')
  }, [router])

  async function handleFileSelected(dataUrl: string) {
    setImage(dataUrl)
    setFlowState('analyzing')
    trackEvent('onboarding_upload_started')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })

      const body = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(body?.error ?? 'Une erreur est survenue, réessaie.')
        setFlowState('idle')
        return
      }

      sessionStorage.setItem(ANONYMOUS_ANALYSIS_KEY, JSON.stringify(body.analysis))
      trackEvent('onboarding_upload_completed')
      router.push('/paywall')
    } catch {
      toast.error('Une erreur est survenue, réessaie.')
      setFlowState('idle')
    }
  }

  if (!firstName) return <div className="min-h-screen bg-[#F4ECDD]" />

  return (
    <main className="flex min-h-screen flex-col bg-[#F4ECDD] px-5">
      {/* Progress indicator */}
      <div className="mx-auto w-full max-w-md pt-12">
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-stone">
          Étape 2 sur 2
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-[#E5DCC8]">
          <div className="h-full w-full rounded-full bg-terracotta transition-all duration-500" />
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-md flex-1 py-12">
        {/* Eyebrow */}
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.25em] text-terracotta">
          À toi de jouer, {firstName}
        </p>

        {/* Title */}
        <h1 className="mb-4 font-display text-[36px] font-medium leading-[1.08] tracking-tight text-charcoal">
          Une photo, et on s&apos;occupe{' '}
          <em className="font-medium italic text-terracotta">du reste.</em>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 text-[16px] leading-relaxed text-[#4A4238]">
          {firstName}, prends une photo nette de ton visage en lumière naturelle.
          Notre IA va analyser ta peau en 30 secondes.
        </p>

        {/* Upload zone */}
        <UploadZone onFileSelected={handleFileSelected} />

        {/* Privacy annotation */}
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
          Pas de stress {firstName}, on supprime ta photo après l&apos;analyse.
        </p>
      </div>

      {flowState === 'analyzing' && image && (
        <AnalyzingOverlay imageSrc={image} />
      )}
    </main>
  )
}
