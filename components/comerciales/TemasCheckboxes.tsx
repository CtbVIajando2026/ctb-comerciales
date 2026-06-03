"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TEMAS_VISITA } from "@/lib/comerciales/mockData"

interface TemasCheckboxesProps {
  selected: string[]
  onChange: (temas: string[]) => void
  otroTexto: string
  onOtroTextoChange: (texto: string) => void
}

export function TemasCheckboxes({ selected, onChange, otroTexto, onOtroTextoChange }: TemasCheckboxesProps) {
  const toggleTema = (tema: string) => {
    if (selected.includes(tema)) {
      onChange(selected.filter(t => t !== tema))
    } else {
      onChange([...selected, tema])
    }
  }

  const isOtroSelected = selected.includes('Otro')

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {TEMAS_VISITA.map(tema => (
          <label 
            key={tema} 
            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              selected.includes(tema) ? 'bg-primary/5 border-primary/30' : 'bg-card border-border hover:bg-muted'
            }`}
          >
            <Checkbox 
              checked={selected.includes(tema)} 
              onCheckedChange={() => toggleTema(tema)}
              className="mt-0.5"
            />
            <span className="text-sm font-medium leading-tight">{tema}</span>
          </label>
        ))}
        
        <label 
          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
            isOtroSelected ? 'bg-primary/5 border-primary/30' : 'bg-card border-border hover:bg-muted'
          }`}
        >
          <Checkbox 
            checked={isOtroSelected} 
            onCheckedChange={() => toggleTema('Otro')}
            className="mt-0.5"
          />
          <span className="text-sm font-medium leading-tight">Otro</span>
        </label>
      </div>

      {isOtroSelected && (
        <div className="animate-in fade-in slide-in-from-top-2 mt-2">
          <Input 
            placeholder="Especifica el tema tratado..." 
            value={otroTexto}
            onChange={(e) => onOtroTextoChange(e.target.value)}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
