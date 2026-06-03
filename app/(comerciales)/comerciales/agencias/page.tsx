import { obtenerAgenciasDirectorio } from "@/app/(comerciales)/actions_agencias"
import { DirectorioClient } from "@/components/comerciales/DirectorioClient"
import { Building2 } from "lucide-react"

export default async function AgenciasPage() {
  const agencias = await obtenerAgenciasDirectorio()

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border p-4 flex items-center justify-between pt-6">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-primary" />
            Directorio
          </h1>
          <p className="text-sm text-muted-foreground">Busca y gestiona tus agencias.</p>
        </div>
        <img src="/logo.png" alt="CTB" className="h-16 w-auto object-contain drop-shadow-sm ml-4" />
      </header>

      <main className="p-4 pb-32">
        <DirectorioClient agenciasIniciales={agencias} />
      </main>
    </div>
  )
}
