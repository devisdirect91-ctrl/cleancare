'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Camera, ChevronRight } from 'lucide-react'
import { daysUntil, nextScanDate } from '@/lib/routine'

export interface TimelineScan {
  id: string
  createdAt: string
  dateLabel: string
  skinType: string
  hydration: number | null
  texture: number | null
}

type Metric = 'hydra' | 'tex'

const RING_R = 20
const RING_C = 2 * Math.PI * RING_R

export function ScanTimeline({ scans }: { scans: TimelineScan[] }) {
  const [metric, setMetric] = useState<Metric>('hydra')

  const latest = scans[0]
  const days = latest ? daysUntil(nextScanDate(latest.createdAt)) : 0
  const overdue = days <= 0
  const elapsed = Math.max(0, Math.min(30, 30 - days))
  const fraction = overdue ? 1 : elapsed / 30
  const dashoffset = (RING_C * (1 - fraction)).toFixed(1)

  function metricValue(s: TimelineScan): number | null {
    return metric === 'hydra' ? s.hydration : s.texture
  }

  return (
    <div>
      {/* Hero prochain scan */}
      <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[#1F1B16] p-4 text-cream">
        <div className="flex items-center gap-3.5">
          <div className="relative h-[46px] w-[46px] flex-none">
            <svg width="46" height="46" viewBox="0 0 46 46">
              <circle
                cx="23"
                cy="23"
                r={RING_R}
                fill="none"
                stroke={overdue ? '#C8755A' : 'rgba(250,246,238,0.18)'}
                strokeWidth="3"
              />
              {!overdue && (
                <circle
                  cx="23"
                  cy="23"
                  r={RING_R}
                  fill="none"
                  stroke="#C8755A"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={dashoffset}
                  transform="rotate(-90 23 23)"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-display text-[15px]">
              {overdue ? (
                <span className="text-[20px] text-terracotta">✦</span>
              ) : (
                days
              )}
            </div>
          </div>
          <div>
            <p className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-[#E8C9BC]">
              Prochain scan
            </p>
            <p className="mt-0.5 font-display text-[16px]">
              {overdue ? 'C’est le moment !' : `Dans ${days} jour${days > 1 ? 's' : ''}`}
            </p>
            <p className="mt-0.5 font-mono text-[8px] text-cream/50">
              {overdue
                ? `${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''} depuis ton dernier scan`
                : `${elapsed} / 30 jours`}
            </p>
          </div>
        </div>
        <Link
          href="/scan"
          className="flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full bg-terracotta px-4 py-2.5 font-sans text-[12.5px] font-semibold text-cream"
        >
          <Camera className="h-4 w-4" strokeWidth={1.7} />
          Scanner
        </Link>
      </div>

      {/* Bascule métrique (si au moins 2 scans pour comparer) */}
      {scans.length > 1 && (
        <div className="mt-3.5 flex justify-end gap-1.5">
          {(['hydra', 'tex'] as Metric[]).map((m) => {
            const active = metric === m
            return (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className="rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors"
                style={{
                  borderColor: active ? '#C8755A' : '#D8CDB5',
                  background: active ? '#C8755A' : 'transparent',
                  color: active ? '#FAF6EE' : '#8B8378',
                }}
              >
                {m === 'hydra' ? 'Hydratation' : 'Texture'}
              </button>
            )
          })}
        </div>
      )}

      {/* Frise */}
      <div className="relative mt-3 pl-[34px]">
        <div
          className="absolute bottom-[18px] left-[10px] top-3 w-[2px]"
          style={{ background: 'linear-gradient(#C8755A, #C8755A 70%, #E0B9A8)' }}
        />
        {scans.map((scan, i) => {
          const isLatest = i === 0
          const prev = scans[i + 1]
          const cur = metricValue(scan)
          const prevVal = prev ? metricValue(prev) : null
          const delta =
            cur != null && prevVal != null ? cur - prevVal : null
          return (
            <div key={scan.id} className="relative mb-[11px] last:mb-0">
              <span
                className="absolute left-[-31px] top-1/2 -translate-y-1/2 rounded-full"
                style={
                  isLatest
                    ? {
                        width: 15,
                        height: 15,
                        background: '#C8755A',
                        border: '3px solid #FAF6EE',
                        boxShadow: '0 0 0 1.5px #C8755A',
                      }
                    : {
                        width: 13,
                        height: 13,
                        background: '#FAF6EE',
                        border: '2.5px solid #C8755A',
                      }
                }
              />
              <Link
                href={`/scans/${scan.id}`}
                className="flex items-center gap-2 rounded-[18px] border border-[#E5DCC8] bg-[#FFFCF6] py-3 pl-3.5 pr-2.5 transition-[transform,box-shadow] duration-100 hover:shadow-[0_12px_30px_-16px_rgba(31,27,22,0.28)] active:scale-[0.985]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone">
                      {scan.dateLabel}
                      {isLatest ? ' · dernier' : ''}
                      {!prev ? ' · 1ᵉʳ scan' : ''}
                    </span>
                    <MetricChip value={cur} delta={delta} hasPrev={!!prev} />
                  </div>
                  <p className="mt-1 font-display text-[16px] capitalize text-charcoal">
                    Peau {scan.skinType}
                  </p>
                </div>
                <ChevronRight
                  className="h-[17px] w-[17px] flex-none text-[#B7AE9F]"
                  strokeWidth={2.2}
                />
              </Link>
            </div>
          )
        })}
      </div>

      {scans.length === 1 && (
        <p className="mx-1.5 mt-4 text-center text-[12.5px] leading-relaxed text-stone">
          C’est ton point de départ ✨
          <br />
          Un nouveau scan dans 30 jours révélera ta progression.
        </p>
      )}
    </div>
  )
}

function MetricChip({
  value,
  delta,
  hasPrev,
}: {
  value: number | null
  delta: number | null
  hasPrev: boolean
}) {
  if (value == null) return null

  // Premier scan (pas de précédent) → point de départ, ton neutre.
  if (!hasPrev || delta == null) {
    return (
      <span className="rounded-full bg-[#EDE3D0] px-2 py-[3px] text-[11px] font-semibold text-[#9A7B53]">
        {value}/10 · départ
      </span>
    )
  }

  const up = delta > 0
  const flat = delta === 0
  const bg = flat ? '#EDE7DA' : up ? '#EAF0E6' : 'rgba(200,117,90,0.12)'
  const color = flat ? '#8B8378' : up ? '#5B7A52' : '#B5573B'
  const arrow = flat ? 'stable' : up ? `▲ +${delta}` : `▼ ${delta}`

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-semibold"
      style={{ background: bg, color }}
    >
      <b>{value}/10</b>
      <span>{arrow}</span>
    </span>
  )
}
