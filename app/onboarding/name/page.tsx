'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'

const NAME_REGEX = /^[a-zA-ZÀ-ÿ\-' ]+$/
const MIN = 2
const MAX = 30

function isValid(value: string) {
  const t = value.trim()
  return t.length >= MIN && t.length <= MAX && NAME_REGEX.test(t)
}

function formatName(value: string) {
  const t = value.trim()
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

export default function NameStep() {
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // On mount: pre-fill from storage + redirect if DB already has first_name
  useEffect(() => {
    async function init() {
      const stored = sessionStorage.getItem('user_first_name')
      if (stored) setName(stored)

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', user.id)
            .single()

          if (profile?.first_name) {
            router.replace('/onboarding/upload')
            return
          }
        }
      } catch {
        // Not blocking — just continue
      }

      setChecking(false)
      trackEvent('onboarding_name_viewed')
      // Delay focus so the keyboard doesn't fire before the page renders
      setTimeout(() => inputRef.current?.focus(), 120)
    }

    init()
  }, [router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.slice(0, MAX + 1)
    setName(val)
    if (validationError) setValidationError(null)
  }

  function validate(value: string): boolean {
    const t = value.trim()
    if (t.length < MIN || t.length > MAX || !NAME_REGEX.test(t)) {
      setValidationError('Ton prénom doit contenir entre 2 et 30 lettres.')
      return false
    }
    setValidationError(null)
    return true
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate(name)) return

    const formatted = formatName(name)
    sessionStorage.setItem('user_first_name', formatted)
    localStorage.setItem('user_first_name', formatted)

    trackEvent('onboarding_name_completed', { name_length: formatted.length })
    router.push('/onboarding/upload')
  }

  const canSubmit = isValid(name)

  if (checking) {
    return <div className="min-h-screen bg-[#F4ECDD]" />
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#F4ECDD] px-5">
      {/* Progress indicator */}
      <div className="mx-auto w-full max-w-md pt-12">
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-stone">
          Étape 1 sur 2
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-[#E5DCC8]">
          <div
            className="h-full rounded-full bg-terracotta transition-all duration-500"
            style={{ width: '50%' }}
          />
        </div>
      </div>

      {/* Main block */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <h1 className="mb-4 font-display text-[38px] font-medium leading-[1.08] tracking-tight text-charcoal">
            Faisons{' '}
            <em className="font-medium italic text-terracotta">connaissance</em>
          </h1>

          {/* Subtitle */}
          <p className="mb-10 text-[16px] leading-relaxed text-[#4A4238]">
            Notre analyse est personnalisée. Pour bien faire les choses,
            dis-nous comment t&apos;appeler.
          </p>

          {/* Input */}
          <div className="mb-2">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={handleChange}
              onBlur={() => name.trim().length > 0 && validate(name)}
              placeholder="Ton prénom"
              autoComplete="given-name"
              maxLength={MAX + 1}
              className={[
                'w-full rounded-2xl border-[1.5px] bg-[#FFFCF6] px-6 py-4',
                'font-sans text-[18px] text-charcoal placeholder:text-stone',
                'capitalize outline-none',
                'transition-colors duration-200',
                validationError
                  ? 'border-terracotta'
                  : 'border-[#D8CDB5] focus:border-terracotta',
              ].join(' ')}
            />
            {validationError && (
              <p className="mt-2 pl-1 text-[12px] text-terracotta">
                {validationError}
              </p>
            )}
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              'mt-6 w-full rounded-full bg-charcoal px-6 py-4',
              'font-sans text-[15px] font-bold text-[#FFFCF6]',
              'transition-opacity duration-150',
              canSubmit
                ? 'hover:opacity-80 active:opacity-70'
                : 'opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            Commencer mon diagnostic &rarr;
          </button>
        </form>
      </div>

      {/* Reassurance footer */}
      <div className="mx-auto w-full max-w-md pb-10 text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone">
          Ton prénom reste privé
        </p>
      </div>
    </main>
  )
}
