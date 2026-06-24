'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics/posthog'

interface RoutinePickerProps {
  userId: string
  scans: { id: string; label: string }[]
  activeId: string
}

// Permet de choisir quel scan pilote la routine active (profiles.active_analysis_id).
export function RoutinePicker({ userId, scans, activeId }: RoutinePickerProps) {
  const router = useRouter()
  const [value, setValue] = useState(activeId)
  const [saving, setSaving] = useState(false)

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    setValue(id)
    setSaving(true)
    trackEvent('active_routine_changed', { analysis_id: id })
    const supabase = createClient()
    await supabase.from('profiles').update({ active_analysis_id: id }).eq('id', userId)
    setSaving(false)
    router.refresh()
  }

  return (
    <label className="relative mt-5 block">
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.18em] text-stone">
        Routine active
      </span>
      <select
        value={value}
        onChange={onChange}
        disabled={saving}
        className="w-full appearance-none rounded-2xl border border-[#E5DCC8] bg-[#FFFCF6] py-3 pl-4 pr-10 font-sans text-[14px] text-charcoal outline-none focus:border-terracotta disabled:opacity-60"
      >
        {scans.map((s) => (
          <option key={s.id} value={s.id}>
            Routine du {s.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-[calc(50%+6px)] h-4 w-4 -translate-y-1/2 text-stone" />
    </label>
  )
}
