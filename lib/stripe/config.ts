export type PlanKey = 'monthly' | 'yearly' | 'lifetime'

export const PRICING_PLANS: Record<
  PlanKey,
  {
    priceId: string | undefined
    mode: 'subscription' | 'payment'
    trialDays: number
    label: string
    price: number
    currency: 'EUR'
    interval: 'month' | 'year' | null
  }
> = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY,
    mode: 'subscription',
    trialDays: 7,
    label: 'Mensuel',
    price: 7.99,
    currency: 'EUR',
    interval: 'month',
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_ID_ANNUAL,
    mode: 'subscription',
    trialDays: 7,
    label: 'Annuel',
    price: 49,
    currency: 'EUR',
    interval: 'year',
  },
  lifetime: {
    priceId: process.env.STRIPE_PRICE_ID_LIFETIME,
    mode: 'payment',
    trialDays: 0,
    label: 'Lifetime',
    price: 99,
    currency: 'EUR',
    interval: null,
  },
}
