import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createAdminClient()
  const { data: users } = await supabase.from('usuarios').select('id, nombre')
  const { data: gamificacion } = await supabase.from('comercial_gamificacion').select('*')
  
  return NextResponse.json({
    gamificacion,
    usersCount: users?.length || 0
  })
}
