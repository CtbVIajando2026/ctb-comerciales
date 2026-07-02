"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BeautifulDateTimePicker } from "./BeautifulDateTimePicker"
import { Plus, Trash2 } from "lucide-react"

interface CheckOutFormProps {
  onSubmit: (data: any) => void
  esActividad?: boolean
  catalogoRegalos?: any[]
}

export function CheckOutForm({ onSubmit, esActividad = false }: CheckOutFormProps) {
  const [motivo, setMotivo] = useState("")
  const [motivoDetalle, setMotivoDetalle] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [proximoPaso, setProximoPaso] = useState("none")
  const [proximoPasoOtro, setProximoPasoOtro] = useState("")
  const [proximoPasoFecha, setProximoPasoFecha] = useState("")
  
  // Entregas state
  const [entregas, setEntregas] = useState<{tipo: string, descripcion: string, cantidad: number, costo: string}[]>([])

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
    
    let formattedDate = null;
    if (!esActividad && proximoPaso !== 'none' && proximoPasoFecha) {
       const localD = new Date(proximoPasoFecha);
       const y = localD.getFullYear();
       const m = String(localD.getMonth() + 1).padStart(2, '0');
       const d = String(localD.getDate()).padStart(2, '0');
       formattedDate = `${y}-${m}-${d}`;
    }

    onSubmit({
      temas: esActividad ? ['Actividad Interna'] : [motivo],
      otroTema: esActividad ? '' : motivoDetalle,
      observaciones,
      proximoPaso: esActividad || proximoPaso === 'none' ? null : finalProximoPaso,
      proximoPasoFecha: formattedDate,
      entregas: esActividad ? [] : entregas
    })
  }

  const addEntrega = () => {
    setEntregas([...entregas, { tipo: "souvenir", descripcion: "", cantidad: 1, costo: "" }])
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

      {!esActividad && (
        <section className="space-y-3 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              REGALOS / GASTOS (OPCIONAL)
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addEntrega}
              className="h-8 text-xs rounded-full"
            >
              <Plus className="w-3 h-3 mr-1" /> Añadir Regalo
            </Button>
          </div>

          {entregas.length === 0 ? (
            <p className="text-sm text-muted-foreground italic mt-2">No se han registrado regalos ni comidas.</p>
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
                    <div className="grid grid-cols-2 gap-3">
                      <Select 
                        value={entrega.tipo} 
                        onValueChange={(val) => updateEntrega(index, 'tipo', val)}
                      >
                        <SelectTrigger className="h-10 bg-card">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="souvenir">Souvenir</SelectItem>
                          <SelectItem value="comida">Comida</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input 
                        placeholder="Ej: Llavero, Torta..." 
                        value={entrega.descripcion} 
                        onChange={(e) => updateEntrega(index, 'descripcion', e.target.value)}
                        className="h-10"
                        required
                      />
                    </div>

                    <div className="flex space-x-3">
                      {entrega.tipo === 'souvenir' ? (
                        <div className="w-full">
                          <Select 
                            value={entrega.cantidad.toString()} 
                            onValueChange={(v) => updateEntrega(index, 'cantidad', parseInt(v) || 1)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Cantidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(n => (
                                <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="w-full">
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            value={entrega.costo} 
                            onChange={(e) => updateEntrega(index, 'costo', e.target.value)}
                            className="h-10"
                            placeholder="Costo total ($)"
                          />
                        </div>
                      )}
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
