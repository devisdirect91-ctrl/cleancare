'use client'

import { Share2, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'

interface FollowupActionsProps {
  shareImageUrl: string
}

export function FollowupActions({ shareImageUrl }: FollowupActionsProps) {
  async function handleShare() {
    try {
      const res = await fetch(shareImageUrl)
      const blob = await res.blob()
      const file = new File([blob], 'cleancare-diagnostic.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mon diagnostic CleanCare',
        })
        return
      }

      window.open(shareImageUrl, '_blank')
    } catch {
      window.open(shareImageUrl, '_blank')
    }
  }

  function handleReminder() {
    toast.success('On te rappelle dans 30 jours pour refaire le point sur ta peau.')
  }

  return (
    <section className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={handleReminder}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-charcoal/15 bg-white px-5 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-charcoal/5"
      >
        <CalendarClock className="h-4 w-4" strokeWidth={1.5} />
        Refaire une analyse dans 30 jours
      </button>
      <button
        onClick={handleShare}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <Share2 className="h-4 w-4" strokeWidth={1.5} />
        Partager mon résultat
      </button>
    </section>
  )
}
