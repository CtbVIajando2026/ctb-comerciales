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
      hora_checkin, hora_checkout, estado, timer_programado_min,
      gps_lat, gps_lng, gps_lat_checkout, gps_lng_checkout,
      distancia_checkin_metros, distancia_checkout_metros, alerta_fraude_checkin, alerta_fraude_checkout,
      registro_regalos(tipo, descripcion, cantidad, costo),
      usuarios:comercial_id ( nombre, zona ),
      agencias:agencia_id ( nombre, direccion, zona, ciudad )
    `)
    .order('created_at', { ascending: false })
    .limit(1000)

  const { data: todosComerciales } = await supabase
    .from('usuarios')
    .select('id, nombre, zona')
    .eq('rol', 'comercial')
    .order('nombre')
    
  const { data: perfiles } = await supabase
    .from('usuarios_perfil')
    .select('id, telefono')

  // Mapear teléfono a las visitas
  const visitasConTelefono = visitas?.map((v: any) => ({
    ...v,
    usuarios: {
      ...v.usuarios,
      telefono: perfiles?.find((p: any) => p.id === v.comercial_id)?.telefono || null
    }
  }))

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

      <VisitasFeedClient visitasIniciales={visitasConTelefono || []} todosComerciales={todosComerciales || []} />
    </div>
  )
}
