'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/posthog'

function Tracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return

    const plan = localStorage.getItem('cleancare:checkout_plan') ?? 'unknown'
    const price = parseFloat(localStorage.getItem('cleancare:checkout_price') ?? '0')

    localStorage.removeItem('cleancare:checkout_plan')
    localStorage.removeItem('cleancare:checkout_price')

    trackEvent('checkout_completed', {
      plan,
      value: price,
      currency: 'EUR',
      has_trial: plan !== 'lifetime',
    })
    trackEvent('subscription_started', { plan, value: price })
  }, [searchParams])

  return null
}

export function CheckoutSuccessTracker() {
  return (
    <Suspense>
      <Tracker />
    </Suspense>
  )
}
