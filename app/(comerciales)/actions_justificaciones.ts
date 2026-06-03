'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearJustificacion(data: { fecha: string, tipo: string, descripcion: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { error } = await supabase
    .from('justificaciones_comerciales')
    .insert({
      comercial_id: user.id,
      fecha: data.fecha,
      tipo: data.tipo,
      descripcion: data.descripcion
    })

  if (error) {
    console.error("Error creando justificación:", error)
    throw new Error(error.message)
  }

  revalidatePath('/comerciales/dashboard')
  revalidatePath('/comerciales/mi-dia')
  return true
}
