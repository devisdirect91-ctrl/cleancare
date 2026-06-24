export type SubscriptionStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'lifetime'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  created_at: string
  trial_ends_at: string
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  subscription_id: string | null
  subscription_plan: string | null
  current_period_end: string | null
  lifetime_purchased_at: string | null
  cancel_at_period_end: boolean
  active_analysis_id: string | null
}

export interface RoutineLog {
  id: string
  user_id: string
  log_date: string
  slot: 'morning' | 'evening'
  step_index: number
  created_at: string
}

export interface Analysis {
  id: string
  user_id: string
  photo_url: string | null
  skin_type: string | null
  concerns: string[]
  undertone: string | null
  routine_morning: RoutineStep[]
  routine_evening: RoutineStep[]
  recommended_products: RecommendedProduct[]
  full_result: Record<string, unknown>
  created_at: string
}

export interface RoutineStep {
  step: number
  category: string
  reason: string
}

export interface RecommendedProduct {
  id: string
  name: string
  brand: string
  category: string
  price_eur: number
  for_skin_types: string[]
  affiliate_url: string | null
  image_url: string | null
}

export interface Product {
  id: string
  name: string
  brand: string
  category: string
  price_eur: number
  for_skin_types: string[]
  affiliate_url: string | null
  image_url: string | null
  created_at: string
}
