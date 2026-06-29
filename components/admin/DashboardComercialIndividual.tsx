'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import { Target, CheckCircle, Clock, ShieldAlert, Filter, Search, Printer, Download, ChevronLeft, ChevronRight, Activity, CalendarDays, Map } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { format, isSameDay, isSameWeek, isSameMonth, parseISO, subDays, subWeeks, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapaWrapper } from '@/components/comerciales/MapaWrapper'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
const ITEMS_PER_PAGE = 10

type Periodo = 'hoy' | 'semana' | 'mes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0]).join(',') + '\n'
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  
  const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

interface DashboardComercialProps {
  usuario: any
  visitas: any[]
}

export function DashboardComercialIndividual({ usuario, visitas }: DashboardComercialProps) {
  const [periodo, setPeriodo] = useState<Periodo>('hoy')
  const [refDateStr, setRefDateStr] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'agencias' | 'internas'>('todas')

  const refDate = parseISO(refDateStr)

  // Generadores de opciones de fecha
  const daysOptions = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(new Date(), i)
      return { value: format(d, 'yyyy-MM-dd'), label: i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : format(d, 'EEEE, d MMM', { locale: es }) }
    })
  }, [])

  const weeksOptions = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const d = subWeeks(new Date(), i)
      const start = startOfWeek(d, { weekStartsOn: 1 })
      const end = endOfWeek(d, { weekStartsOn: 1 })
      return { value: format(d, 'yyyy-MM-dd'), label: i === 0 ? 'Esta Semana' : `${format(start, 'd MMM', { locale: es })} al ${format(end, 'd MMM', { locale: es })}` }
    })
  }, [])

  const monthsOptions = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const d = subMonths(new Date(), i)
      return { value: format(d, 'yyyy-MM-dd'), label: i === 0 ? 'Este Mes' : format(d, 'MMMM yyyy', { locale: es }) }
    })
  }, [])

  const metaDiaria = usuario.metas_comerciales?.[0]?.visitas_diarias || 10
  const metaPeriodo = periodo === 'hoy' ? metaDiaria : periodo === 'semana' ? metaDiaria * 5 : metaDiaria * 20

  // Filtrar visitas por periodo y fecha de referencia
  const visitasPeriodo = useMemo(() => {
    return visitas.filter(v => {
      const fechaVisita = parseISO(v.created_at)
      if (periodo === 'hoy') return isSameDay(fechaVisita, refDate)
      if (periodo === 'semana') return isSameWeek(fechaVisita, refDate, { weekStartsOn: 1 })
      return isSameMonth(fechaVisita, refDate)
    })
  }, [visitas, periodo, refDate])

  const completadas = visitasPeriodo.filter(v => v.estado === 'completada').length
  const visitasRealesCompletadas = visitasPeriodo.filter(v => v.estado === 'completada' && !v.es_actividad).length
  const actividadesCompletadas = visitasPeriodo.filter(v => v.estado === 'completada' && !!v.es_actividad).length
  
  const abiertas = visitasPeriodo.filter(v => v.estado === 'abierta')
  const enRuta = abiertas.length
  const isEnAgencia = abiertas.some(v => !v.es_actividad)
  const isEnExtra = abiertas.some(v => !!v.es_actividad)
  
  let estadoRutaColor = 'text-muted-foreground'
  let estadoRutaText = 'Inactivo'
  if (enRuta > 0) {
    if (isEnAgencia) {
      estadoRutaColor = 'text-primary'
      estadoRutaText = 'En Agencia'
    } else if (isEnExtra) {
      estadoRutaColor = 'text-warning'
      estadoRutaText = 'Labor Extra'
    }
  }

  const alertas = visitasPeriodo.filter(v => v.alerta_fraude_checkin || v.alerta_fraude_checkout).length

  const pctVisitas = metaPeriodo > 0 ? Math.min(100, (visitasRealesCompletadas / metaPeriodo) * 100) : 0
  const pctActividades = metaPeriodo > 0 ? (actividadesCompletadas / metaPeriodo) * 100 : 0
  const pctRenderActividades = Math.min(100 - pctVisitas, pctActividades)
  const porcentajeMeta = Math.min(100, Math.round(pctVisitas + pctActividades))



  const visitasFiltradas = useMemo(() => {
    if (!search) return visitasPeriodo
    const searchLower = search.toLowerCase()
    return visitasPeriodo.filter(v => {
      const agencia = v.agencias?.nombre?.toLowerCase() || ''
      const estado = v.estado?.toLowerCase() || ''
      const fechaStr = format(parseISO(v.created_at), 'dd MMM yyyy', { locale: es }).toLowerCase()
      const hasRiesgo = (v.alerta_fraude_checkin || v.alerta_fraude_checkout) ? 'riesgo alerta fraude' : ''

      const isAgenciaMatch = filtroTipo === 'todas' || (filtroTipo === 'agencias' && !v.es_actividad) || (filtroTipo === 'internas' && !!v.es_actividad)

      return (agencia.includes(searchLower) ||
             estado.includes(searchLower) ||
             fechaStr.includes(searchLower) ||
             hasRiesgo.includes(searchLower)) && isAgenciaMatch
    })
  }, [visitasPeriodo, search, filtroTipo])

  const totalPages = Math.max(1, Math.ceil(visitasFiltradas.length / ITEMS_PER_PAGE))
  const paginatedVisitas = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return visitasFiltradas.slice(start, start + ITEMS_PER_PAGE)
  }, [visitasFiltradas, page])

  const handlePrint = () => window.print()
  const handleExport = () => {
    const exportData = visitasFiltradas.map((v:any) => {
      let mins = 0
      if (v.hora_checkin && v.hora_checkout) {
        mins = Math.floor((new Date(v.hora_checkout).getTime() - new Date(v.hora_checkin).getTime()) / 60000)
      }
      const extracto = v.es_actividad 
        ? v.observaciones 
        : (v.temas && v.temas.length > 0 ? `${v.temas.join(', ')}${v.temas_texto_libre ? `: ${v.temas_texto_libre}` : ''}` : v.observaciones)

      return {
        "Tipo": v.es_actividad ? "Actividad Interna" : "Visita Agencia",
        "Agencia/Actividad": v.es_actividad ? v.titulo_actividad : (v.agencias?.nombre || 'Desc'),
        "Fecha": format(parseISO(v.created_at), "yyyy-MM-dd"),
        "Estado": v.estado,
        "CheckIn": v.hora_checkin ? format(parseISO(v.hora_checkin), "HH:mm:ss") : '',
        "CheckOut": v.hora_checkout ? format(parseISO(v.hora_checkout), "HH:mm:ss") : '',
        "Duración (min)": mins > 0 ? mins : 0,
        "Observaciones": extracto || "",
        "Fraude": (v.alerta_fraude_checkin || v.alerta_fraude_checkout) ? 'SI' : 'NO'
      }
    })
    exportToCSV(exportData, `Visitas_${usuario.nombre_completo}_${periodo}_${refDateStr}`)
  }

  const changePeriod = (p: Periodo) => {
    setPeriodo(p)
    setPage(1)
    setRefDateStr(format(new Date(), 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Controles de Tiempo */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex w-full md:flex-1 p-1 bg-muted/50 rounded-xl border border-border/50 md:max-w-[300px]">
          <button onClick={() => changePeriod('hoy')} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold text-center transition-all ${periodo === 'hoy' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Día</button>
          <button onClick={() => changePeriod('semana')} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold text-center transition-all ${periodo === 'semana' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Semana</button>
          <button onClick={() => changePeriod('mes')} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold text-center transition-all ${periodo === 'mes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Mes</button>
        </div>

        <div className="w-full md:w-auto print:hidden flex items-center gap-2">
          <div className="flex-1">
          {periodo === 'hoy' && (
            <Select value={refDateStr} onValueChange={(v) => { setRefDateStr(v || ""); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[220px] h-9 rounded-xl border-border bg-card text-xs capitalize">
                <div className="flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue placeholder="Seleccionar Día" /></div>
              </SelectTrigger>
              <SelectContent>
                {daysOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="capitalize">{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {periodo === 'semana' && (
            <Select value={refDateStr} onValueChange={(v) => { setRefDateStr(v || ""); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[260px] h-9 rounded-xl border-border bg-card text-xs capitalize">
                <div className="flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue placeholder="Seleccionar Semana" /></div>
              </SelectTrigger>
              <SelectContent>
                {weeksOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="capitalize">{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {periodo === 'mes' && (
            <Select value={refDateStr} onValueChange={(v) => { setRefDateStr(v || ""); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[220px] h-9 rounded-xl border-border bg-card text-xs capitalize">
                <div className="flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue placeholder="Seleccionar Mes" /></div>
              </SelectTrigger>
              <SelectContent>
                {monthsOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="capitalize">{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          </div>
          <button 
            onClick={handleExport} 
            className="px-3 h-9 bg-success text-success-foreground border border-success/20 rounded-xl hover:bg-success/90 shrink-0 font-bold flex items-center text-xs shadow-sm"
            title="Descargar Excel"
          >
            <Download className="w-4 h-4 mr-1.5" /> Excel
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider text-primary">Visitas</p>
          <div className="text-3xl font-black text-primary">
            {visitasRealesCompletadas} <span className="text-xl text-primary/50">/ {metaPeriodo}</span>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider text-warning">Actividades</p>
          <div className="text-3xl font-black text-warning-foreground">{actividadesCompletadas}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
          <p className={`text-[10px] font-bold mb-1 uppercase tracking-wider ${estadoRutaColor}`}>{estadoRutaText}</p>
          <div className={`text-3xl font-black ${estadoRutaColor}`}>{enRuta}</div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider text-destructive">Alertas GPS</p>
          <div className={`text-3xl font-black ${alertas > 0 ? 'text-destructive' : 'text-success'}`}>{alertas}</div>
        </div>
      </div>

      {/* Gráficos Interpuestos en Fila */}
      <div className="flex flex-col md:flex-row gap-4 print:hidden w-full">
        <div className="flex-1 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center min-h-[250px]">
          <h3 className="font-bold text-muted-foreground mb-4 uppercase tracking-wider text-xs">Cumplimiento de Meta</h3>
          <div className="relative flex-1 flex items-center justify-center w-full">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/30" />
              <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={452} strokeDashoffset={452 - (452 * pctVisitas) / 100} className="text-primary transition-all duration-1000 ease-out" />
              {pctRenderActividades > 0 && (
                <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={452} strokeDashoffset={452 - (452 * pctRenderActividades) / 100} className="text-warning transition-all duration-1000 ease-out" style={{ transform: `rotate(${(pctVisitas / 100) * 360}deg)`, transformOrigin: 'center' }} />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{porcentajeMeta}%</span>
              <span className="text-[10px] font-bold text-muted-foreground mt-1">META: {metaPeriodo}</span>
            </div>
          </div>
          <div className="mt-6 flex flex-row items-center justify-center gap-3 w-full">
            <div className="flex items-center text-[11px] font-bold bg-primary/10 px-2.5 py-1.5 rounded-md text-primary whitespace-nowrap">
              Visitas: {visitasRealesCompletadas}
            </div>
            <div className="flex items-center text-[11px] font-bold bg-warning/10 px-2.5 py-1.5 rounded-md text-warning-foreground whitespace-nowrap">
              Extra: {actividadesCompletadas}
            </div>
          </div>
        </div>

        <div className="flex-[2] bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col min-h-[250px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-2 border-b border-border/50 gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center">
              <Map className="w-4 h-4 mr-2 text-primary" /> Recorrido Inteligente
            </h3>
          </div>

          <div className="flex-1 w-full h-full min-h-[300px]">
            <div className="animate-in fade-in duration-300 h-full w-full">
              <MapaWrapper visitas={visitasFiltradas.map(v => ({...v, agenciaNombre: v.agencias?.nombre}))} />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:block">
              Filtrar Datos Visuales:
            </span>
            <div className="flex bg-muted p-1 rounded-xl shadow-inner w-full sm:w-auto">
              <button
                onClick={() => setFiltroTipo('todas')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filtroTipo === 'todas' ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltroTipo('agencias')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filtroTipo === 'agencias' ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                Agencias
              </button>
              <button
                onClick={() => setFiltroTipo('internas')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filtroTipo === 'internas' ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                Internas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Inteligente de Registro */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-xs uppercase tracking-wider flex items-center">
            <Clock className="w-3 h-3 mr-2 text-primary" />
            Registro de Visitas ({visitasPeriodo.length})
          </h3>
          <div className="flex items-center space-x-2 print:hidden w-full sm:w-auto">
            <div className="relative flex-1 sm:w-[200px]">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar agencia..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-8 text-xs rounded-lg w-full" />
            </div>
            <button onClick={handlePrint} className="p-1.5 h-8 bg-background border border-border rounded-lg hover:bg-muted shrink-0"><Printer className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={handleExport} className="px-3 h-8 bg-success text-success-foreground border border-success/20 rounded-lg hover:bg-success/90 shrink-0 font-bold flex items-center text-xs shadow-sm"><Download className="w-3.5 h-3.5 mr-1.5" /> Excel / CSV</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-2 font-bold">Agencia</th>
                <th className="px-4 py-2 font-bold text-center">Tiempos</th>
                <th className="px-4 py-2 font-bold text-center">Estado</th>
                <th className="px-4 py-2 font-bold text-right">Alertas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedVisitas.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No hay visitas en este periodo.</td></tr>
              ) : (
                paginatedVisitas.map((v: any) => (
                  <tr key={v.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-bold">
                      <span className="truncate max-w-[150px] inline-block">{v.agencias?.nombre || 'Agencia Desc.'}</span>
                      <div className="text-[10px] text-muted-foreground font-medium">{format(parseISO(v.created_at), "d MMM, HH:mm", { locale: es })}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-muted-foreground">In: {v.hora_checkin ? format(parseISO(v.hora_checkin), "HH:mm") : '--:--'}</span>
                        <span className="text-[10px] text-muted-foreground">Out: {v.hora_checkout ? format(parseISO(v.hora_checkout), "HH:mm") : '--:--'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${v.estado === 'completada' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>{v.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(v.alerta_fraude_checkin || v.alerta_fraude_checkout) ? (
                        <span className="text-destructive text-[9px] font-bold inline-flex items-center uppercase tracking-wider"><ShieldAlert className="w-3 h-3 mr-1" /> Riesgo</span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border bg-muted/10 flex items-center justify-between print:hidden">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Pág {page} de {totalPages}
            </span>
            <div className="flex space-x-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded bg-background border border-border disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded bg-background border border-border disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
