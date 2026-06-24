import type Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { PRICING_PLANS, type PlanKey } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED_PLANS = new Set<PlanKey>(['monthly', 'yearly', 'lifetime'])

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const plan = body?.plan as PlanKey | undefined

    if (!plan || !ALLOWED_PLANS.has(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email, subscription_status, subscription_id')
      .eq('id', user.id)
      .single()

    const status = profile?.subscription_status as string | undefined
    const hasStripeSubscription = Boolean(profile?.subscription_id)

    // Block only users with a real Stripe subscription (subscription_id exists).
    // 'trialing' without a subscription_id = free in-app trial, allow checkout.
    const isBlocked =
      hasStripeSubscription &&
      (status === 'active' || status === 'trialing' || status === 'lifetime')
    const isLifetimeUpgrade = status === 'active' && plan === 'lifetime' && hasStripeSubscription

    if (isBlocked && !isLifetimeUpgrade) {
      return NextResponse.json(
        { error: 'Tu as déjà un abonnement actif' },
        { status: 400 }
      )
    }

    let customerId = profile?.stripe_customer_id ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? undefined,
        metadata: { user_id: user.id, app: 'lumiscan' },
        preferred_locales: ['fr'],
      })
      customerId = customer.id

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const planConfig = PRICING_PLANS[plan]
    if (!planConfig?.priceId) {
      console.error(`[checkout] missing price ID for plan "${plan}" — check STRIPE_PRICE_ID_* env vars`)
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: planConfig.mode,
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      locale: 'fr',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: { user_id: user.id, plan_type: plan },
      success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/paywall?checkout=canceled`,
    }

    if (planConfig.mode === 'subscription') {
      sessionParams.subscription_data = {
        trial_period_days: planConfig.trialDays,
        metadata: { user_id: user.id, plan_type: plan },
      }
      sessionParams.custom_text = {
        submit: {
          message:
            'Tu ne seras pas facturée pendant les 7 premiers jours. Annule à tout moment.',
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('[checkout] error:', err)
    const message =
      err instanceof Error ? err.message : 'Une erreur est survenue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
