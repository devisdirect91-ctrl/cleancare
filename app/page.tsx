'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ExampleResultModal } from '@/components/landing/example-result-modal'
import { trackEvent } from '@/lib/analytics/posthog'

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
  "Niveau d'hydratation",
  'Pores et texture',
  'Imperfections',
  'Sous-ton (chaud / froid / neutre)',
  'Sensibilité',
]

const TESTIMONIALS = [
  {
    name: 'Léa, 24 ans',
    quote:
      'J'ai enfin compris pourquoi rien ne marchait sur ma peau. La routine proposée a changé la donne en trois semaines.',
    tag: 'Type de peau : mixte',
  },
  {
    name: 'Camille, 31 ans',
    quote:
      'Le diagnostic est bluffant de précision, et l'interface est tellement agréable à utiliser.',
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
    a: 'Non, jamais sans ton accord explicite. Elles sont traitées le temps de l'analyse puis supprimées, sauf si tu choisis de les conserver dans ton espace personnel.',
  },
  {
    q: 'C'est gratuit ?',
    a: 'L'analyse initiale et l'essai de 7 jours sont gratuits. Tu peux ensuite continuer avec un abonnement mensuel, sans engagement.',
  },
  {
    q: 'C'est précis ?',
    a: 'Notre IA est entraînée sur des milliers de profils cutanés validés par des professionnels et évalue 14 critères distincts.',
  },
  {
    q: 'Ça remplace une dermatologue ?',
    a: 'Non. CleanCare n'est pas un dispositif médical. Pour tout problème de peau persistant, consulte une dermatologue.',
  },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showExample, setShowExample] = useState(false)

  useEffect(() => {
    trackEvent('landing_viewed', {
      source: localStorage.getItem('first_utm_source') || 'direct',
      referrer: document.referrer || 'direct',
    })
  }, [])

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
          <StartCta />
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
          Ce qu'on analyse
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
          <StartCta />
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

      {showExample && (
        <ExampleResultModal onClose={() => setShowExample(false)} />
      )}
    </main>
  )
}

function StartCta() {
  return (
    <Link
      href="/onboarding/name"
      onClick={() => trackEvent('landing_cta_clicked')}
      className="inline-flex w-full max-w-sm items-center justify-center rounded-full bg-charcoal px-8 py-4 font-sans text-[15px] font-bold text-cream shadow-[0_8px_20px_-6px_rgba(31,27,22,0.3)] transition-opacity hover:opacity-80"
    >
      Commencer mon diagnostic &rarr;
    </Link>
  )
}
