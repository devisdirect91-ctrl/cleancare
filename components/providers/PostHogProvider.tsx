'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { initPostHog, captureAttribution, trackEvent, identifyUser } from '@/lib/analytics/posthog'

function PostHogInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    initPostHog()
    captureAttribution()
  }, [])

  // Identify user whenever auth state changes
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, subscription_status, subscription_plan, created_at')
          .eq('id', session.user.id)
          .single()

        if (!profile) return

        // Track when a canceled user comes back
        if (profile.subscription_status === 'canceled') {
          const sessionKey = 'ph:canceled_returned_tracked'
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1')
            trackEvent('canceled_user_returned')
          }
        }

        identifyUser(session.user.id, {
          email: session.user.email,
          first_name: profile.first_name,
          subscription_status: profile.subscription_status,
          subscription_plan: profile.subscription_plan,
          is_premium: ['trialing', 'active', 'lifetime'].includes(
            profile.subscription_status ?? ''
          ),
          signup_date: profile.created_at,
          days_since_signup: Math.floor(
            (Date.now() - new Date(profile.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Track pageview on every route change
  useEffect(() => {
    if (pathname) {
      const url =
        window.location.origin +
        pathname +
        (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      trackEvent('$pageview', {
        $current_url: url,
        pathname: pathname,
      })
    }
  }, [pathname, searchParams])

  return <>{children}</>
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <PostHogInner>{children}</PostHogInner>
    </Suspense>
  )
}
