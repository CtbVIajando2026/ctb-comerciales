"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Briefcase, ArrowRight, User } from "lucide-react"
import { iniciarActividad } from "@/app/(comerciales)/actions"
import { toast } from "sonner"

export function NuevaActividadButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [solicitante, setSolicitante] = useState("")
  const [iniciando, setIniciando] = useState(false)
  const [tipoActividad, setTipoActividad] = useState("")

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // El titulo final es el del input si eligió Otra, sino es el del select
    const tituloFinal = tipoActividad === "Otra" ? titulo : tipoActividad

    if (!tituloFinal.trim() || !solicitante.trim()) return

    setIniciando(true)
    
    let lat: number | null = null
    let lng: number | null = null

    try {
      const geo = await import('@/lib/geolocation')
      const coords = await geo.obtenerCoordenadasActuales()
      lat = coords.lat
      lng = coords.lng
    } catch (e) {
      // Para tareas internas, si no hay GPS no bloqueamos, pero lo intentamos
      console.warn("GPS no disponible para actividad interna")
    }

    try {
      const nuevaActividad = await iniciarActividad(tituloFinal, solicitante, lat, lng)
      toast.success("Actividad iniciada", { description: "El cronómetro ha comenzado a correr." })
      setIsOpen(false)
      setTitulo("")
      setTipoActividad("")
      setSolicitante("")
      router.push(`/comerciales/visitas/${nuevaActividad.id}`)
    } catch (error) {
      toast.error("Error", { description: "No se pudo iniciar la actividad." })
    } finally {
      setIniciando(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline" 
        className="w-full h-12 text-sm rounded-2xl shadow-sm text-muted-foreground border-dashed border-2 hover:border-solid transition-all font-medium"
      >
        <Briefcase className="w-4 h-4 mr-2" /> OTRA ACTIVIDAD
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95%] rounded-2xl p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-success" />
              Nueva Actividad
            </DialogTitle>
            <DialogDescription>
              ¿Qué labor interna vas a realizar y quién la solicitó?
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStart} className="space-y-4 mt-2">
            <select
              autoFocus
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={tipoActividad}
              onChange={(e) => {
                setTipoActividad(e.target.value)
                if (e.target.value !== "Otra") {
                  setTitulo("") // clear custom title if predefined is selected
                }
              }}
              required
            >
              <option value="" disabled>Selecciona el tipo de actividad...</option>
              <option value="Cotizaciones">Cotizaciones</option>
              <option value="Reunión de Oficina">Reunión de Oficina</option>
              <option value="Capacitación">Capacitación</option>
              <option value="Trabajo Administrativo">Trabajo Administrativo</option>
              <option value="Personal / Almuerzo">Personal / Almuerzo</option>
              <option value="Otra">Otra (Especificar)</option>
            </select>

            {tipoActividad === "Otra" && (
              <Input
                placeholder="Especificar actividad..."
                className="h-12"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            )}
            
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="¿Quién te lo solicitó? *"
                className="pl-10 h-12"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium mt-2" 
              disabled={!(tipoActividad === "Otra" ? titulo.trim() : tipoActividad) || !solicitante.trim() || iniciando}
            >
              {iniciando ? "Iniciando..." : "Empezar cronómetro"}
              {!iniciando && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
