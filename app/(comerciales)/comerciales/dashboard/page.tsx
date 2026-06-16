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
  const ecDate = new Date(dateStr)
  const day = ecDate.getDay()
  const esFinDeSemana = day === 0 || day === 6
  const esDiaLaboral = day >= 1 && day <= 5

  // --- CÁLCULO DE GAPS DE INACTIVIDAD ---
  type TimelineItem = 
    | { type: 'visita'; data: any }
    | { type: 'gap'; start: string; end: string; durationMin: number }

  const formatterEC = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'America/Guayaquil', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
  const ecDateStr = formatterEC.format(ecDate) // YYYY-MM-DD
  const inicioJornada = new Date(`${ecDateStr}T09:00:00-05:00`)
  const finJornada = new Date(`${ecDateStr}T18:00:00-05:00`)
  const esHoraLaboral = ecDate.getTime() >= inicioJornada.getTime() && ecDate.getTime() <= finJornada.getTime()

  const itemsCronologicos = [...itemsCompletados].sort(
    (a, b) => new Date(a.hora_checkin).getTime() - new Date(b.hora_checkin).getTime()
  )

  const timelineItems: TimelineItem[] = []
  let ultimoCheckoutTime = inicioJornada.getTime()

  if (esDiaLaboral && !justificado) {
    // 1. Verificar gap inicial (09:00 AM al primer check-in)
    if (itemsCronologicos.length > 0) {
      const primerCheckin = new Date(itemsCronologicos[0].hora_checkin).getTime()
      const diffInicioMin = (primerCheckin - inicioJornada.getTime()) / 60000
      if (diffInicioMin >= 30) {
        timelineItems.push({
          type: 'gap',
          start: inicioJornada.toISOString(),
          end: itemsCronologicos[0].hora_checkin,
          durationMin: Math.floor(diffInicioMin)
        })
      }
    }
  }

  // 2. Interpolar gaps entre visitas completadas
  itemsCronologicos.forEach((item, index) => {
    timelineItems.push({ type: 'visita', data: item })
    
    if (esDiaLaboral && index < itemsCronologicos.length - 1) {
      const checkoutActual = new Date(item.hora_checkout).getTime()
      const checkinSiguiente = new Date(itemsCronologicos[index + 1].hora_checkin).getTime()
      const diffMin = (checkinSiguiente - checkoutActual) / 60000
      if (diffMin >= 30) {
        timelineItems.push({
          type: 'gap',
          start: item.hora_checkout,
          end: itemsCronologicos[index + 1].hora_checkin,
          durationMin: Math.floor(diffMin)
        })
      }
    }
    
    if (item.hora_checkout) {
      ultimoCheckoutTime = Math.max(ultimoCheckoutTime, new Date(item.hora_checkout).getTime())
    }
  })

  // 3. Verificar gap de inactividad actual (si estamos en jornada laboral)
  let inactividadActualMin = 0
  if (esDiaLaboral && esHoraLaboral && !justificado && !visitaActiva) {
    const diffActualMin = (ecDate.getTime() - ultimoCheckoutTime) / 60000
    if (diffActualMin >= 30) {
      inactividadActualMin = Math.floor(diffActualMin)
      timelineItems.push({
        type: 'gap',
        start: new Date(ultimoCheckoutTime).toISOString(),
        end: ecDate.toISOString(),
        durationMin: inactividadActualMin
      })
    }
  }

  const timelineOrdenado = [...timelineItems].reverse()

  return (
    <div className="p-4 bg-muted/20 min-h-screen">
      <CumpleanosPopup notificacionesHoy={notifs.filter(n => n.es_hoy)} />
      <div className="max-w-lg mx-auto space-y-6">

        <LiveLocationHeader perfil={perfil} notificacionesCount={notificacionesHoy} />

        {/* Alerta de Inactividad Actual */}
        {inactividadActualMin >= 30 && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-in slide-in-from-top-4 duration-300">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Alerta de Inactividad</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                Llevas más de <span className="font-bold">{inactividadActualMin >= 60 ? `${Math.floor(inactividadActualMin / 60)}h ${inactividadActualMin % 60}m` : `${inactividadActualMin} min`}</span> sin registrar visitas o actividades. Recuerda reportar tu labor en curso.
              </p>
            </div>
          </div>
        )}

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
          {timelineOrdenado.length > 0 ? (
            <div className="space-y-3">
              {timelineOrdenado.map((item: any) => {
                if (item.type === 'gap') {
                  const formatHora = (isoStr: string) => {
                    return new Date(isoStr).toLocaleTimeString('es-EC', {
                      timeZone: 'America/Guayaquil',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }
                  
                  return (
                    <div key={`gap-${item.start}`} className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <p className="text-xs font-black text-destructive uppercase tracking-wider">Período de Inactividad</p>
                          <span className="text-[10px] font-bold text-destructive/80 bg-destructive/10 px-2 py-0.5 rounded-full">
                            {item.durationMin >= 60 
                              ? `${Math.floor(item.durationMin / 60)}h ${item.durationMin % 60}m` 
                              : `${item.durationMin} min`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          No se registraron visitas ni actividades entre las {formatHora(item.start)} y las {formatHora(item.end)}.
                        </p>
                      </div>
                    </div>
                  )
                }

                // Tipo visita
                const v = item.data
                return (
                  <VisitaCard 
                    key={v.id} 
                    visita={{
                      id: v.id,
                      agenciaNombre: v.es_actividad ? v.titulo_actividad : v.agencia?.nombre,
                      hora_checkin: v.hora_checkin,
                      hora_checkout: v.hora_checkout,
                      duracion: v.hora_checkout ? `${Math.floor((new Date(v.hora_checkout).getTime() - new Date(v.hora_checkin).getTime()) / 60000)} min` : null,
                      estado: v.estado,
                      badgeGPS: v.alerta_ubicacion ? { label: v.alerta_ubicacion, tipo: 'lejano' } : undefined,
                      esActividad: v.es_actividad,
                      observaciones: v.es_actividad 
                        ? v.observaciones 
                        : (v.temas && v.temas.length > 0 ? `${v.temas.join(', ')}${v.temas_texto_libre ? `: ${v.temas_texto_libre}` : ''}` : v.observaciones)
                    }} 
                  />
                )
              })}
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
