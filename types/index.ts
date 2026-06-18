export interface User {
  id: string
  email: string
  createdAt: string
}

export interface AnalysisResult {
  id: string
  userId: string
  imageUrl: string
  result: string
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  stripeSubscriptionId: string
  status: 'active' | 'canceled' | 'past_due'
  priceId: string
  currentPeriodEnd: string
}
