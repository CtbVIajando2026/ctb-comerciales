import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MetaBar } from "@/components/comerciales/MetaBar"
import { VisitaCard } from "@/components/comerciales/VisitaCard"
import { ActiveVisitBlock } from "@/components/comerciales/ActiveVisitBlock"
import { Plus, Clock, Briefcase } from "lucide-react"
import { obtenerMeticasDashboard } from "@/app/(comerciales)/actions"
import { NuevaActividadButton } from "@/components/comerciales/NuevaActividadButton"
import { LiveLocationHeader } from "@/components/comerciales/LiveLocationHeader"
import { obtenerNotificaciones, Notificacion } from "@/app/(comerciales)/actions_notificaciones"
import { createClient } from "@/lib/supabase/server"
import { CumpleanosPopup } from "@/components/comerciales/CumpleanosPopup"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await obtenerMeticasDashboard()
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let notificacionesHoy = 0
  let notifs: Notificacion[] = []
  if (user) {
    notifs = await obtenerNotificaciones(user.id)
    notificacionesHoy = notifs.filter(n => n.es_hoy).length
  }
  
  if (!data) {
    return <div>Error cargando datos. Por favor inicia sesión de nuevo.</div>
  }

  const { visitas, meta, justificacionHoy, perfil } = data

  const visitaActiva = visitas.find((v: any) => v.estado === 'abierta')
  const itemsCompletados = visitas.filter((v: any) => v.estado === 'completada')
  
  // Solo las visitas reales cuentan para la meta numérica
  const visitasRealesCompletadas = itemsCompletados.filter((v: any) => !v.es_actividad)
  
  const justificado = justificacionHoy ? true : false

  // Saber si es fin de semana (sábado o domingo) en Ecuador
  const dateStr = new Date().toLocaleString("en-US", {timeZone: "America/Guayaquil"})
  const day = new Date(dateStr).getDay()
  const esFinDeSemana = day === 0 || day === 6

  return (
    <div className="p-4 bg-muted/20 min-h-screen">
      <CumpleanosPopup notificacionesHoy={notifs.filter(n => n.es_hoy)} />
      <div className="max-w-lg mx-auto space-y-6">

        
        <LiveLocationHeader perfil={perfil} notificacionesCount={notificacionesHoy} />

        <section className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <MetaBar 
            realizadas={visitasRealesCompletadas.length} 
            meta={meta} 
            justificado={justificado} 
            actividades={itemsCompletados.length - visitasRealesCompletadas.length}
            esFinDeSemana={esFinDeSemana}
          />
        </section>

        <ActiveVisitBlock visita={visitaActiva} />

        <section className="space-y-3">
          {/* Botones de acción principal */}
          <div className="flex flex-col gap-3">
            {!visitaActiva && (
              <>
                <Link href="/comerciales/visitas/nueva" className="block">
                  <Button className="w-full h-14 text-base rounded-2xl shadow-sm hover:shadow-md transition-all font-semibold tracking-wide">
                    <Plus className="w-5 h-5 mr-2" /> NUEVA VISITA
                  </Button>
                </Link>
                
                <NuevaActividadButton />
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-muted-foreground tracking-wider mb-3">LABORES DE HOY</h2>
          {itemsCompletados.length > 0 ? (
            <div className="space-y-3">
              {itemsCompletados.map((item: any) => (
                <VisitaCard 
                  key={item.id} 
                  visita={{
                    id: item.id,
                    agenciaNombre: item.es_actividad ? item.titulo_actividad : item.agencia?.nombre,
                    hora_checkin: item.hora_checkin,
                    hora_checkout: item.hora_checkout,
                    duracion: item.hora_checkout ? `${Math.floor((new Date(item.hora_checkout).getTime() - new Date(item.hora_checkin).getTime()) / 60000)} min` : null,
                    estado: item.estado,
                    badgeGPS: item.alerta_ubicacion ? { label: item.alerta_ubicacion, tipo: 'lejano' } : undefined,
                    esActividad: item.es_actividad,
                    observaciones: item.es_actividad 
                      ? item.observaciones 
                      : (item.temas && item.temas.length > 0 ? `${item.temas.join(', ')}${item.temas_texto_libre ? `: ${item.temas_texto_libre}` : ''}` : item.observaciones)
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-card rounded-2xl border border-border">
              <p className="text-muted-foreground">Aún no hay labores completadas hoy</p>
            </div>
          )}
        </section>

        <div className="h-6" />
      </div>
    </div>
  )
}
