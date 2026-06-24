import { redirect } from 'next/navigation'
import { AnonymousPaywall } from '@/components/dashboard/anonymous-paywall'
import { PaywallScreen } from '@/components/dashboard/paywall-screen'
import { ResultViewedTracker } from '@/components/result/result-viewed-tracker'
import {
  buildPaywallProps,
  displayNameFromEmail,
  formatDiagnosticDate,
  getLatestDiagnostic,
} from '@/lib/diagnostic'
import { createClient } from '@/lib/supabase/server'

const DAY_MS = 24 * 60 * 60 * 1000

export default async function ResultPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  // Anonyme : le résultat d'analyse + le prénom vivent en sessionStorage.
  // AnonymousPaywall les lit côté client et déclenche result_viewed.
  if (!user) {
    return <AnonymousPaywall />
  }

  const { profile, analysis } = await getLatestDiagnostic(supabase, user.id)

  // Connecté mais pas encore d'analyse en base → fallback sur le flux session.
  if (!analysis || !profile) {
    return <AnonymousPaywall />
  }

  // Premium / essai actif : routine entièrement débloquée = le dashboard.
  const daysLeft = Math.ceil(
    (new Date(profile.trial_ends_at).getTime() - Date.now()) / DAY_MS
  )
  const isPremium =
    profile.subscription_status === 'active' ||
    profile.subscription_status === 'lifetime'
  const isTrialActive =
    profile.subscription_status === 'trialing' && daysLeft > 0

  if (isPremium || isTrialActive) {
    redirect('/dashboard')
  }

  // Connecté mais verrouillé : aperçu diagnostic gratuit + paywall sur la routine.
  const name = displayNameFromEmail(user.email ?? profile.email)
  const formattedDate = formatDiagnosticDate(analysis.created_at)

  return (
    <>
      <ResultViewedTracker
        skinType={analysis.skin_type ?? ''}
        concernsCount={analysis.concerns?.length ?? 0}
        isPremium={false}
      />
      <PaywallScreen {...buildPaywallProps(name, formattedDate, analysis)} />
    </>
  )
}
