'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, captureAttribution, trackEvent } from '@/lib/analytics/posthog'

function PostHogInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    initPostHog()
    captureAttribution()
  }, [])

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
