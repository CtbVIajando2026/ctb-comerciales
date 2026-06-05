"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Building2, ChevronRight, Plus, Filter } from "lucide-react"
import Link from "next/link"
import { TemperaturaBadge } from "@/components/comerciales/TemperaturaBadge"
import { Button } from "@/components/ui/button"
import { AgenciaRegistroModal } from "@/components/comerciales/AgenciaRegistroModal"
import { useRouter } from "next/navigation"

interface Agencia {
  id: string
  nombre: string
  direccion: string
  temperatura: string
  activa: boolean
  ciudad: string
}

export function DirectorioClient({ agenciasIniciales, ciudadComercial = "Quito" }: { agenciasIniciales: Agencia[], ciudadComercial?: string }) {
  const [search, setSearch] = useState("")
  const [filtroCiudad, setFiltroCiudad] = useState("Todas")
  const [filtroTemperatura, setFiltroTemperatura] = useState("Todas")
  const [showFiltros, setShowFiltros] = useState(false)
  const [isRegistroOpen, setIsRegistroOpen] = useState(false)
  const router = useRouter()

  const normalizarCiudad = (c: string | undefined | null) => {
    if (!c) return 'Quito'
    const trimmed = c.trim()
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
  }

  const ciudadesUnicas = Array.from(new Set(agenciasIniciales.map(a => normalizarCiudad(a.ciudad)))).sort()

  const filtradas = agenciasIniciales.filter(a => {
    const matchSearch = a.nombre.toLowerCase().includes(search.toLowerCase())
    const ciudadAgencia = normalizarCiudad(a.ciudad)
    const matchCiudad = filtroCiudad === "Todas" || ciudadAgencia === normalizarCiudad(filtroCiudad)
    const tempAgencia = (a.temperatura || 'fria').toLowerCase()
    const matchTemp = filtroTemperatura === "Todas" || tempAgencia === filtroTemperatura.toLowerCase()
    
    // Solo mostrar las agencias activas en el directorio general
    return matchSearch && matchCiudad && matchTemp && a.activa
  })

  const handleAgenciaRegistrada = (agencia: any) => {
    // Cuando se registra, lo llevamos al detalle de la agencia
    router.push(`/comerciales/agencias/${agencia.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="Buscar agencia..."
            className="pl-10 h-12 bg-card rounded-2xl border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => setShowFiltros(!showFiltros)}
          variant={showFiltros ? "default" : "outline"}
          className={`h-12 w-12 shrink-0 rounded-2xl ${showFiltros ? '' : 'bg-card'}`} 
          size="icon"
        >
          <Filter className="w-5 h-5" />
        </Button>
        <Button 
          onClick={() => setIsRegistroOpen(true)}
          className="h-12 w-12 shrink-0 rounded-2xl" 
          size="icon"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => setFiltroCiudad("Todas")}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${filtroCiudad === "Todas" ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
        >
          Todas las Agencias
        </button>
        <button
          onClick={() => setFiltroCiudad(ciudadComercial)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${filtroCiudad === ciudadComercial ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
        >
          📍 Mi Ciudad ({ciudadComercial})
        </button>
      </div>

      {showFiltros && (
        <div className="bg-card p-4 rounded-2xl border border-border flex gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Otras Ciudades</label>
            <select 
              className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={filtroCiudad}
              onChange={(e) => setFiltroCiudad(e.target.value)}
            >
              <option value="Todas">Todas las ciudades</option>
              {ciudadesUnicas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Temperatura</label>
            <select 
              className="w-full h-10 bg-background border border-border rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={filtroTemperatura}
              onChange={(e) => setFiltroTemperatura(e.target.value)}
            >
              <option value="Todas">Todas</option>
              <option value="activa">Activa</option>
              <option value="tibia">Tibia</option>
              <option value="fria">Fría</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {filtradas.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
            <p className="text-muted-foreground">No se encontraron agencias.</p>
          </div>
        ) : (
          filtradas.map(agencia => (
            <Link key={agencia.id} href={`/comerciales/agencias/${agencia.id}`}>
              <div className="bg-card p-4 rounded-2xl border border-border flex items-center justify-between hover:border-primary/50 transition-colors shadow-sm">
                <div className="space-y-1 pr-4">
                  <h3 className="font-bold text-foreground leading-tight">{agencia.nombre}</h3>
                  <p className="text-xs text-muted-foreground flex items-start">
                    <MapPin className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{agencia.ciudad || 'Quito'} - {agencia.direccion || 'Sin dirección registrada'}</span>
                  </p>
                  <div className="pt-1">
                    <TemperaturaBadge temperatura={agencia.temperatura} />
                  </div>
                </div>
                <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <AgenciaRegistroModal 
        isOpen={isRegistroOpen}
        onClose={() => setIsRegistroOpen(false)}
        onSuccess={handleAgenciaRegistrada}
        ciudadInicial={ciudadComercial}
      />
    </div>
  )
}
