import { obtenerDirectorioEquipo } from '@/app/(admin)/adminActions'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DirectorioComercialesClient } from '@/components/admin/DirectorioComercialesClient'

export const dynamic = 'force-dynamic'

export default async function AdminComercialesPage() {
  // Nueva función optimizada que trae todo cruzado (perfil, meta, visitas del mes)
  const equipo = await obtenerDirectorioEquipo()

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Directorio del Equipo</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Administra y revisa el estado de tus usuarios.</p>
        </div>
        <Link 
          href="/admin/comerciales/nuevo"
          className="bg-primary hover:bg-primary/90 text-white rounded-full md:rounded-xl shadow-lg flex items-center justify-center px-4 py-3 md:py-2 text-sm font-bold transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Crear Usuario</span>
        </Link>
      </div>

      <DirectorioComercialesClient initialData={equipo} />
    </div>
  )
}
