'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/posthog'
import { CancellationSurvey } from '@/components/cancellation/CancellationSurvey'

interface Props {
  isActive: boolean
  daysSinceStart: number
}

export function BillingActions({ isActive, daysSinceStart }: Props) {
  const [showSurvey, setShowSurvey] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    trackEvent('billing_page_viewed')
  }, [])

  async function handleManagePortal() {
    trackEvent('billing_portal_opened')
    setLoading(true)
    try {
      const res = await fetch('/api/billing-portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  if (!isActive) {
    return (
      <div className="mt-6">
        <a
          href="/paywall"
          className="block w-full rounded-full bg-terracotta py-3 text-center text-sm font-semibold text-cream transition-opacity hover:opacity-90"
        >
          Réactiver mon abonnement
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="mt-6 space-y-3">
        <button
          onClick={handleManagePortal}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-3 text-sm font-semibold text-cream transition-opacity hover:opacity-80 disabled:opacity-60"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
          Gérer mon abonnement
        </button>

        <button
          onClick={() => setShowSurvey(true)}
          className="w-full rounded-full border border-charcoal/15 py-3 text-sm font-medium text-stone transition-colors hover:border-terracotta hover:text-terracotta"
        >
          Annuler mon abonnement
        </button>
      </div>

      {showSurvey && (
        <CancellationSurvey
          daysSinceStart={daysSinceStart}
          onClose={() => setShowSurvey(false)}
        />
      )}
    </>
  )
}
