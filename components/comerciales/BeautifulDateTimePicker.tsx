"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BeautifulDateTimePickerProps {
  value: string // ISO string o vacío
  onChange: (isoString: string) => void
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export function BeautifulDateTimePicker({ value, onChange }: BeautifulDateTimePickerProps) {
  const dateObj = value ? new Date(value) : new Date()
  
  const [day, setDay] = useState(value ? dateObj.getDate().toString() : "")
  const [month, setMonth] = useState(value ? dateObj.getMonth().toString() : "")
  const [year, setYear] = useState(value ? dateObj.getFullYear().toString() : "")
  const [hour, setHour] = useState(value ? dateObj.getHours().toString().padStart(2, '0') : "")
  const [minute, setMinute] = useState(value ? dateObj.getMinutes().toString().padStart(2, '0') : "")

  const currentYear = new Date().getFullYear()
  const years = [currentYear.toString(), (currentYear + 1).toString()]
  
  // Calculate days in month
  const getDaysInMonth = (m: string, y: string) => {
    if (!m || !y) return 31
    return new Date(parseInt(y), parseInt(m) + 1, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(month, year)
  const days = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString())
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  useEffect(() => {
    // Si todos los campos tienen un valor, emitimos el ISO string
    if (day && month && year && hour && minute) {
      const d = new Date(parseInt(year), parseInt(month), parseInt(day), parseInt(hour), parseInt(minute))
      onChange(d.toISOString())
    } else {
      onChange("") // Inválido si falta algo
    }
  }, [day, month, year, hour, minute])

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      
      {/* Row: Fecha */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <label className="text-[15px] font-medium">Fecha</label>
        
        <div className="flex items-center space-x-1 bg-muted/40 p-1 rounded-xl">
          <Select value={day} onValueChange={(v) => setDay(v || "")}>
            <SelectTrigger className="h-8 w-[60px] border-0 bg-transparent shadow-none px-2 focus:ring-0 font-medium text-right justify-center">
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent>
              {days.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={month} onValueChange={(v) => setMonth(v || "")}>
            <SelectTrigger className="h-8 w-[100px] border-0 bg-transparent shadow-none px-2 focus:ring-0 font-medium justify-center">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m.substring(0, 3)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={(v) => setYear(v || "")}>
            <SelectTrigger className="h-8 w-[70px] border-0 bg-transparent shadow-none px-2 focus:ring-0 font-medium justify-center">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row: Hora */}
      <div className="flex items-center justify-between p-4">
        <label className="text-[15px] font-medium">Hora</label>
        
        <div className="flex items-center bg-muted/40 p-1 rounded-xl">
          <Select value={hour} onValueChange={(v) => setHour(v || "")}>
            <SelectTrigger className="h-8 w-[60px] border-0 bg-transparent shadow-none px-2 focus:ring-0 font-medium justify-center">
              <SelectValue placeholder="HH" />
            </SelectTrigger>
            <SelectContent>
              {hours.map(h => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="font-bold text-muted-foreground/60 mb-[2px]">:</span>

          <Select value={minute} onValueChange={(v) => setMinute(v || "")}>
            <SelectTrigger className="h-8 w-[60px] border-0 bg-transparent shadow-none px-2 focus:ring-0 font-medium justify-center">
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

    </div>
  )
}
