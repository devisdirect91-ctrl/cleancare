'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics/posthog'

interface ResultViewedTrackerProps {
  skinType: string
  concernsCount: number
  isPremium: boolean
}

export function ResultViewedTracker({
  skinType,
  concernsCount,
  isPremium,
}: ResultViewedTrackerProps) {
  useEffect(() => {
    trackEvent('result_viewed', {
      skin_type: skinType || null,
      concerns_count: concernsCount,
      is_premium: isPremium,
    })
  }, [skinType, concernsCount, isPremium])

  return null
}
