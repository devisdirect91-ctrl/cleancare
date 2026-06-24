'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PlanKey } from '@/lib/stripe/config'

export function AutoCheckout({ plan }: { plan: PlanKey }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function trigger() {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        })
        const data = await res.json()

        if (data.url) {
          window.location.href = data.url
        } else {
          setError(data.error ?? 'Une erreur est survenue.')
        }
      } catch {
        setError('Une erreur est survenue.')
      }
    }
    trigger()
  }, [plan, router])

  if (error) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#F4ECDD] px-6 text-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta">
            Erreur
          </p>
          <p className="mt-3 font-display text-xl text-charcoal">{error}</p>
          <button
            onClick={() => router.push('/paywall')}
            className="mt-6 rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream"
          >
            Retour au paywall
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F4ECDD]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#E5DCC8] border-t-terracotta" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
          Redirection vers le paiement…
        </p>
      </div>
    </main>
  )
}
