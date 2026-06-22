import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Profile, SubscriptionStatus } from '@/types/database'

export interface SubscriptionState {
  status: SubscriptionStatus
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  planType: string | null
  cancelAtPeriodEnd: boolean
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>()
  return data
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const profile = await fetchProfile(userId)
  if (!profile) return false

  const { subscription_status, current_period_end } = profile

  if (subscription_status === 'lifetime') return true

  if (subscription_status === 'trialing' || subscription_status === 'active') {
    if (!current_period_end) return true
    return new Date(current_period_end) > new Date()
  }

  return false
}

export async function exportSubscriptionStatus(
  userId: string
): Promise<SubscriptionState | null> {
  const profile = await fetchProfile(userId)
  if (!profile) return null

  return {
    status: profile.subscription_status,
    trialEndsAt: profile.trial_ends_at,
    currentPeriodEnd: profile.current_period_end,
    planType: profile.subscription_plan,
    cancelAtPeriodEnd: profile.cancel_at_period_end,
  }
}
