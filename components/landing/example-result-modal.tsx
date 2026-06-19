'use client'

import { X } from 'lucide-react'

const CRITERIA = [
  { label: 'Type de peau', value: 'Mixte' },
  { label: 'Hydratation', value: '62 / 100' },
  { label: 'Pores & texture', value: 'Modérés' },
  { label: 'Imperfections', value: 'Légères' },
  { label: 'Sous-ton', value: 'Chaud' },
  { label: 'Sensibilité', value: 'Faible' },
]

export function ExampleResultModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/60 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-cream p-8 shadow-2xl sm:rounded-[28px] animate-fade-up">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-stone transition-colors hover:text-charcoal"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="font-mono text-xs uppercase tracking-wide text-terracotta">
          Exemple de résultat
        </p>
        <h3 className="mt-2 font-display text-2xl leading-snug text-charcoal">
          Diagnostic de Camille, 27 ans
        </h3>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {CRITERIA.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl bg-white p-4 shadow-sm"
            >
              <p className="font-mono text-[10px] uppercase tracking-wide text-stone">
                {c.label}
              </p>
              <p className="mt-1 font-display text-base text-charcoal">
                {c.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-wide text-stone">
            Routine recommandée
          </p>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">
            Matin : nettoyant doux, sérum à la niacinamide, crème hydratante
            légère, SPF 50.
            <br />
            Soir : double nettoyage, sérum hydratant, crème nourrissante.
          </p>
        </div>
      </div>
    </div>
  )
}
