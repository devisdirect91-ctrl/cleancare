// Crée (ou réinitialise) un faux utilisateur PREMIUM pour tester l'app.
// Usage : node scripts/seed-premium-user.mjs
// Lit les clés depuis .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
// ⚠️ Compte de test à supprimer avant la vraie mise en prod.

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local')
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMAIL = 'premium@lumiscan.app'
const PASSWORD = 'Premium2026!'
const FIRST_NAME = 'Camille'
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

const fullResult = {
  skin_type: SKIN,
  undertone: 'neutre',
  hydration_level: 6,
  texture_score: 7,
  concerns: ['déshydratation', 'pores_dilatés'],
  recommendations_summary:
    'Ta peau mixte montre une belle vitalité, avec une zone T un peu plus grasse et des joues qui demandent du confort. On mise sur une hydratation ciblée et une routine douce pour équilibrer tout ça.',
  routine_morning: morning,
  routine_evening: evening,
  ingredients_to_seek: ['acide hyaluronique', 'niacinamide', 'glycérine'],
  ingredients_to_avoid: ['alcool dénaturé', 'parfum'],
}

// 1) Crée ou récupère l'utilisateur auth -----------------------------------
let userId
{
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: FIRST_NAME },
  })
  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
      const found = list.users.find((u) => u.email === EMAIL)
      if (!found) throw new Error(`Utilisateur ${EMAIL} existe mais introuvable.`)
      userId = found.id
      await supabase.auth.admin.updateUserById(userId, {
        password: PASSWORD,
        email_confirm: true,
      })
      console.log('↻ utilisateur existant, mot de passe réinitialisé')
    } else {
      throw error
    }
  } else {
    userId = data.user.id
    console.log('✓ utilisateur auth créé')
  }
}

// 2) Passe le profil en premium (la row est créée par le trigger) ----------
{
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_plan: 'yearly',
      current_period_end: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      first_name: FIRST_NAME,
    })
    .eq('id', userId)
  if (error) throw error
  console.log('✓ profil passé en premium (active)')
}

// 3) Produits réels pour les étapes de routine -----------------------------
const cats = [...new Set([...morning, ...evening].map((s) => s.category))]
let recommended = []
{
  const { data } = await supabase
    .from('products')
    .select('id,name,brand,category,price_eur,for_skin_types,affiliate_url,image_url')
    .in('category', cats)
    .contains('for_skin_types', [SKIN])
  recommended = data ?? []
  if (recommended.length === 0) {
    const { data: anyCat } = await supabase
      .from('products')
      .select('id,name,brand,category,price_eur,for_skin_types,affiliate_url,image_url')
      .in('category', cats)
    recommended = anyCat ?? []
  }
  recommended = recommended.slice(0, 12)
}

// 4) Insère une analyse si l'utilisateur n'en a pas encore -----------------
{
  const { data: existing } = await supabase
    .from('analyses')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing?.length) {
    console.log('• analyse déjà présente, insertion ignorée')
  } else {
    const { error } = await supabase.from('analyses').insert({
      user_id: userId,
      skin_type: SKIN,
      undertone: 'neutre',
      concerns: ['déshydratation', 'pores_dilatés'],
      routine_morning: morning,
      routine_evening: evening,
      recommended_products: recommended,
      full_result: fullResult,
    })
    if (error) throw error
    console.log(`✓ analyse insérée (${recommended.length} produits recommandés)`)
  }
}

console.log('\n========================================')
console.log(' COMPTE PREMIUM DE TEST PRÊT')
console.log(' Email :', EMAIL)
console.log(' Mot de passe :', PASSWORD)
console.log('========================================')
