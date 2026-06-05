"use client"

import { useState } from "react"
import { Bell, CalendarHeart, PartyPopper, CalendarClock, ArrowRight, ChevronRight, MapPin } from "lucide-react"
import Link from "next/link"
import { Notificacion } from "@/app/(comerciales)/actions_notificaciones"

export function NotificacionesClient({ notificacionesIniciales }: { notificacionesIniciales: Notificacion[] }) {
  const [activeTab, setActiveTab] = useState<'todas' | 'seguimiento' | 'cumpleanos' | 'aniversario'>('todas')

  const filtradas = notificacionesIniciales.filter(n => activeTab === 'todas' || n.tipo === activeTab)
  const hoy = filtradas.filter(n => n.es_hoy)
  const proximas = filtradas.filter(n => !n.es_hoy)

  const getIcono = (tipo: string) => {
    switch(tipo) {
      case 'seguimiento': return <CalendarClock className="w-5 h-5 text-primary" />
      case 'cumpleanos': return <PartyPopper className="w-5 h-5 text-amber-500" />
      case 'aniversario': return <CalendarHeart className="w-5 h-5 text-rose-500" />
      default: return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getBadgeColor = (tipo: string) => {
    switch(tipo) {
      case 'seguimiento': return "bg-primary/10 text-primary"
      case 'cumpleanos': return "bg-amber-500/10 text-amber-600 dark:text-amber-500"
      case 'aniversario': return "bg-rose-500/10 text-rose-600 dark:text-rose-500"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const renderCard = (n: Notificacion) => (
    <Link href={`/comerciales/agencias/${n.agencia_id}`} key={n.id} className="block">
      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex gap-4 items-center group relative overflow-hidden">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className={`p-3 rounded-full shrink-0 ${getBadgeColor(n.tipo)} border border-background/20 shadow-inner`}>
          {getIcono(n.tipo)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {n.tipo === 'cumpleanos' ? 'Cumpleaños' : n.tipo === 'aniversario' ? 'Aniversario' : 'Seguimiento'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.es_hoy ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-muted text-muted-foreground'}`}>
              {n.es_hoy ? 'HOY' : new Date(n.fecha).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <h3 className="font-bold text-foreground line-clamp-1">{n.titulo}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.descripcion}</p>
          
          <div className="flex items-center text-[10px] text-muted-foreground mt-2 font-medium">
            <MapPin className="w-3 h-3 mr-1 shrink-0" />
            <span className="line-clamp-1">{n.agencia_nombre}</span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground/40 shrink-0 group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  )

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Tabs / Filters */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <button 
          onClick={() => setActiveTab('todas')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTab === 'todas' ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
        >
          Todas
        </button>
        <button 
          onClick={() => setActiveTab('seguimiento')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTab === 'seguimiento' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
        >
          <CalendarClock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Seguimientos
        </button>
        <button 
          onClick={() => setActiveTab('cumpleanos')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTab === 'cumpleanos' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-500 border-amber-500/30' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
        >
          <PartyPopper className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Cumpleaños
        </button>
        <button 
          onClick={() => setActiveTab('aniversario')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeTab === 'aniversario' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-500 border-rose-500/30' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
        >
          <CalendarHeart className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Aniversarios
        </button>
      </div>

      {notificacionesIniciales.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="font-bold text-foreground mb-1">Nada por aquí</h3>
          <p className="text-sm text-muted-foreground">No tienes notificaciones pendientes para los próximos 7 días.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {hoy.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-foreground uppercase tracking-widest mb-3 flex items-center">
                <span className="w-2 h-2 rounded-full bg-destructive mr-2 animate-pulse"></span>
                Para Hoy ({hoy.length})
              </h2>
              <div className="space-y-3">
                {hoy.map(renderCard)}
              </div>
            </section>
          )}

          {proximas.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center">
                Próximos Días ({proximas.length})
              </h2>
              <div className="space-y-3">
                {proximas.map(renderCard)}
              </div>
            </section>
          )}
          
          {filtradas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No hay resultados para este filtro.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
