import { obtenerDirectorioEquipoComercial } from '@/app/(comerciales)/actions'
import { DirectorioComercialesClient } from '@/components/admin/DirectorioComercialesClient'

export const dynamic = 'force-dynamic'

export default async function EquipoComercialPage() {
  const equipo = await obtenerDirectorioEquipoComercial()

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Directorio del Equipo</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Conoce a tus compañeros y sus métricas.</p>
        </div>
      </div>

      <DirectorioComercialesClient initialData={equipo} isComercialView={true} />
    </div>
  )
}
