import { ProductBubble } from '@/components/app/product-bubble'
import { TabViewTracker } from '@/components/app/tab-view-tracker'
import { KNOWN_CATEGORIES } from '@/lib/categories'
import { createClient } from '@/lib/supabase/server'
import type { RecommendedProduct } from '@/types/analysis'

export default async function CataloguePage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('id,name,brand,category,price_eur,for_skin_types,affiliate_url,image_url')
    .order('category')

  const products = (data ?? []) as RecommendedProduct[]

  // Regroupe par catégorie (ordre connu d'abord, puis le reste).
  const byCategory = new Map<string, RecommendedProduct[]>()
  for (const p of products) {
    const list = byCategory.get(p.category) ?? []
    list.push(p)
    byCategory.set(p.category, list)
  }
  const orderedCategories = [
    ...KNOWN_CATEGORIES.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !KNOWN_CATEGORIES.includes(c)),
  ]

  return (
    <main className="px-5 pt-9">
      <TabViewTracker tab="catalogue" />
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-terracotta">
          La sélection
        </p>
        <h1 className="mt-2 font-display text-[30px] tracking-tight text-charcoal">
          Catalogue
        </h1>
        <p className="mt-1 text-[14px] text-stone">
          Des produits doux, sélectionnés par type de peau.
        </p>
      </header>

      <div className="mt-8 space-y-9">
        {orderedCategories.map((category) => (
          <section key={category}>
            <h2 className="mb-3 font-display text-[19px] capitalize text-charcoal">
              {category}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(byCategory.get(category) ?? []).map((product) => (
                <ProductBubble
                  key={product.id}
                  product={product}
                  context="catalogue"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
