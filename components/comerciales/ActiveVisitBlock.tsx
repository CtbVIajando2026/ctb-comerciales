"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building, MapPin, Clock, ArrowRight, Briefcase } from "lucide-react"

interface ActiveVisitBlockProps {
  visita?: {
    id: string
    agenciaNombre?: string
    titulo_actividad?: string
    es_actividad?: boolean
    hora_checkin: string
    alerta_ubicacion?: string
  }
}

export function ActiveVisitBlock({ visita }: ActiveVisitBlockProps) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState("00:00")

  useEffect(() => {
    if (!visita) return
    
    const start = new Date(visita.hora_checkin).getTime()
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const diff = now - start
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)
      
      if (hours > 0) {
        setElapsed(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      } else {
        setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [visita])

  if (!visita) return null

  return (
    <div 
      onClick={() => router.push(`/comerciales/visitas/${visita.id}`)}
      className="bg-card rounded-2xl shadow-sm border-2 border-success/30 p-4 cursor-pointer hover:border-success/50 transition-colors relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 bg-success/10 text-success px-3 py-1 rounded-bl-xl text-xs font-bold tracking-wider flex items-center">
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse mr-2" />
        EN CURSO
      </div>

      <div className="flex items-start mt-2">
        <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center shrink-0 mr-3">
          {visita.es_actividad ? (
            <Briefcase className="w-5 h-5 text-success" />
          ) : (
            <Building className="w-5 h-5 text-success" />
          )}
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-semibold text-base truncate">
            {visita.es_actividad ? visita.titulo_actividad : visita.agenciaNombre}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Clock className="w-4 h-4 mr-1 text-success" />
            <span className="font-mono font-medium text-foreground">{elapsed}</span>
          </div>
          {visita.alerta_ubicacion && !visita.es_actividad && (
            <div className="flex items-center text-xs text-warning mt-1.5">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{visita.alerta_ubicacion}</span>
            </div>
          )}
        </div>
        <div className="shrink-0 self-center">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-success/10 transition-colors">
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success transition-colors" />
          </div>
        </div>
      </div>
    </div>
  )
}
