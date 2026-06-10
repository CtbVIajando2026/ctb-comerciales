"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Plus, Building2, BarChart2, Power, Trophy } from "lucide-react"
import { createClient } from '@/lib/supabase/client'

const tabs = [
  { href: '/comerciales/dashboard', icon: Home, label: 'Inicio', color: 'text-violet-500', bg: 'bg-violet-500/15' },
  { href: '/comerciales/visitas/nueva', icon: Plus, label: 'Nueva', color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
  { href: '/comerciales/ranking', icon: Trophy, label: 'Ranking', color: 'text-amber-500', bg: 'bg-amber-500/15' },
  { href: '/comerciales/agencias', icon: Building2, label: 'Agencias', color: 'text-blue-500', bg: 'bg-blue-500/15' },
  { href: '/comerciales/mi-dia', icon: BarChart2, label: 'Actividad', color: 'text-orange-500', bg: 'bg-orange-500/15' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-background/90 backdrop-blur-xl border-t border-border/50 flex justify-around z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))', paddingTop: '0.5rem', minHeight: '4.5rem' }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center px-2 py-1 min-w-[3.5rem] min-h-[3rem] rounded-2xl transition-all duration-200 touch-manipulation select-none ${
              isActive
                ? `${tab.color} ${tab.bg} font-bold scale-105 shadow-sm`
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Icon size={isActive ? 22 : 23} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[9px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
          </Link>
        )
      })}

      <button
        onClick={handleLogout}
        className="flex flex-col items-center justify-center px-2 py-1 min-w-[3.5rem] min-h-[3rem] rounded-2xl transition-all duration-200 text-muted-foreground hover:text-destructive hover:bg-destructive/10 touch-manipulation select-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Power size={23} strokeWidth={1.8} />
        <span className="text-[9px] mt-0.5 font-medium">Salir</span>
      </button>
    </nav>
  )
}
