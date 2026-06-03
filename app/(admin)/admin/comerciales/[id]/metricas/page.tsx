import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DashboardComercialIndividual } from '@/components/admin/DashboardComercialIndividual'

export const dynamic = 'force-dynamic'

export default async function MetricasComercialPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params
  
  const supabase = await createClient()
  
  // 1. Fetch User Data
  const { data: usuario, error: userError } = await supabase
    .from('usuarios_perfil')
    .select('*')
    .eq('id', id)
    .single()
    
  if (userError || !usuario || usuario.rol !== 'comercial') {
    console.error("Error fetching user for metrics:", userError)
    redirect('/admin/comerciales')
  }

  // Fetch metas separadamente
  const { data: metas } = await supabase
    .from('metas_comerciales')
    .select('visitas_diarias')
    .eq('comercial_id', id)
    .single()
    
  if (metas) {
    usuario.metas_comerciales = [metas]
  }

  // 2. Fetch all visits for this commercial
  const { data: visitas } = await supabase
    .from('visitas')
    .select(`
      *,
      agencias(nombre, direccion)
    `)
    .eq('comercial_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center space-x-4">
        <Link href="/admin/comerciales" className="inline-flex items-center justify-center size-10 rounded-xl border border-border bg-background hover:bg-muted hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center">
            {usuario.nombre_completo}
            <span className="ml-3 text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-wider">
              {usuario.ciudad_zona || 'Global'}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">Panel de rendimiento individual.</p>
        </div>
      </div>

      <DashboardComercialIndividual usuario={usuario} visitas={visitas || []} />
    </div>
  )
}

