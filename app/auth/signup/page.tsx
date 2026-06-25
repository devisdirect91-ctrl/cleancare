'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { Eye, EyeOff, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent, identifyUser } from '@/lib/analytics/posthog'

function translateError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'Un compte existe déjà avec cet email. Connecte-toi plutôt.'
  }
  if (m.includes('password')) {
    return 'Ton mot de passe doit contenir au moins 6 caractères.'
  }
  if (m.includes('valid email') || m.includes('invalid')) {
    return 'Cette adresse email ne semble pas valide.'
  }
  return 'Une erreur est survenue, réessaie.'
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.2 13.5 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7C43.7 38 46.5 31.8 46.5 24.5z" />
      <path fill="#FBBC05" d="M10.4 28.3c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8l-7.8-6.1C1 16 0 19.9 0 24s1 8 2.6 11.4l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.3-5.7c-2 1.4-4.7 2.3-7.7 2.3-6.4 0-11.8-4-13.6-9.7l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/routine'

  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    trackEvent('signup_modal_viewed')
    const stored =
      sessionStorage.getItem('user_first_name')?.trim() ||
      localStorage.getItem('user_first_name')?.trim() ||
      ''
    setFirstName(stored)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Ton mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)
    trackEvent('signup_started', { method: 'email' })

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        data: firstName ? { first_name: firstName } : undefined,
      },
    })

    setLoading(false)

    if (signUpError) {
      trackEvent('signup_failed', { reason: signUpError.message })
      setError(translateError(signUpError.message))
      return
    }

    // Pas de session = confirmation email requise (option B / filet de sécurité).
    if (!data.session) {
      trackEvent('signup_email_confirmation_required')
      setEmailSent(true)
      return
    }

    if (data.user) {
      // Persiste le prénom sur le profil (best-effort).
      if (firstName) {
        await supabase
          .from('profiles')
          .update({ first_name: firstName })
          .eq('id', data.user.id)
      }
      trackEvent('signup_completed', {
        method: 'email',
        utm_source: localStorage.getItem('first_utm_source') || 'direct',
        utm_campaign: localStorage.getItem('first_utm_campaign') || '',
      })
      identifyUser(data.user.id, {
        email: data.user.email,
        first_name: firstName,
        signup_source: localStorage.getItem('first_utm_source') || 'direct',
        signup_date: new Date().toISOString(),
      })
    }

    router.push(redirectTo)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    trackEvent('signup_started', { method: 'google' })
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })
  }

  // État « vérifie ta boîte mail » (si confirmation email activée).
  if (emailSent) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/12">
          <MailCheck className="h-7 w-7 text-terracotta" strokeWidth={1.5} />
        </span>
        <h1 className="mt-6 font-display text-[28px] leading-tight tracking-tight text-charcoal">
          Vérifie ta boîte mail
        </h1>
        <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-[#6B6356]">
          On vient d&apos;envoyer un lien d&apos;activation à{' '}
          <strong className="text-charcoal">{email}</strong>. Clique dessus pour
          activer ton compte et continuer.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-stone underline underline-offset-4"
        >
          Retour à la connexion
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
      {/* Wordmark */}
      <p className="text-center font-display text-[21px] font-medium tracking-tight text-charcoal">
        LumiScan
      </p>

      {/* Eyebrow + badge */}
      <div className="mt-5 text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-terracotta">
          Dernière étape
        </p>
        <span className="mt-2.5 inline-block rounded-full bg-[#D7E0CC] px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E7350]">
          ✨ 7 jours offerts
        </span>
      </div>

      {/* Title + subtitle */}
      <h1 className="mt-3.5 text-center font-display text-[27px] leading-[1.1] tracking-tight text-charcoal">
        {firstName ? (
          <>
            On y est presque,{' '}
            <em className="font-normal italic text-terracotta">{firstName}</em>
          </>
        ) : (
          'Crée ton compte'
        )}
      </h1>
      <p className="mx-auto mt-2 max-w-xs text-center text-[14px] leading-relaxed text-[#6B6356]">
        Pour débloquer ta routine et ton suivi, sur tous tes appareils.
      </p>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-[#D8CDB5] bg-[#FFFCF6] py-3.5 text-[15px] font-semibold text-charcoal transition-colors hover:bg-cream disabled:opacity-60"
      >
        <GoogleIcon />
        {googleLoading ? 'Redirection…' : 'Continuer avec Google'}
      </button>

      {/* Divider */}
      <div className="my-4 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-[#E5DCC8]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone">
          ou
        </span>
        <span className="h-px flex-1 bg-[#E5DCC8]" />
      </div>

      {/* Email + password */}
      <form onSubmit={handleSubmit} noValidate>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border-[1.5px] border-[#D8CDB5] bg-[#FFFCF6] px-4 py-3.5 text-[16px] text-charcoal outline-none transition-colors placeholder:text-stone focus:border-terracotta"
        />

        <div className="relative mt-2.5">
          <input
            type={showPw ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-[#D8CDB5] bg-[#FFFCF6] px-4 py-3.5 pr-12 text-[16px] text-charcoal outline-none transition-colors placeholder:text-stone focus:border-terracotta"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone transition-colors hover:text-charcoal"
          >
            {showPw ? (
              <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.7} />
            ) : (
              <Eye className="h-[18px] w-[18px]" strokeWidth={1.7} />
            )}
          </button>
        </div>
        <p className="mt-1.5 pl-1 font-mono text-[9px] tracking-wide text-[#A39A8B]">
          Min. 6 caractères
        </p>

        {error && (
          <p className="mt-3 rounded-xl bg-terracotta/10 px-4 py-2.5 text-center text-[13px] text-[#B5573B]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="mt-4 w-full rounded-full bg-charcoal py-4 text-[15px] font-semibold text-cream shadow-[0_8px_20px_-6px_rgba(31,27,22,0.3)] transition-opacity hover:opacity-80 disabled:opacity-60"
        >
          {loading ? 'Création du compte…' : 'Créer mon compte'}
        </button>
      </form>

      {/* Legal */}
      <p className="mx-auto mt-3 max-w-[300px] text-center text-[10.5px] leading-relaxed text-[#A39A8B]">
        En continuant, tu acceptes les{' '}
        <Link href="/cgu" className="underline underline-offset-2 hover:text-charcoal">
          CGU
        </Link>{' '}
        et la{' '}
        <Link
          href="/confidentialite"
          className="underline underline-offset-2 hover:text-charcoal"
        >
          Politique de confidentialité
        </Link>
        .
      </p>

      {/* Trust row */}
      <div className="mt-4 flex items-center justify-center gap-3.5 border-t border-[#E5DCC8] pt-3.5 font-mono text-[9px] uppercase tracking-[0.08em] text-stone">
        <TrustItem label="RGPD" />
        <TrustItem label="Données chiffrées" />
        <TrustItem label="Annule en 1 clic" />
      </div>

      {/* Footer */}
      <p className="mt-4 text-center text-[13px] text-[#6B6356]">
        Déjà un compte ?{' '}
        <Link
          href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
          className="text-terracotta underline underline-offset-2"
        >
          Connexion
        </Link>
      </p>
    </main>
  )
}

function TrustItem({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 before:text-[11px] before:text-[#8A9A82] before:content-['✓']">
      {label}
    </span>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
