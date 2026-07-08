"use client"

import { useMemo, useEffect, useState, useTransition } from 'react'
import { Trophy, MapPin, Award, Briefcase, Filter, CalendarDays, Loader2, Flame, Star, Crown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obtenerRankingAgregado } from '@/app/(admin)/rankingActions'

export function RankingClient({ datos }: { datos: any }) {
  const { comerciales } = datos
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [rankingAgregado, setRankingAgregado] = useState<any[]>([])

  const [filtroZona, setFiltroZona] = useState<string>('Global')
  
  // Por defecto, filtramos por el MES actual
  const [timeFilter, setTimeFilter] = useState<string>(() => {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: 'numeric' })
    const parts = formatter.formatToParts(new Date())
    const y = parts.find(p => p.type === 'year')?.value || '2026'
    const m = (parts.find(p => p.type === 'month')?.value || '07').padStart(2, '0')
    return `${y}-${m}`
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

  const calcularNivel = (xp: number) => Math.floor(Math.sqrt((xp || 0) / 100)) + 1

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

    // Ordenar estricto por Puntos Mensuales
    return Object.values(mapa).sort((a, b) => b.puntos - a.puntos || b.visitas - a.visitas)
  }, [comerciales, filtroZona, rankingAgregado])

  const top3 = ranking.filter(c => c.puntos > 0 || c.visitas > 0).slice(0, 3)
  const maxScoreTop3 = Math.max(...top3.map(c => c.puntos > 0 ? c.puntos : c.visitas), 1)

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-24 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 mt-8">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-2xl mb-2 backdrop-blur-md border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <Crown className="w-10 h-10 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 drop-shadow-sm">
          Salón de la Fama
        </h1>
        <p className="text-muted-foreground font-medium tracking-wide flex items-center justify-center gap-2">
           {isPending && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
           ¿Quién dominará este mes?
        </p>

        {/* SELECTORES DE FILTRO (SOLO MES Y AÑO PARA GAMIFICACION) */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          
          <div className="flex items-center space-x-2 bg-card/60 backdrop-blur-sm border border-border/50 p-1.5 rounded-xl shadow-lg">
            <Filter className="w-4 h-4 text-primary ml-3" />
            <Select value={filtroZona} onValueChange={(val) => setFiltroZona(val ?? 'Global')}>
              <SelectTrigger className="w-[180px] sm:w-[220px] h-10 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 font-bold text-foreground">
                <SelectValue placeholder="Filtrar por Zona" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl bg-card/95">
                <SelectItem value="Global" className="font-bold">🌎 Todo el País</SelectItem>
                {zonas.map(z => (
                  <SelectItem key={z} value={z}>📍 {z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 bg-card/60 backdrop-blur-sm border border-border/50 p-1.5 rounded-xl shadow-lg">
            <CalendarDays className="w-4 h-4 text-primary ml-3" />
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-[180px] sm:w-[220px] h-10 px-3 bg-transparent border-0 font-bold text-foreground outline-none cursor-pointer appearance-none"
            >
              <optgroup label="Ranking por Mes">
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
                  return <option key={val} value={val} className="bg-background">{mesNom.charAt(0).toUpperCase() + mesNom.slice(1)} {year}</option>
                }).reverse()}
              </optgroup>
              <optgroup label="Ranking Histórico (Anual)">
                <option value={new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric' }).formatToParts(new Date()).find(p => p.type === 'year')?.value || '2026'} className="bg-background">
                  Todo el {new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric' }).formatToParts(new Date()).find(p => p.type === 'year')?.value || '2026'}
                </option>
              </optgroup>
            </select>
          </div>

        </div>
      </div>

      {/* PODIO ELITE (GLASSMORPHISM) */}
      {top3.length > 0 ? (
        <div className="flex justify-center items-end h-[400px] gap-3 md:gap-6 max-w-4xl mx-auto px-2 mt-16 mb-20 relative">
          
          {/* Brillo de fondo sutil */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>

          {/* 2do Lugar */}
          {top3[1] && (
          <div className="flex flex-col items-center flex-1 max-w-[140px] group z-10">
            <div className="relative mb-5 text-center">
              <div className="relative inline-block">
                <img src={top3[1].avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-[3px] border-slate-300 shadow-[0_0_20px_rgba(148,163,184,0.4)] z-10 relative bg-background" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-400 to-slate-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-20 whitespace-nowrap border border-slate-300/50">2DO LUGAR</div>
              </div>
              <div className="absolute -right-5 -top-2 bg-slate-800 border border-slate-600 text-slate-100 text-[10px] px-2 py-1 rounded-lg font-black shadow-xl z-30 flex items-center transform rotate-6">
                <Star className="w-3 h-3 text-yellow-400 mr-1 fill-yellow-400" /> LVL {calcularNivel(top3[1].xp)}
              </div>
            </div>
            
            {/* Barra Glassmorphism 2do */}
            <div className="w-full relative flex flex-col items-center justify-start pt-6 rounded-t-3xl overflow-hidden bg-slate-900/40 dark:bg-slate-800/40 backdrop-blur-xl border-x border-t border-slate-700/50 transition-all duration-1000 ease-out shadow-2xl" 
                 style={{ height: mounted ? `${Math.max(100, ((top3[1].puntos || top3[1].visitas) / maxScoreTop3) * 250)}px` : '0px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent"></div>
              <div className="absolute bottom-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]"></div>
              
              <span className="relative z-10 font-black text-2xl md:text-3xl text-white drop-shadow-md">{top3[1].puntos || top3[1].visitas}</span>
              <span className="relative z-10 text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Puntos</span>
            </div>
            <div className="mt-4 px-1 w-full flex flex-col items-center">
              <h3 className="font-bold text-sm text-foreground text-center leading-tight break-words line-clamp-2">{top3[1].nombre}</h3>
            </div>
          </div>
        )}

        {/* 1er Lugar */}
        {top3[0] && (
          <div className="flex flex-col items-center flex-1 max-w-[160px] group z-20">
            <div className="relative mb-5 text-center">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 animate-bounce">
                <Trophy className="w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] fill-amber-400/20" />
              </div>
              <div className="relative inline-block">
                <img src={top3[0].avatar} className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover border-[4px] border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.6)] z-10 relative bg-background" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 text-xs font-black px-4 py-1 rounded-full shadow-xl z-20 whitespace-nowrap border border-amber-300">1ER LUGAR</div>
              </div>
              <div className="absolute -right-6 -top-2 bg-slate-900 border border-amber-500/50 text-amber-400 text-xs px-2 py-1.5 rounded-lg font-black shadow-2xl z-30 flex items-center transform rotate-12">
                <Star className="w-3.5 h-3.5 text-amber-400 mr-1 fill-amber-400" /> LVL {calcularNivel(top3[0].xp)}
              </div>
            </div>
            
            {/* Barra Glassmorphism 1er */}
            <div className="w-full relative flex flex-col items-center justify-start pt-8 rounded-t-3xl overflow-hidden bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl border-x border-t border-amber-500/30 transition-all duration-1000 delay-100 ease-out shadow-[0_-10px_40px_-15px_rgba(245,158,11,0.3)]" 
                 style={{ height: mounted ? '300px' : '0px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/30 via-orange-500/10 to-transparent"></div>
              <div className="absolute bottom-0 w-full h-1.5 bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,1)]"></div>
              
              <span className="relative z-10 font-black text-3xl md:text-5xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{top3[0].puntos || top3[0].visitas}</span>
              <span className="relative z-10 text-xs font-black text-amber-400 uppercase tracking-widest mt-1">Puntos Totales</span>
            </div>
            <div className="mt-4 px-1 w-full flex flex-col items-center">
              <h3 className="font-black text-base md:text-lg text-foreground text-center leading-tight break-words line-clamp-2">{top3[0].nombre}</h3>
            </div>
          </div>
        )}

        {/* 3er Lugar */}
        {top3[2] && (
          <div className="flex flex-col items-center flex-1 max-w-[140px] group z-10">
            <div className="relative mb-5 text-center">
              <div className="relative inline-block">
                <img src={top3[2].avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-[3px] border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)] z-10 relative bg-background" />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-20 whitespace-nowrap border border-orange-400/50">3ER LUGAR</div>
              </div>
              <div className="absolute -right-5 -top-2 bg-slate-800 border border-slate-600 text-slate-100 text-[10px] px-2 py-1 rounded-lg font-black shadow-xl z-30 flex items-center transform rotate-6">
                <Star className="w-3 h-3 text-yellow-400 mr-1 fill-yellow-400" /> LVL {calcularNivel(top3[2].xp)}
              </div>
            </div>
            
            {/* Barra Glassmorphism 3er */}
            <div className="w-full relative flex flex-col items-center justify-start pt-6 rounded-t-3xl overflow-hidden bg-slate-900/40 dark:bg-slate-800/40 backdrop-blur-xl border-x border-t border-slate-700/50 transition-all duration-1000 delay-200 ease-out shadow-2xl" 
                 style={{ height: mounted ? `${Math.max(80, ((top3[2].puntos || top3[2].visitas) / maxScoreTop3) * 250)}px` : '0px' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent"></div>
              <div className="absolute bottom-0 w-full h-1 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]"></div>
              
              <span className="relative z-10 font-black text-2xl md:text-3xl text-white drop-shadow-md">{top3[2].puntos || top3[2].visitas}</span>
              <span className="relative z-10 text-[10px] font-bold text-orange-300 uppercase tracking-widest mt-1">Puntos</span>
            </div>
            <div className="mt-4 px-1 w-full flex flex-col items-center">
              <h3 className="font-bold text-sm text-foreground text-center leading-tight break-words line-clamp-2">{top3[2].nombre}</h3>
            </div>
          </div>
        )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[250px] mt-12 mb-16 bg-card/40 backdrop-blur-sm rounded-3xl border border-dashed border-border/50 mx-4 shadow-inner">
          <Award className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground font-bold text-sm text-center px-4 max-w-sm">
            Aún no hay puntos registrados para este periodo. ¡Sal y cierra algunas visitas para aparecer aquí!
          </p>
        </div>
      )}

      {/* LISTA COMPLETA ESTILIZADA */}
      <div className="max-w-4xl mx-auto px-4 md:px-0 mt-8">
        <div className="flex items-center justify-between mb-8 px-2 border-b border-border/30 pb-4">
          <h3 className="font-black text-lg md:text-xl text-foreground flex items-center">
            <Award className="w-5 h-5 mr-3 text-primary" />
            Clasificación General
          </h3>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest">
            {ranking.length} Asesores
          </span>
        </div>
        
        <div className="space-y-4">
          {ranking.map((c, i) => {
            const isTop3 = i < 3;
            const nivel = calcularNivel(c.xp);

            return (
              <div key={c.nombre} className="bg-card/60 backdrop-blur-md rounded-2xl p-4 md:p-5 shadow-sm border border-border/50 flex flex-col md:flex-row gap-4 md:gap-6 items-center hover:shadow-lg hover:border-primary/30 hover:bg-card/90 transition-all duration-300 relative overflow-hidden group">
                
                {/* Racha Badge */}
                {c.racha >= 3 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-[10px] px-3 py-1 rounded-bl-xl flex items-center shadow-md z-20">
                    <Flame className="w-3 h-3 mr-1 fill-white animate-pulse" /> Racha x{c.racha}
                  </div>
                )}

                <div className="flex items-center gap-4 w-full md:w-1/2 shrink-0">
                  <div className={`w-10 font-black text-center text-xl md:text-2xl ${isTop3 ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-foreground/80 transition-colors'}`}>#{i + 1}</div>
                  
                  <div className="relative">
                    <img src={c.avatar} className={`w-14 h-14 md:w-16 md:h-16 rounded-full object-cover shadow-md border-2 ${isTop3 ? 'border-primary' : 'border-border'}`} />
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 text-slate-100 text-[10px] px-2 py-0.5 rounded-lg font-black shadow-lg z-20 flex items-center">
                      <Star className="w-2.5 h-2.5 text-yellow-400 mr-1 fill-yellow-400" /> LVL {nivel}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-foreground text-base md:text-lg break-words leading-tight">{c.nombre}</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-primary/70 shrink-0"/> {c.zona}
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6 text-center">
                  
                  <div className="flex flex-col justify-center bg-primary/5 rounded-xl p-3 border border-primary/10">
                    <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-1">Puntos</span>
                    <span className="font-black text-xl md:text-2xl text-primary">{c.puntos}</span>
                  </div>

                  <div className="flex flex-col justify-center bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
                    <span className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest mb-1">Visitas</span>
                    <span className="font-black text-lg md:text-xl text-blue-600 dark:text-blue-400">{c.visitas}</span>
                  </div>

                  <div className="flex flex-col justify-center bg-orange-500/5 rounded-xl p-3 border border-orange-500/10">
                    <span className="text-[10px] font-black text-orange-500/70 uppercase tracking-widest mb-1">Internas</span>
                    <span className="font-black text-lg md:text-xl text-orange-600 dark:text-orange-400">{c.actividades}</span>
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
