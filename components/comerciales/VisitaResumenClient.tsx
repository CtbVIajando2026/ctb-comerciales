"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, Clock, Calendar, CheckCircle2, FileText, Target, Route, Gift, Pencil, Check, X } from "lucide-react"
import { calcularDistanciaMetros } from "@/lib/geolocation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { actualizarObservaciones, agregarRegaloAVisita } from "@/app/(comerciales)/actions"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function VisitaResumenClient({ visita }: { visita: any }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editVal, setEditVal] = useState(visita.observaciones || "")
  const [isSaving, setIsSaving] = useState(false)

  const [isAddingRegalo, setIsAddingRegalo] = useState(false)
  const [nuevoRegaloDesc, setNuevoRegaloDesc] = useState("")
  const [nuevoRegaloCant, setNuevoRegaloCant] = useState("1")
  const [isSavingRegalo, setIsSavingRegalo] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await actualizarObservaciones(visita.id, editVal)
      toast.success("Observaciones actualizadas")
      setIsEditing(false)
      router.refresh()
    } catch (e: any) {
      toast.error("Error", { description: e.message || "No se pudo actualizar." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddRegalo = async () => {
    if (!nuevoRegaloDesc.trim()) return;
    try {
      setIsSavingRegalo(true)
      await agregarRegaloAVisita(visita.id, 'souvenir', nuevoRegaloDesc, parseInt(nuevoRegaloCant) || 1)
      toast.success("Souvenir agregado exitosamente")
      setIsAddingRegalo(false)
      setNuevoRegaloDesc("")
      setNuevoRegaloCant("1")
      router.refresh()
    } catch (e: any) {
      toast.error("Error", { description: e.message || "No se pudo agregar." })
    } finally {
      setIsSavingRegalo(false)
    }
  }
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const duracion = visita.hora_checkout 
    ? Math.floor((new Date(visita.hora_checkout).getTime() - new Date(visita.hora_checkin).getTime()) / 60000) 
    : 0

  return (
    <div className="bg-muted/20 min-h-screen pb-10">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center justify-center">
        <div className="w-full max-w-lg flex items-center">
          <Link href="/comerciales/dashboard" className="mr-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">{visita.es_actividad ? "Resumen de Actividad" : "Resumen de Visita"}</h1>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Agencia y Estado */}
        <section className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-primary">
              {visita.es_actividad ? visita.titulo_actividad : visita.agencia?.nombre}
            </h2>
            <CheckCircle2 className="text-green-500 w-6 h-6" />
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-4">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              {formatTime(visita.hora_checkin)} — {formatTime(visita.hora_checkout)} ({duracion} min)
            </span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <MapPin className="w-4 h-4 mr-2" />
            <span>Check-in GPS registrado</span>
          </div>
          {visita.es_actividad && visita.titulo_actividad === 'Transporte / Movilización' && visita.gps_lat && visita.gps_lng && visita.gps_lat_checkout && visita.gps_lng_checkout && (
            <div className="flex items-center text-sm text-blue-600 font-bold bg-blue-500/10 w-fit px-3 py-1.5 rounded-lg mt-3">
              <Route className="w-4 h-4 mr-2" />
              <span>Distancia recorrida: {(calcularDistanciaMetros(visita.gps_lat, visita.gps_lng, visita.gps_lat_checkout, visita.gps_lng_checkout) / 1000).toFixed(2)} km</span>
            </div>
          )}
        </section>

        {/* Motivo de Visita */}
        {!visita.es_actividad && (
          <section className="bg-card p-5 rounded-2xl shadow-sm border border-border space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Motivo de Visita
            </h3>
            <div className="space-y-2">
              {visita.temas?.map((tema: string, idx: number) => (
                <div key={idx} className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium">
                  {tema}
                </div>
              ))}
              {visita.temas_texto_libre && (
                <p className="text-sm mt-2 font-medium">Detalle: {visita.temas_texto_libre}</p>
              )}
            </div>
          </section>
        )}

        {/* Observaciones / Resultados */}
        <section className="bg-card p-5 rounded-2xl shadow-sm border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              {visita.es_actividad ? "Resultados / Observaciones" : "Observaciones"}
            </h3>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors flex items-center"
              >
                <Pencil className="w-3 h-3 mr-1" /> Editar
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <textarea 
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                className="w-full min-h-[100px] text-sm resize-none bg-background border border-primary/30 rounded-xl p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                placeholder="Escribe tus observaciones aquí..."
              />
              <div className="flex items-center gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsEditing(false)
                    setEditVal(visita.observaciones || "")
                  }}
                  disabled={isSaving}
                  className="rounded-xl h-8"
                >
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-xl h-8"
                >
                  <Check className="w-4 h-4 mr-1" /> {isSaving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{visita.observaciones || <span className="text-muted-foreground italic">Sin observaciones registradas.</span>}</p>
          )}
        </section>

        {/* Regalos / Gastos */}
        <section className="bg-card p-5 rounded-2xl shadow-sm border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <Gift className="w-4 h-4 mr-2" />
              Regalos y Gastos
            </h3>
            {!isAddingRegalo && (
              <button 
                onClick={() => setIsAddingRegalo(true)}
                className="text-xs font-bold text-pink-700 bg-pink-500/10 hover:bg-pink-500/20 px-2 py-1 rounded-md transition-colors flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" /> Añadir
              </button>
            )}
          </div>

          {visita.registro_regalos && visita.registro_regalos.length > 0 && (
            <div className="space-y-2 mb-3">
              {visita.registro_regalos.map((r: any, idx: number) => (
                <div key={idx} className="flex items-center text-sm font-bold text-pink-700 bg-pink-500/10 px-3 py-2 rounded-lg w-full">
                  <Gift className="w-4 h-4 mr-2 shrink-0" />
                  {r.tipo === 'souvenir' ? `${r.cantidad}x ${r.descripcion}` : `1x ${r.descripcion} ($${r.costo})`}
                </div>
              ))}
            </div>
          )}
          
          {(!visita.registro_regalos || visita.registro_regalos.length === 0) && !isAddingRegalo && (
            <p className="text-sm text-muted-foreground italic">Sin souvenirs registrados.</p>
          )}

          {isAddingRegalo && (
            <div className="bg-muted p-3 rounded-xl border border-border space-y-3 animate-in fade-in zoom-in-95">
              <p className="text-sm font-medium">Agregar Souvenir</p>
              <div className="flex space-x-2">
                <Select 
                  value={nuevoRegaloCant} 
                  onValueChange={setNuevoRegaloCant}
                >
                  <SelectTrigger className="w-[80px] h-10 bg-background">
                    <SelectValue placeholder="Cant" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  value={nuevoRegaloDesc}
                  onChange={(e) => setNuevoRegaloDesc(e.target.value)}
                  placeholder="Ej: Kit de tazas, Bolígrafos..."
                  className="bg-background h-10 flex-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsAddingRegalo(false)} disabled={isSavingRegalo}>Cancelar</Button>
                <Button size="sm" onClick={handleAddRegalo} disabled={isSavingRegalo || !nuevoRegaloDesc.trim()}>Guardar</Button>
              </div>
            </div>
          )}
        </section>

        {/* Recordatorio / Próximo Paso */}
        {visita.proximo_paso && visita.proximo_paso !== 'none' && (
          <section className="bg-card p-5 rounded-2xl shadow-sm border border-border space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Recordatorio / Próximo Paso
            </h3>
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold">{visita.proximo_paso}</p>
              {visita.proximo_paso_fecha && (
                <p className="text-sm text-muted-foreground mt-1">
                  Agendado para: {formatDate(visita.proximo_paso_fecha)}
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
