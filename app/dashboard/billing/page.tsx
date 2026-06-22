import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { BillingActions } from '@/components/billing/BillingActions'

export default async function BillingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/dashboard/billing')

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status, subscription_plan, trial_ends_at, current_period_end, cancel_at_period_end, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/dashboard')

  const status = profile.subscription_status ?? 'trialing'
  const isActive = ['active', 'trialing', 'lifetime'].includes(status)
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-terracotta">
        Mon compte
      </p>
      <h1 className="mt-3 font-display text-3xl text-charcoal">Abonnement</h1>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-wide text-stone">Statut</p>
          <StatusBadge status={status} />
        </div>

        {profile.current_period_end && status === 'active' && (
          <div className="mt-4 flex items-center justify-between border-t border-charcoal/8 pt-4">
            <p className="font-mono text-xs uppercase tracking-wide text-stone">
              {profile.cancel_at_period_end ? 'Accès jusqu'au' : 'Prochain renouvellement'}
            </p>
            <p className="text-sm text-charcoal">
              {new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(profile.current_period_end))}
            </p>
          </div>
        )}

        {profile.trial_ends_at && status === 'trialing' && (
          <div className="mt-4 flex items-center justify-between border-t border-charcoal/8 pt-4">
            <p className="font-mono text-xs uppercase tracking-wide text-stone">
              Essai gratuit jusqu'au
            </p>
            <p className="text-sm text-charcoal">
              {new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(profile.trial_ends_at))}
            </p>
          </div>
        )}
      </div>

      <BillingActions isActive={isActive} daysSinceStart={daysSinceStart} />
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: 'Actif', className: 'bg-[#EEF3EA] text-[#5B7A52]' },
    trialing: { label: 'Essai gratuit', className: 'bg-[#EEF3EA] text-[#5B7A52]' },
    lifetime: { label: 'À vie', className: 'bg-charcoal text-cream' },
    canceled: { label: 'Annulé', className: 'bg-terracotta/10 text-terracotta' },
    past_due: { label: 'Paiement en attente', className: 'bg-amber-50 text-amber-700' },
  }
  const { label, className } = config[status] ?? { label: status, className: 'bg-charcoal/10 text-charcoal' }

  return (
    <span className={`rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] ${className}`}>
      {label}
    </span>
  )
}
