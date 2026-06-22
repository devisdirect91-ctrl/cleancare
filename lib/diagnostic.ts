import type { SupabaseClient } from '@supabase/supabase-js'
import { getConcernInfo } from '@/components/dashboard/concern-icon'
import type { AnalysisRow, Profile } from '@/types/analysis'

export function displayNameFromEmail(email: string) {
  const local = email.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export async function getLatestDiagnostic(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>()

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single<AnalysisRow>()

  return { profile, analysis }
}

export function buildPaywallProps(
  name: string,
  date: string,
  analysis: AnalysisRow
) {
  const fullResult = analysis.full_result ?? {}
  const concerns = analysis.concerns ?? []
  const products = analysis.recommended_products ?? []

  return {
    name,
    date,
    skinType: analysis.skin_type ?? '—',
    undertone: analysis.undertone ?? '—',
    hydrationLevel: fullResult.hydration_level ?? null,
    textureScore: fullResult.texture_score ?? null,
    concerns: concerns.map((concern) => getConcernInfo(concern).label),
    observation: fullResult.recommendations_summary ?? null,
    productsCount: products.length,
    morningStepsCount: analysis.routine_morning?.length ?? 0,
    eveningStepsCount: analysis.routine_evening?.length ?? 0,
  }
}

export function formatDiagnosticDate(createdAt: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(createdAt))
}
