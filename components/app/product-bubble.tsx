'use client'

import { ExternalLink } from 'lucide-react'
import { ProductPlaceholder } from './product-placeholder'
import { categoryTint } from '@/lib/categories'
import { trackEvent } from '@/lib/analytics/posthog'
import type { RecommendedProduct } from '@/types/analysis'

interface ProductBubbleProps {
  product: RecommendedProduct
  context?: string
}

// Bulle rectangulaire produit : visuel (photo réelle ou placeholder SVG de
// marque), marque, nom, prix, lien affilié. Remplit la largeur de son parent.
export function ProductBubble({ product, context }: ProductBubbleProps) {
  function handleClick() {
    trackEvent('product_clicked', {
      product_id: product.id,
      product_name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price_eur,
      context: context ?? null,
    })
  }

  const inner = (
    <>
      <div className="aspect-[4/5] overflow-hidden rounded-2xl">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ProductPlaceholder
            category={product.category}
            className="h-full w-full"
          />
        )}
      </div>

      <div className="px-1 pt-3">
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: categoryTint(product.category) }}
          />
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone">
            {product.brand}
          </p>
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-charcoal">
          {product.name}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-display text-[15px] text-charcoal">
            {product.price_eur.toFixed(2)} €
          </p>
          {product.affiliate_url && (
            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-terracotta">
              Voir <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </>
  )

  const className =
    'block w-full rounded-[22px] border border-[#E5DCC8] bg-[#FFFCF6] p-2.5 text-left transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(31,27,22,0.18)]'

  if (product.affiliate_url) {
    return (
      <a
        href={product.affiliate_url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={handleClick}
        className={className}
      >
        {inner}
      </a>
    )
  }

  return <div className={className}>{inner}</div>
}
