"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface VisitaTimerProps {
  horaInicio: string
}

export function VisitaTimer({ horaInicio }: VisitaTimerProps) {
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0)

  useEffect(() => {
    const inicio = new Date(horaInicio).getTime()
    
    const updateTimer = () => {
      const ahora = Date.now()
      setSegundosTranscurridos(Math.floor((ahora - inicio) / 1000))
    }

    updateTimer()
    const intervalId = setInterval(updateTimer, 1000)
    
    return () => clearInterval(intervalId)
  }, [horaInicio])

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':')
  }

  return (
    <div className="flex items-center justify-center space-x-2 text-3xl font-bold font-mono tracking-wider tabular-nums text-primary mb-6">
      <Clock className="w-8 h-8" />
      <span>{formatTime(segundosTranscurridos)}</span>
    </div>
  )
}
