// Teintes douces et cohérentes avec la DA (cream/terracotta/ink) pour
// différencier les catégories de produits dans le catalogue et les routines.

const CATEGORY_TINTS: Record<string, string> = {
  'nettoyant doux': '#DCE5DD',
  'sérum hydratant': '#D9E2EC',
  'crème hydratante légère': '#EFE3D2',
  'crème nourrissante': '#EAD9C8',
  'protection solaire': '#F3E4C4',
  'brume apaisante': '#E2E6DE',
  'exfoliant doux': '#ECDCD6',
  'masque purifiant': '#DFE4DA',
  'soin contour des yeux': '#E4DDE9',
}

const DEFAULT_TINT = '#EDE3D0'

/** Couleur de fond douce associée à une catégorie de produit. */
export function categoryTint(category: string | null | undefined): string {
  if (!category) return DEFAULT_TINT
  return CATEGORY_TINTS[category] ?? DEFAULT_TINT
}

/** Liste ordonnée des catégories connues (pour les filtres catalogue). */
export const KNOWN_CATEGORIES = Object.keys(CATEGORY_TINTS)
