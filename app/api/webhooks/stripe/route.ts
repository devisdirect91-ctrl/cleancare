import type Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendTrialEndingEmail, sendPaymentFailedEmail } from '@/lib/email'
import { trackServerEvent } from '@/lib/analytics/posthog-server'

// ── Health check ────────────────────────────────────────────────────────────

export function GET() {
  return NextResponse.json({ status: 'healthy', endpoint: 'stripe' })
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getUserIdFromCustomerId(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()
  return data?.id ?? null
}

async function getUserIdFromSubscription(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.user_id) return sub.metadata.user_id

  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  return getUserIdFromCustomerId(customerId)
}

async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return null
    return (customer as Stripe.Customer).email ?? null
  } catch {
    return null
  }
}

// ── Event log helpers ────────────────────────────────────────────────────────

async function isDuplicate(eventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('webhook_logs')
    .select('event_id')
    .eq('event_id', eventId)
    .single()
  return data !== null
}

async function logEvent(
  event: Stripe.Event,
  userId: string | null,
  success: boolean,
  errorMessage?: string
) {
  await supabaseAdmin.from('webhook_logs').insert({
    event_id: event.id,
    event_type: event.type,
    user_id: userId,
    processed_at: new Date().toISOString(),
    success,
    error_message: errorMessage ?? null,
    // Strip PII-heavy nested objects from the stored payload
    raw_payload: {
      id: event.id,
      type: event.type,
      created: event.created,
      livemode: event.livemode,
      data: { object: (event.data.object as unknown as Record<string, unknown>) },
    },
  })
}

// ── Event handlers ───────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const planType = session.metadata?.plan_type

  if (!userId || planType !== 'lifetime') return null

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'lifetime',
      lifetime_purchased_at: new Date().toISOString(),
    })
    .eq('id', userId)

  console.log(`[webhook] lifetime purchased → user ${userId}`)
  return userId
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const userId = await getUserIdFromSubscription(sub)
  if (!userId) {
    console.warn(`[webhook] ${sub.id}: no user_id found`)
    return null
  }

  const firstItem = sub.items.data[0]
  const priceId = firstItem?.price?.id ?? null
  // In Stripe SDK v22+, current_period_end lives on the subscription item, not on Subscription itself.
  const periodEnd = firstItem?.current_period_end ?? null

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: sub.status,
      subscription_id: sub.id,
      subscription_plan: priceId,
      trial_ends_at: sub.trial_end
        ? new Date(sub.trial_end * 1000).toISOString()
        : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    })
    .eq('id', userId)

  console.log(`[webhook] subscription ${sub.status} → user ${userId}`)
  return userId
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = await getUserIdFromSubscription(sub)

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'canceled' })
    .eq('subscription_id', sub.id)

  if (error) throw error
  console.log(`[webhook] subscription canceled: ${sub.id}`)
  return userId
}

async function handleTrialWillEnd(sub: Stripe.Subscription) {
  const userId = await getUserIdFromSubscription(sub)

  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const email = await getCustomerEmail(customerId)

  if (email) {
    await sendTrialEndingEmail(userId ?? '', email)
  }

  console.log(`[webhook] trial_will_end: sub ${sub.id}, user ${userId}`)
  return userId
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  // In Stripe SDK v22+, invoice.subscription was removed.
  // The subscription reference now lives at invoice.parent.subscription_details.subscription.
  const details = invoice.parent?.type === 'subscription_details'
    ? invoice.parent.subscription_details
    : null
  if (!details) return null
  const sub = details.subscription
  return typeof sub === 'string' ? sub : (sub?.id ?? null)
}

async function handleInvoiceSucceeded(invoice: Stripe.Invoice) {
  // Only update on renewals, not on the first charge after trial
  if (invoice.billing_reason !== 'subscription_cycle') return null

  const subscriptionId = getSubscriptionIdFromInvoice(invoice)
  if (!subscriptionId) return null

  const periodEnd = invoice.lines?.data[0]?.period?.end
  if (!periodEnd) return null

  await supabaseAdmin
    .from('profiles')
    .update({ current_period_end: new Date(periodEnd * 1000).toISOString() })
    .eq('subscription_id', subscriptionId)

  console.log(`[webhook] invoice paid (renewal) for sub ${subscriptionId}`)
  return null
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : (invoice.customer as Stripe.Customer | null)?.id ?? null

  if (!customerId) return null

  const userId = await getUserIdFromCustomerId(customerId)
  const email = await getCustomerEmail(customerId)

  const subscriptionId = getSubscriptionIdFromInvoice(invoice)

  if (subscriptionId) {
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'past_due' })
      .eq('subscription_id', subscriptionId)
  }

  if (email) {
    await sendPaymentFailedEmail(email)
  }

  console.log(`[webhook] payment_failed: customer ${customerId}, user ${userId}`)
  return userId
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[webhook] signature verification failed:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Idempotency guard
  if (await isDuplicate(event.id)) {
    console.log(`[webhook] duplicate event ignored: ${event.id}`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  let userId: string | null = null
  let success = true
  let errorMessage: string | undefined

  try {
    const obj = event.data.object

    switch (event.type) {
      case 'checkout.session.completed':
        userId = await handleCheckoutCompleted(obj as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created': {
        const sub = obj as Stripe.Subscription
        userId = await handleSubscriptionUpsert(sub)
        if (userId) {
          await trackServerEvent(userId, 'subscription_created_server', {
            plan: sub.items.data[0]?.price?.id,
            status: sub.status,
            trial_end: sub.trial_end,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = obj as Stripe.Subscription
        const prev = (event.data.previous_attributes ?? {}) as Record<string, unknown>
        userId = await handleSubscriptionUpsert(sub)

        if (userId) {
          // Cancellation scheduled: cancel_at_period_end just turned true
          if (sub.cancel_at_period_end && prev.cancel_at_period_end === false) {
            const daysUsed = Math.floor(
              (Date.now() / 1000 - sub.created) / 86400
            )
            await trackServerEvent(userId, 'subscription_cancellation_scheduled', {
              plan: sub.items.data[0]?.price?.id,
              days_used: daysUsed,
              cancel_at: sub.cancel_at
                ? new Date(sub.cancel_at * 1000).toISOString()
                : null,
            })
          }

          // Reactivation: cancel_at_period_end just turned false (user un-canceled)
          if (!sub.cancel_at_period_end && prev.cancel_at_period_end === true) {
            await trackServerEvent(userId, 'subscription_reactivated', {
              plan: sub.items.data[0]?.price?.id,
              status: sub.status,
            })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = obj as Stripe.Subscription
        userId = await handleSubscriptionDeleted(sub)
        if (userId) {
          await trackServerEvent(userId, 'subscription_canceled', {
            reason: (sub as unknown as Record<string, unknown>)?.cancellation_details
              ? ((sub as unknown as Record<string, unknown>).cancellation_details as Record<string, unknown>)?.reason
              : null,
          })
        }
        break
      }

      case 'customer.subscription.trial_will_end':
        userId = await handleTrialWillEnd(obj as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded': {
        const invoice = obj as Stripe.Invoice
        userId = await handleInvoiceSucceeded(invoice)
        if (userId && invoice.billing_reason === 'subscription_cycle') {
          await trackServerEvent(userId, 'trial_converted', {
            plan: (invoice.lines?.data[0] as unknown as { price?: { id?: string } })?.price?.id ?? null,
            value: (invoice.amount_paid ?? 0) / 100,
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = obj as Stripe.Invoice
        userId = await handleInvoiceFailed(invoice)
        if (userId) {
          await trackServerEvent(userId, 'payment_failed_server', {
            amount: (invoice.amount_due ?? 0) / 100,
            attempt: invoice.attempt_count,
          })
        }
        break
      }

      default:
        console.log(`[webhook] unhandled event type: ${event.type}`)
    }
  } catch (err) {
    success = false
    errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[webhook] error processing ${event.type}:`, err)
  }

  // Always log, always return 200 so Stripe doesn't retry forever
  try {
    await logEvent(event, userId, success, errorMessage)
  } catch (logErr) {
    console.error('[webhook] failed to write webhook_log:', logErr)
  }

  return NextResponse.json({ received: true })
}
