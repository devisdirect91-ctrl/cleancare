import { PostHog } from 'posthog-node'

let serverClient: PostHog | null = null

export function getPostHogServer(): PostHog | null {
  if (!serverClient && process.env.POSTHOG_KEY_SERVER) {
    serverClient = new PostHog(process.env.POSTHOG_KEY_SERVER, {
      host: 'https://eu.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return serverClient
}

export async function trackServerEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = getPostHogServer()
  if (!client) return

  client.capture({ distinctId: userId, event, properties })
  await client.shutdown()
}
