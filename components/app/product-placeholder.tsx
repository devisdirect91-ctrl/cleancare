import { categoryTint } from '@/lib/categories'

const CREAM = '#FAF6EE'
const TERRACOTTA = '#C8755A'
const INK = '#1F1B16'

/**
 * Placeholder produit 100% local (aucune dépendance réseau) : silhouette
 * de flacon minimaliste dans la palette de marque, fond teinté par catégorie.
 * Utilisé tant qu'aucune vraie photo (`image_url`) n'est disponible.
 */
export function ProductPlaceholder({
  category,
  className = '',
}: {
  category: string | null
  className?: string
}) {
  const tint = categoryTint(category)
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      role="img"
      aria-label="Visuel produit"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="120" height="140" fill={tint} />
      {/* ombre portée douce */}
      <ellipse cx="60" cy="119" rx="25" ry="4.5" fill={INK} opacity="0.06" />
      {/* bouchon */}
      <rect x="49" y="27" width="22" height="15" rx="4" fill={TERRACOTTA} />
      {/* col */}
      <rect x="53" y="40" width="14" height="16" fill={CREAM} />
      {/* corps */}
      <rect
        x="40"
        y="54"
        width="40"
        height="62"
        rx="13"
        fill={CREAM}
        stroke={INK}
        strokeOpacity="0.08"
      />
      {/* étiquette teintée */}
      <rect x="48" y="80" width="24" height="20" rx="4" fill={tint} />
      <rect x="54" y="88" width="12" height="2.6" rx="1.3" fill={TERRACOTTA} />
    </svg>
  )
}
