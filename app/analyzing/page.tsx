'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ANONYMOUS_ANALYSIS_KEY } from '@/components/dashboard/anonymous-paywall'
import { trackEvent } from '@/lib/analytics/posthog'

// --- Réglages de timing --------------------------------------------------
const MODAL_DELAY_MS = 2000 // PHASE 2 : la modal prénom apparaît à 2s
const PHASE3_DELAY_MS = 6000 // PHASE 3 : texte "routine" après 6s minimum
const MIN_TOTAL_MS = 7000 // effet "analyse sérieuse" : 7s minimum avant /result

// --- Validation prénom (reprise de l'ancien onboarding) ------------------
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\-' ]+$/
const NAME_MIN = 2
const NAME_MAX = 30

function isValidName(value: string) {
  const t = value.trim()
  return t.length >= NAME_MIN && t.length <= NAME_MAX && NAME_REGEX.test(t)
}

function formatName(value: string) {
  const t = value.trim()
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

const PHASE3_STEPS = [
  'Détection du sous-ton…',
  'Analyse de la texture…',
  'Sélection des produits…',
  'Construction de ta routine…',
]

export default function AnalyzingPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalClosing, setModalClosing] = useState(false)
  const [modalClosed, setModalClosed] = useState(false)
  const [phase3, setPhase3] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const [error, setError] = useState<string | null>(null)

  // Refs pour la logique de redirection (valeurs lues hors render) ---------
  const startRef = useRef(0)
  const apiSuccessRef = useRef(false)
  const minElapsedRef = useRef(false)
  const modalOpenRef = useRef(false)
  const redirectedRef = useRef(false)
  const errorRef = useRef(false)

  function maybeRedirect() {
    if (redirectedRef.current) return
    if (apiSuccessRef.current && minElapsedRef.current && !modalOpenRef.current) {
      redirectedRef.current = true
      router.push('/result')
    }
  }

  // --- ÉTAPE 1 : montage — photo + appel API en arrière-plan --------------
  useEffect(() => {
    const photoBase64 = sessionStorage.getItem('scan_photo')
    if (!photoBase64) {
      router.replace('/scan')
      return
    }

    startRef.current = Date.now()
    trackEvent('analysis_started')

    const apiPromise = fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: photoBase64 }),
    })

    let cancelled = false

    ;(async () => {
      try {
        const res = await apiPromise
        const body = await res.json().catch(() => null)
        if (cancelled) return

        if (!res.ok) {
          const reason =
            body?.error ?? 'Une erreur est survenue pendant l’analyse.'
          errorRef.current = true
          trackEvent('analysis_failed', { reason })
          setError(reason)
          return
        }

        sessionStorage.setItem(
          ANONYMOUS_ANALYSIS_KEY,
          JSON.stringify(body.analysis)
        )
        trackEvent('analysis_completed', {
          duration_ms: Date.now() - startRef.current,
        })
        apiSuccessRef.current = true
        maybeRedirect()
      } catch (err) {
        if (cancelled) return
        const reason = err instanceof Error ? err.message : 'Erreur réseau'
        errorRef.current = true
        trackEvent('analysis_failed', { reason })
        setError('La connexion a été interrompue. Réessaie dans un instant.')
      }
    })()

    // Timer : ouverture de la modal prénom (PHASE 2)
    const modalTimer = setTimeout(() => {
      if (errorRef.current || redirectedRef.current) return
      modalOpenRef.current = true
      setModalOpen(true)
      trackEvent('name_modal_shown')
    }, MODAL_DELAY_MS)

    // Timer : passage en PHASE 3 (texte "routine")
    const phase3Timer = setTimeout(() => {
      setPhase3(true)
    }, PHASE3_DELAY_MS)

    // Timer : durée minimale écoulée
    const minTimer = setTimeout(() => {
      minElapsedRef.current = true
      maybeRedirect()
    }, MIN_TOTAL_MS)

    return () => {
      cancelled = true
      clearTimeout(modalTimer)
      clearTimeout(phase3Timer)
      clearTimeout(minTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Défilement des steps en PHASE 3 -----------------------------------
  useEffect(() => {
    if (!phase3) return
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % PHASE3_STEPS.length)
    }, 1500)
    return () => clearInterval(id)
  }, [phase3])

  // --- Fermeture de la modal (en fondu) ----------------------------------
  function closeModal() {
    setModalClosing(true)
    setTimeout(() => {
      modalOpenRef.current = false
      setModalOpen(false)
      setModalClosed(true)
      maybeRedirect()
    }, 280)
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidName(nameInput)) {
      setNameError('Ton prénom doit contenir entre 2 et 30 lettres.')
      return
    }
    const formatted = formatName(nameInput)
    sessionStorage.setItem('user_first_name', formatted)
    localStorage.setItem('user_first_name', formatted)
    setFirstName(formatted)
    trackEvent('name_submitted', { name_length: formatted.length })
    closeModal()
  }

  function handleSkip() {
    sessionStorage.setItem('user_first_name', '')
    trackEvent('name_skipped')
    closeModal()
  }

  // --- Écran d'erreur bienveillant ---------------------------------------
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-7 text-center">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-terracotta">
          Petit contretemps
        </p>
        <h1 className="mb-4 max-w-sm font-display text-[28px] font-medium leading-[1.12] tracking-tight text-charcoal">
          On n’a pas pu finir l’analyse
        </h1>
        <p className="mb-9 max-w-xs text-[15px] leading-relaxed text-[#4A4238]">
          {error}
        </p>
        <button
          onClick={() => router.push('/scan')}
          className="rounded-full bg-terracotta px-8 py-4 font-sans text-[15px] font-medium text-cream transition-opacity hover:opacity-90 active:opacity-80"
        >
          Réessayer
        </button>
      </main>
    )
  }

  // --- Texte de loading selon la phase -----------------------------------
  const loadingText = phase3
    ? firstName
      ? `${firstName}, on construit ta routine…`
      : 'On construit ta routine…'
    : 'On analyse ta peau…'

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream px-7">
      {/* Loader (reste actif en arrière-plan, même modal ouverte) */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-10 h-20 w-20">
          {/* Anneau ink statique */}
          <div className="absolute inset-0 rounded-full border-2 border-charcoal/15" />
          {/* Anneau dashed terracotta qui tourne */}
          <div className="loader-ring absolute inset-0 rounded-full border-2 border-dashed border-terracotta" />
        </div>

        <h1 className="mb-7 max-w-xs font-display text-[26px] font-medium italic leading-[1.15] tracking-tight text-charcoal">
          {loadingText}
        </h1>

        {/* Barre de progression */}
        <div className="h-1 w-56 overflow-hidden rounded-full bg-[#E5DCC8]">
          <div className="progress-bar h-full rounded-full bg-terracotta" />
        </div>

        {/* Steps qui défilent en PHASE 3 */}
        <div className="mt-6 h-5">
          {phase3 && (
            <p
              key={stepIndex}
              className="step-fade font-mono text-[11px] uppercase tracking-[0.18em] text-stone"
            >
              {PHASE3_STEPS[stepIndex]}
            </p>
          )}
        </div>
      </div>

      {/* PHASE 2 — Modal prénom */}
      {modalOpen && (
        <div
          className={`fixed inset-0 z-20 flex items-end justify-center sm:items-center ${
            modalClosing ? 'overlay-out' : 'overlay-in'
          }`}
          style={{ backgroundColor: 'rgba(31,27,22,0.35)' }}
        >
          <div
            className={`m-4 w-full max-w-sm rounded-[28px] bg-[#FFFCF6] p-7 shadow-[0_20px_60px_-20px_rgba(31,27,22,0.45)] ${
              modalClosing ? 'card-out' : 'card-in'
            }`}
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-terracotta">
              Pendant qu’on analyse ta peau…
            </p>
            <h2 className="mb-6 font-display text-[26px] font-medium leading-[1.1] tracking-tight text-charcoal">
              Comment t’appelles-tu&nbsp;?
            </h2>

            <form onSubmit={handleNameSubmit} noValidate>
              <input
                autoFocus
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value.slice(0, NAME_MAX + 1))
                  if (nameError) setNameError(null)
                }}
                placeholder="Ton prénom"
                autoComplete="given-name"
                className={[
                  'w-full rounded-2xl border-[1.5px] bg-cream px-5 py-3.5',
                  'font-sans text-[17px] capitalize text-charcoal placeholder:text-stone',
                  'outline-none transition-colors duration-200',
                  nameError
                    ? 'border-terracotta'
                    : 'border-[#D8CDB5] focus:border-terracotta',
                ].join(' ')}
              />
              {nameError && (
                <p className="mt-2 pl-1 text-[12px] text-terracotta">
                  {nameError}
                </p>
              )}

              <button
                type="submit"
                className="mt-5 w-full rounded-full bg-charcoal py-4 font-sans text-[15px] font-bold text-cream transition-opacity hover:opacity-80 active:opacity-70"
              >
                Continuer &rarr;
              </button>
            </form>

            <button
              onClick={handleSkip}
              className="mt-3 w-full text-center font-mono text-[11px] uppercase tracking-[0.18em] text-stone transition-opacity hover:opacity-70"
            >
              Passer
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .loader-ring {
          border-right-color: transparent;
          animation: spin 1.1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .progress-bar {
          width: 0%;
          animation: fill ${MIN_TOTAL_MS}ms ease-out forwards;
        }
        @keyframes fill {
          0% {
            width: 0%;
          }
          70% {
            width: 82%;
          }
          100% {
            width: 96%;
          }
        }
        .step-fade {
          animation: stepFade 1.5s ease-in-out;
        }
        @keyframes stepFade {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0.4;
          }
        }
        .overlay-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .overlay-out {
          animation: fadeOut 0.28s ease-in forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .card-in {
          animation: cardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .card-out {
          animation: cardOut 0.28s ease-in forwards;
        }
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes cardOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(10px);
          }
        }
      `}</style>
    </main>
  )
}
