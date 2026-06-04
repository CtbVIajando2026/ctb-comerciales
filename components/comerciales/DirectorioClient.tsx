"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Building2, ChevronRight, Plus } from "lucide-react"
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

export function DirectorioClient({ agenciasIniciales }: { agenciasIniciales: Agencia[] }) {
  const [search, setSearch] = useState("")
  const [isRegistroOpen, setIsRegistroOpen] = useState(false)
  const router = useRouter()

  const filtradas = agenciasIniciales.filter(a => 
    a.activa && a.nombre.toLowerCase().includes(search.toLowerCase())
  )

  const handleAgenciaRegistrada = (agencia: any) => {
    // Cuando se registra, recargamos la data del servidor para verla en la lista
    router.refresh()
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
          onClick={() => setIsRegistroOpen(true)}
          className="h-12 w-12 shrink-0 rounded-2xl" 
          size="icon"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

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
      />
    </div>
  )
}
