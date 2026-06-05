"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { VisitaTimer } from "@/components/comerciales/VisitaTimer"
import { CheckOutForm } from "@/components/comerciales/CheckOutForm"
import { cerrarVisita } from "@/app/(comerciales)/actions"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { addToOfflineQueue } from "@/lib/offlineStore"

export function VisitaDetalleClient({ visita, catalogoRegalos }: { visita: any, catalogoRegalos?: any[] }) {
  const router = useRouter()
  const [cerrando, setCerrando] = useState(false)

  const handleCerrarVisita = async (data: any) => {
    setCerrando(true)

    let lat: number | null = null
    let lng: number | null = null

    try {
      const geo = await import('@/lib/geolocation')
      const coords = await geo.obtenerCoordenadasActuales()
      lat = coords.lat
      lng = coords.lng
    } catch (e: any) {
      toast.error("GPS Obligatorio", { description: e.message || "Debes encender tu GPS para finalizar la visita." })
      setCerrando(false)
      return // ABORTAR CHECK-OUT SI NO HAY GPS
    }
    
    try {
      const payload = {
        gps_lat_checkout: lat,
        gps_lng_checkout: lng,
        temas: data.temas,
        temas_texto_libre: data.otroTema,
        observaciones: data.observaciones,
        proximo_paso: data.proximoPaso,
        proximo_paso_fecha: data.proximoPasoFecha,
        hora_checkout_local: new Date().toISOString(), // La hora exacta local
        entregas: data.entregas || []
      }

      if (!navigator.onLine) {
        // Guardado Offline usando el nuevo store
        addToOfflineQueue('CHECKOUT', {
          visitaId: visita.id,
          data: payload,
          agenciaNombre: visita.es_actividad ? visita.titulo_actividad : visita.agencia?.nombre
        })
        
        toast.success("Guardado Offline", { 
          description: "Sin conexión. Se guardó en el celular y se sincronizará automáticamente.",
          duration: 6000
        })
        router.push('/comerciales/dashboard')
        return
      }

      // Guardado Online (Normal)
      const res = await cerrarVisita(visita.id, payload)
      
      if (res?.alerta_fraude_checkout) {
        toast.error("Alerta de Ubicación", { 
          description: "La visita fue cerrada, pero el sistema detectó que estabas lejos de la Agencia. Esto generará una novedad.", 
          duration: 8000 
        })
      } else {
        toast.success(visita.es_actividad ? "Actividad completada" : "Visita completada", { description: "Tus datos han sido guardados correctamente." })
      }
      
      if (res?.meta_alcanzada) {
        toast.success("¡Meta Diaria Alcanzada!", { 
          description: "Has completado tu objetivo de visitas de hoy. ¡Excelente trabajo!",
          duration: 6000
        })
        
        const duration = 3 * 1000
        const end = Date.now() + duration
        
        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#22c55e', '#3b82f6', '#eab308']
          })
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#22c55e', '#3b82f6', '#eab308']
          })
          if (Date.now() < end) {
            requestAnimationFrame(frame)
          } else {
            router.push('/comerciales/dashboard')
          }
        }
        frame()
      } else {
        router.push('/comerciales/dashboard')
      }
      
    } catch (e) {
      console.error(e)
      toast.error("Error", { description: "Hubo un error al cerrar." })
      setCerrando(false)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center">
        <Link href="/comerciales/dashboard" className="inline-flex items-center justify-center size-10 rounded-xl hover:bg-muted mr-2 -ml-2 transition-colors shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{visita.es_actividad ? 'Actividad Interna' : `Visita a ${visita.agencia?.nombre}`}</h1>
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto pb-32">
        <div className="bg-muted p-5 rounded-2xl border border-border text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <div className="bg-success text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full animate-pulse">
              EN CURSO
            </div>
          </div>
          
          {visita.es_actividad ? (
            <h2 className="text-2xl font-bold mb-1">{visita.titulo_actividad}</h2>
          ) : (
            <h2 className="text-2xl font-bold mb-1">{visita.agencia?.nombre}</h2>
          )}
          
          <div className="flex items-center justify-center text-sm text-muted-foreground mb-6">
            <MapPin className="w-4 h-4 mr-1" />
            Coordenadas iniciales guardadas
          </div>
          
          <VisitaTimer horaInicio={visita.hora_checkin} />
        </div>

        {cerrando ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg font-medium">Guardando ubicación y cerrando visita...</p>
          </div>
        ) : (
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <CheckOutForm onSubmit={handleCerrarVisita} esActividad={visita.es_actividad} catalogoRegalos={catalogoRegalos} />
          </div>
        )}
      </main>
    </div>
  )
}
