import { AnonymousPaywall } from '@/components/dashboard/anonymous-paywall'
import { AutoCheckout } from '@/components/paywall/AutoCheckout'
import { PaywallScreen } from '@/components/dashboard/paywall-screen'
import {
  buildPaywallProps,
  displayNameFromEmail,
  formatDiagnosticDate,
  getLatestDiagnostic,
} from '@/lib/diagnostic'
import { createClient } from '@/lib/supabase/server'
import type { PlanKey } from '@/lib/stripe/config'

const VALID_PLANS = new Set<string>(['monthly', 'yearly', 'lifetime'])

export default async function PaywallPage({
  searchParams,
}: {
  searchParams: { plan?: string; checkout?: string }
}) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  // After signup: user is now logged in and has a pending plan → auto-checkout
  const pendingPlan = searchParams.plan
  if (user && pendingPlan && VALID_PLANS.has(pendingPlan)) {
    return <AutoCheckout plan={pendingPlan as PlanKey} />
  }

  // Anonymous user — read analysis from sessionStorage and show PaywallScreen
  if (!user) {
    return <AnonymousPaywall />
  }

  const { profile, analysis } = await getLatestDiagnostic(supabase, user.id)

  // No analysis yet — fall back to anonymous flow (reads sessionStorage)
  if (!analysis || !profile) {
    return <AnonymousPaywall />
  }

  // Logged-in user with analysis — show diagnostic preview + pricing
  const name = displayNameFromEmail(user.email ?? profile.email)
  const formattedDate = formatDiagnosticDate(analysis.created_at)

  return <PaywallScreen {...buildPaywallProps(name, formattedDate, analysis)} />
}
