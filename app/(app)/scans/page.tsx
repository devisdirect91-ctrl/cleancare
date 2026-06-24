import { redirect } from 'next/navigation'
import { ScanTimeline, type TimelineScan } from '@/components/app/scan-timeline'
import { TabViewTracker } from '@/components/app/tab-view-tracker'
import { formatDiagnosticDate } from '@/lib/diagnostic'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisRow } from '@/types/analysis'

export default async function ScansPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/scans')

  const { data } = await supabase
    .from('analyses')
    .select('id, skin_type, full_result, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as Pick<
    AnalysisRow,
    'id' | 'skin_type' | 'full_result' | 'created_at'
  >[]

  const scans: TimelineScan[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    dateLabel: formatDiagnosticDate(r.created_at),
    skinType: r.skin_type ?? '—',
    hydration:
      typeof r.full_result?.hydration_level === 'number'
        ? (r.full_result.hydration_level as number)
        : null,
    texture:
      typeof r.full_result?.texture_score === 'number'
        ? (r.full_result.texture_score as number)
        : null,
  }))

  return (
    <main className="px-5 pt-9">
      <TabViewTracker tab="scans" />
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-terracotta">
          Ton évolution
        </p>
        <h1 className="mt-2 font-display text-[30px] tracking-tight text-charcoal">
          Mes scans
        </h1>
      </header>

      <ScanTimeline scans={scans} />
    </main>
  )
}
