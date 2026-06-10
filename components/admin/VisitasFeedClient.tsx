"use client"

import { useState } from "react"
import { ExportarExcelButton } from "./ExportarExcelButton"
import { Building2, Clock, MapPin, User, Search, Filter, ShieldAlert, Timer } from "lucide-react"
import { differenceInMinutes } from 'date-fns'

const normalizarCiudad = (c: string | undefined | null) => {
  if (!c) return 'Quito'
  const trimmed = c.trim()
  if (!trimmed) return 'Quito'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export function VisitasFeedClient({ visitasIniciales }: { visitasIniciales: any[] }) {
  // State for filters
  const [search, setSearch] = useState("")
  const [filtroTiempo, setFiltroTiempo] = useState("Todas") // Todas, Hoy, Semana, Mes, Especifica
  const [fechaEspecifica, setFechaEspecifica] = useState("")
  const [filtroCiudad, setFiltroCiudad] = useState("Todas")
  const [filtroComercial, setFiltroComercial] = useState("Todos")
  const [showFiltros, setShowFiltros] = useState(false)

  // Extract unique filter options
  const ciudadesUnicas = Array.from(new Set(visitasIniciales.map(v => normalizarCiudad(v.agencias?.ciudad || v.usuarios?.zona)).filter(Boolean))).sort()
  const comercialesUnicos = Array.from(new Set(visitasIniciales.map(v => v.usuarios?.nombre?.trim()).filter(Boolean))).sort()

  const filtradas = visitasIniciales.filter(v => {
    const agenciaNombre = v.agencias?.nombre || v.titulo_actividad || ""
    const comercialNombre = v.usuarios?.nombre?.trim() || ""
    const ciudad = normalizarCiudad(v.agencias?.ciudad || v.usuarios?.zona)
    const fecha = new Date(v.created_at)

    // Text search
    const matchSearch = agenciaNombre.toLowerCase().includes(search.toLowerCase()) || 
                        comercialNombre.toLowerCase().includes(search.toLowerCase()) ||
                        (v.observaciones || "").toLowerCase().includes(search.toLowerCase())

    // City
    const matchCiudad = filtroCiudad === "Todas" || ciudad === normalizarCiudad(filtroCiudad)

    // Comercial
    const matchComercial = filtroComercial === "Todos" || comercialNombre === filtroComercial.trim()

    // Time
    let matchTiempo = true
    const hoy = new Date()
    if (filtroTiempo === "Hoy") {
      matchTiempo = fecha.toDateString() === hoy.toDateString()
    } else if (filtroTiempo === "Semana") {
      const msInWeek = 7 * 24 * 60 * 60 * 1000
      matchTiempo = hoy.getTime() - fecha.getTime() < msInWeek
    } else if (filtroTiempo === "Mes") {
      matchTiempo = fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
    } else if (filtroTiempo === "Especifica" && fechaEspecifica) {
      const yyyy = fecha.getFullYear()
      const mm = String(fecha.getMonth() + 1).padStart(2, '0')
      const dd = String(fecha.getDate()).padStart(2, '0')
      const fechaFormato = `${yyyy}-${mm}-${dd}`
      matchTiempo = fechaFormato === fechaEspecifica
    }

    return matchSearch && matchCiudad && matchComercial && matchTiempo
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Buscar por agencia, comercial o texto..."
              className="pl-10 h-11 w-full bg-card rounded-xl border border-border px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFiltros(!showFiltros)}
            className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-colors border ${showFiltros ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:bg-muted'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
        
        <div className="shrink-0">
          <ExportarExcelButton datos={filtradas} />
        </div>
      </div>

      {showFiltros && (
        <div className="bg-card p-4 rounded-2xl border border-border grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Fecha</label>
            <div className="space-y-2">
              <select 
                className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                value={filtroTiempo}
                onChange={(e) => setFiltroTiempo(e.target.value)}
              >
                <option value="Todas">Todas las fechas</option>
                <option value="Hoy">Hoy</option>
                <option value="Semana">Últimos 7 días</option>
                <option value="Mes">Este Mes</option>
                <option value="Especifica">Día Específico...</option>
              </select>
              {filtroTiempo === "Especifica" && (
                <input 
                  type="date" 
                  className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                  value={fechaEspecifica}
                  onChange={(e) => setFechaEspecifica(e.target.value)}
                />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Ciudad</label>
            <select 
              className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={filtroCiudad}
              onChange={(e) => setFiltroCiudad(e.target.value)}
            >
              <option value="Todas">Todas las ciudades</option>
              {ciudadesUnicas.map(c => <option key={c} value={c as string}>{c as string}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Comercial</label>
            <select 
              className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={filtroComercial}
              onChange={(e) => setFiltroComercial(e.target.value)}
            >
              <option value="Todos">Todos los comerciales</option>
              {comercialesUnicos.map(c => <option key={c} value={c as string}>{c as string}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="font-bold text-foreground">Resultados ({filtradas.length})</h2>
        </div>
        
        <div className="divide-y divide-border">
          {filtradas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No se encontraron visitas con los filtros aplicados.
            </div>
          ) : (
            filtradas.map(v => {
              const esFraude = v.alerta_fraude_checkin || v.alerta_fraude_checkout
              return (
                <div key={v.id} className="p-4 hover:bg-muted/50 transition-colors flex flex-col md:flex-row gap-4">
                  <div className="md:w-48 shrink-0 space-y-1">
                    <div className="text-xs font-bold text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString('es-EC')}
                    </div>
                    <div className="text-sm font-black text-foreground">
                      {new Date(v.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center text-xs font-medium text-primary bg-primary/10 w-fit px-2 py-0.5 rounded-full uppercase tracking-wider mt-1">
                      {Array.isArray(v.temas) ? v.temas.join(', ') : (v.temas || 'Visita')}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground flex items-center">
                          <Building2 className="w-4 h-4 mr-1.5 text-muted-foreground" />
                          {v.agencias?.nombre || v.titulo_actividad || 'Desconocido'}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-0.5">
                          <User className="w-3 h-3 mr-1" />
                          {v.usuarios?.nombre || 'Comercial'}
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0 space-y-1">
                        {v.hora_checkin && v.hora_checkout && differenceInMinutes(new Date(v.hora_checkout), new Date(v.hora_checkin)) > 0 && (
                          <div className="text-xs font-bold bg-muted px-2 py-1 rounded-lg flex items-center text-foreground justify-end">
                            <Timer className="w-3 h-3 mr-1 text-primary" />
                            {differenceInMinutes(new Date(v.hora_checkout), new Date(v.hora_checkin))} min
                          </div>
                        )}
                        {(v.agencias?.ciudad || v.usuarios?.zona) && (
                          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-end">
                            <MapPin className="w-3 h-3 mr-1" />
                            {v.agencias?.ciudad || v.usuarios?.zona}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {v.observaciones && (
                      <p className="text-sm text-foreground bg-background border border-border p-3 rounded-xl mt-2">
                        "{v.observaciones}"
                      </p>
                    )}
                    
                    {esFraude && (
                      <div className="flex items-center text-xs font-bold text-destructive bg-destructive/10 px-2 py-1.5 rounded-lg w-fit mt-2">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                        Alerta de Lejanía ({(v.distancia_checkin_metros || 0).toFixed(0)}m de la agencia)
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
