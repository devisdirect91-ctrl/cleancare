type EventProperties = Record<string, string | number | boolean | null | undefined>

export function trackEvent(name: string, properties?: EventProperties): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', name, properties ?? {})
  }
  // TODO: wire up to Posthog, Plausible, or Mixpanel
  // e.g. posthog.capture(name, properties)
}
