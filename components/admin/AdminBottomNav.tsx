"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, Power, Map as MapIcon, Activity, Trophy } from "lucide-react"
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

const tabs = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', color: 'text-violet-500', bg: 'bg-violet-500/15', exact: true },
  { href: '/admin/mapa', icon: MapIcon, label: 'Mapa', color: 'text-emerald-500', bg: 'bg-emerald-500/15', exact: false },
  { href: '/admin/visitas', icon: Activity, label: 'Visitas', color: 'text-blue-500', bg: 'bg-blue-500/15', exact: false },
  { href: '/admin/ranking', icon: Trophy, label: 'Ranking', color: 'text-amber-500', bg: 'bg-amber-500/15', exact: false },
  { href: '/admin/comerciales', icon: Users, label: 'Equipo', color: 'text-orange-500', bg: 'bg-orange-500/15', exact: false },
]

export function AdminBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-background/80 backdrop-blur-xl border-t border-border/50 flex justify-around pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-h-[4.5rem] z-50 px-1 md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
      {tabs.map((tab) => {
        // Para "Inicio" (Dashboard), solo se activa en la ruta exacta /admin
        const isActive = mounted && (tab.exact 
          ? pathname === '/admin'
          : pathname.startsWith(tab.href))
        
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center pt-1.5 pb-1 w-16 h-[3.25rem] rounded-2xl transition-all duration-200 ${
              isActive 
                ? `${tab.color} ${tab.bg} font-bold scale-105 shadow-sm` 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
            }`}
          >
            <Icon size={isActive ? 22 : 23} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-[9px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
          </Link>
        )
      })}
      
      <button
        onClick={handleLogout}
        className="flex flex-col items-center justify-center pt-1.5 pb-1 w-16 h-[3.25rem] rounded-2xl transition-all duration-200 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Power size={23} strokeWidth={1.8} />
        <span className="text-[9px] mt-0.5 font-medium">Salir</span>
      </button>
    </div>
  )
}
