'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AnalyzingOverlay } from '@/components/landing/analyzing-overlay'
import { ExampleResultModal } from '@/components/landing/example-result-modal'
import { SignupModal } from '@/components/landing/signup-modal'
import { UploadZone } from '@/components/landing/upload-zone'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  {
    number: '01',
    title: 'Upload',
    description: 'Une photo, lumière naturelle, sans maquillage si possible.',
  },
  {
    number: '02',
    title: 'Analyse',
    description: 'Notre IA évalue 14 critères en 30 secondes.',
  },
  {
    number: '03',
    title: 'Routine',
    description: 'Reçois ta routine matin et soir personnalisée.',
  },
]

const CRITERIA = [
  'Type de peau',
  'Niveau d’hydratation',
  'Pores et texture',
  'Imperfections',
  'Sous-ton (chaud / froid / neutre)',
  'Sensibilité',
]

const TESTIMONIALS = [
  {
    name: 'Léa, 24 ans',
    quote:
      'J’ai enfin compris pourquoi rien ne marchait sur ma peau. La routine proposée a changé la donne en trois semaines.',
    tag: 'Type de peau : mixte',
  },
  {
    name: 'Camille, 31 ans',
    quote:
      'Le diagnostic est bluffant de précision, et l’interface est tellement agréable à utiliser.',
    tag: 'Type de peau : sèche',
  },
  {
    name: 'Sarah, 27 ans',
    quote:
      'Plus besoin de passer des heures à comparer des produits, tout est déjà fait pour moi.',
    tag: 'Type de peau : grasse',
  },
]

const FAQ = [
  {
    q: 'Mes photos sont-elles stockées ?',
    a: 'Non, jamais sans ton accord explicite. Elles sont traitées le temps de l’analyse puis supprimées, sauf si tu choisis de les conserver dans ton espace personnel.',
  },
  {
    q: 'C’est gratuit ?',
    a: 'L’analyse initiale et l’essai de 7 jours sont gratuits. Tu peux ensuite continuer avec un abonnement mensuel, sans engagement.',
  },
  {
    q: 'C’est précis ?',
    a: 'Notre IA est entraînée sur des milliers de profils cutanés validés par des professionnels et évalue 14 critères distincts.',
  },
  {
    q: 'Ça remplace une dermatologue ?',
    a: 'Non. CleanCare n’est pas un dispositif médical. Pour tout problème de peau persistant, consulte une dermatologue.',
  },
]

type FlowState = 'idle' | 'analyzing' | 'signup'

export default function Home() {
  const router = useRouter()
  const [flowState, setFlowState] = useState<FlowState>('idle')
  const [image, setImage] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showExample, setShowExample] = useState(false)
  const [loadingSignup, setLoadingSignup] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)

  function handleFileSelected(dataUrl: string) {
    setImage(dataUrl)
    setFlowState('analyzing')
    setTimeout(() => {
      setFlowState('signup')
    }, 5000)
  }

  async function handleSignup(email: string, password: string) {
    setLoadingSignup(true)
    setSignupError(null)
    try {
      const supabase = createClient()
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setSignupError(signUpError.message)
        return
      }

      if (!signUpData.session) {
        setSignupError(
          'Confirme ton adresse e-mail via le lien que nous venons de t’envoyer, puis connecte-toi pour débloquer ton diagnostic.'
        )
        return
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setSignupError(body?.error ?? 'Une erreur est survenue, réessaie.')
        return
      }

      router.push('/dashboard')
    } catch {
      setSignupError('Une erreur est survenue, réessaie.')
    } finally {
      setLoadingSignup(false)
    }
  }

  async function handleGoogleSignup() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard`,
      },
    })
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      {/* SECTION 1 — Hero */}
      <section className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-terracotta">
          Analyse cutanée IA · Made in France
        </p>
        <h1 className="mt-5 font-display text-4xl leading-tight text-charcoal sm:text-5xl">
          Découvre ce que ta peau essaie de te dire.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-stone">
          Scan ton visage, reçois un diagnostic personnalisé et la routine
          skincare faite pour toi en 30 secondes.
        </p>

        <div className="mt-10">
          <UploadZone onFileSelected={handleFileSelected} />
        </div>
      </section>

      {/* SECTION 2 — Trust signals */}
      <section className="mt-16 border-t border-charcoal/10 pt-10">
        <div className="flex items-center justify-center divide-x divide-charcoal/15 text-center">
          <div className="flex-1 px-3">
            <p className="font-display text-xl text-charcoal">+12 000</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-stone">
              Analyses
            </p>
          </div>
          <div className="flex-1 px-3">
            <p className="font-display text-xl text-charcoal">94%</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-stone">
              Satisfaction
            </p>
          </div>
          <div className="flex-1 px-3">
            <p className="font-display text-xl text-charcoal">30s</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-stone">
              Durée moyenne
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {['#C8755A', '#D9A98C', '#E8C9B5'].map((color, i) => (
              <span
                key={i}
                className="h-7 w-7 rounded-full border-2 border-cream"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="text-sm text-stone">
            Léa, Camille, Sarah et 12 000+ utilisatrices
          </p>
        </div>
      </section>

      {/* SECTION 3 — Comment ça marche */}
      <section className="mt-20">
        <h2 className="text-center font-display text-2xl text-charcoal">
          Comment ça marche
        </h2>
        <div className="mt-10 space-y-8">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-5">
              <span className="font-mono text-sm text-terracotta">
                {step.number}
              </span>
              <div>
                <p className="font-display text-lg text-charcoal">
                  {step.title}
                </p>
                <p className="mt-1 text-sm text-stone">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — Ce qu'on analyse */}
      <section className="mt-20">
        <h2 className="text-center font-display text-2xl text-charcoal">
          Ce qu’on analyse
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CRITERIA.map((c) => (
            <div
              key={c}
              className="rounded-2xl bg-white px-5 py-4 text-sm text-charcoal shadow-sm"
            >
              {c}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5 — Témoignages */}
      <section className="mt-20">
        <h2 className="text-center font-display text-2xl text-charcoal">
          Elles ont testé
        </h2>
        <div className="mt-8 space-y-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-charcoal">
                « {t.quote} »
              </p>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-display text-sm text-charcoal">{t.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-wide text-stone">
                  {t.tag}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 — FAQ */}
      <section className="mt-20">
        <h2 className="text-center font-display text-2xl text-charcoal">
          Questions fréquentes
        </h2>
        <div className="mt-8 divide-y divide-charcoal/10 border-y border-charcoal/10">
          {FAQ.map((item, i) => (
            <button
              key={item.q}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full py-5 text-left"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-base text-charcoal">
                  {item.q}
                </p>
                <span className="text-stone">
                  {openFaq === i ? '−' : '+'}
                </span>
              </div>
              {openFaq === i && (
                <p className="mt-2 text-sm text-stone animate-fade-up">
                  {item.a}
                </p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 7 — CTA final */}
      <section className="mt-20 text-center">
        <h2 className="font-display text-2xl text-charcoal">
          Prête à découvrir ta peau ?
        </h2>
        <div className="mt-8">
          <UploadZone onFileSelected={handleFileSelected} />
        </div>
        <button
          onClick={() => setShowExample(true)}
          className="mt-5 font-mono text-xs uppercase tracking-wide text-stone underline-offset-4 hover:text-terracotta hover:underline"
        >
          Voir un exemple de résultat
        </button>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-charcoal/10 pt-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-wide text-stone">
          Pas un dispositif médical · Consulte une dermatologue pour tout
          problème
        </p>
        <p className="mt-3 text-xs text-stone">
          Mentions légales · RGPD · contact@cleancare.fr
        </p>
      </footer>

      {flowState === 'analyzing' && image && (
        <AnalyzingOverlay imageSrc={image} />
      )}
      {flowState === 'signup' && (
        <SignupModal
          onClose={() => setFlowState('idle')}
          onSubmit={handleSignup}
          onGoogleSignup={handleGoogleSignup}
          loading={loadingSignup}
          error={signupError}
        />
      )}
      {showExample && (
        <ExampleResultModal onClose={() => setShowExample(false)} />
      )}
    </main>
  )
}
