'use client'

import dynamic from 'next/dynamic'
import { RefreshCcw, Filter, MapPin, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ITEMS_PER_PAGE = 10

const MapaGlobal = dynamic(() => import('./MapaGlobal'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted animate-pulse rounded-2xl flex items-center justify-center">
      <p className="text-muted-foreground font-medium flex items-center">
        <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
        Conectando al Radar GPS...
      </p>
    </div>
  )
})

const normalizarCiudad = (c: string | undefined | null) => {
  if (!c) return 'Quito'
  const trimmed = c.trim()
  if (!trimmed) return 'Quito'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export function MapaGlobalWrapper({ 
  visitas, 
  todosComerciales = [],
  fechaSeleccionada,
  ubicacionesLive = []
}: { 
  visitas: any[]
  todosComerciales?: any[] 
  fechaSeleccionada: string
  ubicacionesLive?: any[]
}) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<'todas' | 'completadas' | 'curso' | 'alerta'>('todas')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [ciudadFiltro, setCiudadFiltro] = useState<string>('todas')
  const [comercialFiltro, setComercialFiltro] = useState<string>('todos')
  const [tipoActividadFiltro, setTipoActividadFiltro] = useState<'todas' | 'agencias' | 'internas'>('todas')

  const ciudades = useMemo(() => {
    if (todosComerciales && todosComerciales.length > 0) {
      const setCiudades = new Set(todosComerciales.map((c: any) => normalizarCiudad(c.zona)).filter(Boolean))
      return Array.from(setCiudades) as string[]
    }
    const setCiudades = new Set(visitas.map((v: any) => normalizarCiudad(v.agencias?.ciudad || v.usuarios?.zona)).filter(Boolean))
    return Array.from(setCiudades) as string[]
  }, [visitas, todosComerciales])

  const comercialesFiltrados = useMemo(() => {
    if (todosComerciales && todosComerciales.length > 0) {
      let list = todosComerciales
      if (ciudadFiltro !== 'todas') {
        list = list.filter((c: any) => normalizarCiudad(c.zona) === normalizarCiudad(ciudadFiltro))
      }
      const setComerciales = new Set(list.map((c: any) => c.nombre?.trim()).filter(Boolean))
      return Array.from(setComerciales) as string[]
    }
    let list = visitas
    if (ciudadFiltro !== 'todas') {
      list = list.filter(v => normalizarCiudad(v.agencias?.ciudad || v.usuarios?.zona) === normalizarCiudad(ciudadFiltro))
    }
    const setComerciales = new Set(list.map((v: any) => v.usuarios?.nombre?.trim()).filter(Boolean))
    return Array.from(setComerciales) as string[]
  }, [visitas, ciudadFiltro, todosComerciales])

  const ubicacionesLiveFiltradas = useMemo(() => {
    let list = ubicacionesLive
    if (comercialFiltro !== 'todos') {
      list = list.filter((u: any) => u.usuarios?.nombre === comercialFiltro)
    }
    if (ciudadFiltro !== 'todas') {
      list = list.filter((u: any) => u.usuarios?.zona === ciudadFiltro)
    }
    return list
  }, [ubicacionesLive, comercialFiltro, ciudadFiltro])

  const visitasFiltradas = useMemo(() => {
    let filtradas = visitas.filter(v => {
      if (filtro === 'completadas') return v.estado === 'completada'
      if (filtro === 'curso') return v.estado === 'abierta'
      if (filtro === 'alerta') return v.alerta_fraude_checkin || v.alerta_fraude_checkout
      return true
    })

    if (tipoActividadFiltro === 'agencias') {
      filtradas = filtradas.filter(v => !v.es_actividad)
    } else if (tipoActividadFiltro === 'internas') {
      filtradas = filtradas.filter(v => !!v.es_actividad)
    }

    if (ciudadFiltro !== 'todas') {
      filtradas = filtradas.filter(v => normalizarCiudad(v.agencias?.ciudad || v.usuarios?.zona) === normalizarCiudad(ciudadFiltro))
    }

    if (comercialFiltro !== 'todos') {
      filtradas = filtradas.filter(v => v.usuarios?.nombre?.trim() === comercialFiltro.trim())
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtradas = filtradas.filter(v => {
        const comercial = v.usuarios?.nombre?.toLowerCase() || ''
        const agencia = v.agencias?.nombre?.toLowerCase() || ''
        return comercial.includes(searchLower) || agencia.includes(searchLower)
      })
    }

    return filtradas
  }, [visitas, filtro, search, ciudadFiltro, comercialFiltro, tipoActividadFiltro])

  const totalPages = Math.max(1, Math.ceil(visitasFiltradas.length / ITEMS_PER_PAGE))
  const paginatedVisitas = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return visitasFiltradas.slice(start, start + ITEMS_PER_PAGE)
  }, [visitasFiltradas, page])

  useEffect(() => {
    setComercialFiltro('todos')
  }, [ciudadFiltro])

  useEffect(() => {
    setPage(1)
  }, [filtro, search, ciudadFiltro, comercialFiltro, tipoActividadFiltro])

  return (
    <div className="flex flex-col flex-1 bg-card rounded-3xl overflow-hidden relative">
      {/* HEADER / CONTROLES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-3 sm:p-4 border-b border-border/50 bg-background/40 backdrop-blur-xl gap-3 shrink-0 w-full relative z-20">
        
        {/* FILTROS PRINCIPALES & ESTADOS */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
          {/* DATE PICKER */}
          <div className="relative shrink-0 flex items-center">
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => {
                const nuevaFecha = e.target.value
                if (nuevaFecha) {
                  router.push(`/admin/mapa?fecha=${nuevaFecha}`)
                }
              }}
              className="h-[36px] px-3 sm:px-4 rounded-full text-[10px] sm:text-xs font-bold bg-muted/40 hover:bg-muted/60 border border-border/50 shadow-sm focus:ring-0 focus:outline-none focus:ring-primary/50 text-foreground transition-all cursor-pointer"
            />
          </div>

          <Select value={ciudadFiltro} onValueChange={(v) => setCiudadFiltro(v || 'todas')}>
            <SelectTrigger className="w-[140px] h-[36px] px-3 sm:px-4 rounded-full text-[10px] sm:text-xs font-bold bg-muted/40 hover:bg-muted/60 border border-border/50 shadow-sm shrink-0 focus:ring-0 focus:ring-offset-0 truncate transition-all flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary opacity-70 hidden sm:block shrink-0" />
              <span className="text-muted-foreground font-medium">Ciudad:</span>
              <span className="truncate text-foreground capitalize">{ciudadFiltro === 'todas' ? 'Todas' : ciudadFiltro}</span>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start" sideOffset={8} className="rounded-xl border-border/50 shadow-xl backdrop-blur-xl bg-background/95 min-w-[200px] p-2">
              <SelectItem value="todas" className="text-xs font-bold cursor-pointer rounded-lg mb-1">📍 Todas las Ciudades</SelectItem>
              {ciudades.map(c => (
                <SelectItem key={c} value={c} className="text-xs font-medium cursor-pointer rounded-lg">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={comercialFiltro} onValueChange={(v) => setComercialFiltro(v || 'todos')}>
            <SelectTrigger className="w-[155px] h-[36px] px-3 sm:px-4 rounded-full text-[10px] sm:text-xs font-bold bg-muted/40 hover:bg-muted/60 border border-border/50 shadow-sm shrink-0 focus:ring-0 focus:ring-offset-0 truncate transition-all flex items-center gap-1.5">
              <span className="text-primary opacity-70 hidden sm:block shrink-0 text-sm">👤</span>
              <span className="text-muted-foreground font-medium">Comercial:</span>
              <span className="truncate text-foreground capitalize">
                {comercialFiltro === 'todos' ? 'Todos' : comercialFiltro.split(' ')[0]}
              </span>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start" sideOffset={8} className="rounded-xl border-border/50 shadow-xl backdrop-blur-xl bg-background/95 min-w-[220px] p-2">
              <SelectItem value="todos" className="text-xs font-bold cursor-pointer rounded-lg mb-1">👤 Todos los Operativos</SelectItem>
              {comercialesFiltrados.map(c => (
                <SelectItem key={c} value={c} className="text-xs font-medium cursor-pointer rounded-lg">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* DIVIDER */}
          <div className="hidden lg:block w-px h-6 bg-border/60 mx-1 shrink-0" />

          {/* ESTADO BUTTONS */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => setFiltro('todas')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center shrink-0 ${filtro === 'todas' ? 'bg-foreground text-background shadow-md' : 'bg-muted/30 border border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              title="Todas"
            >
              <span>Todas ({visitas.length})</span>
            </button>
            <button 
              onClick={() => setFiltro('curso')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center shrink-0 ${filtro === 'curso' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-muted/30 border border-border/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20'}`}
              title="En Curso"
            >
              <Clock className="w-3.5 h-3.5 mr-1" /> 
              <span>En Curso</span>
            </button>
            <button 
              onClick={() => setFiltro('completadas')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center shrink-0 ${filtro === 'completadas' ? 'bg-success text-success-foreground shadow-md shadow-success/20' : 'bg-muted/30 border border-border/50 text-muted-foreground hover:bg-success/10 hover:text-success hover:border-success/20'}`}
              title="Completadas"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 
              <span>Completadas</span>
            </button>
            <button 
              onClick={() => setFiltro('alerta')}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center shrink-0 ${filtro === 'alerta' ? 'bg-destructive text-destructive-foreground shadow-md shadow-destructive/20' : 'bg-muted/30 border border-border/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20'}`}
              title="Con Alerta"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> 
              <span>Con Alerta</span>
            </button>
          </div>
        </div>

        {/* ACCIONES (ACTUALIZAR) */}
        <div className="flex items-center shrink-0 ml-auto lg:ml-0">
          <button 
            onClick={() => router.refresh()}
            className="bg-muted/40 hover:bg-muted/60 border border-border/50 text-foreground px-4 py-2 rounded-full shadow-sm text-[10px] sm:text-xs font-bold transition-all flex items-center shrink-0 justify-center hover:scale-105"
            title="Actualizar"
          >
            <RefreshCcw className="w-4 h-4 mr-2 opacity-70" />
            Actualizar
          </button>
        </div>
      </div>

      {/* MAPA */}
      <div className="h-[50vh] min-h-[400px] relative z-0 shrink-0">
        <MapaGlobal visitas={visitasFiltradas} ubicacionesLive={ubicacionesLiveFiltradas} />
      </div>

      {/* LISTA INFERIOR */}
      <div className="border-t border-border bg-background flex flex-col z-10 relative flex-1">
        <div className="sticky top-0 bg-muted/50 backdrop-blur-md border-b border-border p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0 z-20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 w-full">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center whitespace-nowrap">
              <Filter className="w-4 h-4 mr-1.5" />
              Viendo {visitasFiltradas.length} registros
            </h3>
            
            <div className="flex bg-muted p-1 rounded-xl shadow-inner w-full lg:w-auto">
              <button
                onClick={() => setTipoActividadFiltro('todas')}
                className={`flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${tipoActividadFiltro === 'todas' ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setTipoActividadFiltro('agencias')}
                className={`flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${tipoActividadFiltro === 'agencias' ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                Agencias
              </button>
              <button
                onClick={() => setTipoActividadFiltro('internas')}
                className={`flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${tipoActividadFiltro === 'internas' ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                Actividades
              </button>
            </div>
            
            <div className="relative w-full lg:flex-1 lg:max-w-[300px] lg:ml-auto">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar por agencia..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="pl-8 h-9 text-xs rounded-lg w-full bg-background" 
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          {visitasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
              <MapPin className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">No hay visitas en esta categoría</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paginatedVisitas.map((v: any) => {
                const esFraude = v.alerta_fraude_checkin || v.alerta_fraude_checkout
                const esActiva = v.estado === 'abierta'
                
                return (
                  <div key={v.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${esFraude ? 'bg-destructive animate-pulse' : (esActiva ? 'bg-primary' : 'bg-success')}`} />
                        <p className="font-bold text-sm text-foreground line-clamp-1">{v.es_actividad ? v.titulo_actividad : (v.agencias?.nombre || 'Agencia N/A')}</p>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center">
                        <span className="text-foreground">{v.usuarios?.nombre}</span> 
                        <span className="mx-1.5 opacity-30">•</span> 
                        {new Date(v.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${esActiva ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                        {esActiva ? 'En Ruta' : 'Completada'}
                      </span>
                      {esFraude && (
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Alerta
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="sticky bottom-0 p-3 border-t border-border bg-muted/10 flex items-center justify-between shrink-0 backdrop-blur-md">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Pág {page} de {totalPages}
            </span>
            <div className="flex space-x-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded bg-background border border-border disabled:opacity-50 hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded bg-background border border-border disabled:opacity-50 hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
