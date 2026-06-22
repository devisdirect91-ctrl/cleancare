import Link from 'next/link'
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

  const name = displayNameFromEmail(user.email ?? profile.email)
  const formattedDate = formatDiagnosticDate(analysis.created_at)

  return <PaywallScreen {...buildPaywallProps(name, formattedDate, analysis)} />
}
