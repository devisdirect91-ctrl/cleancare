'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics/posthog'

const NAME_REGEX = /^[a-zA-ZÀ-ÿ\-' ]+$/

function isValid(v: string) {
  const t = v.trim()
  return t.length >= 2 && t.length <= 30 && NAME_REGEX.test(t)
}

function formatName(v: string) {
  const t = v.trim()
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

interface ProfileNameEditorProps {
  userId: string
  initialName: string
  email: string
}

export function ProfileNameEditor({
  userId,
  initialName,
  email,
}: ProfileNameEditorProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialName)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!isValid(draft)) {
      toast.error('Ton prénom doit contenir entre 2 et 30 lettres.')
      return
    }
    const formatted = formatName(draft)
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: formatted })
      .eq('id', userId)
    setSaving(false)
    if (error) {
      toast.error('Impossible d’enregistrer, réessaie.')
      return
    }
    setName(formatted)
    setEditing(false)
    trackEvent('profile_name_updated')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4 rounded-[22px] border border-[#E5DCC8] bg-[#FFFCF6] p-5">
      <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-terracotta/12 font-display text-[22px] text-terracotta">
        {(name || '?').charAt(0).toUpperCase()}
      </span>

      {editing ? (
        <div className="min-w-0 flex-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 31))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') {
                setDraft(name)
                setEditing(false)
              }
            }}
            placeholder="Ton prénom"
            className="w-full rounded-xl border-[1.5px] border-[#D8CDB5] bg-cream px-3 py-2 font-sans text-[16px] capitalize text-charcoal outline-none focus:border-terracotta"
          />
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px] text-charcoal">{name}</p>
          <p className="truncate font-sans text-[13px] text-stone">{email}</p>
        </div>
      )}

      {editing ? (
        <div className="flex flex-none gap-1.5">
          <button
            onClick={save}
            disabled={saving}
            aria-label="Enregistrer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-cream disabled:opacity-60"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => {
              setDraft(name)
              setEditing(false)
            }}
            aria-label="Annuler"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DCC8] text-stone"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setDraft(name)
            setEditing(true)
          }}
          aria-label="Modifier le prénom"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[#E5DCC8] text-stone transition-colors hover:bg-cream"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.6} />
        </button>
      )}
    </div>
  )
}
