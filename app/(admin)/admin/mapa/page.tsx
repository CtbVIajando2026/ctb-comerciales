import { obtenerMetricasEnVivo } from '@/app/(admin)/adminActions'
import { MapaGlobalWrapper } from '@/components/admin/MapaGlobalWrapper'

export const dynamic = 'force-dynamic'

export default async function MapaPage() {
  const data = await obtenerMetricasEnVivo()

  return (
    <div className="flex flex-col min-h-screen pb-20 p-4 md:p-8 bg-muted/30">
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Radar GPS (En Vivo)</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitoreo de visitas en tiempo real</p>
      </div>
      
      <div className="flex-1 bg-card rounded-3xl border border-border shadow-sm flex flex-col">
        <MapaGlobalWrapper visitas={data.visitas || []} />
      </div>
    </div>
  )
}
