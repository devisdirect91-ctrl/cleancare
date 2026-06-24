import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { DiagnosticView } from '@/components/app/diagnostic-view'
import { FollowupActions } from '@/components/dashboard/followup-actions'
import { displayNameFromEmail, formatDiagnosticDate } from '@/lib/diagnostic'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisRow, Profile } from '@/types/analysis'

export default async function ScanDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single<AnalysisRow>()

  if (!analysis) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, email')
    .eq('id', user.id)
    .single<Pick<Profile, 'first_name' | 'email'>>()

  const name =
    profile?.first_name?.trim() ||
    (user.email ? displayNameFromEmail(user.email) : 'toi')
  const date = formatDiagnosticDate(analysis.created_at)

  return (
    <main className="pb-6">
      <div className="px-5 pt-6">
        <Link
          href="/scans"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-stone transition-opacity hover:opacity-70"
        >
          <ChevronLeft className="h-4 w-4" /> Mes scans
        </Link>
      </div>

      <DiagnosticView name={name} date={date} analysis={analysis} />

      <div className="mt-10 px-5">
        <FollowupActions
          shareImageUrl={`/api/og?id=${analysis.id}`}
          analysisCreatedAt={analysis.created_at}
        />
      </div>
    </main>
  )
}
