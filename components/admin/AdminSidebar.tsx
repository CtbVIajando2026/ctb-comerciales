"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Building2, LayoutDashboard, Users, ShieldAlert, LogOut, Map as MapIcon, Activity, Trophy, Database } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

const links = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/mapa', icon: MapIcon, label: 'Radar GPS' },
  { href: '/admin/comerciales', icon: Users, label: 'Comerciales' },
  { href: '/admin/visitas', icon: Activity, label: 'Registro de Visitas' },
  { href: '/admin/agencias', icon: Building2, label: 'Agencias Globales' },
  { href: '/admin/ranking', icon: Trophy, label: 'Ranking' },
  { href: '/admin/reportes', icon: Database, label: 'Data & Reportes' },
  { href: '/admin/alertas', icon: ShieldAlert, label: 'Alertas de Fraude', isDanger: true },
]

import { useState, useEffect } from 'react'

export function AdminSidebar({ userName }: { userName: string }) {
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
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <img src="/logo.png" alt="CTB Logo" className="h-16 w-auto object-contain drop-shadow-sm ml-4" />
        <div className="mt-3">
          <span className="text-[10px] uppercase font-black tracking-widest text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
            ADMINISTRADOR
          </span>
          <p className="text-sm font-bold text-foreground mt-2 line-clamp-1">
            {userName}
          </p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isExactOrChild = mounted && pathname && (link.href === '/admin' 
            ? pathname === '/admin' 
            : pathname.startsWith(link.href))
            
          const Icon = link.icon

          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                isExactOrChild 
                  ? link.isDanger 
                    ? 'bg-destructive text-destructive-foreground' 
                    : 'bg-primary text-primary-foreground'
                  : link.isDanger
                    ? 'text-muted-foreground hover:bg-muted hover:text-destructive'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isExactOrChild ? (link.isDanger ? 'text-destructive-foreground' : 'text-primary-foreground') : ''}`} />
              {link.label}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-border flex items-center justify-between">
        <button 
          onClick={handleLogout}
          className="flex flex-1 items-center px-4 py-3 text-sm font-bold text-muted-foreground hover:text-destructive rounded-xl hover:bg-muted transition-colors mr-2"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Salir
        </button>
        <ThemeToggle />
      </div>
    </aside>
  )
}
