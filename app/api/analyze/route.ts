import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { analyzeSkin, LLMConfigError, RateLimitedError, type RoutineStep } from '@/lib/llm/analyze'
import { createClient } from '@/lib/supabase/server'
import type { RecommendedProduct } from '@/types/analysis'

const TRIAL_ANALYSIS_LIMIT = 3

export async function POST(request: Request) {
  try {
    return await handleAnalyze(request)
  } catch (err) {
    console.error('Unhandled error in /api/analyze:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handleAnalyze(request: Request) {
  const supabase = createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  // Le scan caméra envoie `photo`; l'ancien flow d'upload envoie `image`.
  const body = await request.json()
  const image: unknown = body?.photo ?? body?.image
  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'Photo manquante' }, { status: 400 })
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    if (profile?.subscription_status === 'trial') {
      const { count } = await supabase
        .from('analyses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if ((count ?? 0) >= TRIAL_ANALYSIS_LIMIT) {
        return NextResponse.json(
          {
            error:
              "Tu as utilisé tes analyses d'essai, passe en Premium pour continuer",
          },
          { status: 403 }
        )
      }
    }
  }

  // Catégories réelles du catalogue : on les passe au LLM (pour qu'il s'y tienne)
  // et on s'en sert pour matcher les produits.
  const { data: catRows } = await supabase.from('products').select('category')
  const catalogCategories = Array.from(
    new Set((catRows ?? []).map((r) => r.category as string).filter(Boolean))
  )

  let result
  try {
    result = await analyzeSkin(image, catalogCategories)
  } catch (err) {
    if (err instanceof RateLimitedError) {
      return NextResponse.json(
        { error: 'Notre service est très demandé, réessaie dans 1 min' },
        { status: 429 }
      )
    }
    if (err instanceof LLMConfigError) {
      console.error('LLM config error:', err.message)
      return NextResponse.json(
        { error: 'Service IA mal configuré (clé API manquante ou invalide)' },
        { status: 500 }
      )
    }
    console.error('Unexpected error from analyzeSkin:', err)
    return NextResponse.json({ error: 'Analyse impossible, réessaie.' }, { status: 500 })
  }

  if ('error' in result) {
    return NextResponse.json(
      { error: result.error, reason: result.reason },
      { status: 422 }
    )
  }

  // Associe chaque catégorie de routine (libellé renvoyé par le LLM) à une
  // catégorie réelle du catalogue : égalité normalisée (accents/casse/espaces),
  // sinon inclusion d'un libellé dans l'autre (filet de sécurité).
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  const routineCategories = [
    ...result.routine_morning.map((s: RoutineStep) => s.category),
    ...result.routine_evening.map((s: RoutineStep) => s.category),
  ]
  const matched = new Set<string>()
  for (const raw of routineCategories) {
    const n = norm(raw)
    let hit = catalogCategories.find((c) => norm(c) === n)
    if (!hit) {
      hit = catalogCategories.find(
        (c) => n.includes(norm(c)) || norm(c).includes(n)
      )
    }
    if (hit) matched.add(hit)
  }
  const matchedCategories = [...matched]

  const PRODUCT_FIELDS =
    'id, name, brand, category, price_eur, for_skin_types, affiliate_url, image_url'

  let recommendedProducts: RecommendedProduct[] = []
  if (matchedCategories.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .in('category', matchedCategories)
      .contains('for_skin_types', [result.skin_type])
    let rows = (products ?? []) as RecommendedProduct[]
    // Repli : si rien pour ce type de peau, on garde au moins le match catégorie.
    if (rows.length === 0) {
      const { data: relaxed } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .in('category', matchedCategories)
      rows = (relaxed ?? []) as RecommendedProduct[]
    }
    recommendedProducts = rows.slice(0, 12)
  }

  if (!user) {
    return NextResponse.json({
      analysis: {
        id: null,
        skin_type: result.skin_type,
        concerns: result.concerns,
        undertone: result.undertone,
        routine_morning: result.routine_morning,
        routine_evening: result.routine_evening,
        recommended_products: recommendedProducts,
        full_result: result,
        created_at: new Date().toISOString(),
      },
    })
  }

  const match = image.match(/^data:image\/(\w+);base64,/)
  const extension = match ? match[1] : 'jpg'
  const photoPath = `${user.id}/${randomUUID()}.${extension}`
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
  const photoBuffer = Buffer.from(base64Data, 'base64')

  const { error: uploadError } = await supabase.storage
    .from('user-photos')
    .upload(photoPath, photoBuffer, { contentType: `image/${extension}` })

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError)
    return NextResponse.json(
      { error: "Échec de l'upload de la photo", reason: uploadError.message },
      { status: 500 }
    )
  }

  const { data: analysis, error: insertError } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      photo_url: photoPath,
      skin_type: result.skin_type,
      concerns: result.concerns,
      undertone: result.undertone,
      routine_morning: result.routine_morning,
      routine_evening: result.routine_evening,
      recommended_products: recommendedProducts,
      full_result: result,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Supabase insert error:', insertError)
    return NextResponse.json(
      { error: "Échec de l'enregistrement", reason: insertError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ analysis: { ...analysis, full_result: result } })
}
