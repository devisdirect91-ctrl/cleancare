'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getConcernInfo } from '@/components/dashboard/concern-icon'
import { PaywallScreen } from '@/components/dashboard/paywall-screen'
import { trackEvent } from '@/lib/analytics/posthog'
import type { AnalysisRow } from '@/types/analysis'

export const ANONYMOUS_ANALYSIS_KEY = 'cleancare:lastAnalysis'

type AnonymousAnalysis = Pick<
  AnalysisRow,
  | 'skin_type'
  | 'undertone'
  | 'full_result'
  | 'concerns'
  | 'routine_morning'
  | 'routine_evening'
  | 'recommended_products'
  | 'created_at'
>

export function AnonymousPaywall() {
  const [analysis, setAnalysis] = useState<AnonymousAnalysis | null | undefined>(
    undefined
  )

  const [firstName, setFirstName] = useState<string>('')

  useEffect(() => {
    const raw = sessionStorage.getItem(ANONYMOUS_ANALYSIS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    setAnalysis(parsed)
    setFirstName(sessionStorage.getItem('user_first_name') ?? '')

    if (parsed) {
      trackEvent('result_viewed', {
        is_premium: false,
        has_subscription: false,
        skin_type: parsed.skin_type ?? null,
        concerns_count: parsed.concerns?.length ?? 0,
      })
    }
  }, [])

  if (analysis === undefined) return null

  if (!analysis) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
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

  const fullResult = analysis.full_result ?? {}
  const hydrationLevel = typeof fullResult.hydration_level === 'number' ? fullResult.hydration_level : null
  const textureScore = typeof fullResult.texture_score === 'number' ? fullResult.texture_score : null
  const observation = typeof fullResult.recommendations_summary === 'string' ? fullResult.recommendations_summary : null
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(analysis.created_at))

  return (
    <PaywallScreen
      anonymous
      name={firstName}
      date={formattedDate}
      skinType={analysis.skin_type ?? '—'}
      undertone={analysis.undertone ?? '—'}
      hydrationLevel={hydrationLevel}
      textureScore={textureScore}
      concerns={(analysis.concerns ?? []).map((concern) => getConcernInfo(concern).label)}
      observation={observation}
      productsCount={(analysis.recommended_products ?? []).length}
      morningStepsCount={analysis.routine_morning?.length ?? 0}
      eveningStepsCount={analysis.routine_evening?.length ?? 0}
    />
  )
}
