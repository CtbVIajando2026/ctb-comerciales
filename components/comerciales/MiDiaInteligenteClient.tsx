"use client"

import { useState, useMemo, useEffect } from "react"
import { Building2, Briefcase, Search, Calendar, ChevronLeft, ChevronRight, Clock, RefreshCcw, Map, List, Download, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TimeDistributionChart } from "./TimeDistributionChart"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { MapaWrapper } from "./MapaWrapper"
import { exportToExcel, buildExcelRow } from "@/lib/exportExcel"

// Eliminamos exportToCSV local porque usamos lib/exportExcel

interface Visita {
  id: string
  es_actividad: boolean
  agenciaNombre?: string
  titulo_actividad?: string
  hora_checkin: string
  hora_checkout?: string
  estado: string
  gps_lat?: number | null
  gps_lng?: number | null
  temas?: string[] | null
  temas_texto_libre?: string | null
  observaciones?: string | null
}

interface MiDiaInteligenteClientProps {
  visitas: Visita[]
}

type FiltroModo = 'hoy' | 'semana' | 'mes' | 'personalizado'

export function MiDiaInteligenteClient({ visitas: visitasIniciales }: MiDiaInteligenteClientProps) {
  const supabase = createClient()
  const hoyDate = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const toLocalISOString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  
  const hoyIso = toLocalISOString(hoyDate)
  const mesActualStr = `${hoyDate.getFullYear()}-${pad(hoyDate.getMonth() + 1)}`
  
  const getISOWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7)
  }
  const semanaActualStr = `${hoyDate.getFullYear()}-W${pad(getISOWeek(hoyDate))}`
  
  // Estado DB
  const [visitasDB, setVisitasDB] = useState<Visita[]>(visitasIniciales)
  
  // Modos y Valores Híbridos
  const [modo, setModo] = useState<FiltroModo>('hoy')
  const [vistaSuperior, setVistaSuperior] = useState<'grafico' | 'mapa'>('grafico')
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'agencias' | 'internas'>('todas')
  
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(semanaActualStr)
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActualStr)
  
  // Fechas Maestras (las que mandan en la BD)
  const [fechaInicio, setFechaInicio] = useState(hoyIso)
  const [fechaFin, setFechaFin] = useState(hoyIso)
  
  const [cargando, setCargando] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)

  const [busqueda, setBusqueda] = useState("")
  const [pagina, setPagina] = useState(1)
  const itemsPorPagina = 10

  // Efecto para buscar en BD cuando cambian las Fechas Maestras
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false)
      return
    }

    const cargarRango = async () => {
      if (!fechaInicio || !fechaFin) return
      setCargando(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Ajustamos la zona horaria asegurando inicio y fin absolutos en la zona horaria del vendedor
        const dInicio = new Date(fechaInicio + 'T00:00:00')
        const dFin = new Date(fechaFin + 'T23:59:59')

        const { data: nuevasVisitas } = await supabase
          .from('visitas')
          .select(`
            id,
            es_actividad,
            titulo_actividad,
            hora_checkin,
            hora_checkout,
            estado,
            gps_lat,
            gps_lng,
            temas,
            temas_texto_libre,
            observaciones,
            agencia:agencias(nombre),
            alerta_fraude_checkin,
            distancia_checkin_metros
          `)
          .eq('comercial_id', user.id)
          .in('estado', ['en_curso', 'completada'])
          .gte('hora_checkin', dInicio.toISOString())
          .lte('hora_checkin', dFin.toISOString())
          .order('hora_checkin', { ascending: false })

        if (nuevasVisitas) {
          const mapeadas = nuevasVisitas.map((v, idx) => {
            // MOCK DATA PARA DEMO: Si no hay GPS, inventamos uno por Cuenca (-2.9001, -79.0059)
            let finalLat = v.gps_lat
            let finalLng = v.gps_lng
            if (!finalLat || !finalLng) {
              // Rango de dispersión más realista para un recorrido en Cuenca (aprox 3-4 km)
              finalLat = -2.9001 + (Math.random() * 0.03 - 0.015)
              finalLng = -79.0059 + (Math.random() * 0.03 - 0.015)
            }
            
            return {
              id: v.id,
              es_actividad: v.es_actividad,
              titulo_actividad: v.titulo_actividad,
              hora_checkin: v.hora_checkin,
              hora_checkout: v.hora_checkout,
              estado: v.estado,
              gps_lat: finalLat,
              gps_lng: finalLng,
              temas: v.temas,
              temas_texto_libre: v.temas_texto_libre,
              observaciones: v.observaciones,
              agenciaNombre: (v.agencia as any)?.nombre,
              alerta_fraude_checkin: v.alerta_fraude_checkin,
              distancia_checkin_metros: v.distancia_checkin_metros
            }
          })
          setVisitasDB(mapeadas)
          setPagina(1)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setCargando(false)
      }
    }
    
    cargarRango()
  }, [fechaInicio, fechaFin, supabase])

  // Helpers de Formato Visual Didáctico
  const formatSemanaVisual = (weekStr: string) => {
    if (!weekStr) return "Seleccionar Semana"
    const [yearStr, weekPart] = weekStr.split('-W')
    const year = parseInt(yearStr, 10)
    const week = parseInt(weekPart, 10)
    
    const simple = new Date(year, 0, 1 + (week - 1) * 7)
    const dayOfWeek = simple.getDay()
    const ISOweekStart = simple
    if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
    }
    const monday = new Date(ISOweekStart)
    const sunday = new Date(ISOweekStart)
    sunday.setDate(monday.getDate() + 6)
    
    const fmt = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' })
    return `Del ${fmt.format(monday)} al ${fmt.format(sunday)}`
  }

  const formatMesVisual = (monthStr: string) => {
    if (!monthStr) return "Seleccionar Mes"
    const [year, month] = monthStr.split('-')
    const d = new Date(parseInt(year), parseInt(month) - 1, 1)
    return new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(d)
  }

  // Helpers de Conversión
  const cambiarModo = (nuevoModo: FiltroModo) => {
    setModo(nuevoModo)
    if (nuevoModo === 'hoy') {
      const h = new Date()
      const hoyStr = toLocalISOString(h)
      setFechaInicio(hoyStr)
      setFechaFin(hoyStr)
    } else if (nuevoModo === 'semana') {
      procesarSemana(semanaSeleccionada)
    } else if (nuevoModo === 'mes') {
      procesarMes(mesSeleccionado)
    }
  }

  const procesarSemana = (weekStr: string) => {
    setSemanaSeleccionada(weekStr)
    if (!weekStr) return
    const [yearStr, weekPart] = weekStr.split('-W')
    const year = parseInt(yearStr, 10)
    const week = parseInt(weekPart, 10)
    
    const simple = new Date(year, 0, 1 + (week - 1) * 7)
    const dayOfWeek = simple.getDay()
    const ISOweekStart = simple
    if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
    }
    const monday = new Date(ISOweekStart)
    const sunday = new Date(ISOweekStart)
    sunday.setDate(monday.getDate() + 6)
    
    setFechaInicio(toLocalISOString(monday))
    setFechaFin(toLocalISOString(sunday))
  }

  const procesarMes = (monthStr: string) => {
    setMesSeleccionado(monthStr)
    if (!monthStr) return
    const [year, month] = monthStr.split('-')
    const start = new Date(parseInt(year), parseInt(month) - 1, 1)
    const end = new Date(parseInt(year), parseInt(month), 0)
    
    // Necesitamos asegurarnos de que la conversión a ISO no mueva el día por la zona horaria,
    // así que construimos el string directamente
    const pad = (n: number) => n.toString().padStart(2, '0')
    setFechaInicio(`${year}-${month}-01`)
    setFechaFin(`${year}-${month}-${pad(end.getDate())}`)
  }

  // Calcular días en el rango para pasarle la escala a la gráfica
  const diasRango = useMemo(() => {
    const dInicio = new Date(fechaInicio)
    const dFin = new Date(fechaFin)
    let diff = Math.round((dFin.getTime() - dInicio.getTime()) / (1000 * 3600 * 24)) + 1
    return diff < 1 || isNaN(diff) ? 1 : diff
  }, [fechaInicio, fechaFin])

  // Filtrado por Búsqueda de Texto y Mapeo Mock GPS
  const visitasFiltradas = useMemo(() => {
    setPagina(1)
    
    // 1. Filtrar
    let filtradas = busqueda.trim() 
      ? visitasDB.filter(v => {
          const nombre = v.es_actividad ? v.titulo_actividad : v.agenciaNombre
          return nombre?.toLowerCase().includes(busqueda.toLowerCase())
        })
      : visitasDB

    // Aplicar filtro por tipo
    if (filtroTipo === 'agencias') {
      filtradas = filtradas.filter(v => !v.es_actividad)
    } else if (filtroTipo === 'internas') {
      filtradas = filtradas.filter(v => v.es_actividad)
    }

    // 2. Mapear Mock GPS para DEMO
    return filtradas.map(v => {
      let finalLat = v.gps_lat
      let finalLng = v.gps_lng
      if (!finalLat || !finalLng) {
        // Cuenca
        finalLat = -2.9001 + (Math.random() * 0.03 - 0.015)
        finalLng = -79.0059 + (Math.random() * 0.03 - 0.015)
      }
      return { ...v, gps_lat: finalLat, gps_lng: finalLng }
    })
  }, [visitasDB, busqueda, filtroTipo])

  // Calcular Métricas para el Dash
  const { agencias, actividades, minutosAgencias, minutosActividades } = useMemo(() => {
    const agenciasList = visitasFiltradas.filter(v => !v.es_actividad)
    const actividadesList = visitasFiltradas.filter(v => v.es_actividad)

    const calcMinutos = (lista: Visita[]) => {
      return lista.reduce((acc, curr) => {
        if (curr.hora_checkin && curr.hora_checkout) {
          let mins = Math.floor((new Date(curr.hora_checkout).getTime() - new Date(curr.hora_checkin).getTime()) / 60000)
          if (mins === 0) mins = 1 // Asegurar que pruebas de 0 mins se grafiquen
          return acc + mins
        }
        return acc
      }, 0)
    }

    return {
      agencias: agenciasList,
      actividades: actividadesList,
      minutosAgencias: calcMinutos(agenciasList),
      minutosActividades: calcMinutos(actividadesList)
    }
  }, [visitasFiltradas])

  // Paginación
  const totalPaginas = Math.ceil(visitasFiltradas.length / itemsPorPagina) || 1
  const paginados = visitasFiltradas.slice((pagina - 1) * itemsPorPagina, pagina * itemsPorPagina)

  const formatearFechaHora = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('es-EC', { 
      weekday: 'short', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    })
  }

  const formatMinutos = (mins: number) => {
    if (mins < 60) return `${mins} min`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m > 0 ? m + 'm' : ''}`
  }

  const handleExportExcel = () => {
    if (visitasFiltradas.length === 0) return
    const dataToExport = visitasFiltradas.map(v => buildExcelRow(v))
    
    exportToExcel(dataToExport, `Mis_Visitas_${modo}_${new Date().getTime()}`)
  }

  return (
    <div className="space-y-6">
      
      {/* UI Híbrida de Fechas */}
      <div className="bg-card p-2 rounded-xl border border-border shadow-sm print:hidden">
        
        <div className="flex items-center justify-between mb-3 gap-2">
          {/* Segmented Control */}
          <div className="flex bg-muted p-1 rounded-lg flex-1">
            {(['hoy', 'semana', 'mes', 'personalizado'] as FiltroModo[]).map((m) => (
              <button
                key={m}
                onClick={() => cambiarModo(m)}
                className={`flex-1 py-1.5 text-[11px] sm:text-xs font-bold uppercase rounded-md transition-all ${
                  modo === m 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          
          <Button 
            onClick={handleExportExcel} 
            disabled={visitasFiltradas.length === 0}
            className="h-9 px-3 rounded-lg bg-success text-success-foreground hover:bg-success/90 font-bold shadow-sm flex items-center gap-1.5 shrink-0"
            title="Descargar Excel"
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Excel</span>
          </Button>
        </div>

        {/* Controles Contextuales Nativo */}
        {modo === 'semana' && (
          <div className="flex flex-col space-y-1.5 px-1 pb-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">
              Selecciona la Semana:
            </label>
            <div className="relative flex items-center">
              <Input 
                type="week"
                value={semanaSeleccionada}
                onChange={(e) => procesarSemana(e.target.value)}
                className="bg-card h-12 rounded-xl pl-4 pr-12 text-sm font-bold shadow-sm cursor-pointer border-border [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer z-10 text-transparent bg-transparent"
              />
              {/* Icono falso debajo para dar la ilusión de botón premium a la derecha */}
              <div className="absolute inset-0 bg-card rounded-xl pointer-events-none flex justify-between items-center pl-4 pr-2 border border-border shadow-sm">
                <span className="font-bold text-foreground text-sm uppercase">{formatSemanaVisual(semanaSeleccionada)}</span>
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {modo === 'mes' && (
          <div className="flex flex-col space-y-1.5 px-1 pb-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">
              Selecciona el Mes:
            </label>
            <div className="relative flex items-center">
              <Input 
                type="month"
                value={mesSeleccionado}
                onChange={(e) => procesarMes(e.target.value)}
                className="bg-card h-12 rounded-xl pl-4 pr-12 text-sm font-bold shadow-sm cursor-pointer border-border [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer z-10 text-transparent bg-transparent"
              />
              <div className="absolute inset-0 bg-card rounded-xl pointer-events-none flex justify-between items-center pl-4 pr-2 border border-border shadow-sm">
                <span className="font-bold text-foreground text-sm uppercase">{formatMesVisual(mesSeleccionado)}</span>
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {modo === 'personalizado' && (
          <div className="grid grid-cols-2 gap-3 px-1 pb-1 relative">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Desde</label>
              <Input 
                type="date" 
                value={fechaInicio} 
                onChange={(e) => setFechaInicio(e.target.value)}
                className="bg-muted/50 border-border h-11"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Hasta</label>
              <Input 
                type="date" 
                value={fechaFin} 
                onChange={(e) => setFechaFin(e.target.value)}
                className="bg-muted/50 border-border h-11"
              />
            </div>
          </div>
        )}

        {cargando && (
          <div className="flex items-center justify-center mt-3 text-xs font-medium text-muted-foreground">
            <RefreshCcw className="w-3 h-3 mr-2 animate-spin" /> Descargando historial...
          </div>
        )}
      </div>

      {/* Tarjetas de Métricas (Arriba) */}
      <section className="space-y-3 print:break-inside-avoid">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-3xl font-black text-foreground">{agencias.length}</span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Visitas a Agencias</p>
          </div>
          
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-5 h-5 text-warning" />
              <span className="text-3xl font-black text-foreground">{actividades.length}</span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actividades Internas</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-2 border-b border-border/50 gap-3">
            <h3 className="text-sm font-bold text-foreground">Rendimiento y Recorrido</h3>
            
            {/* Switch de Vista */}
            <div className="flex bg-muted p-1 rounded-xl shadow-inner w-full sm:w-auto print:hidden">
              <button
                onClick={() => setVistaSuperior('grafico')}
                className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${vistaSuperior === 'grafico' ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                <Clock className="w-4 h-4 mr-2" /> 
                <span>Gráfico</span>
              </button>
              <button
                onClick={() => setVistaSuperior('mapa')}
                className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${vistaSuperior === 'mapa' ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                <Map className="w-4 h-4 mr-2" /> 
                <span>Mapa</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 min-h-[400px]">
            {vistaSuperior === 'grafico' ? (
              <div className="animate-in fade-in duration-300 h-full flex items-center justify-center">
                <div className="w-full">
                  <TimeDistributionChart 
                    minutosAgencias={minutosAgencias} 
                    minutosActividades={minutosActividades} 
                    diasRango={diasRango}
                  />
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300 h-full">
                <MapaWrapper visitas={visitasFiltradas} />
              </div>
            )}
          </div>
          
          {/* Filtros Inteligentes (Afectan Gráfico, Mapa y Lista) */}
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
      </section>

      {/* Sección de Registro Detallado */}
      <section className="pt-2 mt-4 print:break-inside-avoid">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-bold">Registro Detallado</h2>
          
          <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto gap-3">
            {/* Input de búsqueda */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar agencia o actividad..."
                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleExportExcel} 
              disabled={visitasFiltradas.length === 0}
              className="w-full sm:w-auto rounded-xl bg-success text-success-foreground hover:bg-success/90 font-bold shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" /> Excel / CSV
            </Button>
          </div>
        </div>

        {/* Resumen Gerencial Integrado */}
        {visitasFiltradas.length > 0 && (
          <div className="bg-muted/30 p-4 rounded-2xl border border-border mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Agencias</p>
              <div className="flex items-center">
                <Building2 className="w-4 h-4 text-primary mr-2" />
                <span className="text-xl font-black">{agencias.length}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Tiempo Agencias</p>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-primary mr-2" />
                <span className="text-xl font-black">{formatMinutos(minutosAgencias)}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Internas</p>
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 text-warning mr-2" />
                <span className="text-xl font-black">{actividades.length}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Tiempo Internas</p>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-warning mr-2" />
                <span className="text-xl font-black">{formatMinutos(minutosActividades)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Lista Paginada (Siempre Visible) */}
        <div className="space-y-3 animate-in fade-in duration-300">
          {paginados.length === 0 ? (
            <div className="bg-card p-8 rounded-2xl border border-border text-center">
              <p className="text-muted-foreground font-medium">No se encontraron registros en este rango.</p>
            </div>
          ) : (
            paginados.map((v) => {
              let mins = 0
              let colorClass = 'bg-primary/10 text-primary' // Default para en curso
              let borderClass = 'border-border'
              let etiquetaTiempo = ''
              
              const extracto = v.es_actividad 
                ? v.observaciones 
                : (v.temas && v.temas.length > 0 ? `${v.temas.join(', ')}${v.temas_texto_libre ? `: ${v.temas_texto_libre}` : ''}` : v.observaciones)

              if (v.hora_checkin && v.hora_checkout) {
                mins = Math.floor((new Date(v.hora_checkout).getTime() - new Date(v.hora_checkin).getTime()) / 60000)
                etiquetaTiempo = formatMinutos(mins)
                if (mins < 30) {
                  colorClass = 'bg-success/15 text-success' // Verde
                  borderClass = 'border-success/30'
                } else if (mins <= 60) {
                  colorClass = 'bg-warning/15 text-warning-foreground' // Amarillo
                  borderClass = 'border-warning/50'
                } else {
                  colorClass = 'bg-destructive text-destructive-foreground' // Rojo fuerte para >60m
                  borderClass = 'border-destructive ring-1 ring-destructive'
                }
              }

              return (
                <div key={v.id} className={`bg-card p-4 rounded-xl border ${borderClass} shadow-sm flex flex-col print:border-gray-300 print:shadow-none transition-all`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-3 ${v.es_actividad ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                        {v.es_actividad ? <Briefcase className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                          {v.es_actividad ? v.titulo_actividad : v.agenciaNombre}
                          {v.es_actividad && (
                            <span className="text-[9px] uppercase tracking-widest bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">Interna</span>
                          )}
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5 space-x-3">
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Llegada: {formatearFechaHora(v.hora_checkin)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end space-y-1">
                      {v.hora_checkout ? (
                        <>
                          {mins > 60 && (
                            <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-md uppercase flex items-center shadow-sm animate-pulse">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Novedad: Larga
                            </span>
                          )}
                          <span className={`text-xs font-black px-2 py-1 rounded-md ${colorClass} ${mins > 60 ? 'shadow-sm' : ''}`}>
                            {etiquetaTiempo}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase animate-pulse">En Curso</span>
                      )}
                    </div>
                  </div>
                  {extracto && v.hora_checkout && (
                    <div className="mt-3 text-xs text-muted-foreground italic line-clamp-1 border-l-2 border-border pl-2">
                      &quot;{extracto}&quot;
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Controles de Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between pt-2 print:hidden">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={pagina === 1}
              onClick={() => setPagina(p => p - 1)}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={pagina === totalPaginas}
              onClick={() => setPagina(p => p + 1)}
              className="rounded-xl"
            >
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
