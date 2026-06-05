"use client"

import { useMemo, useEffect, useState } from 'react'
import { Trophy, MapPin, Award, Star, Briefcase } from 'lucide-react'

export function RankingClient({ datos }: { datos: any }) {
  const { visitas, comerciales } = datos
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Retraso para que la animación se vea después de cargar la página
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const ranking = useMemo(() => {
    const mapa: Record<string, { nombre: string, zona: string, visitas: number, actividades: number, avatar: string }> = {}
    
    comerciales.forEach((c: any) => {
      mapa[c.id] = {
        nombre: c.nombre_completo,
        zona: c.ciudad_zona || 'Global',
        visitas: 0,
        actividades: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre_completo)}&background=random`
      }
    })

    visitas.forEach((v: any) => {
      if (v.estado === 'completada') {
        if (!mapa[v.comercial_id]) {
          const nombre = v.usuarios?.nombre || 'Usuario Registrado'
          mapa[v.comercial_id] = {
            nombre,
            zona: v.usuarios?.zona || 'Global',
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
  }, [visitas, comerciales])

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
          Desempeño comercial de los últimos 30 días
        </p>
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
