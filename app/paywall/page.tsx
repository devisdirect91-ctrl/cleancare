import Link from 'next/link'
import { PaywallCard } from '@/components/paywall/PaywallCard'
import { createClient } from '@/lib/supabase/server'

export default async function PaywallPage() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    return (
      <main className="min-h-screen bg-[#F4ECDD]">
        <PaywallCard />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F4ECDD]">
      <div className="pt-10 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone">
          Mira Premium
        </p>
        <h1 className="mt-3 font-display text-[28px] leading-[1.1] tracking-tight text-charcoal">
          Ta peau mérite
          <br />
          <em className="font-normal italic text-terracotta">le meilleur suivi</em>
        </h1>
        <Link
          href="/"
          className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.15em] text-stone underline underline-offset-2"
        >
          &larr; Retour au diagnostic
        </Link>
      </div>
      <PaywallCard />
    </main>
  )
}
