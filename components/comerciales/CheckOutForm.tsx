"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BeautifulDateTimePicker } from "./BeautifulDateTimePicker"
import { Plus, Trash2, Gift } from "lucide-react"

interface CheckOutFormProps {
  onSubmit: (data: any) => void
  esActividad?: boolean
  catalogoRegalos?: any[]
}

export function CheckOutForm({ onSubmit, esActividad = false, catalogoRegalos = [] }: CheckOutFormProps) {
  const [motivo, setMotivo] = useState("")
  const [motivoDetalle, setMotivoDetalle] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [proximoPaso, setProximoPaso] = useState("none")
  const [proximoPasoOtro, setProximoPasoOtro] = useState("")
  const [proximoPasoFecha, setProximoPasoFecha] = useState("")
  
  // Entregas state
  const [entregas, setEntregas] = useState<{regalo_id: string, cantidad: number, entregado_a: string}[]>([])

  // Validate date if proximoPaso requires it (i.e. not "none")
  const isDateValid = proximoPaso === "none" || proximoPasoFecha !== ""
  
  const isValidActividad = observaciones.trim().length > 5
  const isValidVisita = motivo !== "" && motivoDetalle.trim() !== "" && isDateValid && (proximoPaso !== 'otro' || proximoPasoOtro.trim() !== '')

  const isValid = esActividad ? isValidActividad : isValidVisita

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    let finalProximoPaso = proximoPaso
    if (proximoPaso === 'otro') finalProximoPaso = proximoPasoOtro
    if (proximoPaso === 'none') finalProximoPaso = ''
    
    onSubmit({
      temas: esActividad ? ['Actividad Interna'] : [motivo],
      otroTema: esActividad ? '' : motivoDetalle,
      observaciones,
      proximoPaso: esActividad || proximoPaso === 'none' ? null : finalProximoPaso,
      proximoPasoFecha: esActividad || proximoPaso === 'none' ? null : (proximoPasoFecha ? new Date(proximoPasoFecha).toISOString() : null),
      entregas: esActividad ? [] : entregas
    })
  }

  const addEntrega = () => {
    if (catalogoRegalos.length === 0) return
    setEntregas([...entregas, { regalo_id: catalogoRegalos[0].id, cantidad: 1, entregado_a: "" }])
  }

  const removeEntrega = (index: number) => {
    setEntregas(entregas.filter((_, i) => i !== index))
  }

  const updateEntrega = (index: number, field: string, value: any) => {
    const newEntregas = [...entregas]
    newEntregas[index] = { ...newEntregas[index], [field]: value }
    setEntregas(newEntregas)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {!esActividad && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            MOTIVO DE VISITA *
          </h3>
          <Select value={motivo} onValueChange={(v) => setMotivo(v || "")}>
            <SelectTrigger className="h-12 bg-card">
              <SelectValue placeholder="Seleccionar motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Promo Destino">Promo Destino</SelectItem>
              <SelectItem value="Promo + Cotización">Promo + Cotización</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>

          {motivo === "Promo Destino" && (
            <Input 
              placeholder="¿Qué destino promocionaste?" 
              value={motivoDetalle}
              onChange={(e) => setMotivoDetalle(e.target.value)}
              className="h-12"
              required
            />
          )}
          
          {motivo === "Promo + Cotización" && (
            <Input 
              placeholder="¿De dónde y detalles de cotización?" 
              value={motivoDetalle}
              onChange={(e) => setMotivoDetalle(e.target.value)}
              className="h-12"
              required
            />
          )}

          {motivo === "Otro" && (
            <Input 
              placeholder="Especifica el motivo..." 
              value={motivoDetalle}
              onChange={(e) => setMotivoDetalle(e.target.value)}
              className="h-12"
              required
            />
          )}
        </section>
      )}

      {!esActividad && catalogoRegalos.length > 0 && (
        <section className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              ENTREGAS (OPCIONAL)
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addEntrega}
              className="h-8 text-xs rounded-full"
            >
              <Plus className="w-3 h-3 mr-1" /> Añadir Entrega
            </Button>
          </div>

          {entregas.length === 0 ? (
            <p className="text-sm text-muted-foreground italic mt-2">No se han registrado entregas de regalos o souvenirs.</p>
          ) : (
            <div className="space-y-4 mt-4">
              {entregas.map((entrega, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-xl border border-border relative">
                  <button 
                    type="button" 
                    onClick={() => removeEntrega(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow hover:bg-destructive/90"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  <div className="space-y-3">
                    <div>
                      <Select 
                        value={entrega.regalo_id} 
                        onValueChange={(val) => updateEntrega(index, 'regalo_id', val)}
                      >
                        <SelectTrigger className="h-10 bg-card">
                          <SelectValue placeholder="Seleccionar regalo" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogoRegalos.map((r: any) => (
                            <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-3">
                      <div className="w-1/3">
                        <Input 
                          type="number" 
                          min="1" 
                          value={entrega.cantidad} 
                          onChange={(e) => updateEntrega(index, 'cantidad', parseInt(e.target.value) || 1)}
                          className="h-10 text-center"
                          placeholder="Cant."
                        />
                      </div>
                      <div className="flex-1">
                        <Input 
                          value={entrega.entregado_a} 
                          onChange={(e) => updateEntrega(index, 'entregado_a', e.target.value)}
                          className="h-10"
                          placeholder="¿A quién? (Opcional)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {esActividad ? "RESULTADOS / OBSERVACIONES *" : "OBSERVACIONES (OPCIONAL)"}
        </h3>
        <textarea 
          className="w-full flex min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={esActividad ? "¿Qué hiciste o a dónde fuiste? *" : "¿Qué pasó? ¿Qué dijeron?"}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          required={esActividad}
        />
      </section>

      {!esActividad && (
        <section className="space-y-3 border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            RECORDATORIO (OPCIONAL)
          </h3>
          <Select value={proximoPaso} onValueChange={(v) => setProximoPaso(v || "")}>
            <SelectTrigger className="h-12 bg-card">
              <SelectValue placeholder="Seleccionar próximo paso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguno por ahora</SelectItem>
              <SelectItem value="enviar_proforma">Enviar proforma</SelectItem>
              <SelectItem value="llamada_seguimiento">Llamada de seguimiento</SelectItem>
              <SelectItem value="reunion_virtual">Agendar reunión virtual</SelectItem>
              <SelectItem value="otro">Otro (Especificar)</SelectItem>
            </SelectContent>
          </Select>
          
          {proximoPaso === "otro" && (
            <Input 
              placeholder="Especifica el recordatorio..." 
              value={proximoPasoOtro}
              onChange={(e) => setProximoPasoOtro(e.target.value)}
              className="h-12 mt-3"
              required
            />
          )}

          {proximoPaso !== "none" && (
            <div className="mt-4">
              <BeautifulDateTimePicker 
                value={proximoPasoFecha}
                onChange={setProximoPasoFecha}
              />
            </div>
          )}
        </section>
      )}

      <Button 
        type="submit" 
        disabled={!isValid} 
        className="w-full h-16 text-lg rounded-2xl bg-primary hover:bg-primary/90 mt-6"
      >
        {esActividad ? "GUARDAR ACTIVIDAD" : "GUARDAR VISITA"}
      </Button>
    </form>
  )
}
