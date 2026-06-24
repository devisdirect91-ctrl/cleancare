'use client'

import { useMemo, useState } from 'react'
import { Check, Flame, Moon, Sunrise } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics/posthog'
import { computeStreak, localDateKey } from '@/lib/routine'
import type { RoutineStep } from '@/types/analysis'

type Slot = 'morning' | 'evening'

interface LogRow {
  log_date: string
  slot: Slot
  step_index: number
}

interface RoutineBoardProps {
  userId: string
  morning: RoutineStep[]
  evening: RoutineStep[]
  initialLogs: LogRow[]
}

const DOW = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

export function RoutineBoard({
  userId,
  morning,
  evening,
  initialLogs,
}: RoutineBoardProps) {
  const today = localDateKey()
  const [logs, setLogs] = useState<Set<string>>(
    () => new Set(initialLogs.map((l) => `${l.log_date}|${l.slot}|${l.step_index}`))
  )

  const completedDays = useMemo(
    () => new Set([...logs].map((k) => k.split('|')[0])),
    [logs]
  )
  const streak = useMemo(() => computeStreak(completedDays), [completedDays])

  // 7 derniers jours (du plus ancien à aujourd'hui).
  const week = useMemo(() => {
    const out: { key: string; letter: string; done: boolean; isToday: boolean }[] = []
    const base = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i)
      const key = localDateKey(d)
      out.push({
        key,
        letter: DOW[d.getDay()],
        done: completedDays.has(key),
        isToday: key === today,
      })
    }
    return out
  }, [completedDays, today])

  async function toggle(slot: Slot, idx: number) {
    const key = `${today}|${slot}|${idx}`
    const has = logs.has(key)

    setLogs((prev) => {
      const next = new Set(prev)
      if (has) next.delete(key)
      else next.add(key)
      return next
    })
    trackEvent('routine_step_toggled', { slot, step_index: idx, checked: !has })

    const supabase = createClient()
    const { error } = has
      ? await supabase
          .from('routine_logs')
          .delete()
          .match({ user_id: userId, log_date: today, slot, step_index: idx })
      : await supabase
          .from('routine_logs')
          .insert({ user_id: userId, log_date: today, slot, step_index: idx })

    // 23505 = doublon (déjà coché) → on considère que c'est ok.
    if (error && error.code !== '23505') {
      setLogs((prev) => {
        const next = new Set(prev)
        if (has) next.add(key)
        else next.delete(key)
        return next
      })
      toast.error('Action non enregistrée, réessaie.')
    }
  }

  return (
    <div>
      {/* Série + agenda semaine */}
      <div className="rounded-[22px] border border-[#E5DCC8] bg-[#FFFCF6] p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta/12">
            <Flame className="h-4 w-4 text-terracotta" strokeWidth={1.8} />
          </span>
          <p className="font-display text-[16px] text-charcoal">
            {streak > 0
              ? `${streak} jour${streak > 1 ? 's' : ''} d’affilée`
              : 'Commence ta série aujourd’hui'}
          </p>
        </div>
        <div className="mt-4 flex justify-between">
          {week.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className="font-mono text-[9px] uppercase"
                style={{ color: d.isToday ? '#C8755A' : '#8B8378' }}
              >
                {d.letter}
              </span>
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{
                  background: d.done ? '#C8755A' : 'transparent',
                  border: d.done
                    ? 'none'
                    : `1.5px solid ${d.isToday ? '#C8755A' : '#E0D6C2'}`,
                }}
              >
                {d.done && (
                  <Check className="h-3 w-3 text-cream" strokeWidth={3} />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SlotCard
        title="Routine du matin"
        slot="morning"
        steps={morning}
        logs={logs}
        today={today}
        onToggle={toggle}
      />
      <SlotCard
        title="Routine du soir"
        slot="evening"
        steps={evening}
        logs={logs}
        today={today}
        onToggle={toggle}
      />
    </div>
  )
}

function SlotCard({
  title,
  slot,
  steps,
  logs,
  today,
  onToggle,
}: {
  title: string
  slot: Slot
  steps: RoutineStep[]
  logs: Set<string>
  today: string
  onToggle: (slot: Slot, idx: number) => void
}) {
  if (steps.length === 0) return null
  const Icon = slot === 'morning' ? Sunrise : Moon
  const done = steps.filter((_, i) => logs.has(`${today}|${slot}|${i}`)).length

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-terracotta" strokeWidth={1.6} />
          <h2 className="font-display text-[20px] italic text-charcoal">
            {title}
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone">
          {done}/{steps.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[#E5DCC8] bg-[#FFFCF6]">
        {steps.map((step, i) => {
          const checked = logs.has(`${today}|${slot}|${i}`)
          return (
            <button
              key={`${step.step}-${step.category}`}
              onClick={() => onToggle(slot, i)}
              className={`flex w-full items-center gap-3 p-4 text-left transition-colors ${
                i > 0 ? 'border-t border-[#EFE7D6]' : ''
              }`}
            >
              <span
                className="flex h-6 w-6 flex-none items-center justify-center rounded-full transition-colors"
                style={{
                  background: checked ? '#C8755A' : 'transparent',
                  border: checked ? 'none' : '1.5px solid #D8CDB5',
                }}
              >
                {checked && <Check className="h-3.5 w-3.5 text-cream" strokeWidth={3} />}
              </span>
              <div className="flex-1">
                <p
                  className="font-display text-[15px] capitalize text-charcoal transition-opacity"
                  style={{ opacity: checked ? 0.55 : 1 }}
                >
                  {step.category}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-stone">
                  {step.reason}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
