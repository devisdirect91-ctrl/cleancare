'use client'

import { Check, Lock } from 'lucide-react'
import { useState } from 'react'

interface PaywallScreenProps {
  name: string
  date: string
  skinType: string
  undertone: string
  hydrationLevel: number | null
  textureScore: number | null
  concerns: string[]
  observation: string | null
  productsCount: number
  morningStepsCount: number
  eveningStepsCount: number
  anonymous?: boolean
}

type Plan = 'yearly' | 'monthly'

export function PaywallScreen({
  name,
  date,
  skinType,
  undertone,
  hydrationLevel,
  textureScore,
  concerns,
  observation,
  productsCount,
  morningStepsCount,
  eveningStepsCount,
  anonymous = false,
}: PaywallScreenProps) {
  const [plan, setPlan] = useState<Plan>('yearly')
  const [loading, setLoading] = useState<Plan | 'lifetime' | null>(null)

  async function startCheckout(selected: Plan | 'lifetime') {
    if (anonymous) {
      window.location.href = '/auth/signup'
      return
    }
    setLoading(selected)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selected }),
      })
      const body = await res.json()
      if (body.url) {
        window.location.href = body.url
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#F4ECDD] pb-16">
      <div className="mx-auto max-w-md px-5 pt-10">
        {/* Header */}
        <div className="border-b border-[#E5DCC8] pb-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#8B8378]">
            Diagnostic personnalisé
          </p>
          <h1 className="mt-4 font-display text-[32px] leading-[1.05] tracking-tight text-[#1F1B16]">
            Ta peau,
            <br />
            <em className="font-normal italic text-terracotta">aujourd’hui</em>
          </h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#8B8378]">
            {name ? `${name} · ` : ''}{date}
          </p>
        </div>

        {/* Observation */}
        <div className="pt-6">
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8B8378]">
            <span className="h-px w-4 bg-terracotta" />
            Ce que l’on observe
          </div>
          {observation && (
            <p className="font-display text-base italic leading-snug text-[#1F1B16] first-letter:text-[28px] first-letter:not-italic first-letter:leading-none first-letter:text-terracotta">
              {observation}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatBubble label="Type" value={skinType} />
            <StatBubble label="Sous-ton" value={undertone} />
            <StatBubble
              label="Hydratation"
              value={hydrationLevel != null ? `${hydrationLevel}` : '—'}
              suffix="/10"
            />
            <StatBubble
              label="Texture"
              value={textureScore != null ? `${textureScore}` : '—'}
              suffix="/10"
            />
          </div>

          {concerns.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {concerns.map((concern) => (
                <span
                  key={concern}
                  className="flex items-center gap-1.5 rounded-full bg-[#E8C9BC] px-3 py-1.5 text-[11px] font-medium text-[#A85A41]"
                >
                  <span className="h-1 w-1 rounded-full bg-terracotta" />
                  {concern}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-3 pt-2">
          <div className="h-px flex-1 bg-[#D8CDB5]" />
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-[#8B8378]">
            <Lock className="h-2.5 w-2.5 text-terracotta" strokeWidth={2.5} />
            Ta routine
          </div>
          <div className="h-px flex-1 bg-[#D8CDB5]" />
        </div>

        {/* Locked previews */}
        <div className="mt-4 space-y-2">
          <div className="relative overflow-hidden rounded-[18px] border border-[#E5DCC8] bg-[#FFFCF6] p-3.5">
            <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-[#1F1B16] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#FFFCF6]">
              <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
              Verrouillé
            </div>
            <div className="flex items-center gap-3 opacity-50 blur-[5px]">
              <div className="h-6 w-6 flex-none rounded-full bg-[#EDE3D0]" />
              <div className="flex-1">
                <div className="h-2.5 w-4/5 rounded-full bg-[#EDE3D0]" />
                <div className="mt-1.5 h-1.5 w-2/5 rounded-full bg-[#EDE3D0]" />
              </div>
              <div className="h-9 w-9 flex-none rounded-full bg-[#EDE3D0]" />
            </div>
          </div>
          <div className="overflow-hidden rounded-[18px] border border-[#E5DCC8] bg-[#FFFCF6] p-3.5">
            <div className="flex items-center gap-3 opacity-50 blur-[5px]">
              <div className="h-6 w-6 flex-none rounded-full bg-[#EDE3D0]" />
              <div className="flex-1">
                <div className="h-2.5 w-3/5 rounded-full bg-[#EDE3D0]" />
                <div className="mt-1.5 h-1.5 w-2/5 rounded-full bg-[#EDE3D0]" />
              </div>
              <div className="h-9 w-9 flex-none rounded-full bg-[#EDE3D0]" />
            </div>
          </div>
        </div>

        {/* Paywall card */}
        <div className="mt-7">
          <div className="relative rounded-[24px] border-[1.5px] border-[#E8C9BC] bg-gradient-to-b from-[#FFFCF6] to-[#EDE3D0] p-6 text-center shadow-[0_20px_50px_-15px_rgba(200,117,90,0.25)]">
            <div className="relative mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-[#1F1B16] before:absolute before:-inset-1 before:rounded-full before:border before:border-dashed before:border-terracotta">
              <Lock className="h-5 w-5 text-[#FFFCF6]" strokeWidth={2} />
            </div>

            <span className="mb-3 inline-block rounded-full bg-[#C8D2BF] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8A9A82]">
              7 jours gratuits
            </span>

            <h2 className="font-display text-[22px] leading-[1.15] tracking-tight text-[#1F1B16]">
              Débloque
              <br />
              <em className="italic text-terracotta">ta routine complète</em>
            </h2>

            <p className="mx-auto mt-2.5 max-w-[280px] text-[13px] leading-relaxed text-[#4A4238]">
              Ta routine personnalisée matin et soir t’attend, avec les produits
              adaptés à TA peau.
            </p>

            <ul className="mb-6 mt-5 space-y-2 text-left">
              <Feature>
                <strong>{productsCount} produits</strong> sélectionnés pour ta peau{' '}
                {skinType}
              </Feature>
              <Feature>
                <strong>Routine matin et soir</strong> en {morningStepsCount} et{' '}
                {eveningStepsCount} étapes
              </Feature>
              <Feature>
                <strong>Ingrédients</strong> à privilégier et à éviter
              </Feature>
              <Feature>
                <strong>Suivi photo</strong> mensuel de ta progression
              </Feature>
              <Feature>
                <strong>Analyses illimitées</strong> à chaque évolution
              </Feature>
            </ul>

            <div className="mb-4 flex flex-col gap-2">
              <PriceOption
                selected={plan === 'yearly'}
                onSelect={() => setPlan('yearly')}
                badge="Recommandé"
                label="Annuel"
                sub="Soit 4,08 €/mois"
                savings="Économise 47 €"
                amount="49 €"
                amountSuffix="/an"
                strike="96 €"
              />
              <PriceOption
                selected={plan === 'monthly'}
                onSelect={() => setPlan('monthly')}
                label="Mensuel"
                sub="Sans engagement"
                amount="7,99 €"
                amountSuffix="/mois"
              />
            </div>

            <button
              onClick={() => startCheckout(plan)}
              disabled={loading !== null}
              className="mb-2.5 block w-full rounded-full bg-[#1F1B16] py-[15px] text-sm font-semibold text-[#FFFCF6] shadow-[0_8px_20px_-6px_rgba(31,27,22,0.3)] transition-opacity disabled:opacity-60"
            >
              {loading === plan
                ? 'Redirection…'
                : 'Commencer mon essai gratuit'}
            </button>
            <p className="mb-2.5 text-[11px] leading-relaxed text-[#8B8378]">
              Aucun débit pendant 7 jours · Annule à tout moment
            </p>
            <button className="text-xs text-[#8B8378] underline underline-offset-2">
              Pas maintenant
            </button>

            <div className="mt-4.5 flex items-center justify-center gap-3 border-t border-[#E5DCC8] pt-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8B8378]">
              <TrustItem label="Stripe" />
              <TrustItem label="RGPD" />
              <TrustItem label="Made in France" />
            </div>
          </div>
        </div>

        {/* OR separator */}
        <div className="relative my-4 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[#8B8378]">
          <span className="absolute left-0 top-1/2 w-[35%] -translate-y-1/2 border-t border-[#D8CDB5]" />
          OU
          <span className="absolute right-0 top-1/2 w-[35%] -translate-y-1/2 border-t border-[#D8CDB5]" />
        </div>

        {/* Lifetime card */}
        <div className="relative overflow-hidden rounded-[22px] bg-[#1F1B16] p-5 text-[#FFFCF6]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,_#C8755A_0%,_transparent_70%)] opacity-40" />

          <div className="relative z-10 mb-3 flex items-center justify-between">
            <span className="rounded-full bg-terracotta px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#FFFCF6]">
              Founder offer
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#E8C9BC]">
              137 places restantes
            </span>
          </div>

          <h3 className="relative z-10 mb-1.5 font-display text-[22px] leading-[1.15] tracking-tight">
            Accès <em className="italic text-terracotta">à vie</em>
          </h3>
          <p className="relative z-10 mb-4 text-xs leading-relaxed text-[#E8C9BC]">
            Une seule fois. Pour les 500 premières. Toutes les fonctionnalités à
            vie.
          </p>

          <div className="relative z-10 mb-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#E8C9BC]/20">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-terracotta to-[#E8C9BC]" />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-[#E8C9BC]">
              <span>363 / 500</span>
              <span>72%</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <p className="font-display text-[28px] leading-none tracking-tight">
              99 €<small className="ml-1 text-[11px] font-normal text-[#E8C9BC]">une fois</small>
            </p>
            <button
              onClick={() => startCheckout('lifetime')}
              disabled={loading !== null}
              className="rounded-full bg-terracotta px-4 py-2.5 text-[13px] font-semibold text-[#FFFCF6] shadow-[0_4px_12px_rgba(200,117,90,0.4)] disabled:opacity-60"
            >
              {loading === 'lifetime' ? 'Redirection…' : 'Réserver'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

function StatBubble({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div className="rounded-[14px] border border-[#E5DCC8] bg-[#FFFCF6] px-3 py-2.5">
      <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8B8378]">
        {label}
      </p>
      <p className="font-display text-base capitalize tracking-tight text-[#1F1B16]">
        {value}
        {suffix && (
          <small className="ml-0.5 text-[10px] font-sans font-normal text-[#8B8378]">
            {suffix}
          </small>
        )}
      </p>
    </div>
  )
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-xs leading-snug text-[#1F1B16]">
      <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#8A9A82]">
        <Check className="h-2.5 w-2.5 text-[#FFFCF6]" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  )
}

function PriceOption({
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
      onClick={onSelect}
      className={`relative flex items-center justify-between rounded-2xl border-[1.5px] bg-[#FFFCF6] px-4 py-3.5 text-left transition-all ${
        selected
          ? 'border-terracotta shadow-[0_4px_16px_-6px_rgba(200,117,90,0.25)]'
          : 'border-[#D8CDB5]'
      }`}
    >
      {badge && (
        <span className="absolute -top-2 right-3.5 rounded-full bg-terracotta px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#FFFCF6] shadow-[0_2px_6px_rgba(200,117,90,0.3)]">
          {badge}
        </span>
      )}
      <div className="flex flex-1 items-center gap-3">
        <span
          className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-[1.5px] bg-[#FFFCF6] ${
            selected ? 'border-terracotta' : 'border-[#D8CDB5]'
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full bg-terracotta transition-opacity ${
              selected ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight text-[#1F1B16]">
            {label}
          </p>
          <p className="mt-0.5 font-mono text-[10px] tracking-wide text-[#8B8378]">
            {sub}
          </p>
          {savings && (
            <span className="mt-1 inline-block rounded-full bg-[#C8D2BF] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8A9A82]">
              {savings}
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-display text-[19px] font-semibold leading-tight tracking-tight text-[#1F1B16]">
          {amount}
          <small className="text-[11px] font-sans font-normal text-[#8B8378]">
            {amountSuffix}
          </small>
        </p>
        {strike && (
          <p className="mt-0.5 text-[11px] text-[#8B8378] line-through">
            {strike}
          </p>
        )}
      </div>
    </button>
  )
}

function TrustItem({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 before:content-['✓'] before:text-[11px] before:text-[#8A9A82]">
      {label}
    </span>
  )
}
