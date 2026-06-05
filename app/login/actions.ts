'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  const user = signInData.user
  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rol = usuario?.rol
    revalidatePath('/', 'layout')

    if (rol === 'admin') {
      redirect('/admin')
    } else {
      redirect('/comerciales/dashboard')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
