"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, MapPin, Building2, User, Phone, Mail, Calendar, Thermometer, Clock } from "lucide-react"
import Link from "next/link"
import { AgenciaEditModal } from "./AgenciaEditModal"
import { TemperaturaBadge } from "./TemperaturaBadge"

export function AgenciaDetalleClient({ dataInicial, backUrl = "/comerciales/agencias" }: { dataInicial: any, backUrl?: string }) {
  const router = useRouter()
  const [agencia, setAgencia] = useState(dataInicial)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleAgenciaUpdated = (updated: any) => {
    setAgencia({ ...agencia, ...updated })
    router.refresh()
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/60 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Link 
            href={backUrl} 
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-bold text-foreground line-clamp-1">Perfil de Agencia</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} className="rounded-full h-9 px-4 text-sm font-semibold">
          <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
        </Button>
      </header>


      <main className="p-4 space-y-6 max-w-lg mx-auto pb-32">
        <section className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <h2 className="text-2xl font-black leading-tight text-foreground">{agencia.nombre}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <TemperaturaBadge temperatura={agencia.temperatura} />
                <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${agencia.activa ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {agencia.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl shrink-0">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-start">
              <MapPin className="w-4 h-4 text-muted-foreground mr-2 mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">
                <strong>{agencia.ciudad || 'Quito'}</strong> - {agencia.direccion || 'Sin dirección registrada'}
              </span>
            </div>
            {agencia.fecha_aniversario && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                <span className="text-sm text-foreground">
                  Aniversario: <strong className="font-semibold">{new Date(agencia.fecha_aniversario).toLocaleDateString('es-EC', { timeZone: 'UTC' })}</strong>
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Contactos ({agencia.contactos?.length || 0})</h3>
          
          <div className="grid gap-3">
            {(!agencia.contactos || agencia.contactos.length === 0) ? (
              <div className="text-center py-8 bg-muted/30 rounded-2xl border border-dashed border-border">
                <p className="text-muted-foreground text-sm">No hay contactos registrados.</p>
              </div>
            ) : (
              agencia.contactos.map((contacto: any) => (
                <div key={contacto.id} className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-3">
                  <div className="flex items-center">
                    <div className="bg-muted w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground leading-none">{contacto.nombre}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{contacto.cargo || 'Staff'}</span>
                    </div>
                  </div>
                  
                  <div className="pl-13 space-y-1.5 pt-2 border-t border-border/50">
                    {contacto.telefono && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 mr-1.5" /> {contacto.telefono}
                      </div>
                    )}
                    {contacto.email && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Mail className="w-3 h-3 mr-1.5" /> {contacto.email}
                      </div>
                    )}
                    {contacto.fecha_cumpleanos && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1.5" /> Cumple: {new Date(contacto.fecha_cumpleanos).toLocaleDateString('es-EC', { timeZone: 'UTC' })}
                      </div>
                    )}
                    {!contacto.telefono && !contacto.email && !contacto.fecha_cumpleanos && (
                      <span className="text-xs text-muted-foreground italic">Sin datos adicionales</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Historial de Interacciones</h3>
          
          <div className="bg-card p-4 rounded-3xl border border-border shadow-sm">
            {(!agencia.historial || agencia.historial.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-4 italic">No hay registros de visitas recientes.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {agencia.historial.map((h: any, index: number) => (
                  <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary/10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_4px_var(--background)]">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-2xl border border-border bg-background shadow-sm space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {new Date(h.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-primary">{Array.isArray(h.temas) ? h.temas.join(', ') : (h.temas || 'Visita')}</span>
                      </div>
                      <p className="text-xs text-foreground font-medium">{h.observaciones || 'Sin novedades'}</p>
                      <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                        Por: <strong>{h.usuarios?.nombre || 'Desconocido'}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <AgenciaEditModal 
        agencia={agencia}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleAgenciaUpdated}
      />
    </div>
  )
}
