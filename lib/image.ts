/**
 * Helpers de traitement d'image côté client (canvas).
 * À n'importer que depuis des composants client.
 */

interface CompressOptions {
  maxWidth?: number
  quality?: number
}

/**
 * Redimensionne (largeur max) et recompresse une image en JPEG.
 * Retourne l'image d'origine en cas d'échec (jamais throw).
 */
export function compressImage(
  dataUrl: string,
  { maxWidth = 1024, quality = 0.85 }: CompressOptions = {}
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      try {
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/** Taille en octets du payload d'un dataURL base64. */
export function dataUrlByteSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  if (!b64) return 0
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding)
}
