import { obtenerMetricasEnVivo } from '@/app/(admin)/adminActions'
import { MapaGlobalWrapper } from '@/components/admin/MapaGlobalWrapper'

export const dynamic = 'force-dynamic'

export default async function MapaPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const { fecha } = await searchParams
  
  // Obtener la fecha actual de Ecuador como valor por defecto
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' })
  const hoyEcuador = formatter.format(new Date()) // "YYYY-MM-DD"
  
  const fechaQuery = fecha || hoyEcuador
  const data = await obtenerMetricasEnVivo(fechaQuery)

  return (
    <div className="flex flex-col min-h-screen pb-20 p-4 md:p-8 bg-muted/30">
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Radar GPS (En Vivo)</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitoreo de visitas en tiempo real</p>
      </div>
      
      <div className="flex-1 bg-card rounded-3xl border border-border shadow-sm flex flex-col">
        <MapaGlobalWrapper 
          visitas={data.visitas || []} 
          todosComerciales={(data as any).todosComerciales || []} 
          fechaSeleccionada={fechaQuery}
        />
      </div>
    </div>
  )
}
