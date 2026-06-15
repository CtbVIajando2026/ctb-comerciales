"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { MapPin, User, Building, Calendar, Users, Plus, Trash2, Phone, Mail } from "lucide-react"
import { crearAgenciaRapida } from "@/app/(comerciales)/actions_agencias"
import { addToOfflineQueue } from "@/lib/offlineStore"

interface AgenciaRegistroModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (agencia: any, contacto: any) => void
  ciudadInicial?: string
}

interface OtroContacto {
  nombre: string
  cargo: string
  cumpleanos: string
  telefono: string
  email: string
}

export function AgenciaRegistroModal({ isOpen, onClose, onSuccess, ciudadInicial = "Quito" }: AgenciaRegistroModalProps) {
  const [nombre, setNombre] = useState("")
  const [direccion, setDireccion] = useState("")
  const [ciudad, setCiudad] = useState(ciudadInicial !== "Quito" ? ciudadInicial : "")
  const [aniversario, setAniversario] = useState("")
  
  const [gerenteNombre, setGerenteNombre] = useState("")
  const [gerenteCumpleanos, setGerenteCumpleanos] = useState("")
  const [gerenteTelefono, setGerenteTelefono] = useState("")
  const [gerenteEmail, setGerenteEmail] = useState("")
  
  const [otrosContactos, setOtrosContactos] = useState<OtroContacto[]>([])
  const [guardando, setGuardando] = useState(false)

  const handleAddContacto = () => {
    setOtrosContactos([...otrosContactos, { nombre: "", cargo: "", cumpleanos: "", telefono: "", email: "" }])
  }

  const handleRemoveContacto = (index: number) => {
    const nuevos = [...otrosContactos]
    nuevos.splice(index, 1)
    setOtrosContactos(nuevos)
  }

  const handleContactoChange = (index: number, field: keyof OtroContacto, value: string) => {
    const nuevos = [...otrosContactos]
    nuevos[index][field] = value
    setOtrosContactos(nuevos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setGuardando(true)

    let lat: number | null = null
    let lng: number | null = null

    try {
      const geo = await import('@/lib/geolocation')
      const coords = await geo.obtenerCoordenadasActuales()
      lat = coords.lat
      lng = coords.lng
    } catch (e: any) {
      toast.error("GPS Obligatorio", { description: e.message || "Debes encender tu GPS para poder registrar una nueva agencia (medida de seguridad)." })
      setGuardando(false)
      return // ABORTAR SI NO HAY GPS
    }

    const payload = {
      nombre,
      direccion,
      ciudad,
      aniversario_agencia: aniversario || null,
      contactoNombre: gerenteNombre,
      contactoCargo: "Gerente",
      contactoCumpleanos: gerenteCumpleanos || null,
      contactoTelefono: gerenteTelefono || null,
      contactoEmail: gerenteEmail || null,
      otrosContactos: otrosContactos.filter(c => c.nombre.trim() !== ""),
      gps_lat: lat,
      gps_lng: lng
    }

    const saveOffline = () => {
      const tempId = `temp_agencia_${Date.now()}`
      addToOfflineQueue('NUEVA_AGENCIA', payload, tempId)
      toast.warning("Sin conexión. Guardado local.", { description: `La agencia ${nombre} se sincronizará cuando recuperes internet.` })
      
      onSuccess(
        { id: tempId, nombre, direccion, ciudad }, 
        gerenteNombre ? { id: `temp_contacto_${Date.now()}`, nombre: gerenteNombre } : null
      )
      onClose()
      
      setNombre("")
      setDireccion("")
      setCiudad(ciudadInicial)
      setAniversario("")
      setGerenteNombre("")
      setGerenteCumpleanos("")
      setGerenteTelefono("")
      setGerenteEmail("")
      setOtrosContactos([])
    }

    try {
      if (!navigator.onLine) {
        saveOffline()
        setGuardando(false)
        return
      }

      const { agencia, contacto } = await crearAgenciaRapida(payload)
      
      toast.success("Agencia Registrada", { description: `${nombre} ha sido añadida a la base de datos.` })
      onSuccess(agencia, contacto)
      onClose()
      
      // Limpiar formulario
      setNombre("")
      setDireccion("")
      setCiudad(ciudadInicial)
      setAniversario("")
      setGerenteNombre("")
      setGerenteCumpleanos("")
      setGerenteTelefono("")
      setGerenteEmail("")
      setOtrosContactos([])
    } catch (error: any) {
      console.error(error)
      if (error.message?.includes('fetch') || error.message?.includes('network') || !navigator.onLine) {
        saveOffline()
      } else {
        toast.error("Error", { description: error.message || "Hubo un problema al registrar la agencia." })
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] w-[95%] rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Nueva Agencia</DialogTitle>
          <DialogDescription>
            Registra la agencia y a su equipo. Tu ubicación GPS actual se vinculará automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <div className="relative">
              <Building className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Nombre de la Agencia *"
                className="pl-10 h-12"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Ciudad (Ej. Quito) *"
                  className="pl-10 h-12"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Dirección (Opcional)"
                  className="pl-10 h-12"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground ml-1 mb-1 block">Aniversario de la Agencia</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10 h-12"
                  value={aniversario}
                  onChange={(e) => setAniversario(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <h4 className="text-sm font-semibold mb-3 text-primary flex items-center">
              <User className="w-4 h-4 mr-2" />
              Gerente / Encargado
            </h4>
            <div className="space-y-3">
              <Input
                placeholder="Nombre completo"
                className="h-12"
                value={gerenteNombre}
                onChange={(e) => setGerenteNombre(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Teléfono"
                    className="pl-10 h-12"
                    type="tel"
                    value={gerenteTelefono}
                    onChange={(e) => setGerenteTelefono(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Email"
                    className="pl-10 h-12"
                    type="email"
                    value={gerenteEmail}
                    onChange={(e) => setGerenteEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground ml-1 mb-1 block">Cumpleaños</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-10 h-12"
                    value={gerenteCumpleanos}
                    onChange={(e) => setGerenteCumpleanos(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Otros miembros del equipo
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddContacto} className="h-8">
                <Plus className="w-4 h-4 mr-1" /> Añadir
              </Button>
            </div>
            
            <div className="space-y-4">
              {otrosContactos.map((contacto, index) => (
                <div key={index} className="bg-muted/30 p-3 rounded-lg border border-border space-y-3 relative">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveContacto(index)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Input
                    placeholder="Nombre completo"
                    className="h-10 bg-background pr-8"
                    value={contacto.nombre}
                    onChange={(e) => handleContactoChange(index, 'nombre', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Cargo (ej. Asesor)"
                      className="h-10 bg-background"
                      value={contacto.cargo}
                      onChange={(e) => handleContactoChange(index, 'cargo', e.target.value)}
                    />
                    <Input
                      type="date"
                      className="h-10 bg-background"
                      value={contacto.cumpleanos}
                      onChange={(e) => handleContactoChange(index, 'cumpleanos', e.target.value)}
                      title="Cumpleaños"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Teléfono"
                      type="tel"
                      className="h-10 bg-background"
                      value={contacto.telefono}
                      onChange={(e) => handleContactoChange(index, 'telefono', e.target.value)}
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      className="h-10 bg-background"
                      value={contacto.email}
                      onChange={(e) => handleContactoChange(index, 'email', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              
              {otrosContactos.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-2">
                  No has añadido otros miembros aún.
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full h-14 text-base mt-4" disabled={guardando || !nombre.trim()}>
            {guardando ? "Guardando datos..." : "Registrar Agencia"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

