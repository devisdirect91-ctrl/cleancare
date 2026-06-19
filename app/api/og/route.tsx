import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisRow } from '@/types/analysis'

export const runtime = 'edge'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return new Response('Non authentifié', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const analysisId = searchParams.get('id')

  let query = supabase
    .from('analyses')
    .select('skin_type, undertone, full_result, created_at')
    .eq('user_id', userData.user.id)

  query = analysisId ? query.eq('id', analysisId) : query.order('created_at', { ascending: false })

  const { data: analysis } = await query.limit(1).single<
    Pick<AnalysisRow, 'skin_type' | 'undertone' | 'full_result' | 'created_at'>
  >()

  if (!analysis) {
    return new Response('Aucune analyse trouvée', { status: 404 })
  }

  const { full_result, skin_type, undertone } = analysis
  const hydration = full_result?.hydration_level
  const texture = full_result?.texture_score

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          backgroundColor: '#FAF6EE',
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#C8755A',
            }}
          >
            Diagnostic personnalisé
          </span>
          <span style={{ fontSize: 44, color: '#1F1B17', marginTop: 24 }}>
            Type de peau : {skin_type ?? '—'}
          </span>
          <span style={{ fontSize: 24, color: '#8B8378', marginTop: 12 }}>
            Sous-ton {undertone ?? '—'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#8B8378', textTransform: 'uppercase' }}>
              Hydratation
            </span>
            <span style={{ fontSize: 36, color: '#1F1B17' }}>
              {hydration != null ? `${hydration} / 10` : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#8B8378', textTransform: 'uppercase' }}>
              Texture
            </span>
            <span style={{ fontSize: 36, color: '#1F1B17' }}>
              {texture != null ? `${texture} / 10` : '—'}
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: 16,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#C8755A',
            alignSelf: 'flex-end',
          }}
        >
          Mira
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
