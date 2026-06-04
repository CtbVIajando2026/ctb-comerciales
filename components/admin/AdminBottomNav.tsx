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
    <div className="fixed bottom-0 w-full bg-background border-t border-border flex justify-around items-center h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] z-50 px-2 md:hidden">
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
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isExactOrChild ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isExactOrChild ? 'bg-primary text-primary-foreground' : ''}`}>
              <Icon size={22} strokeWidth={isExactOrChild ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium ${isExactOrChild ? 'text-primary font-bold' : ''}`}>{tab.label}</span>
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
