import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY!,
  annual: process.env.STRIPE_PRICE_ID_ANNUAL!,
  lifetime: process.env.STRIPE_PRICE_ID_LIFETIME!,
} as const

type Plan = keyof typeof PRICE_IDS

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const user = userData.user

  const { plan } = (await request.json()) as { plan?: Plan }
  if (!plan || !(plan in PRICE_IDS)) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: plan === 'lifetime' ? 'payment' : 'subscription',
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
    client_reference_id: user.id,
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    subscription_data:
      plan === 'lifetime' ? undefined : { trial_period_days: 7 },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
