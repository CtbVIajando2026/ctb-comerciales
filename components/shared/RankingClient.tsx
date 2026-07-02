"use client"

import { useMemo, useEffect, useState } from 'react'
import { Trophy, MapPin, Award, Star, Briefcase, Filter, CalendarDays } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function RankingClient({ datos }: { datos: any }) {
  const { visitas, comerciales } = datos
  const [mounted, setMounted] = useState(false)
  const [filtroZona, setFiltroZona] = useState<string>('Global')
  const [timeFilter, setTimeFilter] = useState<string>(() => {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: 'numeric' })
    const parts = formatter.formatToParts(new Date())
    const y = parts.find(p => p.type === 'year')?.value || '2026'
    const m = (parts.find(p => p.type === 'month')?.value || '07').padStart(2, '0')
    return `${y}-${m}` // Por defecto el mes actual en Ecuador: YYYY-MM
  })

  useEffect(() => {
    // Retraso para que la animación se vea después de cargar la página
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const zonas = useMemo(() => {
    const setZonas = new Set<string>()
    comerciales.forEach((c: any) => {
      if (c.ciudad_zona) setZonas.add(c.ciudad_zona)
    })
    return Array.from(setZonas).sort()
  }, [comerciales])

  const ranking = useMemo(() => {
    const mapa: Record<string, { nombre: string, zona: string, visitas: number, actividades: number, avatar: string }> = {}
    
    comerciales.forEach((c: any) => {
      const zona = c.ciudad_zona || 'Global'
      if (filtroZona !== 'Global' && zona !== filtroZona) return

      mapa[c.id] = {
        nombre: c.nombre_completo,
        zona,
        visitas: 0,
        actividades: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre_completo)}&background=random`
      }
    })

    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: 'numeric', day: 'numeric' })
    const getParts = (d: Date) => {
      const parts = formatter.formatToParts(d)
      const y = parts.find(p => p.type === 'year')?.value || ''
      const m = (parts.find(p => p.type === 'month')?.value || '').padStart(2, '0')
      const dNum = (parts.find(p => p.type === 'day')?.value || '').padStart(2, '0')
      return { year: y, month: m, day: dNum, yyyyMm: `${y}-${m}`, yyyyMmDd: `${y}-${m}-${dNum}` }
    }
    const ecNow = getParts(now)

    visitas.forEach((v: any) => {
      if (v.estado === 'completada') {
        const fechaVisita = new Date(v.created_at)
        const vParts = getParts(fechaVisita)

        let passesTimeFilter = false
        if (timeFilter === 'hoy') {
          passesTimeFilter = vParts.yyyyMmDd === ecNow.yyyyMmDd
        } else if (timeFilter === 'semana') {
          const msInWeek = 7 * 24 * 60 * 60 * 1000
          passesTimeFilter = now.getTime() - fechaVisita.getTime() < msInWeek
        } else if (timeFilter.length === 7) {
          passesTimeFilter = vParts.yyyyMm === timeFilter
        } else if (timeFilter.length === 4) {
          passesTimeFilter = vParts.year === timeFilter
        } else {
          passesTimeFilter = true
        }

        if (!passesTimeFilter) return

        const comercialZona = v.usuarios?.zona || 'Global'
        if (filtroZona !== 'Global' && comercialZona !== filtroZona) return

        if (!mapa[v.comercial_id]) {
          const nombre = v.usuarios?.nombre || 'Usuario Registrado'
          mapa[v.comercial_id] = {
            nombre,
            zona: comercialZona,
            visitas: 0,
            actividades: 0,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`
          }
        }
        if (v.es_actividad) {
          mapa[v.comercial_id].actividades += 1
        } else {
          mapa[v.comercial_id].visitas += 1
        }
      }
    })

    return Object.values(mapa).sort((a, b) => b.visitas - a.visitas)
  }, [visitas, comerciales, filtroZona])

  const top3 = ranking.slice(0, 3)
  const maxVisitasTop3 = Math.max(...top3.map(c => c.visitas), 1)

  // Maximos para calcular anchos relativos
  const maxVisitas = Math.max(...ranking.map(c => c.visitas), 1)
  const maxActividades = Math.max(...ranking.map(c => c.actividades), 1)

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-24 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 mt-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-blue-500/20 to-indigo-500/10 rounded-2xl mb-2 border border-blue-500/20 shadow-inner">
          <Trophy className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
          Ranking de Efectividad
        </h1>
        <p className="text-muted-foreground text-sm font-medium tracking-wide">
          {timeFilter === 'hoy' ? 'Desempeño comercial de Hoy' : 
           timeFilter === 'semana' ? 'Desempeño comercial de los últimos 7 días' : 
           timeFilter.length === 7 ? 'Desempeño comercial del mes seleccionado' :
           timeFilter.length === 4 ? 'Desempeño comercial del año seleccionado' :
           'Desempeño comercial'}
        </p>

        {/* SELECTORES DE FILTRO */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          
          <div className="flex items-center space-x-2 bg-card border border-border p-1 rounded-xl shadow-sm">
            <Filter className="w-4 h-4 text-muted-foreground ml-3" />
            <Select value={filtroZona} onValueChange={(val) => setFiltroZona(val ?? 'Global')}>
              <SelectTrigger className="w-[180px] sm:w-[220px] h-10 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 font-bold text-foreground">
                <SelectValue placeholder="Filtrar por Zona" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Global" className="font-bold">🌎 Todo el País</SelectItem>
                {zonas.map(z => (
                  <SelectItem key={z} value={z}>📍 {z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 bg-card border border-border p-1 rounded-xl shadow-sm">
            <CalendarDays className="w-4 h-4 text-muted-foreground ml-3" />
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-[180px] sm:w-[220px] h-10 px-3 bg-transparent border-0 font-bold text-foreground outline-none cursor-pointer"
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
          </div>

        </div>
      </div>

      {/* TOP 3 BARRAS VERTICALES ANIMADAS */}
      <div className="flex justify-center items-end h-[350px] gap-4 md:gap-8 max-w-3xl mx-auto px-4 mt-12 mb-16">
        
        {/* 2do Lugar */}
        {top3[1] && (
          <div className="flex flex-col items-center flex-1 max-w-[120px] group">
            <div className="relative mb-4 text-center">
              <img src={top3[1].avatar} className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-[3px] border-card shadow-lg z-10 relative" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-20">2DO</div>
            </div>
            <div className="w-full relative flex items-end justify-center rounded-t-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all duration-1000 ease-out" 
                 style={{ height: mounted ? `${Math.max(40, (top3[1].visitas / maxVisitasTop3) * 200)}px` : '0px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-300 to-slate-400 opacity-90"></div>
              <span className="relative z-10 font-black text-2xl text-slate-800 mb-2">{top3[1].visitas}</span>
            </div>
            <h3 className="font-bold text-xs text-foreground mt-3 line-clamp-1 text-center w-full">{top3[1].nombre}</h3>
          </div>
        )}

        {/* 1er Lugar */}
        {top3[0] && (
          <div className="flex flex-col items-center flex-1 max-w-[140px] group z-10">
            <div className="relative mb-4 text-center">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                <Trophy className="w-6 h-6 text-amber-500 drop-shadow-md" />
              </div>
              <img src={top3[0].avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-[4px] border-amber-400 shadow-xl z-10 relative" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[10px] font-black px-3 py-0.5 rounded-full shadow-sm z-20 whitespace-nowrap">1ER</div>
            </div>
            <div className="w-full relative flex items-end justify-center rounded-t-2xl overflow-hidden bg-amber-100 dark:bg-amber-900/30 transition-all duration-1000 delay-100 ease-out" 
                 style={{ height: mounted ? '240px' : '0px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-amber-400 to-amber-500 opacity-90"></div>
              <span className="relative z-10 font-black text-4xl text-amber-950 mb-4">{top3[0].visitas}</span>
            </div>
            <h3 className="font-black text-sm text-foreground mt-3 line-clamp-1 text-center w-full">{top3[0].nombre}</h3>
          </div>
        )}

        {/* 3er Lugar */}
        {top3[2] && (
          <div className="flex flex-col items-center flex-1 max-w-[120px] group">
            <div className="relative mb-4 text-center">
              <img src={top3[2].avatar} className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-[3px] border-card shadow-lg z-10 relative" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-20">3ER</div>
            </div>
            <div className="w-full relative flex items-end justify-center rounded-t-2xl overflow-hidden bg-orange-100 dark:bg-orange-900/30 transition-all duration-1000 delay-200 ease-out" 
                 style={{ height: mounted ? `${Math.max(30, (top3[2].visitas / maxVisitasTop3) * 200)}px` : '0px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500 to-orange-600 opacity-90"></div>
              <span className="relative z-10 font-black text-2xl text-white mb-2">{top3[2].visitas}</span>
            </div>
            <h3 className="font-bold text-xs text-foreground mt-3 line-clamp-1 text-center w-full">{top3[2].nombre}</h3>
          </div>
        )}
      </div>

      {/* LISTA COMPLETA CON BARRAS HORIZONTALES */}
      <div className="max-w-4xl mx-auto px-4 md:px-0 mt-8">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center">
            <Award className="w-4 h-4 mr-2" />
            Rendimiento del Equipo
          </h3>
        </div>
        
        <div className="space-y-4">
          {ranking.map((c, i) => {
            const pctVisitas = c.visitas === 0 ? 0 : Math.max(5, (c.visitas / maxVisitas) * 100);
            const pctActividades = c.actividades === 0 ? 0 : Math.max(5, (c.actividades / maxActividades) * 100);
            const isTop3 = i < 3;

            return (
              <div key={c.nombre} className="bg-card rounded-3xl p-5 shadow-sm border border-border flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-shadow">
                
                <div className="flex items-center gap-4 w-full md:w-1/3 shrink-0">
                  <div className={`w-8 font-black text-center text-lg ${isTop3 ? 'text-primary' : 'text-muted-foreground/60'}`}>{i + 1}</div>
                  <img src={c.avatar} className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-border" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm sm:text-base truncate">{c.nombre}</p>
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center mt-0.5 truncate">
                      <MapPin className="w-3 h-3 mr-1 opacity-50 shrink-0"/> {c.zona}
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  {/* Barra Visitas */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center tracking-wider">
                        <MapPin className="w-3 h-3 mr-1" /> Visitas Reales
                      </span>
                      <span className="font-black text-blue-600">{c.visitas}</span>
                    </div>
                    <div className="h-2.5 w-full bg-blue-500/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: mounted ? `${pctVisitas}%` : '0%' }}></div>
                    </div>
                  </div>

                  {/* Barra Actividades */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-orange-500 uppercase flex items-center tracking-wider">
                        <Briefcase className="w-3 h-3 mr-1" /> Actividades Internas
                      </span>
                      <span className="font-black text-orange-600">{c.actividades}</span>
                    </div>
                    <div className="h-2.5 w-full bg-orange-500/10 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out delay-100" style={{ width: mounted ? `${pctActividades}%` : '0%' }}></div>
                    </div>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
