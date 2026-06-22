'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/posthog'

function Tracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('checkout') !== 'canceled') return
    trackEvent('checkout_canceled', { reason: 'user_canceled_on_stripe' })
  }, [searchParams])

  return null
}

export function CheckoutCanceledTracker() {
  return (
    <Suspense>
      <Tracker />
    </Suspense>
  )
}
