'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent, identifyUser } from '@/lib/analytics/posthog'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackEvent('signup_modal_viewed')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    trackEvent('signup_started', { method: 'email' })

    const supabase = createClient()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })

    setLoading(false)

    if (signUpError) {
      trackEvent('signup_failed', { reason: signUpError.message })
      setError(signUpError.message)
      return
    }

    if (!signUpData.session) {
      setError(
        "Confirme ton adresse e-mail via le lien que nous venons de t'envoyer, puis connecte-toi."
      )
      return
    }

    if (signUpData.user) {
      const firstName =
        sessionStorage.getItem('user_first_name') ??
        localStorage.getItem('user_first_name') ??
        ''
      trackEvent('signup_completed', {
        method: 'email',
        utm_source: localStorage.getItem('first_utm_source') || 'direct',
        utm_campaign: localStorage.getItem('first_utm_campaign') || '',
      })
      identifyUser(signUpData.user.id, {
        email: signUpData.user.email,
        first_name: firstName,
        signup_source: localStorage.getItem('first_utm_source') || 'direct',
        signup_campaign: localStorage.getItem('first_utm_campaign') || '',
        signup_date: new Date().toISOString(),
      })
    }

    router.push(redirectTo)
  }

  async function handleGoogle() {
    trackEvent('signup_started', { method: 'google' })
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-2xl text-charcoal">
        Créer un compte
      </h1>
      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-stone focus:border-terracotta focus:outline-none"
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-stone focus:border-terracotta focus:outline-none"
        />
        {error && <p className="text-sm text-terracotta">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-terracotta py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Création du compte…' : 'Créer mon compte'}
        </button>
      </form>
      <button
        type="button"
        onClick={handleGoogle}
        className="mt-4 w-full rounded-xl border border-charcoal/15 bg-white py-3 text-sm font-medium text-charcoal transition-colors hover:bg-charcoal/5"
      >
        Continuer avec Google
      </button>
      <p className="mt-6 text-center text-sm text-stone">
        Déjà un compte ?{' '}
        <a
          href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="text-terracotta underline"
        >
          Connexion
        </a>
      </p>
    </main>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
