import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldAlert, BarChart2 } from "lucide-react"
import { JustificacionFormClient } from "./JustificacionFormClient"
import { MiDiaInteligenteClient } from "@/components/comerciales/MiDiaInteligenteClient"

export default async function MiDiaMetricsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const hoyStr = new Date().toISOString().split('T')[0]
  
  // Buscar justificación de hoy
  const { data: justificacion } = await supabase
    .from('justificaciones_comerciales')
    .select('*')
    .eq('comercial_id', user.id)
    .eq('fecha', hoyStr)
    .single()

  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)

  const { data: visitasRaw } = await supabase
    .from('visitas')
    .select(`
      id,
      es_actividad,
      titulo_actividad,
      hora_checkin,
      hora_checkout,
      estado,
      gps_lat,
      gps_lng,
      temas,
      temas_texto_libre,
      observaciones,
      agencia:agencias(nombre)
    `)
    .eq('comercial_id', user.id)
    .in('estado', ['en_curso', 'completada'])
    .gte('hora_checkin', hoyInicio.toISOString())
    .order('hora_checkin', { ascending: false })

  const visitas = (visitasRaw || []).map(v => ({
    id: v.id,
    es_actividad: v.es_actividad,
    titulo_actividad: v.titulo_actividad,
    hora_checkin: v.hora_checkin,
    hora_checkout: v.hora_checkout,
    estado: v.estado,
    gps_lat: v.gps_lat,
    gps_lng: v.gps_lng,
    temas: v.temas,
    temas_texto_libre: v.temas_texto_libre,
    observaciones: v.observaciones,
    agenciaNombre: (v.agencia as any)?.nombre
  }))

  return (
    <div className="p-4 space-y-6 bg-muted/20 min-h-screen pb-32">
      <header className="pt-2 pb-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-primary" /> Mi Actividad</h1>
          <p className="text-sm text-muted-foreground">Panel de Control de Inteligencia</p>
        </div>
        <img src="/logo.png" alt="CTB" className="h-16 w-auto object-contain drop-shadow-sm ml-4" />
      </header>

      {/* Motor de Inteligencia (Cliente) */}
      <MiDiaInteligenteClient visitas={visitas} />

      <section className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
        <h2 className="text-lg font-bold flex items-center">
          <ShieldAlert className="w-5 h-5 mr-2 text-warning" />
          Justificar Inasistencia o Falla
        </h2>
        
        {justificacion ? (
          <div className="bg-muted p-4 rounded-xl border border-border">
            <p className="font-semibold mb-1">Día justificado ({justificacion.tipo})</p>
            <p className="text-sm text-muted-foreground mb-3">{justificacion.descripcion}</p>
            <div className={`text-xs font-bold uppercase px-2 py-1 inline-block rounded-md ${
              justificacion.estado === 'aprobada' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
            }`}>
              Estado: {justificacion.estado}
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Si hoy no pudiste cumplir tus visitas por alguna razón de fuerza mayor, puedes reportarlo aquí.
            </p>
            <JustificacionFormClient hoy={hoyStr} />
          </>
        )}
      </section>
    </div>
  )
}
