'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts'
import { TrendingUp, Map, Award, Users, Filter, Calendar as CalendarIcon, Clock, Search, Briefcase, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
const AREA_COLOR = '#3b82f6'
const ITEMS_PER_PAGE = 10

type VistaType = 'global' | 'ciudad' | 'comercial'

function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0]).join(',') + '\n'
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  
  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function DashboardInteractivo({ data }: { data: any }) {
  const { visitas, metas, comerciales } = data
  const [vista, setVista] = useState<VistaType>('global')
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>('Quito')
  const [comercialSeleccionado, setComercialSeleccionado] = useState<string>('all')
  
  // Filtros y Paginación
  const [searchAgencia, setSearchAgencia] = useState('')
  const [searchGlobalAgencia, setSearchGlobalAgencia] = useState('')
  const [globalPage, setGlobalPage] = useState(1)
  const [comercialPage, setComercialPage] = useState(1)

  // ---------------- DATOS GLOBALES ----------------
  const totalVisitas = visitas.length
  const completadas = visitas.filter((v: any) => v.estado === 'completada').length
  const conversionRate = totalVisitas > 0 ? Math.round((completadas / totalVisitas) * 100) : 0

  const visitasPorCiudadGlobal = useMemo(() => {
    const map: Record<string, number> = {}
    visitas.forEach((v: any) => {
      if (v.estado === 'completada') {
        const ciudad = v.agencias?.ciudad || v.usuarios?.zona || 'Sin Zona'
        map[ciudad] = (map[ciudad] || 0) + 1
      }
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [visitas])

  // Composición de trabajo: Agencias vs Actividades
  const compTrabajoData = useMemo(() => {
    const reales = visitas.filter((v: any) => v.estado === 'completada' && !v.es_actividad).length
    const extra = visitas.filter((v: any) => v.estado === 'completada' && v.es_actividad).length
    return [
      { name: 'Agencias', value: reales, fill: '#3b82f6' }, // primary
      { name: 'Internas', value: extra, fill: '#f59e0b' }   // warning
    ]
  }, [visitas])

  // Serie de tiempo (Power BI style)
  const visitasPorDia = useMemo(() => {
    const map: Record<string, number> = {}
    visitas.forEach((v: any) => {
      if (v.estado === 'completada') {
        const dia = format(new Date(v.created_at), "dd MMM")
        map[dia] = (map[dia] || 0) + 1
      }
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .reverse() // Asumiendo que vienen ordenadas desc, revertimos para la gráfica (cronológico)
  }, [visitas])

  const visitasGlobalesFiltradas = useMemo(() => {
    if (!searchGlobalAgencia) return visitas
    const term = searchGlobalAgencia.toLowerCase()
    return visitas.filter((v: any) => {
      const agencia = v.agencias?.nombre?.toLowerCase() || ''
      const comercial = v.usuarios?.nombre?.toLowerCase() || ''
      const zona = v.usuarios?.zona?.toLowerCase() || ''
      const estado = v.estado?.toLowerCase() || ''
      const fecha = format(new Date(v.created_at), "d MMM yyyy HH:mm", { locale: es }).toLowerCase()
      
      return agencia.includes(term) || comercial.includes(term) || zona.includes(term) || estado.includes(term) || fecha.includes(term)
    })
  }, [visitas, searchGlobalAgencia])

  // Paginación Global
  const totalGlobalPages = Math.max(1, Math.ceil(visitasGlobalesFiltradas.length / ITEMS_PER_PAGE))
  const paginatedVisitasGlobal = useMemo(() => {
    const start = (globalPage - 1) * ITEMS_PER_PAGE
    return visitasGlobalesFiltradas.slice(start, start + ITEMS_PER_PAGE)
  }, [visitasGlobalesFiltradas, globalPage])

  // ---------------- DATOS POR CIUDAD ----------------
  const visitasCiudad = useMemo(() => {
    return visitas.filter((v: any) => (v.agencias?.ciudad || v.usuarios?.zona) === ciudadSeleccionada)
  }, [visitas, ciudadSeleccionada])

  const visitasRealesCiudad = useMemo(() => visitasCiudad.filter((v: any) => !v.es_actividad), [visitasCiudad])
  const actividadesCiudad = useMemo(() => visitasCiudad.filter((v: any) => v.es_actividad), [visitasCiudad])

  const comercialesEnCiudad = useMemo(() => {
    return comerciales.filter((c: any) => c.ciudad_zona === ciudadSeleccionada)
  }, [comerciales, ciudadSeleccionada])

  const rankingComercialesCiudad = useMemo(() => {
    const map: Record<string, number> = {}
    visitasCiudad.forEach((v: any) => {
      if (v.estado === 'completada') {
        const nombre = v.usuarios?.nombre || 'Desconocido'
        map[nombre] = (map[nombre] || 0) + 1
      }
    })
    return Object.entries(map)
      .map(([name, total]) => ({ name, visitas: total }))
      .sort((a, b) => b.visitas - a.visitas)
  }, [visitasCiudad])

  const rankingComercialesGlobal = useMemo(() => {
    const map: Record<string, number> = {}
    visitas.forEach((v: any) => {
      if (v.estado === 'completada') {
        const nombre = v.usuarios?.nombre || 'Desconocido'
        map[nombre] = (map[nombre] || 0) + 1
      }
    })
    return Object.entries(map)
      .map(([name, total]) => ({ name, visitas: total }))
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 10) // Top 10
  }, [visitas])

  // ---------------- DATOS POR COMERCIAL ----------------
  const comercialData = comerciales.find((c: any) => c.id === comercialSeleccionado)
  const metaComercial = metas.find((m: any) => m.comercial_id === comercialSeleccionado)?.visitas_diarias || 0
  
  const visitasDelComercial = useMemo(() => {
    let filtered = visitas.filter((v: any) => v.comercial_id === comercialSeleccionado)
    if (searchAgencia) {
      const term = searchAgencia.toLowerCase()
      filtered = filtered.filter((v: any) => {
        const agencia = v.agencias?.nombre?.toLowerCase() || ''
        const estado = v.estado?.toLowerCase() || ''
        const fecha = format(new Date(v.created_at), "d MMM yyyy HH:mm", { locale: es }).toLowerCase()
        return agencia.includes(term) || estado.includes(term) || fecha.includes(term)
      })
    }
    return filtered
  }, [visitas, comercialSeleccionado, searchAgencia])

  const completadasComercial = visitasDelComercial.filter((v: any) => v.estado === 'completada').length

  // Paginación Comercial
  const totalComercialPages = Math.max(1, Math.ceil(visitasDelComercial.length / ITEMS_PER_PAGE))
  const paginatedVisitasComercial = useMemo(() => {
    const start = (comercialPage - 1) * ITEMS_PER_PAGE
    return visitasDelComercial.slice(start, start + ITEMS_PER_PAGE)
  }, [visitasDelComercial, comercialPage])

  // ---------------- HANDLERS EXPORTACIÓN ----------------
  const handlePrint = () => window.print()
  
  const handleExportGlobal = () => {
    const exportData = visitasGlobalesFiltradas.map((v:any) => ({
      Agencia: v.agencias?.nombre || 'Desc',
      Comercial: v.usuarios?.nombre,
      Zona: v.usuarios?.zona,
      Fecha: format(new Date(v.created_at), "yyyy-MM-dd HH:mm"),
      Estado: v.estado,
      Fraude: (v.alerta_fraude_checkin || v.alerta_fraude_checkout) ? 'SI' : 'NO'
    }))
    exportToCSV(exportData, 'Visitas_Globales')
  }

  const handleExportComercial = () => {
    const exportData = visitasDelComercial.map((v:any) => ({
      Agencia: v.agencias?.nombre || 'Desc',
      Fecha: format(new Date(v.created_at), "yyyy-MM-dd HH:mm"),
      Estado: v.estado,
      Fraude: (v.alerta_fraude_checkin || v.alerta_fraude_checkout) ? 'SI' : 'NO'
    }))
    exportToCSV(exportData, `Visitas_${comercialData?.nombre_completo || 'Comercial'}`)
  }

  return (
    <div className="space-y-6 mt-4 animate-in fade-in duration-500">
      {/* HEADER BI (Oculto en impresión) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm print:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight leading-tight">Business Intelligence</h2>
            <p className="text-xs text-muted-foreground flex items-center mt-0.5">
              <CalendarIcon className="w-3 h-3 mr-1" /> Últimos 30 días
            </p>
          </div>
        </div>
        
        {/* TAB MENU */}
        <div className="flex w-full md:flex-1 p-1 bg-muted/50 rounded-xl border border-border/50 md:max-w-md">
          <button onClick={() => setVista('global')} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold text-center transition-all ${vista === 'global' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Global</button>
          <button onClick={() => setVista('ciudad')} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold text-center transition-all ${vista === 'ciudad' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Por Ciudad</button>
          <button onClick={() => setVista('comercial')} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold text-center transition-all ${vista === 'comercial' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Comercial</button>
        </div>
      </div>

      {/* ---------------- VISTA GLOBAL ---------------- */}
      {vista === 'global' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-row gap-4 print:hidden w-full">
            <div className="flex-1 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center text-center min-h-[250px]">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Briefcase className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Composición del Trabajo</h3>
              </div>
              <div className="flex-1 w-full h-full min-h-[180px] relative">
                {compTrabajoData[0].value + compTrabajoData[1].value > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={compTrabajoData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                          {compTrabajoData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
                        <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                      <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground leading-none">
                        {compTrabajoData[0].value + compTrabajoData[1].value}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Totales</span>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Sin datos</div>
                )}
              </div>
            </div>

            <div className="flex-1 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-lg flex flex-col min-h-[250px]">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Map className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Distribución Nacional</h3>
              </div>
              <div className="flex-1 w-full h-full min-h-[180px]">
                {visitasPorCiudadGlobal.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={visitasPorCiudadGlobal} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                        {visitasPorCiudadGlobal.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
                      <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Sin datos</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-lg flex flex-col min-h-[300px] print:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Tendencia de Visitas Exitosas</h3>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[200px]">
              {visitasPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visitasPorDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={AREA_COLOR} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={AREA_COLOR} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <RechartsTooltip cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke={AREA_COLOR} strokeWidth={3} fillOpacity={1} fill="url(#colorVisitas)" activeDot={{ r: 6, strokeWidth: 0, fill: AREA_COLOR }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Sin actividad.</div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center">
                <Clock className="w-3 h-3 mr-2 text-primary" />
                Registro Global ({visitas.length} registros)
              </h3>
              <div className="flex items-center space-x-2 print:hidden w-full sm:w-auto">
                <div className="relative flex-1 sm:w-[200px]">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Filtrar datos (agencia, comercial, zona, fecha)..." value={searchGlobalAgencia} onChange={(e) => { setSearchGlobalAgencia(e.target.value); setGlobalPage(1); }} className="pl-8 h-8 text-xs rounded-lg w-full" />
                </div>
                <button onClick={handlePrint} className="p-1.5 h-8 bg-background border border-border rounded-lg hover:bg-muted shrink-0"><Printer className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={handleExportGlobal} className="p-1.5 h-8 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 shrink-0"><Download className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="w-full">
              <table className="w-full text-left table-fixed">
                <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 font-bold w-8 text-center"></th>
                    <th className="px-2 py-2 font-bold">Agencia/Labor</th>
                    <th className="px-2 py-2 font-bold">Comercial</th>
                    <th className="px-3 py-2 font-bold text-right w-24">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedVisitasGlobal.map((v: any) => {
                    const isRiesgo = v.alerta_fraude_checkin || v.alerta_fraude_checkout
                    const dotColor = isRiesgo ? 'bg-destructive' : v.estado === 'completada' ? 'bg-success' : 'bg-primary'
                    
                    return (
                      <tr key={v.id} className="hover:bg-muted/10">
                        <td className="px-3 py-3 text-center align-middle">
                          <div className={`w-2.5 h-2.5 rounded-full mx-auto shadow-sm ${dotColor}`} />
                        </td>
                        <td className="px-2 py-3 font-bold align-middle">
                          <div className="truncate text-xs text-foreground pr-2">
                            {v.es_actividad ? v.titulo_actividad : (v.agencias?.nombre || 'Desconocido')}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-muted-foreground align-middle">
                          <div className="truncate text-xs pr-2">
                            {v.usuarios?.nombre}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-muted-foreground align-middle">
                          <div className="text-[10px] whitespace-nowrap">
                            {format(new Date(v.created_at), "d MMM, HH:mm", { locale: es })}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* PAGINACIÓN */}
            {totalGlobalPages > 1 && (
              <div className="p-3 border-t border-border bg-muted/10 flex items-center justify-between print:hidden">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Pág {globalPage} de {totalGlobalPages}
                </span>
                <div className="flex space-x-1">
                  <button onClick={() => setGlobalPage(p => Math.max(1, p - 1))} disabled={globalPage === 1} className="p-1 rounded bg-background border border-border disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setGlobalPage(p => Math.min(totalGlobalPages, p + 1))} disabled={globalPage === totalGlobalPages} className="p-1 rounded bg-background border border-border disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- VISTA CIUDAD ---------------- */}
      {vista === 'ciudad' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2 print:hidden">
            <Select value={ciudadSeleccionada} onValueChange={(v) => setCiudadSeleccionada(v || "")}>
              <SelectTrigger className="w-[180px] h-9 rounded-xl border-border bg-card text-xs">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Quito">Quito</SelectItem>
                <SelectItem value="Guayaquil">Guayaquil</SelectItem>
                <SelectItem value="Cuenca">Cuenca</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Análisis de plaza: <span className="text-foreground">{ciudadSeleccionada}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
              <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Visitas (Agencias)</p>
              <div className="text-3xl font-black text-primary">{visitasRealesCiudad.length}</div>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
              <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider text-secondary-foreground">Actividades Extra</p>
              <div className="text-3xl font-black text-foreground">{actividadesCiudad.length}</div>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
              <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Equipo Comercial</p>
              <div className="text-3xl font-black text-muted-foreground">{comercialesEnCiudad.length}</div>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
              <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider text-success">Cierre Visitas</p>
              <div className="text-3xl font-black text-success">
                {visitasRealesCiudad.length > 0 ? Math.round((visitasRealesCiudad.filter((v:any)=>v.estado==='completada').length / visitasRealesCiudad.length) * 100) : 0}%
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-[10px] uppercase tracking-wider">Ranking Comerciales</h3>
              </div>
              <button onClick={handlePrint} className="p-1.5 bg-background border border-border rounded-lg hover:bg-muted transition-colors print:hidden"><Printer className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="h-56">
              {rankingComercialesCiudad.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rankingComercialesCiudad} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--foreground)' }} width={80} />
                    <RechartsTooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                    <Bar dataKey="visitas" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                      {rankingComercialesCiudad.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Sin actividad.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- VISTA COMERCIAL ---------------- */}
      {vista === 'comercial' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center mb-2 print:hidden">
            <Select value={comercialSeleccionado} onValueChange={(v) => { setComercialSeleccionado(v || ""); setComercialPage(1); }}>
              <SelectTrigger className="w-full max-w-xs h-9 rounded-xl border-border bg-card text-xs">
                <SelectValue placeholder="Comercial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Resumen General de Equipo</SelectItem>
                {comerciales.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre_completo} <span className="text-muted-foreground">({c.ciudad_zona})</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {comercialSeleccionado === 'all' ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-row gap-4 print:hidden w-full">
                <div className="flex-1 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col min-h-[250px]">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Map className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Visitas Completadas por Ciudad</h3>
                  </div>
                  <div className="flex-1 w-full min-h-[180px]">
                    {visitasPorCiudadGlobal.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visitasPorCiudadGlobal} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--foreground)' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                          <RechartsTooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32}>
                            {visitasPorCiudadGlobal.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Sin datos</div>
                    )}
                  </div>
                </div>

                <div className="flex-1 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col min-h-[250px]">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Award className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Top 10 Nacional</h3>
                  </div>
                  <div className="flex-1 w-full min-h-[180px]">
                    {rankingComercialesGlobal.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankingComercialesGlobal} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--foreground)' }} width={80} />
                          <RechartsTooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                          <Bar dataKey="visitas" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16}>
                            {rankingComercialesGlobal.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Sin actividad.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-center text-center">
              <h3 className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Meta Base</h3>
              <div className="text-3xl font-black">{metaComercial > 0 ? metaComercial : 'Libre'}</div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-center text-center">
              <h3 className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Total (30d)</h3>
              <div className="text-3xl font-black">{visitasDelComercial.length}</div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-center col-span-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Efectividad Personal</h3>
                <TrendingUp className="w-3 h-3 text-success" />
              </div>
              <div className="flex items-end space-x-3">
                <div className="text-3xl font-black text-success leading-none">
                  {visitasDelComercial.length > 0 ? Math.round((completadasComercial / visitasDelComercial.length) * 100) : 0}%
                </div>
                <div className="flex-1 bg-secondary h-1.5 mb-2 rounded-full overflow-hidden">
                  <div className="bg-success h-full rounded-full transition-all duration-1000" style={{ width: `${visitasDelComercial.length > 0 ? Math.round((completadasComercial / visitasDelComercial.length) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-3 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center">
                <Map className="w-3 h-3 mr-2 text-primary" /> Ruta Recorrida
              </h3>
              <div className="flex items-center space-x-2 print:hidden w-full sm:w-auto">
                <div className="relative flex-1 sm:w-[200px]">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Filtrar datos (agencia, fecha)..." value={searchAgencia} onChange={(e) => { setSearchAgencia(e.target.value); setComercialPage(1); }} className="pl-8 h-8 text-xs rounded-lg w-full" />
                </div>
                <button onClick={handlePrint} className="p-1.5 h-8 bg-background border border-border rounded-lg hover:bg-muted shrink-0"><Printer className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={handleExportComercial} className="p-1.5 h-8 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 shrink-0"><Download className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-2 font-bold">Agencia</th>
                    <th className="px-4 py-2 font-bold">Fecha / Hora</th>
                    <th className="px-4 py-2 font-bold">Estado</th>
                    <th className="px-4 py-2 font-bold">Alertas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedVisitasComercial.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Sin registros.</td></tr>
                  ) : (
                    paginatedVisitasComercial.map((v: any) => (
                      <tr key={v.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-bold truncate max-w-[150px]">{v.agencias?.nombre || 'Agencia Desc.'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(v.created_at), "d MMM, HH:mm", { locale: es })}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${v.estado === 'completada' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>{v.estado}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {(v.alerta_fraude_checkin || v.alerta_fraude_checkout) ? (
                            <span className="text-destructive text-[9px] font-bold flex items-center uppercase tracking-wider"><Filter className="w-3 h-3 mr-1" /> GPS Alterado</span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

              {/* PAGINACIÓN */}
              {totalComercialPages > 1 && (
                <div className="p-3 border-t border-border bg-muted/10 flex items-center justify-between print:hidden">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Pág {comercialPage} de {totalComercialPages}
                  </span>
                  <div className="flex space-x-1">
                    <button onClick={() => setComercialPage(p => Math.max(1, p - 1))} disabled={comercialPage === 1} className="p-1 rounded bg-background border border-border disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setComercialPage(p => Math.min(totalComercialPages, p + 1))} disabled={comercialPage === totalComercialPages} className="p-1 rounded bg-background border border-border disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          </>
          )}
        </div>
      )}

    </div>
  )
}
