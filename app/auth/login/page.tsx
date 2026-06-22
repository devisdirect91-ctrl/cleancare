'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.push(redirectTo)
  }

  async function handleGoogle() {
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
      <h1 className="font-display text-2xl text-charcoal">Connexion</h1>
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
          {loading ? 'Connexion…' : 'Se connecter'}
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
        Pas encore de compte ?{' '}
        <a
          href={`/auth/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="text-terracotta underline"
        >
          Créer un compte
        </a>
      </p>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
