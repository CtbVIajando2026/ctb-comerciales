"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { crearJustificacion } from "@/app/(comerciales)/actions_justificaciones"
import { toast } from "sonner"

export function JustificacionFormClient({ hoy }: { hoy: string }) {
  const [tipo, setTipo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tipo || !descripcion) return

    setEnviando(true)
    try {
      await crearJustificacion({ fecha: hoy, tipo, descripcion })
      toast.success("Enviado", { description: "Justificación enviada a administración." })
    } catch (error) {
      console.error(error)
      toast.error("Error", { description: "Ocurrió un error al enviar la justificación." })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <Select value={tipo} onValueChange={(v) => setTipo(v || "")} required>
        <SelectTrigger className="h-12">
          <SelectValue placeholder="Motivo principal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="salud">Problema de Salud</SelectItem>
          <SelectItem value="vehiculo">Daño de Vehículo / Movilidad</SelectItem>
          <SelectItem value="personal">Calamidad Doméstica</SelectItem>
          <SelectItem value="capacitacion">Capacitación Interna / Tareas Admin</SelectItem>
          <SelectItem value="otro">Otro</SelectItem>
        </SelectContent>
      </Select>

      <textarea
        required
        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
        placeholder="Explica brevemente el motivo de tu justificación..."
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />

      <Button type="submit" disabled={enviando || !tipo || !descripcion} className="w-full h-12">
        {enviando ? "Enviando..." : "Enviar Justificación"}
      </Button>
    </form>
  )
}
