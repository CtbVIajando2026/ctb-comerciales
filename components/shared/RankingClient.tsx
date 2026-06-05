"use client"

import { useMemo } from 'react'
import { Trophy, Medal, MapPin, Award } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function RankingClient({ datos }: { datos: any }) {
  const { visitas, comerciales } = datos

  // Procesar ranking (solo completadas reales, no actividades, en últimos 30 días)
  const ranking = useMemo(() => {
    const mapa: Record<string, { nombre: string, zona: string, puntos: number, avatar: string }> = {}
    
    comerciales.forEach((c: any) => {
      mapa[c.id] = {
        nombre: c.nombre_completo,
        zona: c.ciudad_zona || 'Global',
        puntos: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nombre_completo)}&background=random`
      }
    })

    visitas.forEach((v: any) => {
      if (v.estado === 'completada' && !v.es_actividad) {
        if (!mapa[v.comercial_id]) {
          const nombre = v.usuarios?.nombre || 'Usuario Registrado'
          const zona = v.usuarios?.zona || 'Global'
          mapa[v.comercial_id] = {
            nombre,
            zona,
            puntos: 0,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`
          }
        }
        mapa[v.comercial_id].puntos += 1 // 1 punto por visita exitosa
      }
    })

    return Object.values(mapa)
      .sort((a, b) => b.puntos - a.puntos)
  }, [visitas, comerciales])

  const top3 = ranking.slice(0, 3)
  const resto = ranking.slice(3)

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center space-y-2 mt-4">
        <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-2">
          <Trophy className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Ranking de Comerciales</h1>
        <p className="text-muted-foreground text-sm font-medium">Top de efectividad en los últimos 30 días</p>
      </div>

      {/* PODIUM */}
      <div className="flex items-end justify-center gap-3 md:gap-8 mt-16 mb-12 h-72">
        {/* 2do Lugar */}
        {top3[1] && (
          <div className="flex flex-col items-center justify-end w-28 md:w-36 animate-in slide-in-from-bottom-12 duration-700 delay-100 group">
            <div className="relative mb-4 transition-transform group-hover:-translate-y-2 duration-300">
              <div className="absolute inset-0 bg-slate-400/40 rounded-full blur-xl scale-110 -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img src={top3[1].avatar} className="w-16 h-16 rounded-full border-[3px] border-slate-300/80 shadow-[0_0_15px_rgba(148,163,184,0.3)] object-cover" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-400 to-slate-300 text-slate-900 text-[10px] font-black px-3 py-0.5 rounded-full shadow-lg border border-slate-200/50">2DO</div>
            </div>
            <p className="font-bold text-xs md:text-sm text-center line-clamp-1 w-full text-foreground/90">{top3[1].nombre}</p>
            <p className="text-[9px] text-muted-foreground mb-3 flex items-center justify-center font-medium uppercase tracking-wider"><MapPin className="w-2.5 h-2.5 mr-1"/> {top3[1].zona}</p>
            <div className="relative w-full h-32 rounded-t-2xl flex items-start justify-center pt-4 overflow-hidden border-t border-l border-r border-slate-300/30 dark:border-slate-400/20 bg-gradient-to-t from-slate-100/50 to-slate-200/80 dark:from-slate-900/40 dark:to-slate-800/60 backdrop-blur-md shadow-[0_-5px_25px_rgba(148,163,184,0.15)] dark:shadow-[0_-5px_25px_rgba(148,163,184,0.1)]">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 dark:to-white/5"></div>
              <span className="font-black text-slate-700/80 dark:text-slate-300/80 text-4xl drop-shadow-sm z-10">{top3[1].puntos}</span>
            </div>
          </div>
        )}

        {/* 1er Lugar */}
        {top3[0] && (
          <div className="flex flex-col items-center justify-end w-36 md:w-48 z-10 animate-in slide-in-from-bottom-16 duration-700 group">
            <div className="relative mb-5 transition-transform group-hover:-translate-y-3 duration-300">
              <div className="absolute inset-0 bg-amber-500/50 rounded-full blur-2xl scale-125 -z-10 animate-pulse"></div>
              
              {/* Crown Icon */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 bg-amber-500 rounded-full p-1.5 shadow-[0_0_15px_rgba(245,158,11,0.6)] border-2 border-amber-200">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              
              <img src={top3[0].avatar} className="w-24 h-24 rounded-full border-[4px] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] object-cover ring-2 ring-amber-500/30 ring-offset-2 ring-offset-background" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 text-xs font-black px-4 py-1 rounded-full shadow-lg border border-amber-200/50 tracking-widest">1ER</div>
            </div>
            <p className="font-black text-sm md:text-base text-center line-clamp-1 w-full text-foreground mt-1">{top3[0].nombre}</p>
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mb-3 flex items-center justify-center uppercase tracking-widest"><MapPin className="w-3 h-3 mr-1"/> {top3[0].zona}</p>
            
            <div className="relative w-full h-48 rounded-t-3xl flex items-start justify-center pt-5 overflow-hidden border-t-2 border-l border-r border-amber-400/50 dark:border-amber-500/30 bg-gradient-to-t from-amber-200/40 to-amber-300/70 dark:from-amber-950/40 dark:to-amber-900/60 backdrop-blur-xl shadow-[0_-10px_40px_rgba(245,158,11,0.25)] dark:shadow-[0_-10px_40px_rgba(245,158,11,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 dark:to-white/5"></div>
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-400/20 to-transparent"></div>
              <span className="font-black text-amber-700 dark:text-amber-400 text-5xl drop-shadow-md z-10">{top3[0].puntos}</span>
            </div>
          </div>
        )}

        {/* 3er Lugar */}
        {top3[2] && (
          <div className="flex flex-col items-center justify-end w-28 md:w-36 animate-in slide-in-from-bottom-8 duration-700 delay-200 group">
            <div className="relative mb-4 transition-transform group-hover:-translate-y-2 duration-300">
              <div className="absolute inset-0 bg-orange-600/40 rounded-full blur-xl scale-110 -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img src={top3[2].avatar} className="w-16 h-16 rounded-full border-[3px] border-orange-700/80 shadow-[0_0_15px_rgba(194,65,12,0.3)] object-cover" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-lg border border-orange-400/50">3ER</div>
            </div>
            <p className="font-bold text-xs md:text-sm text-center line-clamp-1 w-full text-foreground/90">{top3[2].nombre}</p>
            <p className="text-[9px] text-muted-foreground mb-3 flex items-center justify-center font-medium uppercase tracking-wider"><MapPin className="w-2.5 h-2.5 mr-1"/> {top3[2].zona}</p>
            <div className="relative w-full h-24 rounded-t-2xl flex items-start justify-center pt-3 overflow-hidden border-t border-l border-r border-orange-700/30 dark:border-orange-700/30 bg-gradient-to-t from-orange-100/50 to-orange-200/80 dark:from-orange-950/40 dark:to-orange-900/50 backdrop-blur-md shadow-[0_-5px_25px_rgba(194,65,12,0.15)] dark:shadow-[0_-5px_25px_rgba(194,65,12,0.1)]">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 dark:to-white/5"></div>
              <span className="font-black text-orange-800/80 dark:text-orange-500/80 text-3xl drop-shadow-sm z-10">{top3[2].puntos}</span>
            </div>
          </div>
        )}
      </div>

      {/* LISTA RESTANTE */}
      {resto.length > 0 && (
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-700 delay-300">
          <div className="p-4 bg-muted/30 border-b border-border flex items-center">
            <Award className="w-4 h-4 text-primary mr-2" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Resto del Equipo</h3>
          </div>
          <div className="divide-y divide-border">
            {resto.map((c, i) => (
              <div key={c.nombre} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-8 font-black text-muted-foreground text-center text-lg">{i + 4}</div>
                  <img src={c.avatar} className="w-10 h-10 rounded-full border border-border" />
                  <div>
                    <p className="font-bold text-sm text-foreground">{c.nombre}</p>
                    <p className="text-[10px] text-muted-foreground">{c.zona}</p>
                  </div>
                </div>
                <div className="font-black text-primary text-xl bg-primary/10 px-3 py-1 rounded-xl">
                  {c.puntos}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
