"use client"

import Link from "next/link"
import { ArrowLeft, MapPin, Clock, Calendar, CheckCircle2, FileText, Target } from "lucide-react"

export function VisitaResumenClient({ visita }: { visita: any }) {
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const duracion = visita.hora_checkout 
    ? Math.floor((new Date(visita.hora_checkout).getTime() - new Date(visita.hora_checkin).getTime()) / 60000) 
    : 0

  return (
    <div className="bg-muted/20 min-h-screen pb-10">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center justify-center">
        <div className="w-full max-w-lg flex items-center">
          <Link href="/comerciales/dashboard" className="mr-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">{visita.es_actividad ? "Resumen de Actividad" : "Resumen de Visita"}</h1>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Agencia y Estado */}
        <section className="bg-card p-5 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-primary">
              {visita.es_actividad ? visita.titulo_actividad : visita.agencia?.nombre}
            </h2>
            <CheckCircle2 className="text-green-500 w-6 h-6" />
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-4">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              {formatTime(visita.hora_checkin)} — {formatTime(visita.hora_checkout)} ({duracion} min)
            </span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <MapPin className="w-4 h-4 mr-2" />
            <span>Check-in GPS registrado</span>
          </div>
        </section>

        {/* Motivo de Visita */}
        {!visita.es_actividad && (
          <section className="bg-card p-5 rounded-2xl shadow-sm border border-border space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Motivo de Visita
            </h3>
            <div className="space-y-2">
              {visita.temas?.map((tema: string, idx: number) => (
                <div key={idx} className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium">
                  {tema}
                </div>
              ))}
              {visita.temas_texto_libre && (
                <p className="text-sm mt-2 font-medium">Detalle: {visita.temas_texto_libre}</p>
              )}
            </div>
          </section>
        )}

        {/* Observaciones / Resultados */}
        {visita.observaciones && (
          <section className="bg-card p-5 rounded-2xl shadow-sm border border-border space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              {visita.es_actividad ? "Resultados / Observaciones" : "Observaciones"}
            </h3>
            <p className="text-sm whitespace-pre-wrap">{visita.observaciones}</p>
          </section>
        )}

        {/* Recordatorio / Próximo Paso */}
        {visita.proximo_paso && visita.proximo_paso !== 'none' && (
          <section className="bg-card p-5 rounded-2xl shadow-sm border border-border space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Recordatorio / Próximo Paso
            </h3>
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-semibold">{visita.proximo_paso}</p>
              {visita.proximo_paso_fecha && (
                <p className="text-sm text-muted-foreground mt-1">
                  Agendado para: {formatDate(visita.proximo_paso_fecha)}
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
