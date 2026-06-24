import { getConcernInfo } from '@/components/dashboard/concern-icon'
import { ProductBubble } from './product-bubble'
import type { AnalysisRow, RoutineStep, RecommendedProduct } from '@/types/analysis'

interface DiagnosticViewProps {
  name: string
  date: string
  analysis: AnalysisRow
}

// Rendu d'analyse redessiné : épuré, moderne, produits en bulles rectangulaires.
export function DiagnosticView({ name, date, analysis }: DiagnosticViewProps) {
  const fullResult = analysis.full_result ?? {}
  const observation =
    typeof fullResult.recommendations_summary === 'string'
      ? fullResult.recommendations_summary
      : null
  const hydration =
    typeof fullResult.hydration_level === 'number'
      ? fullResult.hydration_level
      : null
  const texture =
    typeof fullResult.texture_score === 'number'
      ? fullResult.texture_score
      : null
  const seek = Array.isArray(fullResult.ingredients_to_seek)
    ? (fullResult.ingredients_to_seek as string[])
    : []
  const avoid = Array.isArray(fullResult.ingredients_to_avoid)
    ? (fullResult.ingredients_to_avoid as string[])
    : []
  const concerns = analysis.concerns ?? []
  const products = analysis.recommended_products ?? []

  return (
    <div className="px-5">
      {/* Header */}
      <header className="pt-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-terracotta">
          Diagnostic personnalisé
        </p>
        <h1 className="mt-3 font-display text-[34px] leading-[1.04] tracking-tight text-charcoal">
          Ta peau,
          <br />
          <em className="font-normal italic text-terracotta">{name}</em>
        </h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
          {date}
        </p>
      </header>

      {/* Observation */}
      {observation && (
        <p className="mt-7 font-display text-[18px] italic leading-relaxed text-charcoal first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[44px] first-letter:not-italic first-letter:leading-[0.8] first-letter:text-terracotta">
          {observation}
        </p>
      )}

      {/* Stats */}
      <div className="mt-7 grid grid-cols-2 gap-2.5">
        <StatBubble label="Type de peau" value={analysis.skin_type ?? '—'} />
        <StatBubble label="Sous-ton" value={analysis.undertone ?? '—'} />
        <StatBubble
          label="Hydratation"
          value={hydration != null ? String(hydration) : '—'}
          suffix="/10"
        />
        <StatBubble
          label="Texture"
          value={texture != null ? String(texture) : '—'}
          suffix="/10"
        />
      </div>

      {/* Concerns */}
      {concerns.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {concerns.map((concern) => (
            <span
              key={concern}
              className="flex items-center gap-1.5 rounded-full bg-[#E8C9BC] px-3 py-1.5 text-[11px] font-medium text-[#A85A41]"
            >
              <span className="h-1 w-1 rounded-full bg-terracotta" />
              {getConcernInfo(concern).label}
            </span>
          ))}
        </div>
      )}

      {/* Routines */}
      <RoutineBlock
        title="Routine du matin"
        steps={analysis.routine_morning ?? []}
        products={products}
      />
      <RoutineBlock
        title="Routine du soir"
        steps={analysis.routine_evening ?? []}
        products={products}
      />

      {/* Ingrédients */}
      {(seek.length > 0 || avoid.length > 0) && (
        <section className="mt-10 grid grid-cols-1 gap-3">
          {seek.length > 0 && (
            <IngredientCard
              label="À privilégier"
              items={seek}
              tone="#8A9A82"
              bg="#EEF3EA"
            />
          )}
          {avoid.length > 0 && (
            <IngredientCard
              label="À limiter"
              items={avoid}
              tone="#C8755A"
              bg="rgba(200,117,90,0.08)"
            />
          )}
        </section>
      )}
    </div>
  )
}

function RoutineBlock({
  title,
  steps,
  products,
}: {
  title: string
  steps: RoutineStep[]
  products: RecommendedProduct[]
}) {
  if (steps.length === 0) return null
  return (
    <section className="mt-10">
      <h2 className="font-display text-[22px] italic text-charcoal">{title}</h2>
      <div className="mt-4 space-y-4">
        {steps.map((step) => {
          const stepProducts = products
            .filter((p) => p.category === step.category)
            .slice(0, 6)
          return (
            <div
              key={`${step.step}-${step.category}`}
              className="rounded-[22px] border border-[#E5DCC8] bg-[#FFFCF6] p-4"
            >
              <div className="flex gap-3">
                <span className="font-mono text-[11px] text-terracotta">
                  {String(step.step).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <p className="font-display text-[16px] capitalize text-charcoal">
                    {step.category}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone">
                    {step.reason}
                  </p>
                </div>
              </div>

              {stepProducts.length > 0 && (
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {stepProducts.map((product) => (
                    <div key={product.id} className="w-36 shrink-0">
                      <ProductBubble product={product} context="diagnostic" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StatBubble({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div className="rounded-[18px] border border-[#E5DCC8] bg-[#FFFCF6] px-4 py-3.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone">
        {label}
      </p>
      <p className="mt-1 font-display text-[19px] capitalize tracking-tight text-charcoal">
        {value}
        {suffix && (
          <small className="ml-0.5 font-sans text-[11px] font-normal text-stone">
            {suffix}
          </small>
        )}
      </p>
    </div>
  )
}

function IngredientCard({
  label,
  items,
  tone,
  bg,
}: {
  label: string
  items: string[]
  tone: string
  bg: string
}) {
  return (
    <div className="rounded-[22px] p-5" style={{ backgroundColor: bg }}>
      <p
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: tone }}
      >
        {label}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-[14px] text-charcoal"
          >
            <span
              className="mt-2 h-1 w-1 flex-none rounded-full"
              style={{ backgroundColor: tone }}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
