'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/posthog'

const REASONS = [
  'Trop cher',
  "Je n'utilise pas assez",
  "Les recommandations ne m'ont pas convaincue",
  "J'ai trouvé une alternative",
  'Problème technique',
  'Autre',
]

interface Props {
  daysSinceStart: number
  onClose: () => void
}

export function CancellationSurvey({ daysSinceStart, onClose }: Props) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!selectedReason) return
    setLoading(true)

    trackEvent('cancellation_feedback_submitted', {
      reason: selectedReason,
      custom_text: selectedReason === 'Autre' ? customText : '',
      days_subscribed: daysSinceStart,
    })

    try {
      const res = await fetch('/api/billing-portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  function handleKeep() {
    trackEvent('cancellation_aborted', {
      reason_clicked: selectedReason ?? 'none',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/50 px-4 pb-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta">
              Avant de partir
            </p>
            <h2 className="mt-1 font-display text-xl text-charcoal">
              Qu&apos;est-ce qui ne t&apos;a pas convaincu ?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 flex-none text-stone hover:text-charcoal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
              className={[
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                selectedReason === reason
                  ? 'border-terracotta bg-terracotta/5 text-charcoal'
                  : 'border-charcoal/10 bg-white text-charcoal hover:border-charcoal/20',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-4 w-4 flex-none items-center justify-center rounded-full border-[1.5px]',
                  selectedReason === reason
                    ? 'border-terracotta'
                    : 'border-charcoal/20',
                ].join(' ')}
              >
                {selectedReason === reason && (
                  <span className="h-2 w-2 rounded-full bg-terracotta" />
                )}
              </span>
              {reason}
            </button>
          ))}
        </div>

        {/* Textarea for "Autre" */}
        {selectedReason === 'Autre' && (
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Dis-nous en plus…"
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-charcoal/15 px-4 py-3 text-sm text-charcoal placeholder:text-stone focus:border-terracotta focus:outline-none"
          />
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleConfirm}
            disabled={!selectedReason || loading}
            className="w-full rounded-full border border-charcoal/20 py-3 text-sm font-medium text-stone transition-colors hover:border-terracotta hover:text-terracotta disabled:opacity-40"
          >
            {loading ? 'Redirection…' : 'Confirmer l'annulation'}
          </button>
          <button
            onClick={handleKeep}
            disabled={loading}
            className="w-full rounded-full bg-charcoal py-3 text-sm font-semibold text-cream transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            Garder mon abonnement
          </button>
        </div>
      </div>
    </div>
  )
}
