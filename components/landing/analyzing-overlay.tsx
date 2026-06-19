'use client'

import { useEffect, useState } from 'react'

interface AnalyzingOverlayProps {
  imageSrc: string
}

const STEPS = [
  'Détection des contours du visage…',
  'Évaluation de la texture et des pores…',
  'Analyse du sous-ton et de l’hydratation…',
  'Préparation de ton diagnostic…',
]

export function AnalyzingOverlay({ imageSrc }: AnalyzingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
    }, 1300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal/90 px-6 backdrop-blur-sm">
      <div className="relative h-56 w-56 overflow-hidden rounded-[28px] shadow-2xl">
        <img
          src={imageSrc}
          alt="Analyse en cours"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-terracotta/10" />
        <div
          className="absolute left-0 right-0 h-[2px] bg-terracotta shadow-[0_0_12px_2px_rgba(200,117,90,0.8)]"
          style={{ animation: 'scan-line 2.1s ease-in-out infinite' }}
        />
      </div>
      <p className="mt-8 font-display text-xl text-cream">Analyse en cours…</p>
      <p className="mt-2 font-mono text-xs uppercase tracking-wide text-cream/60">
        {STEPS[stepIndex]}
      </p>
    </div>
  )
}
