"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, ShieldAlert, Power, Map as MapIcon, Activity, Trophy } from "lucide-react"
import { createClient } from '@/lib/supabase/client'

const tabs = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/mapa', icon: MapIcon, label: 'Mapa' },
  { href: '/admin/visitas', icon: Activity, label: 'Visitas' },
  { href: '/admin/ranking', icon: Trophy, label: 'Ranking' },
  { href: '/admin/comerciales', icon: Users, label: 'Equipo' },
]

export function AdminBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Solo mostrar en móvil (hasta sm)
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-background border-t border-border flex justify-around pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-h-[4.5rem] z-50 px-2 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/') && tab.href !== '/admin'
        // Fix para que /admin no se marque como activo si estamos en /admin/comerciales
        const isExactOrChild = tab.href === '/admin' 
          ? pathname === '/admin' 
          : pathname.startsWith(tab.href)
        
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center pt-1.5 pb-1 w-16 h-[3.25rem] rounded-2xl transition-all ${
              isExactOrChild 
                ? 'text-primary bg-primary/15 scale-105 shadow-sm' 
                : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
            }`}
          >
            <Icon size={isExactOrChild ? 22 : 24} strokeWidth={isExactOrChild ? 2.5 : 2} />
            <span className={`text-[9px] mt-0.5 ${isExactOrChild ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
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
