"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Plus, Building2, BarChart2, Power, Trophy } from "lucide-react"
import { createClient } from '@/lib/supabase/client'

const tabs = [
  { href: '/comerciales/dashboard', icon: Home, label: 'Inicio' },
  { href: '/comerciales/visitas/nueva', icon: Plus, label: 'Nueva' },
  { href: '/comerciales/ranking', icon: Trophy, label: 'Ranking' },
  { href: '/comerciales/agencias', icon: Building2, label: 'Agencias' },
  { href: '/comerciales/mi-dia', icon: BarChart2, label: 'Actividad' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Only show on comerciales routes
  if (!pathname.startsWith('/comerciales')) return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-background border-t border-border flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)] z-50 px-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        )
      })}
      
      <button
        onClick={handleLogout}
        className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors text-muted-foreground hover:text-destructive"
      >
        <Power size={24} strokeWidth={2} />
        <span className="text-[10px] font-medium">Salir</span>
      </button>
    </div>
  )
}
