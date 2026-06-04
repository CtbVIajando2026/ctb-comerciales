import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminBottomNav } from "@/components/admin/AdminBottomNav"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

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
    <>
    <div className="flex h-[100dvh] bg-muted/30">
      {/* Sidebar - Oculto en móvil, visible en md+ */}
      <AdminSidebar userName={perfil?.nombre_completo || 'Admin Master'} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
    {/* Navegación Inferior Móvil */}
    <AdminBottomNav />
    </>
  )
}
