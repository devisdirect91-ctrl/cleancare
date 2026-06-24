import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Camera } from 'lucide-react'
import { CheckoutSuccessTracker } from '@/components/analytics/CheckoutSuccessTracker'
import { RoutineBoard } from '@/components/app/routine-board'
import { RoutinePicker } from '@/components/app/routine-picker'
import { TabViewTracker } from '@/components/app/tab-view-tracker'
import { displayNameFromEmail, formatDiagnosticDate } from '@/lib/diagnostic'
import { daysUntil, localDateKey, nextScanDate } from '@/lib/routine'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisRow, Profile, RoutineLog } from '@/types/analysis'

export default async function RoutinePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/routine')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, email, active_analysis_id')
    .eq('id', user.id)
    .single<Pick<Profile, 'first_name' | 'email' | 'active_analysis_id'>>()

  const { data: analysesData } = await supabase
    .from('analyses')
    .select('id, created_at, skin_type, routine_morning, routine_evening')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const analyses = (analysesData ?? []) as Pick<
    AnalysisRow,
    'id' | 'created_at' | 'skin_type' | 'routine_morning' | 'routine_evening'
  >[]

  const name =
    profile?.first_name?.trim() ||
    (user.email ? displayNameFromEmail(user.email) : 'toi')

  if (analyses.length === 0) {
    return (
      <main className="px-5 pt-9">
        <TabViewTracker tab="routine" />
        <CheckoutSuccessTracker />
        <h1 className="font-display text-[30px] tracking-tight text-charcoal">
          Bonjour {name}
        </h1>
        <div className="mt-8 rounded-[24px] border border-[#E5DCC8] bg-[#FFFCF6] p-7 text-center">
          <p className="text-[15px] leading-relaxed text-stone">
            Tu n&apos;as pas encore de routine. Fais ton premier scan pour
            recevoir ta routine personnalisée.
          </p>
          <Link
            href="/scan"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-6 py-3.5 font-sans text-[15px] font-semibold text-cream"
          >
            <Camera className="h-4 w-4" strokeWidth={1.6} />
            Faire mon scan
          </Link>
        </div>
      </main>
    )
  }

  const active =
    analyses.find((a) => a.id === profile?.active_analysis_id) ?? analyses[0]
  const latest = analyses[0]
  const days = daysUntil(nextScanDate(latest.created_at))

  // Logs récents (fenêtre large ; le calcul "aujourd'hui"/streak est local côté client).
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)
  const { data: logsData } = await supabase
    .from('routine_logs')
    .select('log_date, slot, step_index')
    .eq('user_id', user.id)
    .gte('log_date', localDateKey(cutoff))

  const initialLogs = (logsData ?? []) as Pick<
    RoutineLog,
    'log_date' | 'slot' | 'step_index'
  >[]

  return (
    <main className="px-5 pt-9">
      <TabViewTracker tab="routine" />
      <CheckoutSuccessTracker />

      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-terracotta">
          Ta routine
        </p>
        <h1 className="mt-2 font-display text-[30px] tracking-tight text-charcoal">
          Bonjour {name}
        </h1>
      </header>

      {analyses.length > 1 && (
        <RoutinePicker
          userId={user.id}
          activeId={active.id}
          scans={analyses.map((a) => ({
            id: a.id,
            label: formatDiagnosticDate(a.created_at),
          }))}
        />
      )}

      {/* Rappel prochain scan */}
      <div className="mt-5 flex items-center justify-between rounded-[20px] bg-[#1F1B16] p-4 text-cream">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#E8C9BC]">
            Prochain scan
          </p>
          <p className="mt-1 font-display text-[16px]">
            {days > 0
              ? `Dans ${days} jour${days > 1 ? 's' : ''}`
              : 'C’est le moment !'}
          </p>
        </div>
        <Link
          href="/scan"
          className="rounded-full bg-terracotta px-4 py-2.5 font-sans text-[13px] font-semibold text-cream"
        >
          Scanner
        </Link>
      </div>

      <div className="mt-7">
        <RoutineBoard
          userId={user.id}
          morning={active.routine_morning ?? []}
          evening={active.routine_evening ?? []}
          initialLogs={initialLogs}
        />
      </div>

      <Link
        href={`/scans/${active.id}`}
        className="mt-8 block rounded-full border border-[#E5DCC8] bg-[#FFFCF6] py-3.5 text-center font-sans text-[14px] text-charcoal transition-opacity hover:opacity-80"
      >
        Voir le diagnostic complet
      </Link>
    </main>
  )
}
