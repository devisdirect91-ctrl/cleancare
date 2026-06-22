import posthog from 'posthog-js'

let initialized = false

export function initPostHog() {
  if (typeof window === 'undefined' || initialized) return

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) {
    console.warn('PostHog not initialized: NEXT_PUBLIC_POSTHOG_KEY missing')
    return
  }

  posthog.init(apiKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private]',
    },
    loaded: () => {
      initialized = true
    },
  })
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(name, properties)
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.identify(userId, traits)
}

export function resetUser() {
  if (typeof window === 'undefined') return
  posthog.reset()
}

export function captureAttribution() {
  if (typeof window === 'undefined') return

  const urlParams = new URLSearchParams(window.location.search)
  const utmSource = urlParams.get('utm_source')
  const utmMedium = urlParams.get('utm_medium')
  const utmCampaign = urlParams.get('utm_campaign')
  const utmContent = urlParams.get('utm_content')
  const referrer = document.referrer

  if (utmSource && !localStorage.getItem('first_utm_source')) {
    localStorage.setItem('first_utm_source', utmSource)
    localStorage.setItem('first_utm_medium', utmMedium || '')
    localStorage.setItem('first_utm_campaign', utmCampaign || '')
    localStorage.setItem('first_utm_content', utmContent || '')
    localStorage.setItem('first_referrer', referrer || '')
    localStorage.setItem('first_landing_at', new Date().toISOString())
  }

  if (utmSource || referrer) {
    trackEvent('attribution_captured', {
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      referrer: referrer,
    })
  }
}

export { posthog }
