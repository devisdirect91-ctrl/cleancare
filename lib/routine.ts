// Helpers de routine & planification de scan. Tout est calculé en heure
// LOCALE de l'utilisatrice (jamais UTC) pour le "aujourd'hui" et le streak.

export const NEXT_SCAN_INTERVAL_DAYS = 30

/** Clé de date locale `YYYY-MM-DD` (pas de décalage UTC). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Date recommandée du prochain scan = dernier scan + 30 jours. */
export function nextScanDate(lastScanISO: string): Date {
  const d = new Date(lastScanISO)
  d.setDate(d.getDate() + NEXT_SCAN_INTERVAL_DAYS)
  return d
}

/** Nombre de jours (calendaires locaux) entre deux dates (négatif si passé). */
export function daysUntil(target: Date, from: Date = new Date()): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/**
 * Série (streak) : nombre de jours consécutifs avec AU MOINS un slot complété.
 * `completedDays` = ensemble de clés `YYYY-MM-DD` (locales) ayant ≥ 1 slot fait.
 * On part d'aujourd'hui ; si rien n'est encore fait aujourd'hui, on part d'hier.
 */
export function computeStreak(
  completedDays: Set<string>,
  today: Date = new Date()
): number {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!completedDays.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let streak = 0
  while (completedDays.has(localDateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
