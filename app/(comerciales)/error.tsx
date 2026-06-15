"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Registramos el error en la consola
    console.error("Error en Server Component:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
      <div className="space-y-6 max-w-sm">
        <div className="bg-destructive/10 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-destructive shadow-xl">
          <AlertCircle size={48} />
        </div>
        
        <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
          Error de Conexión
        </h1>
        
        <p className="text-muted-foreground text-sm font-medium">
          Tuvimos un problema de comunicación con los servidores (posiblemente por falta de señal o un micro-corte de internet).
        </p>

        <button 
          onClick={() => reset()} 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw size={18} />
          Reintentar
        </button>
      </div>
    </div>
  )
}
