import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Tu es un assistant cosmétique professionnel (PAS médical, PAS dermatologique).
Analyse la photo de visage fournie et retourne un JSON strict :

{
  "skin_type": "sèche|mixte|grasse|normale|sensible",
  "concerns": ["acné_légère", "déshydratation", "pores_dilatés", "rougeurs",
               "ridules", "taches", "ternissement"],  // tableau, peut être vide
  "undertone": "chaud|froid|neutre",
  "hydration_level": 1-10,
  "texture_score": 1-10,
  "recommendations_summary": "2-3 phrases bienveillantes décrivant ce que tu observes",
  "routine_morning": [
    {"step": 1, "category": "nettoyant doux", "reason": "..."},
    {"step": 2, "category": "sérum hydratant", "reason": "..."}
  ],
  "routine_evening": [...],
  "ingredients_to_seek": ["acide hyaluronique", "niacinamide"],
  "ingredients_to_avoid": ["alcool dénaturé"]
}

IMPORTANT :
- Reste BIENVEILLANT, jamais critique. Pas de score général, pas de notation.
- Ne diagnostique aucune pathologie. Tu observes, tu ne diagnostiques pas.
- Si la photo est de mauvaise qualité ou ne montre pas un visage, retourne
  {"error": "Photo invalide", "reason": "..."}.
- Réponds UNIQUEMENT en JSON valide, sans markdown.`

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

function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) throw new Error('Format image invalide')
  return { mediaType: match[1], base64: match[2] }
}

export async function analyzeSkin(
  imageBase64: string
): Promise<SkinAnalysis | SkinAnalysisError> {
  const { mediaType, base64 } = parseDataUrl(imageBase64)

  let response
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
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
    })
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new RateLimitedError('Rate limited')
    }
    throw err
  }

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return { error: 'Photo invalide', reason: 'Aucune réponse exploitable.' }
  }

  try {
    return JSON.parse(textBlock.text)
  } catch {
    return { error: 'Photo invalide', reason: 'Réponse non exploitable.' }
  }
}
