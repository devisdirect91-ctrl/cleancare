import type { RoutineStep, SkinAnalysis } from '@/lib/llm/analyze'

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

export interface AnalysisRow {
  id: string
  user_id: string
  photo_url: string | null
  skin_type: string | null
  concerns: string[]
  undertone: string | null
  routine_morning: RoutineStep[]
  routine_evening: RoutineStep[]
  recommended_products: RecommendedProduct[]
  full_result: Partial<SkinAnalysis>
  created_at: string
}

export interface Profile {
  id: string
  email: string
  created_at: string
  trial_ends_at: string
  subscription_status: 'trial' | 'active' | 'past_due' | 'canceled'
  stripe_customer_id: string | null
}
