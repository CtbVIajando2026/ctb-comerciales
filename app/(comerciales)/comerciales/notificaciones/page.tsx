import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Bell } from "lucide-react"
import { obtenerNotificaciones } from "@/app/(comerciales)/actions_notificaciones"
import { NotificacionesClient } from "@/components/comerciales/NotificacionesClient"

export const dynamic = 'force-dynamic'

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const notificaciones = await obtenerNotificaciones(user.id)

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-[-1rem] md:top-[-2rem] z-10 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center justify-between pt-6 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center">
            <Bell className="w-5 h-5 mr-2 text-primary" />
            Notificaciones
          </h1>
          <p className="text-sm text-muted-foreground">Tus recordatorios para los próximos 7 días.</p>
        </div>
        <img src="/logo.png" alt="CTB" className="h-16 w-auto object-contain drop-shadow-sm ml-4" />
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto pb-32">
        <NotificacionesClient notificacionesIniciales={notificaciones} />
      </main>
    </div>
  )
}
