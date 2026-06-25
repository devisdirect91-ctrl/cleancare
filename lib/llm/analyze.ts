import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// NB : on conserve les noms de champs `recommendations_summary`,
// `ingredients_to_seek` et `ingredients_to_avoid` (et non `observation` /
// `ingredients_seek` / `ingredients_avoid`) car le dashboard, la paywall,
// la route OG et lib/diagnostic les lisent déjà depuis full_result.
const SYSTEM_PROMPT = `Tu es un assistant cosmétique professionnel bienveillant (PAS médical, PAS dermatologique). Analyse cette photo de visage et retourne UNIQUEMENT un JSON valide, sans markdown, sans texte avant ou après.

Si la photo ne montre pas clairement un visage, retourne :
{"error": "no_face", "message": "On n'arrive pas à bien voir ton visage. Reprends une photo en pleine lumière."}

Sinon retourne exactement cette structure :
{
  "skin_type": "sèche|mixte|grasse|normale|sensible",
  "undertone": "chaud|froid|neutre",
  "hydration_level": <1-10>,
  "texture_score": <1-10>,
  "concerns": [<liste parmi: "déshydratation", "acné_légère", "pores_dilatés", "rougeurs", "ridules", "taches", "ternissement">],
  "recommendations_summary": "<2-3 phrases bienveillantes décrivant ce que tu observes. Reste positive et encourageante. Pas de jugement, pas de notation globale.>",
  "routine_morning": [
    {"step": 1, "category": "<catégorie produit>", "reason": "<pourquoi pour cette peau>"}
  ],
  "routine_evening": [
    {"step": 1, "category": "<catégorie produit>", "reason": "<pourquoi pour cette peau>"}
  ],
  "ingredients_to_seek": [<3-4 actifs adaptés>],
  "ingredients_to_avoid": [<3-4 ingrédients à limiter>]
}

routine_morning compte 3 à 4 étapes, routine_evening compte 3 étapes.

RÈGLES STRICTES :
- Reste TOUJOURS dans des recommandations simples et sûres (nettoyant doux, hydratant, SPF, 1-2 actifs doux max comme niacinamide ou acide hyaluronique).
- Ne recommande JAMAIS de rétinol fort, acides exfoliants concentrés, ou traitements agressifs.
- Si tu détectes une condition qui semble sévère (acné kystique importante, rougeurs type rosacée marquée, lésions suspectes), ajoute "consultation_recommandée" dans concerns et mets dans recommendations_summary une suggestion douce de consulter un dermatologue.
- Reste cosmétique, jamais médical. Tu observes, tu ne diagnostiques pas.
- Reste BIENVEILLANT, jamais critique. Pas de score général, pas de notation.
- Réponds UNIQUEMENT en JSON valide, sans markdown.`

// Contraint le LLM à choisir `category` dans la liste EXACTE du catalogue,
// pour que le matching produits côté serveur fonctionne (sinon il renvoie des
// libellés descriptifs type "Nettoyant doux gel ou mousse" → 0 produit matché).
function buildSystemPrompt(categories: string[]): string {
  if (categories.length === 0) return SYSTEM_PROMPT
  return (
    SYSTEM_PROMPT +
    `\n\nCATÉGORIES PRODUITS AUTORISÉES — le champ "category" de CHAQUE étape (routine_morning ET routine_evening) DOIT être EXACTEMENT l'un de ces libellés, copié tel quel, sans aucun ajout ni reformulation :\n${categories
      .map((c) => `- ${c}`)
      .join('\n')}\nMets toute précision (texture, actif comme niacinamide/acide hyaluronique, SPF, etc.) dans "reason", JAMAIS dans "category".`
  )
}

export interface RoutineStep {
  step: number
  category: string
  reason: string
}

export interface SkinAnalysis {
  skin_type: string
  concerns: string[]
  undertone: string
  hydration_level: number
  texture_score: number
  recommendations_summary: string
  routine_morning: RoutineStep[]
  routine_evening: RoutineStep[]
  ingredients_to_seek: string[]
  ingredients_to_avoid: string[]
}

export interface SkinAnalysisError {
  error: string
  reason: string
}

export class RateLimitedError extends Error {}
export class LLMConfigError extends Error {}

function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) throw new Error('Format image invalide')
  return { mediaType: match[1], base64: match[2] }
}

export async function analyzeSkin(
  imageBase64: string,
  categories: string[] = []
): Promise<SkinAnalysis | SkinAnalysisError> {
  const { mediaType, base64 } = parseDataUrl(imageBase64)

  let response
  try {
    response = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: buildSystemPrompt(categories),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                  data: base64,
                },
              },
              { type: 'text', text: 'Analyse cette photo de visage.' },
            ],
          },
        ],
      },
      // Timeout 30s max pour l'appel Anthropic.
      { timeout: 30_000 }
    )
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new RateLimitedError('Rate limited')
    }
    if (err instanceof Anthropic.AuthenticationError) {
      throw new LLMConfigError('ANTHROPIC_API_KEY est manquante ou invalide')
    }
    throw err
  }

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return { error: 'Photo invalide', reason: 'Aucune réponse exploitable.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(textBlock.text)
  } catch {
    return { error: 'Photo invalide', reason: 'Réponse non exploitable.' }
  }

  // Le modèle signale une erreur structurée (ex: no_face). On expose le
  // message lisible dans `error` (affiché au client) et le code dans `reason`.
  if (parsed && typeof parsed === 'object' && 'error' in parsed) {
    const e = parsed as { error?: unknown; message?: unknown; reason?: unknown }
    return {
      error:
        (typeof e.message === 'string' && e.message) ||
        (typeof e.reason === 'string' && e.reason) ||
        'Photo invalide',
      reason: typeof e.error === 'string' ? e.error : 'invalid',
    }
  }

  return parsed as SkinAnalysis
}
