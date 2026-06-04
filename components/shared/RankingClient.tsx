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
        if (mapa[v.comercial_id]) {
          mapa[v.comercial_id].puntos += 1 // 1 punto por visita exitosa
        }
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
      <div className="flex items-end justify-center gap-2 md:gap-6 mt-12 mb-8 h-64">
        {/* 2do Lugar */}
        {top3[1] && (
          <div className="flex flex-col items-center justify-end w-28 md:w-36 animate-in slide-in-from-bottom-12 duration-700 delay-100">
            <div className="relative mb-3">
              <img src={top3[1].avatar} className="w-16 h-16 rounded-full border-4 border-slate-300 shadow-lg object-cover" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">2DO</div>
            </div>
            <p className="font-bold text-xs md:text-sm text-center line-clamp-1 w-full">{top3[1].nombre}</p>
            <p className="text-[10px] text-muted-foreground mb-2 flex items-center justify-center"><MapPin className="w-3 h-3 mr-0.5"/> {top3[1].zona}</p>
            <div className="w-full bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 h-28 rounded-t-lg border-t-2 border-slate-300 flex items-start justify-center pt-3 shadow-inner">
              <span className="font-black text-slate-600 dark:text-slate-300 text-xl">{top3[1].puntos}</span>
            </div>
          </div>
        )}

        {/* 1er Lugar */}
        {top3[0] && (
          <div className="flex flex-col items-center justify-end w-32 md:w-44 z-10 animate-in slide-in-from-bottom-16 duration-700">
            <div className="relative mb-3">
              <Medal className="w-8 h-8 text-amber-500 absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-md z-10" />
              <img src={top3[0].avatar} className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-xl object-cover ring-4 ring-amber-500/20" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-black px-3 py-0.5 rounded-full shadow-md">1ER</div>
            </div>
            <p className="font-black text-sm md:text-base text-center line-clamp-1 w-full text-foreground">{top3[0].nombre}</p>
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mb-2 flex items-center justify-center"><MapPin className="w-3 h-3 mr-0.5"/> {top3[0].zona}</p>
            <div className="w-full bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-900 dark:to-amber-800 h-40 rounded-t-xl border-t-4 border-amber-400 flex items-start justify-center pt-4 shadow-inner">
              <span className="font-black text-amber-700 dark:text-amber-400 text-3xl">{top3[0].puntos}</span>
            </div>
          </div>
        )}

        {/* 3er Lugar */}
        {top3[2] && (
          <div className="flex flex-col items-center justify-end w-28 md:w-36 animate-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="relative mb-3">
              <img src={top3[2].avatar} className="w-16 h-16 rounded-full border-4 border-orange-700 shadow-lg object-cover" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">3ER</div>
            </div>
            <p className="font-bold text-xs md:text-sm text-center line-clamp-1 w-full">{top3[2].nombre}</p>
            <p className="text-[10px] text-muted-foreground mb-2 flex items-center justify-center"><MapPin className="w-3 h-3 mr-0.5"/> {top3[2].zona}</p>
            <div className="w-full bg-gradient-to-t from-orange-200 to-orange-100 dark:from-orange-950 dark:to-orange-900 h-20 rounded-t-lg border-t-2 border-orange-700 flex items-start justify-center pt-2 shadow-inner">
              <span className="font-black text-orange-800 dark:text-orange-600 text-lg">{top3[2].puntos}</span>
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
