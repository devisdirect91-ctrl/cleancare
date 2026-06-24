'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics/posthog'

export function TabViewTracker({ tab }: { tab: string }) {
  useEffect(() => {
    trackEvent('app_tab_viewed', { tab })
  }, [tab])
  return null
}
