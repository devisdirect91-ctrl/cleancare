'use client'

import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics/posthog'

type Plan = 'monthly' | 'yearly'

const PLAN_PRICES: Record<'monthly' | 'yearly' | 'lifetime', number> = {
  monthly: 7.99,
  yearly: 49,
  lifetime: 99,
}

const BENEFITS = [
  <>Routine <strong>matin et soir</strong> personnalisée étape par étape</>,
  <><strong>Produits</strong> sélectionnés pour ton type de peau exact</>,
  <><strong>Ingrédients</strong> à privilégier et à éviter</>,
  <><strong>Suivi photo</strong> mensuel de ta progression</>,
  <><strong>Analyses illimitées</strong> à chaque évolution</>,
]

export function PaywallCard() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly')
  const [loading, setLoading] = useState<'monthly' | 'yearly' | 'lifetime' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackEvent('paywall_card_viewed', { has_lifetime_available: true })
  }, [])

  function handlePlanChange(newPlan: Plan) {
    setSelectedPlan(newPlan)
    trackEvent('plan_selected', {
      plan: newPlan,
      price: PLAN_PRICES[newPlan],
    })
  }

  async function handleCheckout(plan: 'monthly' | 'yearly' | 'lifetime') {
    trackEvent('checkout_initiated', {
      plan,
      has_trial: plan !== 'lifetime',
      price: PLAN_PRICES[plan],
    })

    setLoading(plan)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (response.status === 401) {
        window.location.href = `/auth/signup?redirectTo=${encodeURIComponent(`/paywall?plan=${plan}`)}`
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      // Persist plan so the success page can track it
      localStorage.setItem('cleancare:checkout_plan', plan)
      localStorage.setItem('cleancare:checkout_price', String(PLAN_PRICES[plan]))

      window.location.href = data.url
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : 'Une erreur est survenue'
      trackEvent('checkout_failed', { plan, reason })
      setError(reason)
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <div className="mx-auto w-full max-w-md px-5 py-10">
      {/* ── Premium card ── */}
      <div className="relative rounded-[24px] border-[1.5px] border-[#E8C9BC] bg-gradient-to-b from-[#FFFCF6] to-[#EDE3D0] p-6 text-center shadow-[0_20px_50px_-15px_rgba(200,117,90,0.25)]">

        {/* Lock icon with spinning dashed ring */}
        <div className="relative mx-auto mb-3.5 h-12 w-12">
          <div
            className="absolute inset-0 rounded-full border border-dashed border-terracotta"
            style={{ animation: 'spin 18s linear infinite' }}
          />
          <div className="flex h-full w-full items-center justify-center rounded-full bg-charcoal">
            <LockIcon />
          </div>
        </div>

        {/* Trial badge */}
        <span className="mb-3 inline-block rounded-full bg-[#C8D2BF] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8A9A82]">
          7 jours gratuits
        </span>

        {/* Title */}
        <h2 className="font-display text-[22px] leading-[1.15] tracking-tight text-charcoal">
          Débloque
          <br />
          <em className="font-normal italic text-terracotta">ta routine complète</em>
        </h2>

        {/* Benefits */}
        <ul className="mb-6 mt-5 space-y-2 text-left">
          {BENEFITS.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs leading-snug text-charcoal">
              <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#8A9A82]">
                <CheckIcon />
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Plan selector */}
        <div className="mb-4 flex flex-col gap-2">
          <PriceOption
            id="yearly"
            selected={selectedPlan === 'yearly'}
            onSelect={() => handlePlanChange('yearly')}
            badge="Recommandé"
            label="Annuel"
            sub="Soit 4,08 €/mois"
            savings="Économise 47 €"
            amount="49 €"
            amountSuffix="/an"
            strike="96 €"
          />
          <PriceOption
            id="monthly"
            selected={selectedPlan === 'monthly'}
            onSelect={() => handlePlanChange('monthly')}
            label="Mensuel"
            sub="Sans engagement"
            amount="7,99 €"
            amountSuffix="/mois"
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-center text-[12px] text-red-600">
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={() => handleCheckout(selectedPlan)}
          disabled={isLoading}
          className="mb-2.5 block w-full rounded-full bg-charcoal py-[15px] text-sm font-semibold text-[#FFFCF6] shadow-[0_8px_20px_-6px_rgba(31,27,22,0.3)] transition-opacity hover:opacity-80 disabled:opacity-60"
        >
          {loading === selectedPlan ? 'Chargement…' : 'Commencer mon essai gratuit'}
        </button>

        <p className="mb-2.5 text-[11px] leading-relaxed text-stone">
          Aucun débit pendant 7 jours · Annule à tout moment
        </p>

        <button
          onClick={() => {
            trackEvent('checkout_dismissed', { plan_was_selected: selectedPlan })
            window.history.back()
          }}
          disabled={isLoading}
          className="text-xs text-stone underline underline-offset-2 disabled:opacity-50"
        >
          Pas maintenant
        </button>

        {/* Trust badges */}
        <div className="mt-4 flex items-center justify-center gap-3 border-t border-[#E5DCC8] pt-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-stone">
          <TrustBadge label="Stripe" />
          <TrustBadge label="RGPD" />
          <TrustBadge label="Made in France" />
        </div>
      </div>

      {/* ── OR separator ── */}
      <div className="relative my-5 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-stone">
        <span className="absolute left-0 top-1/2 w-[38%] -translate-y-1/2 border-t border-[#D8CDB5]" />
        OU
        <span className="absolute right-0 top-1/2 w-[38%] -translate-y-1/2 border-t border-[#D8CDB5]" />
      </div>

      {/* ── Lifetime card ── */}
      <div className="relative overflow-hidden rounded-[22px] bg-charcoal p-5 text-[#FFFCF6]">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,_#C8755A_0%,_transparent_70%)] opacity-40" />

        {/* Header row */}
        <div className="relative z-10 mb-3 flex items-center justify-between">
          <span className="rounded-full bg-terracotta px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#FFFCF6]">
            Founder offer
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#E8C9BC]">
            137 places restantes
          </span>
        </div>

        {/* Title */}
        <h3 className="relative z-10 mb-1.5 font-display text-[22px] leading-[1.15] tracking-tight">
          Accès <em className="italic text-terracotta">à vie</em>
        </h3>
        <p className="relative z-10 mb-4 text-xs leading-relaxed text-[#E8C9BC]">
          Une seule fois. Pour les 500 premières. Toutes les fonctionnalités à vie.
        </p>

        {/* Progress bar */}
        <div className="relative z-10 mb-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#E8C9BC]/20">
            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-terracotta to-[#E8C9BC]" />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-[#E8C9BC]">
            <span>363 / 500</span>
            <span>72 %</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="font-display text-[28px] leading-none tracking-tight">
            99 €
            <small className="ml-1 text-[11px] font-normal text-[#E8C9BC]">une fois</small>
          </p>
          <button
            onClick={() => handleCheckout('lifetime')}
            disabled={isLoading}
            className="rounded-full bg-terracotta px-4 py-2.5 text-[13px] font-semibold text-[#FFFCF6] shadow-[0_4px_12px_rgba(200,117,90,0.4)] transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            {loading === 'lifetime' ? 'Chargement…' : 'Réserver'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PriceOption({
  id,
  selected,
  onSelect,
  badge,
  label,
  sub,
  savings,
  amount,
  amountSuffix,
  strike,
}: {
  id: string
  selected: boolean
  onSelect: () => void
  badge?: string
  label: string
  sub: string
  savings?: string
  amount: string
  amountSuffix: string
  strike?: string
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onSelect}
      className={[
        'relative flex items-center justify-between rounded-2xl border-[1.5px] bg-[#FFFCF6] px-4 py-3.5 text-left',
        'transition-all duration-150',
        selected
          ? 'border-terracotta shadow-[0_4px_16px_-6px_rgba(200,117,90,0.25)]'
          : 'border-[#D8CDB5] hover:-translate-y-0.5 hover:border-[#C8B89E] hover:shadow-sm',
      ].join(' ')}
    >
      {badge && (
        <span className="absolute -top-2 right-3.5 rounded-full bg-terracotta px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#FFFCF6] shadow-[0_2px_6px_rgba(200,117,90,0.3)]">
          {badge}
        </span>
      )}

      <div className="flex flex-1 items-center gap-3">
        {/* Radio dot */}
        <span
          className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-[1.5px] bg-[#FFFCF6] transition-colors ${
            selected ? 'border-terracotta' : 'border-[#D8CDB5]'
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full bg-terracotta transition-opacity duration-150 ${
              selected ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </span>

        <div>
          <p className="text-sm font-semibold leading-tight text-charcoal">{label}</p>
          <p className="mt-0.5 font-mono text-[10px] tracking-wide text-stone">{sub}</p>
          {savings && (
            <span className="mt-1 inline-block rounded-full bg-[#C8D2BF] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8A9A82]">
              {savings}
            </span>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className="font-display text-[19px] font-semibold leading-tight tracking-tight text-charcoal">
          {amount}
          <small className="text-[11px] font-sans font-normal text-stone">{amountSuffix}</small>
        </p>
        {strike && (
          <p className="mt-0.5 text-[11px] text-stone line-through">{strike}</p>
        )}
      </div>
    </button>
  )
}

function TrustBadge({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 before:text-[11px] before:text-[#8A9A82] before:content-['✓']">
      {label}
    </span>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FAF6EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFCF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
