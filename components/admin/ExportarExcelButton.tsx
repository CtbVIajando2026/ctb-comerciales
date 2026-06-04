"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

export function ExportarExcelButton({ datos }: { datos: any }) {
  const handleExport = () => {
    // We expect datos to contain .visitas, or be an array of visitas directly
    const visitas = Array.isArray(datos) ? datos : (datos?.visitas || [])
    if (visitas.length === 0) {
      toast.info("No hay datos", { description: "No hay visitas registradas para exportar." })
      return
    }

    // Prepare headers
    const headers = [
      "ID Visita", 
      "Fecha", 
      "Comercial", 
      "Agencia", 
      "Ciudad",
      "Tipo Actividad", 
      "Duracion (min)", 
      "Distancia a Agencia (m)", 
      "Resumen"
    ]

    // Map rows
    const rows = visitas.map((v: any) => {
      const fecha = new Date(v.created_at).toLocaleString('es-EC')
      const comercial = v.usuarios?.nombre_completo || "Desconocido"
      const agencia = v.agencias?.nombre || "Desconocida"
      const ciudad = v.agencias?.ciudad || "Quito"
      const tipo = v.tipo_actividad || ""
      const duracion = v.tiempo_en_sitio_minutos || 0
      const distancia = v.distancia_gps_metros || 0
      
      // Clean up text for CSV (quotes, newlines)
      const resumen = `"${(v.resumen_visita || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`

      return [v.id, fecha, comercial, agencia, ciudad, tipo, duracion, distancia, resumen].join(",")
    })

    // Add BOM for Excel UTF-8 support
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Reporte_Visitas_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success("Descarga iniciada", { description: "El reporte CSV ha sido generado exitosamente." })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="rounded-full bg-card hover:bg-muted text-foreground border-border shadow-sm h-9">
      <Download className="w-4 h-4 mr-1.5" /> Exportar CSV
    </Button>
  )
}
