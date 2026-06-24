'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, LayoutGrid, Sparkles, User } from 'lucide-react'

const TERRACOTTA = '#C8755A'
const STONE = '#8B8378'

const TABS = [
  { href: '/routine', label: 'Routine', icon: Sparkles },
  { href: '/scans', label: 'Scans', icon: Activity },
  { href: '/catalogue', label: 'Catalogue', icon: LayoutGrid },
  { href: '/profil', label: 'Profil', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5DCC8] bg-cream/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center gap-1 py-2.5 transition-colors"
                style={{ color: active ? TERRACOTTA : STONE }}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2 : 1.6}
                />
                <span className="font-mono text-[9px] uppercase tracking-[0.12em]">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
