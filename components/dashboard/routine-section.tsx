'use client'

import { useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/posthog'
import type { RoutineStep } from '@/lib/llm/analyze'
import type { RecommendedProduct } from '@/types/analysis'

interface RoutineSectionProps {
  title: string
  routineTime: 'morning' | 'evening'
  steps: RoutineStep[]
  products: RecommendedProduct[]
}

export function RoutineSection({ title, routineTime, steps, products }: RoutineSectionProps) {
  useEffect(() => {
    const hour = new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'

    trackEvent('routine_viewed', {
      routine_time: routineTime,
      time_of_day: timeOfDay,
    })
  }, [routineTime])

  return (
    <section>
      <h2 className="font-display text-2xl italic text-charcoal">{title}</h2>
      <div className="mt-6 space-y-5">
        {steps.map((step) => {
          const stepProducts = products
            .filter((p) => p.category === step.category)
            .slice(0, 3)

          return (
            <div key={step.step} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex gap-4">
                <span className="font-mono text-xs text-terracotta">
                  {String(step.step).padStart(2, '0')}
                </span>
                <div>
                  <p className="font-display text-base text-charcoal">
                    {step.category}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-stone">
                    {step.reason}
                  </p>
                </div>
              </div>

              {stepProducts.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {stepProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      routineTime={routineTime}
                    />
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

function ProductCard({
  product,
  routineTime,
}: {
  product: RecommendedProduct
  routineTime: 'morning' | 'evening'
}) {
  function handleProductClick() {
    trackEvent('product_clicked', {
      product_id: product.id,
      product_name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price_eur,
      routine_time: routineTime,
    })
  }

  return (
    <div className="rounded-xl border border-charcoal/10 bg-cream/50 p-3">
      <div className="aspect-square overflow-hidden rounded-lg bg-white">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl text-stone/50">
            {product.brand.charAt(0)}
          </div>
        )}
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-stone">
        {product.brand}
      </p>
      <p className="mt-0.5 text-sm leading-snug text-charcoal">{product.name}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="font-display text-sm text-charcoal">
          {product.price_eur.toFixed(2)} €
        </p>
        {product.affiliate_url && (
          <a
            href={product.affiliate_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={handleProductClick}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-terracotta hover:underline"
          >
            Voir <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}
