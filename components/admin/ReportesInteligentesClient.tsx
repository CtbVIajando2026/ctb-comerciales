"use client"

import { useState, useEffect } from "react"
import { Filter, Download, FileSpreadsheet, Calendar, Users, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { obtenerDatosParaFiltrosReportes, generarDataReporte } from "@/app/(admin)/adminActions"
import { buildExcelRow, exportToExcel } from "@/lib/exportExcel"

export function ReportesInteligentesClient() {
  const [periodo, setPeriodo] = useState("rango_fechas")
  
  // Opciones cargadas desde BD
  const [sedesOpciones, setSedesOpciones] = useState<string[]>([])
  const [asesoresOpciones, setAsesoresOpciones] = useState<any[]>([])
  
  // Estado de los filtros
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [sede, setSede] = useState("TODAS LAS SEDES")
  const [asesorId, setAsesorId] = useState("TODOS")

  const [isLoading, setIsLoading] = useState(false)
  const [isCargandoFiltros, setIsCargandoFiltros] = useState(true)

  useEffect(() => {
    // Inicializar fechas con hoy (Ecuador/Local)
    const hoy = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const hoyStr = formatter.format(hoy)
    setFechaInicio(hoyStr)
    setFechaFin(hoyStr)

    // Cargar listas
    obtenerDatosParaFiltrosReportes().then((data) => {
      setSedesOpciones(data.sedes)
      setAsesoresOpciones(data.asesores)
      setIsCargandoFiltros(false)
    }).catch(e => {
      console.error(e)
      setIsCargandoFiltros(false)
    })
  }, [])

  const getRangoPorPeriodo = (periodoStr: string) => {
    const hoy = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
    
    if (periodoStr === 'hoy') {
      return { inicio: formatter.format(hoy), fin: formatter.format(hoy) }
    }
    
    if (periodoStr === 'esta_semana') {
      const inicioSemana = new Date(hoy)
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1) // Lunes
      return { inicio: formatter.format(inicioSemana), fin: formatter.format(hoy) }
    }
    
    if (periodoStr === 'este_mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      return { inicio: formatter.format(inicioMes), fin: formatter.format(hoy) }
    }
    
    if (periodoStr === 'este_ano') {
      const inicioAno = new Date(hoy.getFullYear(), 0, 1)
      return { inicio: formatter.format(inicioAno), fin: formatter.format(hoy) }
    }
    
    return { inicio: undefined, fin: undefined }
  }

  const handleExportar = async () => {
    try {
      setIsLoading(true)
      
      let inicio = fechaInicio
      let fin = fechaFin
      
      if (periodo !== "rango_fechas") {
         const rangos = getRangoPorPeriodo(periodo)
         if (rangos.inicio && rangos.fin) {
           inicio = rangos.inicio
           fin = rangos.fin
         } else {
           // historico
           inicio = ''
           fin = ''
         }
      }

      const filtros = {
        fechaInicio: inicio || undefined,
        fechaFin: fin || undefined,
        sede,
        asesorId
      }

      const dataCruda = await generarDataReporte(filtros)

      if (!dataCruda || dataCruda.length === 0) {
        alert("No hay datos para exportar con estos filtros.")
        setIsLoading(false)
        return
      }

      const rowsForExcel = dataCruda.map(v => buildExcelRow(v))
      const fileName = `Reporte_Inteligente_${new Date().getTime()}`
      await exportToExcel(rowsForExcel, fileName, dataCruda)
    } catch (error) {
      console.error(error)
      alert("Ocurrió un error al generar el reporte.")
    } finally {
      setIsLoading(false)
    }
  }

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
                  <input 
                    type="date" 
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-muted/30 border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>
                <span className="text-muted-foreground text-xs font-bold">-</span>
                <div className="relative flex-1">
                  <input 
                    type="date" 
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-muted/30 border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
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
              <select 
                value={sede}
                onChange={(e) => setSede(e.target.value)}
                disabled={isCargandoFiltros}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border text-sm font-semibold text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <option value="TODAS LAS SEDES">TODAS LAS SEDES</option>
                {sedesOpciones.map(s => (
                  <option key={s} value={s}>{s.toUpperCase()}</option>
                ))}
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
              <select 
                value={asesorId}
                onChange={(e) => setAsesorId(e.target.value)}
                disabled={isCargandoFiltros}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border text-sm font-semibold text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <option value="TODOS">TODO EL EQUIPO</option>
                {asesoresOpciones.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre_completo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-border/50">
          <p className="text-[10px] md:text-[11px] text-muted-foreground leading-relaxed uppercase font-semibold max-w-xl text-center md:text-left">
            Se descargarán dos pestañas: Resumen (Dashboard) y Tabla Completa de Datos B2B con auto-filtros y fórmulas de sumatoria inteligente aplicadas.
          </p>
          
          <Button 
            size="lg" 
            onClick={handleExportar}
            disabled={isLoading || isCargandoFiltros}
            className="w-full md:w-auto rounded-xl bg-[#0f172a] hover:bg-black text-white font-bold tracking-wide shadow-xl flex items-center gap-2 py-6 px-8 transition-transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isLoading ? "GENERANDO..." : "EXPORTAR XLSX INTELIGENTE"}
          </Button>
        </div>
      </div>
    </div>
  )
}
