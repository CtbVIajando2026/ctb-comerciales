"use client"

import { useMemo, useEffect, useState, useTransition } from 'react'
import { Trophy, MapPin, Award, Briefcase, Filter, CalendarDays, Loader2, Flame, Star, Medal } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obtenerRankingAgregado } from '@/app/(admin)/rankingActions'

export function RankingClient({ datos }: { datos: any }) {
  const { comerciales } = datos
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [rankingAgregado, setRankingAgregado] = useState<any[]>([])

  const [filtroZona, setFiltroZona] = useState<string>('Global')
  const [timeFilter, setTimeFilter] = useState<string>(() => {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: 'numeric' })
    const parts = formatter.formatToParts(new Date())
    const y = parts.find(p => p.type === 'year')?.value || '2026'
    const m = (parts.find(p => p.type === 'month')?.value || '07').padStart(2, '0')
    return `${y}-${m}` // Por defecto el mes actual en Ecuador
  })

  useEffect(() => {
    startTransition(async () => {
      const data = await obtenerRankingAgregado(timeFilter, filtroZona)
      setRankingAgregado(data)
    })
  }, [timeFilter, filtroZona])

  useEffect(() => {
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

  const calcularNivel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1

  const ranking = useMemo(() => {
    const mapa: Record<string, any> = {}
    
    comerciales.forEach((c: any) => {
      const zona = c.ciudad_zona || 'Global'
      if (filtroZona !== 'Global' && zona !== filtroZona) return

      mapa[c.id] = {
        nombre: c.nombre_completo,
        zona,
        visitas: 0,
        actividades: 0,
        puntos: 0,
        xp: 0,
        racha: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre_completo)}&background=random`
      }
    })

    rankingAgregado.forEach(r => {
      if (mapa[r.comercial_id]) {
        mapa[r.comercial_id].visitas = r.visitas
        mapa[r.comercial_id].actividades = r.actividades
        mapa[r.comercial_id].puntos = r.puntos_mes_actual || 0
        mapa[r.comercial_id].xp = r.xp_total || 0
        mapa[r.comercial_id].racha = r.racha_dias || 0
      }
    })

    // Ordenar por puntos (si no tienen puntos aún, por visitas)
    return Object.values(mapa).sort((a, b) => b.puntos - a.puntos || b.visitas - a.visitas)
  }, [comerciales, filtroZona, rankingAgregado])

  // Solo mostrar en el podio a quienes tienen al menos 1 punto o 1 visita
  const top3 = ranking.filter(c => c.puntos > 0 || c.visitas > 0).slice(0, 3)
  const maxScoreTop3 = Math.max(...top3.map(c => c.puntos > 0 ? c.puntos : c.visitas), 1)

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-24 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 mt-8">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-amber-500/20 to-orange-500/10 rounded-2xl mb-2 border border-amber-500/20 shadow-inner">
          <Trophy className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
          Ranking Élite
        </h1>
        <p className="text-muted-foreground text-sm font-medium tracking-wide flex items-center justify-center gap-2">
           {isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
           Demuestra quién es el número 1.
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
      {top3.length > 0 ? (
        <div className="flex justify-center items-end h-[380px] gap-4 md:gap-8 max-w-3xl mx-auto px-4 mt-12 mb-16">
          
          {/* 2do Lugar */}
          {top3[1] && (
          <div className="flex flex-col items-center flex-1 max-w-[120px] group">
            <div className="relative mb-4 text-center">
              <img src={top3[1].avatar} className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-[3px] border-slate-300 shadow-lg z-10 relative" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-20">2DO</div>
              <div className="absolute -right-3 -top-2 bg-background border border-border text-xs px-1.5 py-0.5 rounded-md font-bold shadow-sm z-20 flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-0.5 fill-yellow-500" /> {calcularNivel(top3[1].xp)}
              </div>
            </div>
            <div className="w-full relative flex items-end justify-center rounded-t-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all duration-1000 ease-out" 
                 style={{ height: mounted ? `${Math.max(60, ((top3[1].puntos || top3[1].visitas) / maxScoreTop3) * 200)}px` : '0px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-300 to-slate-400 opacity-90"></div>
              <span className="relative z-10 font-black text-xl text-slate-800 mb-2">{top3[1].puntos || top3[1].visitas} pts</span>
            </div>
            <h3 className="font-bold text-xs text-foreground mt-3 line-clamp-1 text-center w-full">{top3[1].nombre}</h3>
          </div>
        )}

        {/* 1er Lugar */}
        {top3[0] && (
          <div className="flex flex-col items-center flex-1 max-w-[140px] group z-10">
            <div className="relative mb-4 text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                <Trophy className="w-7 h-7 text-amber-500 drop-shadow-lg" />
              </div>
              <img src={top3[0].avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-[4px] border-amber-400 shadow-xl z-10 relative" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[10px] font-black px-3 py-0.5 rounded-full shadow-sm z-20 whitespace-nowrap">1ER</div>
              <div className="absolute -right-4 -top-0 bg-background border border-border text-xs px-1.5 py-0.5 rounded-md font-bold shadow-sm z-20 flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-0.5 fill-yellow-500" /> {calcularNivel(top3[0].xp)}
              </div>
            </div>
            <div className="w-full relative flex items-end justify-center rounded-t-2xl overflow-hidden bg-amber-100 dark:bg-amber-900/30 transition-all duration-1000 delay-100 ease-out shadow-lg" 
                 style={{ height: mounted ? '240px' : '0px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-amber-400 to-amber-500 opacity-90"></div>
              <span className="relative z-10 font-black text-2xl text-amber-950 mb-4">{top3[0].puntos || top3[0].visitas} pts</span>
            </div>
            <h3 className="font-black text-sm text-foreground mt-3 line-clamp-1 text-center w-full">{top3[0].nombre}</h3>
          </div>
        )}

        {/* 3er Lugar */}
        {top3[2] && (
          <div className="flex flex-col items-center flex-1 max-w-[120px] group">
            <div className="relative mb-4 text-center">
              <img src={top3[2].avatar} className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-[3px] border-orange-400 shadow-lg z-10 relative" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-20">3ER</div>
              <div className="absolute -right-3 -top-2 bg-background border border-border text-xs px-1.5 py-0.5 rounded-md font-bold shadow-sm z-20 flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-0.5 fill-yellow-500" /> {calcularNivel(top3[2].xp)}
              </div>
            </div>
            <div className="w-full relative flex items-end justify-center rounded-t-2xl overflow-hidden bg-orange-100 dark:bg-orange-900/30 transition-all duration-1000 delay-200 ease-out" 
                 style={{ height: mounted ? `${Math.max(45, ((top3[2].puntos || top3[2].visitas) / maxScoreTop3) * 200)}px` : '0px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500 to-orange-600 opacity-90"></div>
              <span className="relative z-10 font-black text-xl text-white mb-2">{top3[2].puntos || top3[2].visitas} pts</span>
            </div>
            <h3 className="font-bold text-xs text-foreground mt-3 line-clamp-1 text-center w-full">{top3[2].nombre}</h3>
          </div>
        )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[200px] mt-12 mb-16 bg-card/50 rounded-3xl border border-dashed border-border mx-4">
          <Trophy className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-bold text-sm text-center px-4">
            Aún no hay puntos registrados para este periodo.
          </p>
        </div>
      )}

      {/* LISTA COMPLETA */}
      <div className="max-w-4xl mx-auto px-4 md:px-0 mt-8">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center">
            <Award className="w-4 h-4 mr-2" />
            Tabla de Posiciones Global
          </h3>
        </div>
        
        <div className="space-y-4">
          {ranking.map((c, i) => {
            const isTop3 = i < 3;
            const nivel = calcularNivel(c.xp);

            return (
              <div key={c.nombre} className="bg-card rounded-3xl p-4 md:p-5 shadow-sm border border-border flex flex-col md:flex-row gap-4 md:gap-6 items-center hover:shadow-md transition-shadow relative overflow-hidden">
                
                {/* Racha Badge (Solo visual) */}
                {c.racha >= 3 && (
                  <div className="absolute top-0 right-0 bg-orange-500/10 text-orange-600 font-black text-[10px] px-3 py-1 rounded-bl-xl flex items-center">
                    <Flame className="w-3 h-3 mr-1 fill-orange-500" /> Racha x{c.racha}
                  </div>
                )}

                <div className="flex items-center gap-4 w-full md:w-auto md:min-w-[280px] shrink-0">
                  <div className={`w-8 font-black text-center text-lg ${isTop3 ? 'text-primary' : 'text-muted-foreground/60'}`}>{i + 1}</div>
                  
                  <div className="relative">
                    <img src={c.avatar} className={`w-12 h-12 rounded-full object-cover shadow-sm border-2 ${isTop3 ? 'border-primary' : 'border-border'}`} />
                    <div className="absolute -bottom-2 -right-2 bg-background border border-border text-[10px] px-1 rounded-md font-bold shadow-sm z-20 flex items-center">
                      <Star className="w-2.5 h-2.5 text-yellow-500 mr-0.5 fill-yellow-500" /> {nivel}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm sm:text-base truncate pr-8">{c.nombre}</p>
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center mt-0.5 truncate">
                      <MapPin className="w-3 h-3 mr-1 opacity-50 shrink-0"/> {c.zona}
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full grid grid-cols-3 gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-center">
                  
                  <div className="flex flex-col justify-center bg-muted/50 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Puntos</span>
                    <span className="font-black text-lg text-primary">{c.puntos}</span>
                  </div>

                  <div className="flex flex-col justify-center bg-muted/50 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Visitas</span>
                    <span className="font-black text-lg text-blue-600">{c.visitas}</span>
                  </div>

                  <div className="flex flex-col justify-center bg-muted/50 rounded-xl p-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Internas</span>
                    <span className="font-black text-lg text-orange-600">{c.actividades}</span>
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
