import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Building2, LayoutDashboard, Users, ShieldAlert, LogOut, Map as MapIcon, Activity } from "lucide-react"

import { AdminBottomNav } from "@/components/admin/AdminBottomNav"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar si es admin
  const { data: perfil } = await supabase
    .from('usuarios_perfil')
    .select('rol, nombre_completo')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'admin') {
    // Si no es admin, lo devolvemos a la zona de comerciales
    redirect('/comerciales/dashboard')
  }

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar - Oculto en móvil, visible en md+ */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <img src="/logo.png" alt="CTB Logo" className="h-16 object-contain" />
          <div className="mt-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
              ADMINISTRADOR
            </span>
            <p className="text-sm font-bold text-foreground mt-2 line-clamp-1">
              {perfil?.nombre_completo || 'Admin Master'}
            </p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Ojo de Sauron
          </Link>
          <Link href="/admin/mapa" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <MapIcon className="w-5 h-5 mr-3" />
            Radar GPS
          </Link>
          <Link href="/admin/comerciales" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Users className="w-5 h-5 mr-3" />
            Comerciales
          </Link>
          <Link href="/admin/visitas" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Activity className="w-5 h-5 mr-3" />
            Registro de Visitas
          </Link>
          <Link href="/admin/agencias" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Building2 className="w-5 h-5 mr-3" />
            Agencias Globales
          </Link>
          <Link href="/admin/alertas" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted text-destructive hover:text-destructive transition-colors">
            <ShieldAlert className="w-5 h-5 mr-3" />
            Alertas de Fraude
          </Link>
        </nav>
        
        <div className="p-4 border-t border-border">
          <button className="flex items-center w-full px-4 py-3 text-sm font-bold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      
      {/* Navegación Inferior Móvil */}
      <AdminBottomNav />
    </div>
  )
}
