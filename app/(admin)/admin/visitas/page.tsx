import { createClient } from "@/lib/supabase/server"
import { VisitasFeedClient } from "@/components/admin/VisitasFeedClient"
import { Activity } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminVisitasPage() {
  const supabase = await createClient()

  const { data: visitas } = await supabase
    .from('visitas')
    .select(`
      id, created_at, comercial_id, agencia_id,
      es_actividad, titulo_actividad, temas, observaciones,
      hora_checkin, hora_checkout, estado,
      gps_lat, gps_lng,
      distancia_checkin_metros, alerta_fraude_checkin, alerta_fraude_checkout,
      usuarios:comercial_id ( nombre ),
      agencias:agencia_id ( nombre, direccion, zona, ciudad )
    `)
    .order('created_at', { ascending: false })
    .limit(1000)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center">
            <Activity className="w-8 h-8 mr-3 text-primary" />
            Registro de Visitas
          </h1>
          <p className="text-muted-foreground mt-1">
            Feed en vivo de toda la actividad operativa del equipo.
          </p>
        </div>
      </div>

      <VisitasFeedClient visitasIniciales={visitas || []} />
    </div>
  )
}
