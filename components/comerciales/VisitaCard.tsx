import { MapPin, Clock, Map, Briefcase } from "lucide-react"
import Link from "next/link"

interface VisitaCardProps {
  visita: {
    id: string
    agenciaNombre: string
    hora_checkin: string
    hora_checkout: string | null
    duracion: string | null
    estado: string
    badgeGPS?: { label: string; tipo: 'verificado' | 'lejano' | 'ambos' | 'sin-gps' | 'aprendido' | 'editado' }
    esActividad?: boolean
    observaciones?: string | null
  }
}

export function VisitaCard({ visita }: VisitaCardProps) {
  const enCurso = visita.estado === 'abierta'

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  }

  const checkinTime = formatTime(visita.hora_checkin)
  const checkoutTime = formatTime(visita.hora_checkout)

  return (
    <Link href={`/comerciales/visitas/${visita.id}`} className="block">
      <div className={`p-4 rounded-xl border transition-colors hover:bg-muted/50 ${enCurso ? 'border-primary bg-primary/5' : 'border-border bg-card'} mb-3 shadow-sm`}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{visita.agenciaNombre}</h3>
          {enCurso ? (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full animate-pulse">
              En curso
            </span>
          ) : (
            <div className="flex items-center text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full">
              <Clock className="w-3 h-3 mr-1" />
              {visita.duracion}
            </div>
          )}
        </div>

        <div className="flex items-center text-sm text-muted-foreground mb-3">
          {visita.esActividad ? (
            <Briefcase className="w-4 h-4 mr-1 text-primary" />
          ) : (
            <MapPin className="w-4 h-4 mr-1 text-primary" />
          )}
          {enCurso ? `Inicio: ${checkinTime}` : `${checkinTime} — ${checkoutTime}`}
        </div>

        {visita.observaciones && !enCurso && (
          <div className="mb-2 text-xs text-muted-foreground italic line-clamp-1 border-l-2 border-border pl-2">
            "{visita.observaciones}"
          </div>
        )}

        {visita.badgeGPS && !visita.esActividad && (
          <div className="mt-2 text-xs flex items-center">
            <Map className="w-3 h-3 mr-1" />
            <span className="font-medium text-warning">
              {visita.badgeGPS.label}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
