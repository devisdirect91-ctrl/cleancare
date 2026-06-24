'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resetUser, trackEvent } from '@/lib/analytics/posthog'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    trackEvent('logout_clicked')
    const supabase = createClient()
    await supabase.auth.signOut()
    resetUser()
    // Rechargement complet pour purger l'état serveur (cookies).
    window.location.href = '/scan'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E5DCC8] bg-[#FFFCF6] py-3.5 font-sans text-[14px] text-charcoal transition-opacity hover:opacity-80 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.6} />
      {loading ? 'Déconnexion…' : 'Se déconnecter'}
    </button>
  )
}
