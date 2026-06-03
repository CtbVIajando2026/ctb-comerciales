import { BottomNav } from "@/components/comerciales/BottomNav"
import { OfflineSyncProvider } from "@/components/comerciales/OfflineSyncProvider"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ComercialesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: perfil } = await supabase
      .from('usuarios_perfil')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol === 'admin') {
      redirect('/admin')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <OfflineSyncProvider />
      
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
