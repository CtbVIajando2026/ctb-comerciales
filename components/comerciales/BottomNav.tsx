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
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-background border-t border-border flex justify-around pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-h-[4.5rem] z-50 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center pt-1.5 pb-1 w-16 h-[3.25rem] rounded-2xl transition-all ${
              isActive 
                ? 'text-primary bg-primary/10 shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0px_2px_4px_rgba(0,0,0,0.2)] font-bold' 
                : 'text-muted-foreground hover:text-primary hover:bg-muted/50 font-medium'
            }`}
          >
            <Icon size={isActive ? 22 : 24} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[9px] mt-0.5`}>{tab.label}</span>
          </Link>
        )
      })}
      
      <button
        onClick={handleLogout}
        className="flex flex-col items-center justify-center pt-1.5 pb-1 w-16 h-[3.25rem] rounded-2xl transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Power size={24} strokeWidth={2} />
        <span className="text-[9px] mt-0.5 font-medium">Salir</span>
      </button>
    </div>
  )
}
