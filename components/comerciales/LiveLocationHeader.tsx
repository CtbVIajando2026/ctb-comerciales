'use client'

import { useState, useEffect } from 'react'
import { MapPin, Sun, Moon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LiveLocationHeader({ perfil }: { perfil: any }) {
  const [time, setTime] = useState<Date | null>(null)
  const [location, setLocation] = useState<{ city: string; ready: boolean; error: boolean }>({ city: 'Buscando GPS...', ready: false, error: false })

  useEffect(() => {
    // Initial clock setup
    setTime(new Date())
    const interval = setInterval(() => setTime(new Date()), 1000)
    
    // Geolocation setup
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords
            // Reverse geocoding via Nominatim (Free, no API key needed)
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`)
            const data = await res.json()
            const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Ubicación precisa'
            setLocation({ city, ready: true, error: false })
          } catch (e) {
            setLocation({ city: 'Señal GPS Activa', ready: true, error: false })
          }
        },
        () => {
          setLocation({ city: 'GPS Desactivado', ready: false, error: true })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setLocation({ city: 'GPS No Soportado', ready: false, error: true })
    }

    return () => clearInterval(interval)
  }, [])

  const isNight = time ? (time.getHours() >= 18 || time.getHours() < 6) : false

  return (
    <div className="w-full relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white shadow-2xl shadow-indigo-900/20 mb-6 p-6 sm:p-8">
      {/* Decorative background elements (Glassmorphism & Orbs) */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px]" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-violet-600/30 rounded-full blur-[80px]" />
      
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">
              {time ? time.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </h1>
            <p className="text-indigo-200/80 font-medium text-sm flex items-center gap-1.5 mt-2">
              {isNight ? <Moon className="w-4 h-4 text-indigo-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
              {time ? time.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Cargando...'}
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold backdrop-blur-md shadow-sm transition-all duration-500",
              location.error ? "bg-red-500/10 text-red-200 border border-red-500/20" : 
              location.ready ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20" : "bg-white/5 text-white border border-white/10"
            )}>
              {location.ready ? <MapPin className="w-4 h-4" /> : location.error ? <MapPin className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
              <span className="truncate max-w-[120px]">{location.city}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-white/10">
          <div>
            <p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-widest mb-0.5">Hola de nuevo,</p>
            <p className="text-lg font-bold truncate max-w-[150px] tracking-tight">{perfil?.nombre_completo?.split(' ')[0] || 'Comercial'}</p>
          </div>
          {perfil?.ciudad_zona && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-widest mb-0.5">Zona Asignada</p>
              <p className="text-lg font-bold tracking-tight text-indigo-100">{perfil.ciudad_zona}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
