"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AgenciaBuscador } from "@/components/comerciales/AgenciaBuscador"
import { ContactoPicker } from "@/components/comerciales/ContactoPicker"
import { CheckInButton } from "@/components/comerciales/CheckInButton"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { iniciarVisita } from "@/app/(comerciales)/actions"
import { AgenciaRegistroModal } from "@/components/comerciales/AgenciaRegistroModal"
import { addToOfflineQueue } from "@/lib/offlineStore"
import { toast } from "sonner"
import { CheckOutForm } from "@/components/comerciales/CheckOutForm"

export default function NuevaVisitaPage() {
  const router = useRouter()
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState<any | null>(null)
  const [contactoSeleccionado, setContactoSeleccionado] = useState<any | null>(null)
  const [timerProgramado, setTimerProgramado] = useState<string>("none")
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false)
  const [offlineTempId, setOfflineTempId] = useState<string | null>(null)

  const handleCrearNuevaAgencia = () => {
    setModalRegistroAbierto(true)
  }

  const handleAgenciaRegistrada = (agencia: any, contacto: any) => {
    setAgenciaSeleccionada(agencia)
    if (contacto) {
      setContactoSeleccionado(contacto)
    }
  }

  const handleCheckIn = async () => {
    if (!agenciaSeleccionada) return

    let lat: number | null = null
    let lng: number | null = null

    try {
      // Usar helper de GPS estricto (importado dinámicamente o asumiendo que agregaremos el import arriba)
      const geo = await import('@/lib/geolocation')
      const coords = await geo.obtenerCoordenadasActuales()
      lat = coords.lat
      lng = coords.lng
    } catch (e: any) {
      toast.warning("GPS no disponible", { description: "Guardando visita sin ubicación precisa." })
      // NO ABORTAMOS, CONTINUAMOS SIN GPS
    }

    try {
      const res = await iniciarVisita({
        agencia_id: agenciaSeleccionada.id,
        contacto_id: contactoSeleccionado?.id,
        gps_lat: lat,
        gps_lng: lng,
        timer_programado_min: timerProgramado === "none" ? null : parseInt(timerProgramado, 10)
      })

      if (!res.success) {
        toast.error("Error", { description: res.error || "Hubo un error al iniciar la visita." })
        return
      }

      const nuevaVisita = res.data
      toast.success("Check-In exitoso", { description: `Iniciaste visita en ${agenciaSeleccionada.nombre}` })
      // Redirigir directamente a la interfaz del timer y checkout
      router.push(`/comerciales/visitas/${nuevaVisita.id}`)
    } catch (e: any) {
      console.error(e)
      // Si falla por falta de internet, guardamos en local y NO redirigimos
      if (e.message?.includes('fetch') || !navigator.onLine) {
        toast.warning("Sin conexión. Guardando localmente.", { description: "Ahora puedes llenar tus notas de salida (Check-out)." })
        
        const tempId = `temp_${Date.now()}`
        addToOfflineQueue('CHECKIN', {
          agencia_id: agenciaSeleccionada.id,
          contacto_id: contactoSeleccionado?.id,
          gps_lat: lat,
          gps_lng: lng,
          timer_programado_min: timerProgramado === "none" ? null : parseInt(timerProgramado, 10)
        }, tempId)
        
        setOfflineTempId(tempId)
      } else {
        toast.error("Error", { description: e.message || "Hubo un error al iniciar la visita." })
      }
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-[-1rem] md:top-[-2rem] z-10 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center justify-between pt-6 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6">
        <div className="flex items-center">
          <Link href="/comerciales/dashboard" className="inline-flex items-center justify-center size-10 rounded-xl hover:bg-muted mr-2 -ml-2 transition-colors shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Nueva Visita</h1>
        </div>
        <img src="/logo.png" alt="CTB" className="h-16 w-auto object-contain drop-shadow-sm ml-4" />
      </header>

      <main className="p-4 space-y-8 max-w-lg mx-auto pb-32">
        {!offlineTempId && !agenciaSeleccionada && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-6">¿A qué agencia visitás?</h2>
            <AgenciaBuscador 
              onSelect={setAgenciaSeleccionada} 
              onCrearNueva={handleCrearNuevaAgencia} 
            />
          </section>
        )}
        
        {!offlineTempId && agenciaSeleccionada && (
          <section className="animate-in slide-in-from-right-4 duration-300 space-y-8">
            <div className="bg-muted p-5 rounded-2xl border border-border">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold">{agenciaSeleccionada.nombre}</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary h-8 -mt-1 -mr-2"
                  onClick={() => {
                    setAgenciaSeleccionada(null)
                    setContactoSeleccionado(null)
                  }}
                >
                  Cambiar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{agenciaSeleccionada.direccion}</p>
            </div>

            <ContactoPicker 
              agenciaId={agenciaSeleccionada.id}
              selectedContactoId={contactoSeleccionado?.id ?? null}
              onSelect={setContactoSeleccionado}
            />

            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
              <label className="text-sm font-bold flex items-center mb-3">
                <Clock className="w-4 h-4 mr-2 text-primary" />
                Tiempo programado para la visita
              </label>
              <Select value={timerProgramado} onValueChange={(v) => setTimerProgramado(v || "")}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Seleccionar tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Libre (Sin Límite)</SelectItem>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-2">
                Si eliges un tiempo, te enviaremos un recordatorio para evitar demoras innecesarias.
              </p>
            </div>

            <div className="pt-4 mt-4">
              <CheckInButton 
                onCheckIn={handleCheckIn}
              />
              <p className="text-center text-[10px] text-muted-foreground mt-3 px-4 uppercase font-bold tracking-wider">
                Tu ubicación GPS será guardada
              </p>
            </div>
          </section>
        )}

        {offlineTempId && (
          <section className="animate-in slide-in-from-bottom-4 duration-500 mt-8">
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl mb-6">
              <h3 className="font-bold text-amber-600 dark:text-amber-400 mb-1">Check-in Local Registrado</h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-500/80">
                Tu hora de entrada ha sido guardada en el celular. Por favor, llena tus notas de salida aquí mismo cuando termines.
              </p>
            </div>
            
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
              <h3 className="text-lg font-bold mb-4">Notas de Salida (Offline)</h3>
              <CheckOutForm onSubmit={(data) => {
                addToOfflineQueue('CHECKOUT', {
                  visitaId: offlineTempId,
                  data: {
                    ...data,
                    hora_checkout_local: new Date().toISOString()
                  }
                })
                toast.success("Visita completada localmente", { description: "Se sincronizará cuando recuperes el internet." })
                router.push('/comerciales/dashboard')
              }} esActividad={false} catalogoRegalos={[]} />
            </div>
          </section>
        )}
      </main>

      <AgenciaRegistroModal 
        isOpen={modalRegistroAbierto}
        onClose={() => setModalRegistroAbierto(false)}
        onSuccess={handleAgenciaRegistrada}
      />
    </div>
  )
}
