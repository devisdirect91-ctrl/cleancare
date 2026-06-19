import { Lock } from 'lucide-react'

interface LockedSectionProps {
  locked: boolean
  children: React.ReactNode
}

export function LockedSection({ locked, children }: LockedSectionProps) {
  if (!locked) return <>{children}</>

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-md">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-cream/70 text-center">
        <Lock className="h-5 w-5 text-stone" strokeWidth={1.5} />
        <p className="max-w-[220px] font-mono text-[11px] uppercase tracking-wide text-stone">
          Réactive ton abonnement pour voir le détail
        </p>
      </div>
    </div>
  )
}
