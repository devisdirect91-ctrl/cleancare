import Link from 'next/link'
import { CheckoutSuccessTracker } from '@/components/analytics/CheckoutSuccessTracker'
import { AnonymousPaywall } from '@/components/dashboard/anonymous-paywall'
import { getConcernInfo } from '@/components/dashboard/concern-icon'
import { FollowupActions } from '@/components/dashboard/followup-actions'
import { PaywallScreen } from '@/components/dashboard/paywall-screen'
import { RoutineSection } from '@/components/dashboard/routine-section'
import { StickyTrialBar } from '@/components/dashboard/sticky-trial-bar'
import {
  buildPaywallProps,
  displayNameFromEmail,
  formatDiagnosticDate,
  getLatestDiagnostic,
} from '@/lib/diagnostic'
import { createClient } from '@/lib/supabase/server'

const DAY_MS = 24 * 60 * 60 * 1000

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    return <AnonymousPaywall />
  }

  const { profile, analysis } = await getLatestDiagnostic(supabase, user.id)

  if (!analysis || !profile) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-terracotta">
          Aucun diagnostic
        </p>
        <h1 className="mt-3 font-display text-2xl text-charcoal">
          Tu n’as pas encore d’analyse.
        </h1>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-terracotta px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Faire mon premier diagnostic
        </Link>
      </main>
    )
  }

  const daysLeft = Math.ceil(
    (new Date(profile.trial_ends_at).getTime() - Date.now()) / DAY_MS
  )
  const isPremium = profile.subscription_status === 'active'
  const isTrialActive = profile.subscription_status === 'trialing' && daysLeft > 0
  const unlocked = isPremium || isTrialActive
  const locked = !unlocked

  const fullResult = analysis.full_result ?? {}
  const summary = typeof fullResult.recommendations_summary === 'string' ? fullResult.recommendations_summary : null
  const hydrationLevel = typeof fullResult.hydration_level === 'number' ? fullResult.hydration_level : null
  const textureScore = typeof fullResult.texture_score === 'number' ? fullResult.texture_score : null
  const ingredientsToSeek = Array.isArray(fullResult.ingredients_to_seek) ? (fullResult.ingredients_to_seek as string[]) : []
  const ingredientsToAvoid = Array.isArray(fullResult.ingredients_to_avoid) ? (fullResult.ingredients_to_avoid as string[]) : []
  const name = displayNameFromEmail(user.email ?? profile.email)
  const formattedDate = formatDiagnosticDate(analysis.created_at)

  const concerns = analysis.concerns ?? []
  const products = analysis.recommended_products ?? []

  if (locked) {
    return <PaywallScreen {...buildPaywallProps(name, formattedDate, analysis)} />
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 pb-28 sm:py-20">
      <CheckoutSuccessTracker />
      {/* Header */}
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-terracotta">
          Diagnostic personnalisé
        </p>
        <h1 className="mt-3 font-display text-3xl text-charcoal">
          Pour {name} · {formattedDate}
        </h1>
      </header>

      {/* Section 1 — Synthèse */}
      <section className="mt-10 rounded-2xl bg-white p-8 shadow-sm">
        <p className="font-display text-xl italic text-charcoal">
          Ce que ta peau dit aujourd’hui
        </p>
        {summary && (
          <p className="mt-4 font-display text-[18px] leading-relaxed text-charcoal">
            {summary}
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Type de peau" value={analysis.skin_type ?? '—'} />
          <Stat label="Sous-ton" value={analysis.undertone ?? '—'} />
          <Stat
            label="Hydratation"
            value={hydrationLevel != null ? `${hydrationLevel} / 10` : '—'}
          />
          <Stat
            label="Texture"
            value={textureScore != null ? `${textureScore} / 10` : '—'}
          />
        </div>
      </section>

      {/* Section 2 — Points d'attention */}
      {concerns.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl italic text-charcoal">
            Points d’attention
          </h2>
          <div className="mt-6 space-y-3">
            {concerns.map((concern) => {
              const { icon: Icon, label, explanation } = getConcernInfo(concern)
              return (
                <div
                  key={concern}
                  className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-terracotta/10">
                    <Icon className="h-4 w-4 text-terracotta" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-display text-base text-charcoal">{label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-stone">
                      {explanation}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Section 3 & 4 — Routines */}
      <div className="mt-12 space-y-12">
        <RoutineSection
          title="Ta routine matin"
          steps={analysis.routine_morning ?? []}
          products={products}
        />
        <RoutineSection
          title="Ta routine soir"
          steps={analysis.routine_evening ?? []}
          products={products}
        />
      </div>

      {/* Section 5 — Ingrédients */}
      {(ingredientsToSeek.length > 0 || ingredientsToAvoid.length > 0) ? (
        <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#EEF3EA] p-6">
            <p className="font-mono text-xs uppercase tracking-wide text-[#5B7A52]">
              À privilégier
            </p>
            <ul className="mt-4 space-y-2">
              {ingredientsToSeek.map((ingredient) => (
                <li key={ingredient} className="flex items-start gap-2 text-sm text-charcoal">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-[#5B7A52]" />
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-terracotta/10 p-6">
            <p className="font-mono text-xs uppercase tracking-wide text-terracotta">
              À limiter
            </p>
            <ul className="mt-4 space-y-2">
              {ingredientsToAvoid.map((ingredient) => (
                <li key={ingredient} className="flex items-start gap-2 text-sm text-charcoal">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-terracotta" />
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Section 6 — Suivi */}
      <div className="mt-12">
        <FollowupActions shareImageUrl={`/api/og?id=${analysis.id}`} />
      </div>

      {!isPremium && (
        <StickyTrialBar daysLeft={Math.max(daysLeft, 0)} expired={locked} />
      )}
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wide text-stone">{label}</p>
      <p className="mt-1 font-display text-base capitalize text-charcoal">{value}</p>
    </div>
  )
}
