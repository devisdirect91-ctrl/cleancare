import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, CreditCard } from 'lucide-react'
import { LogoutButton } from '@/components/app/logout-button'
import { ProfileNameEditor } from '@/components/app/profile-name-editor'
import { TabViewTracker } from '@/components/app/tab-view-tracker'
import { displayNameFromEmail } from '@/lib/diagnostic'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisRow, Profile } from '@/types/analysis'

const STATUS_LABEL: Record<string, string> = {
  active: 'Abonnement actif',
  trialing: 'Essai en cours',
  lifetime: 'Accès à vie',
  past_due: 'Paiement en attente',
  canceled: 'Annulé',
  free: 'Gratuit',
}

export default async function ProfilPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/profil')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, email, subscription_status, subscription_plan')
    .eq('id', user.id)
    .single<
      Pick<
        Profile,
        'first_name' | 'email' | 'subscription_status' | 'subscription_plan'
      >
    >()

  const { data: analysis } = await supabase
    .from('analyses')
    .select('skin_type, undertone')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Pick<AnalysisRow, 'skin_type' | 'undertone'>>()

  const name =
    profile?.first_name?.trim() ||
    (user.email ? displayNameFromEmail(user.email) : 'toi')
  const email = user.email ?? profile?.email ?? ''
  const status = profile?.subscription_status ?? 'free'

  return (
    <main className="px-5 pt-9">
      <TabViewTracker tab="profil" />
      <h1 className="font-display text-[30px] tracking-tight text-charcoal">
        Profil
      </h1>

      {/* Identité (prénom éditable) */}
      <div className="mt-6">
        <ProfileNameEditor userId={user.id} initialName={name} email={email} />
      </div>

      {/* Profil peau */}
      {analysis && (
        <div className="mt-4 rounded-[22px] border border-[#E5DCC8] bg-[#FFFCF6] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone">
            Profil peau
          </p>
          <div className="mt-3 flex gap-2">
            <Tag>Peau {analysis.skin_type ?? '—'}</Tag>
            <Tag>Sous-ton {analysis.undertone ?? '—'}</Tag>
          </div>
        </div>
      )}

      {/* Abonnement */}
      <div className="mt-4 rounded-[22px] border border-[#E5DCC8] bg-[#FFFCF6] p-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone">
          Abonnement
        </p>
        <p className="mt-1.5 font-display text-[17px] text-charcoal">
          {STATUS_LABEL[status] ?? status}
        </p>
        <Link
          href="/dashboard/billing"
          className="mt-4 flex items-center justify-between rounded-full border border-[#E5DCC8] px-4 py-3 transition-colors hover:bg-cream"
        >
          <span className="flex items-center gap-2 font-sans text-[14px] text-charcoal">
            <CreditCard className="h-4 w-4 text-stone" strokeWidth={1.6} />
            Gérer mon abonnement
          </span>
          <ChevronRight className="h-4 w-4 text-stone" />
        </Link>
      </div>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </main>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-cream px-3 py-1.5 font-sans text-[13px] capitalize text-charcoal">
      {children}
    </span>
  )
}
