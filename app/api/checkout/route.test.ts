// To run these tests: npm install --save-dev jest @types/jest jest-environment-node ts-jest
// and add to package.json: "test": "jest"
// or use vitest (drop-in compatible): npm install --save-dev vitest

import { POST } from './route'

// --- mocks ---

const mockGetUser = jest.fn()
const mockSupabaseSelect = jest.fn()
const mockSupabaseUpdate = jest.fn()
const mockStripeCustomerCreate = jest.fn()
const mockStripeSessionCreate = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}))

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSupabaseSelect,
        }),
      }),
      update: () => ({
        eq: mockSupabaseUpdate,
      }),
    }),
  },
}))

jest.mock('@/lib/stripe/server', () => ({
  stripe: {
    customers: { create: mockStripeCustomerCreate },
    checkout: { sessions: { create: mockStripeSessionCreate } },
  },
}))

jest.mock('@/lib/stripe/config', () => ({
  PRICING_PLANS: {
    monthly: {
      priceId: 'price_monthly_test',
      mode: 'subscription',
      trialDays: 7,
    },
    yearly: {
      priceId: 'price_yearly_test',
      mode: 'subscription',
      trialDays: 7,
    },
    lifetime: {
      priceId: 'price_lifetime_test',
      mode: 'payment',
      trialDays: 0,
    },
  },
}))

// --- helpers ---

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.mira.com'
})

// --- tests ---

describe('POST /api/checkout', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await POST(makeRequest({ plan: 'monthly' }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Non authentifié')
  })

  it('returns 400 for an unknown plan', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'a@b.com' } },
      error: null,
    })
    mockSupabaseSelect.mockResolvedValue({
      data: { stripe_customer_id: null, email: 'a@b.com', subscription_status: 'free' },
    })

    const res = await POST(makeRequest({ plan: 'enterprise' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid plan')
  })

  it('returns 400 when user already has an active subscription', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'a@b.com' } },
      error: null,
    })
    mockSupabaseSelect.mockResolvedValue({
      data: {
        stripe_customer_id: 'cus_existing',
        email: 'a@b.com',
        subscription_status: 'active',
      },
    })

    const res = await POST(makeRequest({ plan: 'monthly' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('Tu as déjà un abonnement actif')
  })

  it('allows an active user to upgrade to lifetime', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'a@b.com' } },
      error: null,
    })
    mockSupabaseSelect.mockResolvedValue({
      data: {
        stripe_customer_id: 'cus_existing',
        email: 'a@b.com',
        subscription_status: 'active',
      },
    })
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    })

    const res = await POST(makeRequest({ plan: 'lifetime' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.url).toContain('stripe.com')
    expect(mockStripeCustomerCreate).not.toHaveBeenCalled()
  })

  it('creates a Stripe customer when none exists and saves it to the profile', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-2', email: 'new@user.com' } },
      error: null,
    })
    mockSupabaseSelect.mockResolvedValue({
      data: { stripe_customer_id: null, email: 'new@user.com', subscription_status: 'free' },
    })
    mockStripeCustomerCreate.mockResolvedValue({ id: 'cus_new_456' })
    mockSupabaseUpdate.mockResolvedValue({ error: null })
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_test_456',
      url: 'https://checkout.stripe.com/pay/cs_test_456',
    })

    const res = await POST(makeRequest({ plan: 'monthly' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockStripeCustomerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@user.com',
        metadata: { user_id: 'user-2', app: 'mira' },
      })
    )
    expect(mockSupabaseUpdate).toHaveBeenCalled()
    expect(body.sessionId).toBe('cs_test_456')
  })

  it('adds subscription_data and custom_text for subscription plans', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-3', email: 'sub@user.com' } },
      error: null,
    })
    mockSupabaseSelect.mockResolvedValue({
      data: {
        stripe_customer_id: 'cus_sub',
        email: 'sub@user.com',
        subscription_status: 'free',
      },
    })
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_sub_789',
      url: 'https://checkout.stripe.com/pay/cs_sub_789',
    })

    await POST(makeRequest({ plan: 'yearly' }))

    expect(mockStripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        subscription_data: expect.objectContaining({ trial_period_days: 7 }),
        custom_text: expect.objectContaining({ submit: expect.any(Object) }),
      })
    )
  })

  it('returns 500 on Stripe error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-4', email: 'err@user.com' } },
      error: null,
    })
    mockSupabaseSelect.mockResolvedValue({
      data: { stripe_customer_id: 'cus_err', email: 'err@user.com', subscription_status: 'free' },
    })
    mockStripeSessionCreate.mockRejectedValue(new Error('Stripe connection failed'))

    const res = await POST(makeRequest({ plan: 'monthly' }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Stripe connection failed')
  })
})
