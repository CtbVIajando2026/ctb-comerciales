"use client"

import { Button } from "@/components/ui/button"
import { Download } from 'lucide-react'
import { differenceInMinutes, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from "sonner"
import { exportToExcel, buildExcelRow } from "@/lib/exportExcel"

export function ExportarExcelButton({ datos }: { datos: any }) {
  const handleExport = async () => {
    // We expect datos to contain .visitas, or be an array of visitas directly
    const visitas = Array.isArray(datos) ? datos : (datos?.visitas || [])
    if (visitas.length === 0) {
      toast.info("No hay datos", { description: "No hay visitas registradas para exportar." })
      return
    }

    // Map rows
    const rows = visitas.map((v: any) => buildExcelRow(v))

    try {
      await exportToExcel(rows, `Reporte_Visitas_${new Date().toISOString().split('T')[0]}`)
      toast.success("¡Descarga completada! (v2.0)", { description: "El reporte de Excel ha sido generado exitosamente." })
    } catch (err: any) {
      console.error(err);
      toast.error("Error en la descarga", { description: err.message || "No se pudo generar el archivo." })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="rounded-full bg-card hover:bg-muted text-foreground border-border shadow-sm h-9">
      <Download className="w-4 h-4 mr-1.5" /> Exportar Excel
    </Button>
  )
}
