"use client"

import { useState, useEffect } from "react"
import { PartyPopper, X } from "lucide-react"
import Link from "next/link"
import { Notificacion } from "@/app/(comerciales)/actions_notificaciones"

export function CumpleanosPopup({ notificacionesHoy }: { notificacionesHoy: Notificacion[] }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const cumpleanosHoy = notificacionesHoy.filter(n => n.tipo === 'cumpleanos')

  useEffect(() => {
    if (cumpleanosHoy.length > 0) {
      // Usar sessionStorage para que solo salga una vez por sesión (al abrir la app)
      const hasSeenPopup = sessionStorage.getItem('hasSeenBirthdayPopup')
      if (!hasSeenPopup) {
        setIsOpen(true)
        sessionStorage.setItem('hasSeenBirthdayPopup', 'true')
      }
    }
  }, [cumpleanosHoy])

  if (!isOpen || cumpleanosHoy.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-500 delay-150">
        
        {/* Header festivo */}
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1.5 bg-black/20 text-white rounded-full hover:bg-black/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="bg-white/20 w-16 h-16 rounded-full mx-auto flex items-center justify-center backdrop-blur-md shadow-inner mb-3">
            <PartyPopper className="w-8 h-8 text-white drop-shadow-sm" />
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
            ¡Día de Fiesta!
          </h2>
          <p className="text-white/90 text-sm font-medium mt-1">
            {cumpleanosHoy.length === 1 
              ? "Tienes un cumpleaños importante hoy" 
              : `Tienes ${cumpleanosHoy.length} cumpleaños importantes hoy`}
          </p>
        </div>

        {/* Lista de cumpleañeros */}
        <div className="p-5 bg-card">
          <div className="space-y-3">
            {cumpleanosHoy.map(cump => (
              <div key={cump.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                  {cump.contacto_nombre?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm line-clamp-1">{cump.contacto_nombre}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{cump.agencia_nombre}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link href="/comerciales/notificaciones" onClick={() => setIsOpen(false)}>
              <button className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95">
                Ver Notificaciones
              </button>
            </Link>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full h-12 bg-transparent text-muted-foreground font-semibold rounded-2xl hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
