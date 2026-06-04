import { obtenerMetricasEnVivo, obtenerDatosHistoricosAdmin } from '@/app/(admin)/adminActions'
import { DashboardInteractivo } from '@/components/admin/DashboardInteractivo'
import { ExportarExcelButton } from '@/components/admin/ExportarExcelButton'
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const data = await obtenerMetricasEnVivo()
  const datosHistoricos = await obtenerDatosHistoricosAdmin()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: perfil } = await supabase
    .from('usuarios_perfil')
    .select('nombre_completo')
    .eq('id', user?.id)
    .single()

  return (
    <div className="space-y-6 flex flex-col h-full">
      
      {/* HEADER COHERENTE CON COMERCIALES */}
      <header className="pt-2 pb-1 flex items-start justify-between">
        <div className="space-y-1 flex-1 pr-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground line-clamp-1 uppercase flex items-center flex-wrap gap-2">
            Visión Global
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              EN VIVO
            </span>
          </h1>
          <p className="text-base font-semibold text-muted-foreground">
            {perfil?.nombre_completo || 'Administrador'}
          </p>
          <p className="text-sm font-medium text-muted-foreground/90 mt-1 capitalize">
            {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center space-x-4 shrink-0">
          <ExportarExcelButton datos={datosHistoricos} />
          <img src="/logo.png" alt="CTB" className="h-20 w-auto object-contain drop-shadow-sm" />
        </div>
      </header>

      <div className="mb-2">
        <h2 className="text-xl font-black tracking-tight text-foreground">Métricas en Tiempo Real</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Estado actual del equipo comercial</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Total Registros (Hoy)</p>
          <div className="text-3xl font-black text-foreground leading-none">{data.visitas?.length || 0}</div>
        </div>
        
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase text-primary">En Ruta (Abiertas)</p>
          <div className="text-3xl font-black text-primary leading-none">{data.activas}</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Comerciales Activos</p>
          <div className="text-3xl font-black text-foreground leading-none">{data.comercialesEnRuta}</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm text-center flex flex-col justify-center">
          <p className="text-[10px] font-bold text-destructive mb-1 uppercase">Alertas GPS</p>
          <div className={`text-3xl font-black leading-none ${data.alertas > 0 ? 'text-destructive' : 'text-success'}`}>
            {data.alertas}
          </div>
        </div>
      </div>
      
      {/* Sección de Inteligencia de Negocios (Gráficos) */}
      <DashboardInteractivo data={datosHistoricos} />
    </div>
  )
}
