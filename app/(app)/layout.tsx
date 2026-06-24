import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/app/bottom-nav'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

// Section connectée premium : garde auth + abonnement, puis shell + onglets.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/routine')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, current_period_end')
    .eq('id', user.id)
    .single<Pick<Profile, 'subscription_status' | 'current_period_end'>>()

  const status = profile?.subscription_status
  const premium =
    status === 'active' ||
    status === 'lifetime' ||
    (status === 'trialing' &&
      (!profile?.current_period_end ||
        new Date(profile.current_period_end) > new Date()))

  // Pas (encore) premium → on renvoie vers le paywall.
  if (!premium) {
    redirect('/result')
  }

  return (
    <div className="mx-auto min-h-svh max-w-md bg-cream pb-24">
      {children}
      <BottomNav />
    </div>
  )
}
