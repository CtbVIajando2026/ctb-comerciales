'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, MapPin, Phone, Target, Edit2, ShieldAlert, Award, CalendarDays, Filter, Trophy, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { obtenerRankingAgregado } from '@/app/(admin)/rankingActions'

export function DirectorioComercialesClient({ initialData, isComercialView = false }: { initialData: any[], isComercialView?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<string>(() => {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: 'numeric' })
    const parts = formatter.formatToParts(new Date())
    const y = parts.find(p => p.type === 'year')?.value || '2026'
    const m = (parts.find(p => p.type === 'month')?.value || '07').padStart(2, '0')
    return `${y}-${m}` // Por defecto el mes actual en Ecuador: YYYY-MM
  })

  const [isPending, startTransition] = useTransition()
  // Store the fetched aggregate data
  const [agregadosServidor, setAgregadosServidor] = useState<any[]>(initialData) // Initially it holds the data passed from the server

  // Fetch new data when timeFilter changes
  useEffect(() => {
    // Avoid double fetching on mount because initialData already matches the default timeFilter
    const defaultYm = `${new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric' }).formatToParts(new Date()).find(p => p.type === 'year')?.value || '2026'}-${(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', month: 'numeric' }).formatToParts(new Date()).find(p => p.type === 'month')?.value || '07').padStart(2, '0')}`
    
    // We can just fetch it anyway to ensure consistency if the user changes it immediately
    startTransition(async () => {
      const data = await obtenerRankingAgregado(timeFilter, 'Global')
      setAgregadosServidor(data)
    })
  }, [timeFilter])

  const processedData = useMemo(() => {
    return initialData.map(user => {
      // Find the aggregated stats for this user
      const stats = agregadosServidor.find(s => (s.comercial_id === user.id) || (s.id === user.id))
      // If it came from initialData, it already has visitas_mes. If it came from the server action, it has visitas.
      const visitasReales = stats?.visitas !== undefined ? stats.visitas : (stats?.visitas_mes || 0)

      return {
        ...user,
        visitas_mes: visitasReales
      }
    })
  }, [initialData, agregadosServidor])

  const filteredData = useMemo(() => {
    const data = processedData.filter(user => {
      const matchesSearch = 
        user.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.ciudad_zona?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRol = filtroRol === 'all' || user.rol === filtroRol

      return matchesSearch && matchesRol
    })

    // Sort as a ranking (most visits first)
    return data.sort((a, b) => (b.visitas_mes || 0) - (a.visitas_mes || 0))
  }, [processedData, searchTerm, filtroRol])

  const totalUsuarios = initialData.length
  const totalActivos = initialData.filter(u => u.activo).length
  const totalComerciales = initialData.filter(u => u.rol === 'comercial').length

  return (
    <div className="space-y-6">
      
      {/* Kpis rápidos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border p-3 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Usuarios</p>
          <div className="text-2xl font-black">{totalUsuarios}</div>
        </div>
        <div className="bg-card border border-border p-3 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-success">Activos</p>
          <div className="text-2xl font-black text-success">{totalActivos}</div>
        </div>
        <div className="bg-card border border-border p-3 rounded-2xl shadow-sm text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-primary">Comerciales</p>
          <div className="text-2xl font-black text-primary">{totalComerciales}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border-border rounded-xl pl-9 text-sm h-11"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <div className="flex bg-muted/50 p-1 rounded-xl shrink-0 border border-border/50">
            <button onClick={() => setFiltroRol('all')} className={`px-4 py-2 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all whitespace-nowrap ${filtroRol === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Todos</button>
            <button onClick={() => setFiltroRol('comercial')} className={`px-4 py-2 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all whitespace-nowrap ${filtroRol === 'comercial' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Comerciales</button>
            <button onClick={() => setFiltroRol('admin')} className={`px-4 py-2 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all whitespace-nowrap ${filtroRol === 'admin' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Admin</button>
          </div>
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-card text-[11px] font-bold uppercase tracking-wider text-foreground outline-none cursor-pointer shrink-0"
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Últimos 7 días</option>
            <optgroup label="Por Mes">
              {Array.from({ 
                length: parseInt(
                  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', month: 'numeric' })
                    .formatToParts(new Date()).find(p => p.type === 'month')?.value || '12'
                ) 
              }).map((_, i) => {
                const year = parseInt(
                  new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric' })
                    .formatToParts(new Date()).find(p => p.type === 'year')?.value || '2026'
                );
                const month = i + 1;
                const val = `${year}-${month.toString().padStart(2, '0')}`;
                const mesNom = new Date(year, i, 1).toLocaleString('es-ES', { month: 'long' });
                return <option key={val} value={val}>{mesNom} {year}</option>
              }).reverse()}
            </optgroup>
            <optgroup label="Por Año">
              <option value={new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric' }).formatToParts(new Date()).find(p => p.type === 'year')?.value || '2026'}>
                Todo el {new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric' }).formatToParts(new Date()).find(p => p.type === 'year')?.value || '2026'}
              </option>
            </optgroup>
          </select>
          {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Top 4 Inteligente */}
      {filteredData.length > 0 && (filteredData[0].visitas_mes || 0) > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-amber-500" /> Líderes {searchTerm ? 'de la Búsqueda' : 'del Equipo'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {filteredData.slice(0, 4).filter(u => (u.visitas_mes || 0) > 0).map((leader, index) => {
              const styles = [
                {
                  bg: "from-amber-400 to-amber-600 border-amber-300 shadow-amber-500/30",
                  text: "text-amber-100",
                  badgeBg: "bg-white text-amber-600",
                  badgeLabel: "1ER LUGAR"
                },
                {
                  bg: "from-slate-400 to-slate-600 border-slate-300 shadow-slate-500/30",
                  text: "text-slate-100",
                  badgeBg: "bg-white text-slate-700",
                  badgeLabel: "2DO LUGAR"
                },
                {
                  bg: "from-orange-500 to-orange-700 border-orange-400 shadow-orange-600/30",
                  text: "text-orange-100",
                  badgeBg: "bg-white text-orange-800",
                  badgeLabel: "3ER LUGAR"
                },
                {
                  bg: "from-blue-500 to-blue-700 border-blue-400 shadow-blue-600/30",
                  text: "text-blue-100",
                  badgeBg: "bg-white text-blue-800",
                  badgeLabel: "4TO LUGAR"
                }
              ]
              const style = styles[index]

              return (
                <div key={`leader-${leader.id}`} className={`bg-gradient-to-br ${style.bg} border rounded-3xl p-4 md:p-5 shadow-lg text-white relative overflow-hidden flex flex-col justify-between h-[160px] md:h-[180px] animate-in zoom-in-95 duration-500 delay-${index * 100}`}>
                  {/* Decoración de fondo */}
                  <Award className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
                  
                  <div className="flex items-start justify-between z-10">
                    <div className="flex flex-col">
                      <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block w-max mb-2 shadow-sm ${style.badgeBg}`}>
                        {style.badgeLabel}
                      </div>
                      <h3 className="font-black text-sm md:text-base leading-tight line-clamp-2">{leader.nombre_completo}</h3>
                      <p className={`${style.text} text-[10px] md:text-xs font-medium flex items-center mt-1 truncate max-w-full`}>
                        <MapPin className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate">{leader.ciudad_zona || 'Global'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="z-10 flex items-end justify-between mt-auto">
                    <div className="flex -space-x-2 mr-2">
                       <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg md:text-xl border-2 border-white/40 shadow-inner">
                        {leader.nombre_completo?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`${style.text} text-[9px] uppercase tracking-widest font-bold mb-[-2px]`}>Visitas</p>
                      <p className="font-black text-3xl md:text-4xl leading-none">{leader.visitas_mes}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredData.length === 0 ? (
          <div className="col-span-full bg-card p-12 text-center rounded-3xl border border-border">
            <Filter className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground">Sin resultados</h3>
            <p className="text-xs text-muted-foreground mt-1">No se encontraron usuarios con esos filtros.</p>
          </div>
        ) : (
          filteredData.map((user, index) => {
            const isAdmin = user.rol === 'admin'
            
            return (
              <div key={user.id} className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group flex flex-col h-full">
                {/* Ranking Badge if top 3 */}
                {index < 3 && user.visitas_mes > 0 && (
                  <div className={`absolute top-0 right-6 px-3 py-1 rounded-b-lg font-black text-xs text-white shadow-md z-10 flex items-center justify-center ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-700'}`}>
                    #{index + 1}
                  </div>
                )}
                {/* Banda de color superior según rol */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${isAdmin ? 'bg-primary' : 'bg-secondary'}`} />
                
                <div className="flex justify-between items-start mt-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner ${isAdmin ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-secondary/20 text-secondary-foreground border border-secondary/30'}`}>
                      {user.nombre_completo?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground leading-tight line-clamp-1">{user.nombre_completo}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-secondary-foreground'}`}>
                        {user.rol}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    {user.activo ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="Activo" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-destructive" title="Inactivo" />
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 mb-6">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 mr-3 shrink-0" />
                    <span className="truncate">{user.telefono || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 mr-3 shrink-0" />
                    <span className="truncate font-medium">{user.ciudad_zona || 'Global'}</span>
                  </div>
                </div>

                {/* Métricas de Rendimiento del Mes (Si es comercial o tiene meta) */}
                <div className="mt-auto">
                  {user.rol === 'comercial' ? (
                    <div className="bg-muted/30 rounded-2xl p-3 border border-border/50 grid grid-cols-2 gap-2 mb-4">
                      <div className={user.meta_diaria > 0 ? "" : "col-span-2 text-center"}>
                        <p className={`text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center ${user.meta_diaria > 0 ? '' : 'justify-center'}`}><CalendarDays className="w-3 h-3 mr-1"/> {timeFilter === 'hoy' ? 'Visitas Hoy' : timeFilter === 'semana' ? 'Visitas Sem.' : timeFilter.length === 7 ? 'Visitas Mes' : timeFilter.length === 4 ? 'Visitas Año' : 'Visitas'}</p>
                        <p className="font-black text-lg leading-none">{user.visitas_mes}</p>
                      </div>
                      {user.meta_diaria > 0 && (
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center justify-end"><Target className="w-3 h-3 mr-1"/> Meta Diaria</p>
                          <p className="font-black text-lg leading-none">{user.meta_diaria}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-[76px] mb-4"></div>
                  )}

                  {!isComercialView && (
                    <div className="pt-4 border-t border-border flex gap-2">
                      <Link 
                        href={`/admin/comerciales/${user.id}/editar`}
                        className="flex-1 bg-background border border-border hover:bg-muted text-foreground text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-2" />
                        Editar
                      </Link>
                      {!isAdmin && (
                        <Link 
                          href={`/admin/comerciales/${user.id}/metricas`}
                          className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center"
                        >
                          <Target className="w-3.5 h-3.5 mr-2" />
                          Métricas
                        </Link>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
