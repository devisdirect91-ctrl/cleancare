import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt: string
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto min-h-svh max-w-2xl px-6 pb-20 pt-10">
      <Link
        href="/scan"
        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-stone transition-opacity hover:opacity-70"
      >
        <ChevronLeft className="h-4 w-4" /> LumiScan
      </Link>

      <h1 className="mt-6 font-display text-[32px] leading-[1.1] tracking-tight text-charcoal">
        {title}
      </h1>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
        Dernière mise à jour · {updatedAt}
      </p>

      <div className="mt-8 space-y-7">{children}</div>
    </main>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-2 font-display text-[19px] text-charcoal">{title}</h2>
      <div className="space-y-2 text-[14.5px] leading-relaxed text-[#4A4238]">
        {children}
      </div>
    </section>
  )
}
