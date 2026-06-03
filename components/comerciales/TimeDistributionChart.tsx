"use client"

import { useEffect, useState } from "react"
import { Building2, Briefcase } from "lucide-react"

interface TimeDistributionChartProps {
  minutosAgencias: number
  minutosActividades: number
  diasRango?: number
}

function formatearTiempo(minutos: number) {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function TimeDistributionChart({ minutosAgencias, minutosActividades, diasRango = 1 }: TimeDistributionChartProps) {
  const [mounted, setMounted] = useState(false)
  const totalMinutos = minutosAgencias + minutosActividades
  
  useEffect(() => {
    // Delay setting mounted to true slightly to allow stroke transition to trigger from 0
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Math for SVG Circle
  const radius = 40
  const circumference = 2 * Math.PI * radius
  
  // Percentages (protect against NaN)
  // Base 24 horas (1440 minutos) por día seleccionado
  const BASE_MINUTOS = 1440 * diasRango

  const pctAgencias = (minutosAgencias / BASE_MINUTOS) * 100
  const pctActividades = (minutosActividades / BASE_MINUTOS) * 100

  // Dash arrays (length of the stroke, then gap which is circumference - length)
  const strokeAgencias = (pctAgencias / 100) * circumference
  const strokeActividades = (pctActividades / 100) * circumference

  // Offset for Actividades so it starts exactly where Agencias ends
  // SVG circles start at 3 o'clock. We rotate it -90deg to start at 12 o'clock in the parent div.
  const offsetActividades = circumference - strokeAgencias

  return (
    <div className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col items-center col-span-2 relative overflow-hidden">
      
      <div className="text-center mb-6 w-full flex flex-col items-center">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Distribución del Tiempo</h3>
        <p className="text-xs text-muted-foreground">¿En qué invertiste tu día?</p>
      </div>

      <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-sm">
          {/* Base Background Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/30"
          />

          {totalMinutos > 0 && (
            <>
              {/* Segment 1: Agencias (Primary Blue) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="butt"
                className="text-primary transition-all duration-1000 ease-out"
                strokeDasharray={`${mounted ? strokeAgencias : 0} ${circumference}`}
                strokeDashoffset="0"
              />

              {/* Segment 2: Actividades Internas (Naranja) */}
              {pctActividades > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="butt"
                  className="text-warning transition-all duration-1000 ease-out delay-300"
                  strokeDasharray={`${mounted ? strokeActividades : 0} ${circumference}`}
                  strokeDashoffset={mounted ? -strokeAgencias : 0}
                />
              )}
            </>
          )}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-foreground">
            {totalMinutos > 0 ? formatearTiempo(totalMinutos) : '0m'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
            Total Invertido
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-border">
        <div className="flex flex-col">
          <div className="flex items-center text-xs font-bold text-muted-foreground mb-1 uppercase">
            <div className="w-3 h-3 rounded-full bg-primary mr-2" />
            Agencias
          </div>
          <div className="flex items-baseline space-x-1 pl-5">
            <span className="text-lg font-bold text-foreground">
              {formatearTiempo(minutosAgencias)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">({Math.round(pctAgencias)}%)</span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center text-xs font-bold text-muted-foreground mb-1 uppercase">
            <div className="w-3 h-3 rounded-full bg-warning mr-2" />
            Internas
          </div>
          <div className="flex items-baseline space-x-1 pl-5">
            <span className="text-lg font-bold text-foreground">
              {formatearTiempo(minutosActividades)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">({Math.round(pctActividades)}%)</span>
          </div>
        </div>
      </div>

    </div>
  )
}
