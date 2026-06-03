"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Building2, Plus } from "lucide-react"
import { TemperaturaBadge } from "@/components/comerciales/TemperaturaBadge"
import { buscarAgencias } from "@/app/(comerciales)/actions"

interface AgenciaBuscadorProps {
  onSelect: (agencia: any) => void
  onCrearNueva: () => void
}

export function AgenciaBuscador({ onSelect, onCrearNueva }: AgenciaBuscadorProps) {
  const [query, setQuery] = useState("")
  const [resultados, setResultados] = useState<any[]>([])
  const [buscando, setBuscando] = useState(false)
  const [haBuscado, setHaBuscado] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setResultados([])
      setHaBuscado(false)
      return
    }

    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await buscarAgencias(query)
        setResultados(res)
        setHaBuscado(true)
      } catch (error) {
        console.error(error)
      } finally {
        setBuscando(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar agencia (ej. Sol, Luna...)"
          className="pl-10 h-12 text-lg shadow-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {buscando && <div className="text-center text-sm text-muted-foreground p-4">Buscando...</div>}

      {!buscando && haBuscado && resultados.length > 0 && (
        <div className="space-y-2 bg-card rounded-xl border border-border overflow-hidden">
          {resultados.map((agencia) => (
            <button
              key={agencia.id}
              className="w-full text-left p-4 hover:bg-muted/50 border-b border-border last:border-0 transition-colors flex flex-col gap-1"
              onClick={() => onSelect(agencia)}
            >
              <div className="flex justify-between items-start w-full">
                <span className="font-semibold text-base">{agencia.nombre}</span>
                <TemperaturaBadge temperatura={agencia.temperatura as any} />
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {agencia.direccion} <span className="mx-1">•</span> {agencia.zona}
              </div>
            </button>
          ))}
        </div>
      )}

      {!buscando && haBuscado && resultados.length === 0 && (
        <div className="text-center p-6 bg-card border border-border border-dashed rounded-xl space-y-4">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-lg">No encontramos "{query}"</p>
            <p className="text-sm text-muted-foreground mt-1">¿Es una agencia nueva?</p>
          </div>
          <Button onClick={onCrearNueva} className="w-full h-12" variant="outline">
            <Plus className="w-5 h-5 mr-2" /> Registrar nueva agencia
          </Button>
        </div>
      )}
    </div>
  )
}
