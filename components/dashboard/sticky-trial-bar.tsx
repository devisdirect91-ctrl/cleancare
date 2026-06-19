interface StickyTrialBarProps {
  daysLeft: number
  expired: boolean
}

export function StickyTrialBar({ daysLeft, expired }: StickyTrialBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-charcoal/10 bg-cream/95 px-5 py-3 backdrop-blur-sm sm:hidden">
      <span className="rounded-full bg-terracotta/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-terracotta">
        {expired
          ? 'Essai terminé'
          : `Essai gratuit · ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`}
      </span>
      <button className="rounded-xl bg-terracotta px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
        Passer en Premium
      </button>
    </div>
  )
}
