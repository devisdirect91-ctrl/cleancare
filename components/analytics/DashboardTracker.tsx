'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics/posthog'

interface Props {
  subscriptionStatus: string
  createdAt: string
}

export function DashboardTracker({ subscriptionStatus, createdAt }: Props) {
  useEffect(() => {
    const lastVisit = localStorage.getItem('last_visit_at')
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    trackEvent('dashboard_viewed', {
      is_returning: lastVisit !== null,
      days_since_signup: daysSinceSignup,
      subscription_status: subscriptionStatus,
    })

    localStorage.setItem('last_visit_at', new Date().toISOString())
  }, [subscriptionStatus, createdAt])

  return null
}
