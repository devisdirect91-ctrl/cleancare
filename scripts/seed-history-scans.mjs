// Seede un historique de 3 scans (cadence ~30 j, métriques croissantes) pour
// le compte premium de test, afin de visualiser la frise chronologique
// complète (évolution + sélecteur de routine).
// Usage : node scripts/seed-history-scans.mjs
// ⚠️ Écrit dans la base pointée par .env.local. Données de test.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EMAIL = 'premium@lumiscan.app'
const SKIN = 'mixte'

const morning = [
  { step: 1, category: 'nettoyant doux', reason: 'Nettoie sans décaper le film hydrolipidique, idéal pour une peau mixte.' },
  { step: 2, category: 'sérum hydratant', reason: 'Repulpe les zones déshydratées avec de l’acide hyaluronique.' },
  { step: 3, category: 'crème hydratante légère', reason: 'Hydrate la zone T sans surcharge ni effet gras.' },
  { step: 4, category: 'protection solaire', reason: 'Protège des UV et prévient taches et ridules.' },
]
const evening = [
  { step: 1, category: 'nettoyant doux', reason: 'Retire impuretés et sébum accumulés dans la journée.' },
  { step: 2, category: 'sérum hydratant', reason: 'Renforce la barrière cutanée pendant la nuit.' },
  { step: 3, category: 'crème nourrissante', reason: 'Apporte du confort aux zones plus sèches des joues.' },
]

const daysAgoISO = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// Du plus ancien au plus récent : métriques en progression.
const HISTORY = [
  { daysAgo: 78, hydration: 4, texture: 4, concerns: ['déshydratation', 'pores_dilatés', 'ternissement'],
    summary: 'Première analyse : ta peau mixte est un peu déshydratée et le teint manque d’éclat. On pose les bases d’une routine douce.' },
  { daysAgo: 48, hydration: 5, texture: 6, concerns: ['déshydratation', 'pores_dilatés'],
    summary: 'Belle progression : la peau est plus confortable, les pores commencent à s’affiner. On continue sur cette lancée.' },
  { daysAgo: 18, hydration: 6, texture: 7, concerns: ['pores_dilatés'],
    summary: 'Ta peau mixte est désormais bien équilibrée et lumineuse. La zone T reste un peu marquée, on l’accompagne en douceur.' },
]

// 1) Utilisateur premium
const { data: prof, error: profErr } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', EMAIL)
  .single()
if (profErr || !prof) throw new Error(`Profil ${EMAIL} introuvable : ${profErr?.message}`)
const userId = prof.id

// 2) Produits recommandés (peau mixte, catégories des routines)
const cats = [...new Set([...morning, ...evening].map((s) => s.category))]
let recommended = []
{
  const { data } = await supabase
    .from('products')
    .select('id,name,brand,category,price_eur,for_skin_types,affiliate_url,image_url')
    .in('category', cats)
    .contains('for_skin_types', [SKIN])
  recommended = (data ?? []).slice(0, 12)
}

// 3) Repart d'un historique propre
await supabase.from('analyses').delete().eq('user_id', userId)

// 4) Insère les 3 scans datés
for (const h of HISTORY) {
  const fullResult = {
    skin_type: SKIN,
    undertone: 'neutre',
    hydration_level: h.hydration,
    texture_score: h.texture,
    concerns: h.concerns,
    recommendations_summary: h.summary,
    routine_morning: morning,
    routine_evening: evening,
    ingredients_to_seek: ['acide hyaluronique', 'niacinamide', 'glycérine'],
    ingredients_to_avoid: ['alcool dénaturé', 'parfum'],
  }
  const { error } = await supabase.from('analyses').insert({
    user_id: userId,
    skin_type: SKIN,
    undertone: 'neutre',
    concerns: h.concerns,
    routine_morning: morning,
    routine_evening: evening,
    recommended_products: recommended,
    full_result: fullResult,
    created_at: daysAgoISO(h.daysAgo),
  })
  if (error) throw error
  console.log(`✓ scan il y a ${h.daysAgo} j — hydratation ${h.hydration}/10, texture ${h.texture}/10`)
}

console.log('\nHistorique de 3 scans prêt pour', EMAIL)
