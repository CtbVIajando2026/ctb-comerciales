import { BottomNav } from "@/components/comerciales/BottomNav"
import { OfflineIndicator } from "@/components/comerciales/OfflineIndicator"
import { OfflineSyncManager } from "@/components/comerciales/OfflineSyncManager"
import { LiveLocationTracker } from "@/components/comerciales/LiveLocationTracker"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { Home, Plus, Building2, BarChart2, LogOut, Trophy, User } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export default async function ComercialesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let perfil = null;

  if (user) {
    const { data: perfilData } = await supabase
      .from('usuarios_perfil')
      .select('rol, nombre_completo')
      .eq('id', user.id)
      .maybeSingle()
      
    perfil = perfilData;

    if (!perfil) {
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('rol, nombre')
        .eq('id', user.id)
        .maybeSingle()
        
      if (usuarioData) {
        perfil = {
          rol: usuarioData.rol,
          nombre_completo: usuarioData.nombre
        }
      }
    }

    if (perfil?.rol === 'admin') {
      redirect('/admin')
    }
  }

  return (
    <>
    <div className="flex h-[100dvh] bg-muted/20">
      <OfflineIndicator />
      <OfflineSyncManager />
      <LiveLocationTracker />
      
      {/* Sidebar - Oculto en móvil, visible en md+ */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <img src="/logo.png" alt="CTB Logo" className="h-16 object-contain" />
          <div className="mt-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
              COMERCIAL
            </span>
            <p className="text-sm font-bold text-foreground mt-2 line-clamp-1">
              {perfil?.nombre_completo || 'Usuario'}
            </p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/comerciales/dashboard" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Home className="w-5 h-5 mr-3" />
            Inicio
          </Link>
          <Link href="/comerciales/visitas/nueva" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-5 h-5 mr-3" />
            Nueva Visita
          </Link>
          <Link href="/comerciales/agencias" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Building2 className="w-5 h-5 mr-3" />
            Directorio Agencias
          </Link>
          <Link href="/comerciales/equipo" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <User className="w-5 h-5 mr-3" />
            Directorio Equipo
          </Link>
          <Link href="/comerciales/mi-dia" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <BarChart2 className="w-5 h-5 mr-3" />
            Mi Rendimiento
          </Link>
          <Link href="/comerciales/ranking" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Trophy className="w-5 h-5 mr-3 text-amber-500" />
            Ranking
          </Link>
        </nav>
        
        <div className="p-4 border-t border-border flex items-center justify-between">
          <form action="/login" method="GET" className="flex-1 mr-2">
            <button type="submit" className="flex items-center w-full px-4 py-3 text-sm font-bold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors">
              <LogOut className="w-5 h-5 mr-3" />
              Salir
            </button>
          </form>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
    <div className="md:hidden">
      <BottomNav />
    </div>
    </>
  )
}
