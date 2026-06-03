import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditarForm } from './EditarForm'

export const dynamic = 'force-dynamic'

export default async function EditarComercialPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params
  
  const supabase = await createClient()
  
  const { data: usuario, error } = await supabase
    .from('usuarios_perfil')
    .select('*')
    .eq('id', id)
    .single()
    
  if (error || !usuario) {
    console.error("Error fetching user:", error)
    redirect('/admin/comerciales')
  }

  // Fetch metas separadamente para evitar problemas de joins
  const { data: metas } = await supabase
    .from('metas_comerciales')
    .select('visitas_diarias')
    .eq('comercial_id', id)
    .single()
    
  if (metas) {
    usuario.metas_comerciales = [metas]
  }

  // Fetch email de la tabla base usuarios
  const { data: usuarioBase } = await supabase
    .from('usuarios')
    .select('email')
    .eq('id', id)
    .single()
    
  if (usuarioBase) {
    usuario.email = usuarioBase.email
  }

  return <EditarForm usuario={usuario} />
}
