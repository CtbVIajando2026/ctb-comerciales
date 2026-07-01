"use client"

import { useState } from "react"
import { Filter, Download, FileSpreadsheet, Calendar, Users, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ReportesInteligentesClient() {
  const [periodo, setPeriodo] = useState("rango_fechas")
  
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full -z-0" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              Reportes Inteligentes (Excel)
            </h1>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-3xl">
              Genera un archivo <strong className="text-foreground">Microsoft Excel (.xlsx)</strong> de alta calidad. 
              Incluye una pestaña de <strong className="text-foreground">Dashboard</strong> con rankings contables, 
              y una pestaña de <strong className="text-foreground">Data Maestra</strong> con filtros (flechitas) 
              para cruzar agencias, estados, destinos y sacar subtotales automáticos.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center bg-green-500/10 text-green-600 p-4 rounded-2xl">
            <FileSpreadsheet className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Configurator Card */}
      <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border/50 space-y-8">
        <div className="flex items-center gap-2 text-primary font-bold">
          <Filter className="w-5 h-5" />
          <h2>CONFIGURAR EXPORTACIÓN INTELIGENTE</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Periodo de Creacion */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Período de Creación
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <select 
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border text-sm font-semibold text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="historico">Histórico Completo</option>
                <option value="hoy">Hoy</option>
                <option value="esta_semana">Esta Semana</option>
                <option value="este_mes">Este Mes</option>
                <option value="este_ano">Este Año</option>
                <option value="rango_fechas">✓ Rango de fechas...</option>
              </select>
            </div>
            
            {periodo === "rango_fechas" && (
              <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                  <input type="date" defaultValue="2026-06-01" className="w-full px-3 py-2.5 rounded-lg bg-muted/30 border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <span className="text-muted-foreground text-xs font-bold">-</span>
                <div className="relative flex-1">
                  <input type="date" defaultValue="2026-06-30" className="w-full px-3 py-2.5 rounded-lg bg-muted/30 border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            )}
          </div>

          {/* Sede / Ciudad */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Sede / Ciudad
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-primary" />
              </div>
              <select className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border text-sm font-semibold text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>TODAS LAS SEDES</option>
                {/* Options would be loaded here */}
              </select>
            </div>
          </div>

          {/* Operativo / Asesor */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Operativo / Asesor
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <select className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border text-sm font-semibold text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>TODO EL EQUIPO</option>
                {/* Options would be loaded here */}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-border/50">
          <p className="text-[10px] md:text-[11px] text-muted-foreground leading-relaxed uppercase font-semibold max-w-xl text-center md:text-left">
            Se descargarán dos pestañas: Resumen (Dashboard) y Tabla Completa de Datos B2B con auto-filtros y fórmulas de sumatoria inteligente aplicadas.
          </p>
          
          <Button size="lg" className="w-full md:w-auto rounded-xl bg-[#0f172a] hover:bg-black text-white font-bold tracking-wide shadow-xl flex items-center gap-2 py-6 px-8 transition-transform active:scale-95">
            <Download className="w-5 h-5" />
            EXPORTAR XLSX INTELIGENTE
          </Button>
        </div>
      </div>
    </div>
  )
}
