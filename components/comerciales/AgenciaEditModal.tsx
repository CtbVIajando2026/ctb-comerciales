"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { MapPin, User, Building, Calendar, Users, Plus, Phone, Mail } from "lucide-react"
import { actualizarAgencia } from "@/app/(comerciales)/actions_agencias"

interface AgenciaEditModalProps {
  agencia: any
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedAgencia: any) => void
}

interface Contacto {
  id?: string
  nombre: string
  cargo: string
  fecha_cumpleanos: string | null
  telefono: string | null
  email: string | null
}

export function AgenciaEditModal({ agencia, isOpen, onClose, onSuccess }: AgenciaEditModalProps) {
  const [nombre, setNombre] = useState("")
  const [direccion, setDireccion] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [aniversario, setAniversario] = useState("")
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [guardando, setGuardando] = useState(false)

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen && agencia) {
      setNombre(agencia.nombre || "")
      setDireccion(agencia.direccion || "")
      setCiudad(agencia.ciudad || "Quito")
      setAniversario(agencia.fecha_aniversario ? agencia.fecha_aniversario.split('T')[0] : "")
      
      const inicialContactos = (agencia.contactos || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre || "",
        cargo: c.cargo || "",
        fecha_cumpleanos: c.fecha_cumpleanos ? c.fecha_cumpleanos.split('T')[0] : "",
        telefono: c.telefono || "",
        email: c.email || ""
      }))
      
      setContactos(inicialContactos)
    }
  }, [isOpen, agencia])

  const handleAddContacto = () => {
    setContactos([...contactos, { id: 'temp-'+Date.now(), nombre: "", cargo: "", fecha_cumpleanos: "", telefono: "", email: "" }])
  }

  const handleContactoChange = (index: number, field: keyof Contacto, value: string) => {
    const nuevos = [...contactos]
    nuevos[index] = { ...nuevos[index], [field]: value }
    setContactos(nuevos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return

    setGuardando(true)

    try {
      // Map to API format
      const payloadContactos = contactos.filter(c => c.nombre.trim() !== "").map(c => ({
        id: c.id?.startsWith('temp-') ? undefined : c.id, // temp IDs are for new inserts
        nombre: c.nombre,
        cargo: c.cargo || 'Staff',
        fecha_cumpleanos: c.fecha_cumpleanos || null,
        telefono: c.telefono || null,
        email: c.email || null
      }))

      await actualizarAgencia(agencia.id, {
        nombre,
        direccion,
        ciudad,
        fecha_aniversario: aniversario || null,
        contactos: payloadContactos
      })
      
      toast.success("Agencia Actualizada", { description: `Los datos han sido guardados.` })
      
      // Return a mocked updated object just for the client side to react fast
      // (a real reload happens via router.refresh in the parent)
      onSuccess({
        nombre,
        direccion,
        ciudad,
        fecha_aniversario: aniversario || null,
        contactos: payloadContactos // these might miss real IDs if new, but parent refreshes
      })
      onClose()
      
    } catch (error) {
      console.error(error)
      toast.error("Error", { description: "Hubo un problema al actualizar la agencia." })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] w-[95%] rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Editar Agencia</DialogTitle>
          <DialogDescription>
            Modifica los datos de la agencia y de su equipo.
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
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Ciudad"
                className="pl-10 h-12"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Dirección (Opcional)"
                className="pl-10 h-12"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
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
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Equipo de la Agencia
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddContacto} className="h-8">
                <Plus className="w-4 h-4 mr-1" /> Añadir Persona
              </Button>
            </div>
            
            <div className="space-y-6">
              {contactos.map((contacto, index) => (
                <div key={contacto.id || index} className="bg-muted/30 p-3 rounded-lg border border-border space-y-3">
                  <div className="flex items-center text-xs font-bold text-primary mb-1">
                    <User className="w-3 h-3 mr-1" /> {index === 0 && !contacto.id?.startsWith('temp-') ? "Gerente / Encargado" : "Miembro del Equipo"}
                  </div>
                  
                  <Input
                    placeholder="Nombre completo"
                    className="h-10 bg-background"
                    value={contacto.nombre}
                    onChange={(e) => handleContactoChange(index, 'nombre', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Cargo (ej. Gerente)"
                      className="h-10 bg-background"
                      value={contacto.cargo}
                      onChange={(e) => handleContactoChange(index, 'cargo', e.target.value)}
                    />
                    <Input
                      type="date"
                      className="h-10 bg-background"
                      value={contacto.fecha_cumpleanos || ""}
                      onChange={(e) => handleContactoChange(index, 'fecha_cumpleanos', e.target.value)}
                      title="Cumpleaños"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Teléfono"
                        type="tel"
                        className="pl-9 h-10 bg-background"
                        value={contacto.telefono || ""}
                        onChange={(e) => handleContactoChange(index, 'telefono', e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Email"
                        type="email"
                        className="pl-9 h-10 bg-background"
                        value={contacto.email || ""}
                        onChange={(e) => handleContactoChange(index, 'email', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {contactos.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-2">
                  No hay contactos registrados.
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full h-14 text-base mt-4" disabled={guardando || !nombre.trim()}>
            {guardando ? "Guardando datos..." : "Guardar Cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
