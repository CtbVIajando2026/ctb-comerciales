"use client"

import { useMemo } from 'react'
import { Trophy, Medal, MapPin, Award, Star } from 'lucide-react'
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
    <div className="space-y-8 max-w-5xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 mt-8 mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-amber-500/20 to-orange-500/10 rounded-2xl mb-2 border border-amber-500/20 shadow-inner">
          <Trophy className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
          Ranking de Efectividad
        </h1>
        <p className="text-muted-foreground text-sm font-medium tracking-wide">
          Desempeño comercial de los últimos 30 días
        </p>
      </div>

      {/* TOP 3 CARDS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto px-4 md:px-0">
        
        {/* 2do Lugar - SILVER */}
        {top3[1] && (
          <div className="order-2 md:order-1 flex flex-col items-center p-5 bg-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-300 transition-colors duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-300 to-slate-400"></div>
            
            <div className="relative mb-3 mt-2">
              <img src={top3[1].avatar} className="w-16 h-16 rounded-full object-cover border-[3px] border-card shadow-sm z-10 relative" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 text-[9px] font-black px-3 py-0.5 rounded-full shadow-sm tracking-wider z-20">
                2DO
              </div>
            </div>
            
            <h3 className="font-bold text-base text-foreground mt-1 line-clamp-1 text-center w-full">{top3[1].nombre}</h3>
            <p className="text-[10px] text-muted-foreground font-medium flex items-center mb-4 uppercase tracking-wider">
              <MapPin className="w-2.5 h-2.5 mr-1"/> {top3[1].zona}
            </p>
            
            <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">Visitas</span>
              <span className="font-black text-2xl text-slate-700 dark:text-slate-300">{top3[1].puntos}</span>
            </div>
          </div>
        )}

        {/* 1er Lugar - GOLD */}
        {top3[0] && (
          <div className="order-1 md:order-2 flex flex-col items-center p-6 bg-card rounded-3xl border border-amber-200 dark:border-amber-900/50 shadow-xl relative overflow-hidden group hover:border-amber-300 transition-colors duration-300 z-10 scale-105">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative mb-4 mt-2">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-1 shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-white" />
              </div>
              <img src={top3[0].avatar} className="w-20 h-20 rounded-full object-cover border-[3px] border-card shadow-md z-10 relative ring-2 ring-amber-400/30 ring-offset-1 ring-offset-background" />
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-black px-4 py-0.5 rounded-full shadow-sm tracking-widest z-20 whitespace-nowrap">
                1ER LUGAR
              </div>
            </div>
            
            <h3 className="font-black text-lg text-foreground mt-2 line-clamp-1 text-center w-full">{top3[0].nombre}</h3>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold flex items-center mb-4 uppercase tracking-wider">
              <MapPin className="w-2.5 h-2.5 mr-1"/> {top3[0].zona}
            </p>
            
            <div className="w-full bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 flex flex-col items-center justify-center border border-amber-100 dark:border-amber-900/50">
              <span className="text-[10px] font-bold text-amber-600/80 dark:text-amber-500/80 mb-0.5 uppercase tracking-widest">Puntuación</span>
              <span className="font-black text-4xl text-amber-600 dark:text-amber-500">{top3[0].puntos}</span>
            </div>
          </div>
        )}

        {/* 3er Lugar - BRONZE */}
        {top3[2] && (
          <div className="order-3 flex flex-col items-center p-5 bg-card rounded-3xl border border-orange-200 dark:border-orange-900/40 shadow-lg relative overflow-hidden group hover:border-orange-300 transition-colors duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
            
            <div className="relative mb-3 mt-2">
              <img src={top3[2].avatar} className="w-16 h-16 rounded-full object-cover border-[3px] border-card shadow-sm z-10 relative" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[9px] font-black px-3 py-0.5 rounded-full shadow-sm tracking-wider z-20">
                3ER
              </div>
            </div>
            
            <h3 className="font-bold text-base text-foreground mt-1 line-clamp-1 text-center w-full">{top3[2].nombre}</h3>
            <p className="text-[10px] text-muted-foreground font-medium flex items-center mb-4 uppercase tracking-wider">
              <MapPin className="w-2.5 h-2.5 mr-1"/> {top3[2].zona}
            </p>
            
            <div className="w-full bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-3 flex flex-col items-center justify-center border border-orange-100 dark:border-orange-900/30">
              <span className="text-[10px] font-semibold text-orange-600/70 dark:text-orange-500/70 mb-0.5 uppercase tracking-wider">Visitas</span>
              <span className="font-black text-2xl text-orange-600 dark:text-orange-500">{top3[2].puntos}</span>
            </div>
          </div>
        )}

      </div>

      {/* LISTA RESTANTE */}
      {resto.length > 0 && (
        <div className="max-w-3xl mx-auto mt-12 px-4 md:px-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center">
              <Award className="w-4 h-4 mr-2" />
              Clasificación General
            </h3>
          </div>
          <div className="bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {resto.map((c, i) => (
                <div key={c.nombre} className="p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center space-x-4 sm:space-x-5">
                    <div className="w-8 font-black text-muted-foreground/60 text-center text-lg">{i + 4}</div>
                    <img src={c.avatar} className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-transparent group-hover:ring-border transition-all" />
                    <div>
                      <p className="font-bold text-foreground text-sm sm:text-base">{c.nombre}</p>
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 opacity-50"/> {c.zona}
                      </p>
                    </div>
                  </div>
                  <div className="font-black text-lg sm:text-xl text-primary bg-primary/10 px-4 py-1.5 rounded-2xl flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-primary/20 text-primary" />
                    {c.puntos}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
