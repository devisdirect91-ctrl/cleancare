import { AnonymousPaywall } from '@/components/dashboard/anonymous-paywall'
import { PaywallScreen } from '@/components/dashboard/paywall-screen'
import {
  buildPaywallProps,
  displayNameFromEmail,
  formatDiagnosticDate,
  getLatestDiagnostic,
} from '@/lib/diagnostic'
import { createClient } from '@/lib/supabase/server'

export default async function PaywallPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  // Anonymous user — read analysis from sessionStorage and show PaywallScreen
  if (!user) {
    return <AnonymousPaywall />
  }

  const { profile, analysis } = await getLatestDiagnostic(supabase, user.id)

  // No analysis yet — fall back to anonymous flow (also handles empty state)
  if (!analysis || !profile) {
    return <AnonymousPaywall />
  }

  // Logged-in user with analysis — show diagnostic preview + pricing
  const name = displayNameFromEmail(user.email ?? profile.email)
  const formattedDate = formatDiagnosticDate(analysis.created_at)

  return <PaywallScreen {...buildPaywallProps(name, formattedDate, analysis)} />
}
