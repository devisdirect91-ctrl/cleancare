'use client'

import { X } from 'lucide-react'
import { useState } from 'react'

interface SignupModalProps {
  onClose: () => void
  onSubmit: (email: string, password: string) => void
  onGoogleSignup: () => void
  loading: boolean
  error?: string | null
}

export function SignupModal({
  onClose,
  onSubmit,
  onGoogleSignup,
  loading,
  error,
}: SignupModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/60 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative w-full max-w-md rounded-t-[28px] bg-cream p-8 shadow-2xl sm:rounded-[28px] animate-fade-up">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-stone transition-colors hover:text-charcoal"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="font-mono text-xs uppercase tracking-wide text-terracotta">
          Diagnostic prêt
        </p>
        <h3 className="mt-2 font-display text-2xl leading-snug text-charcoal">
          Ton diagnostic est prêt.
        </h3>
        <p className="mt-2 text-sm text-stone">
          Crée ton compte pour le débloquer — essai gratuit de 7 jours, sans
          engagement.
        </p>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(email, password)
          }}
        >
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
          {error && (
            <p className="text-sm text-terracotta">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-terracotta py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Création du compte…' : 'Débloquer mon diagnostic'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-charcoal/10" />
          <span className="font-mono text-[11px] uppercase text-stone">ou</span>
          <div className="h-px flex-1 bg-charcoal/10" />
        </div>

        <button
          type="button"
          onClick={onGoogleSignup}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-charcoal/15 bg-white py-3 text-sm font-medium text-charcoal transition-colors hover:bg-charcoal/5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.41 3.58v2.97h3.86c2.26-2.08 3.57-5.15 3.57-8.79z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.07C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.31a7.2 7.2 0 0 1 0-4.62V6.62H1.27a11.98 11.98 0 0 0 0 10.76l4-3.07z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.76 0 3.34.6 4.58 1.78l3.43-3.43C17.94 1.18 15.24 0 12 0 7.31 0 3.26 2.7 1.27 6.62l4 3.07C6.22 6.86 8.87 4.75 12 4.75z"
            />
          </svg>
          Continuer avec Google
        </button>

        <p className="mt-5 text-center font-mono text-[11px] uppercase tracking-wide text-stone">
          Pas un dispositif médical
        </p>
      </div>
    </div>
  )
}
