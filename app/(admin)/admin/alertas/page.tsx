import { createClient } from '@/lib/supabase/server'
import { ShieldAlert } from 'lucide-react'
import { AlertasClient } from '@/components/admin/AlertasClient'

export const dynamic = 'force-dynamic'

export default async function AlertasPage() {
  const supabase = await createClient()

  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)

  // Obtener visitas con alerta de fraude
  const { data: alertas } = await supabase
    .from('visitas')
    .select(`
      *,
      usuarios!inner(nombre, zona),
      agencias(nombre, direccion)
    `)
    .or('alerta_fraude_checkin.eq.true,alerta_fraude_checkout.eq.true')
    .gte('created_at', hace30Dias.toISOString())
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center text-destructive">
            <ShieldAlert className="w-8 h-8 mr-3" />
            Desvíos GPS
          </h1>
          <p className="text-muted-foreground mt-1">
            Registro de visitas con anomalías de geolocalización (fuera del perímetro).
          </p>
        </div>
      </div>

      <AlertasClient alertasIniciales={alertas || []} />
    </div>
  )
}
