"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { User, UserPlus, Check, Phone, Mail, Calendar } from "lucide-react"
import { obtenerContactos, crearContacto } from "@/app/(comerciales)/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ContactoPickerProps {
  agenciaId: string
  selectedContactoId: string | null
  onSelect: (contacto: any | null) => void
}

export function ContactoPicker({ agenciaId, selectedContactoId, onSelect }: ContactoPickerProps) {
  const [contactos, setContactos] = useState<any[]>([])
  const [creandoNuevo, setCreandoNuevo] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [nuevoCargo, setNuevoCargo] = useState("")
  const [nuevoTelefono, setNuevoTelefono] = useState("")
  const [nuevoEmail, setNuevoEmail] = useState("")
  const [nuevoCumpleanos, setNuevoCumpleanos] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const cargarContactos = async () => {
      const data = await obtenerContactos(agenciaId)
      setContactos(data)
    }
    cargarContactos()
  }, [agenciaId])

  const handleCrearNuevo = async () => {
    if (!nuevoNombre.trim()) return
    setLoading(true)
    const nuevo = await crearContacto(agenciaId, nuevoNombre, nuevoCargo, nuevoTelefono, nuevoEmail, nuevoCumpleanos)
    if (nuevo) {
      setContactos([...contactos, nuevo])
      onSelect(nuevo)
      setCreandoNuevo(false)
      setNuevoNombre("")
      setNuevoCargo("")
      setNuevoTelefono("")
      setNuevoEmail("")
      setNuevoCumpleanos("")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">¿Con quién te vas a reunir?</h3>
      
      <div className="flex flex-wrap gap-2">
        {contactos.map(contacto => {
          const isSelected = selectedContactoId === contacto.id
          return (
            <button
              key={contacto.id}
              onClick={() => onSelect(isSelected ? null : contacto)}
              className={`flex items-center px-4 py-2 rounded-xl border text-sm font-medium transition-all text-left leading-tight ${
                isSelected 
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm' 
                  : 'border-border bg-card hover:bg-muted text-foreground'
              }`}
            >
              <div className="flex flex-col mr-2">
                <span className="font-semibold flex items-center">
                  {isSelected ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <User className="w-3.5 h-3.5 mr-1.5 opacity-70" />}
                  {contacto.nombre}
                </span>
                {contacto.cargo && (
                  <span className={`text-[10px] uppercase tracking-wider pl-5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {contacto.cargo}
                  </span>
                )}
              </div>
            </button>
          )
        })}
        
        <button
          onClick={() => setCreandoNuevo(true)}
          className="flex items-center px-4 py-2 rounded-xl border border-dashed border-muted-foreground/50 bg-muted/30 text-muted-foreground text-sm font-medium hover:bg-muted/50 hover:text-foreground transition-all"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Persona nueva
        </button>
      </div>

      {creandoNuevo && (
        <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nombre completo *</Label>
                <Input 
                  autoFocus
                  placeholder="Ej. María Pérez" 
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="bg-background h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cargo (Opcional)</Label>
                <Input 
                  placeholder="Ej. Asesora de Ventas" 
                  value={nuevoCargo}
                  onChange={(e) => setNuevoCargo(e.target.value)}
                  className="bg-background h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3"/> Teléfono (Opcional)</Label>
                <Input 
                  placeholder="Ej. 0987654321" 
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  className="bg-background h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3"/> Email (Opcional)</Label>
                <Input 
                  type="email"
                  placeholder="Ej. correo@agencia.com" 
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="bg-background h-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> Cumpleaños (Opcional)</Label>
              <Input 
                type="date"
                value={nuevoCumpleanos}
                onChange={(e) => setNuevoCumpleanos(e.target.value)}
                className="bg-background h-10 w-full"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border/50">
            <Button onClick={() => setCreandoNuevo(false)} size="sm" variant="ghost" className="h-9 px-4">Cancelar</Button>
            <Button onClick={handleCrearNuevo} size="sm" className="h-9 px-4" disabled={!nuevoNombre.trim() || loading}>
              {loading ? "Agregando..." : "Guardar y Seleccionar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
