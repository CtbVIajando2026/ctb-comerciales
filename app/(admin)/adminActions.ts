'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearComercialAdmin(data: {
  nombre: string
  email: string
  telefono: string
  ciudad: string
  metaDiaria: number
  password_temporal: string
  rol?: string
}) {
  const supabase = await createAdminClient()

  // 1. Crear el usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password_temporal,
    email_confirm: true,
    user_metadata: { rol: data.rol || 'comercial' }
  })

  if (authError) {
    console.error("Error creando auth user:", authError)
    throw new Error(authError.message)
  }

  const userId = authData.user.id

  // 2. Insertar perfil
  const { error: perfilError } = await supabase
    .from('usuarios_perfil')
    .insert({
      id: userId,
      rol: data.rol || 'comercial',
      nombre_completo: data.nombre,
      telefono: data.telefono,
      ciudad_zona: data.ciudad,
      activo: true
    })

  if (perfilError) {
    console.error("Error creando perfil:", perfilError)
    // Rollback no es fácil en auth, pero lanzamos el error
    throw new Error("Usuario creado en Auth pero falló el perfil: " + perfilError.message)
  }

  // 2b. Insertar en la tabla legacy/base de 'usuarios' para asegurar llaves foráneas con 'visitas'
  const { error: baseError } = await supabase
    .from('usuarios')
    .insert({
      id: userId,
      email: data.email,
      nombre: data.nombre,
      rol: data.rol || 'comercial',
      zona: data.ciudad
    })

  if (baseError) {
    console.error("Error creando usuario base:", baseError)
    // Ignoramos error crítico si ya se creó el perfil, aunque idealmente debería transaccionarse.
  }

  // 3. Crear Meta Diaria
  const { error: metaError } = await supabase
    .from('metas_comerciales')
    .insert({
      comercial_id: userId,
      visitas_diarias: data.metaDiaria,
      activa: true
    })

  if (metaError) {
    console.error("Error creando meta:", metaError)
    // No bloqueamos por meta
  }

  revalidatePath('/admin/comerciales')
  return { success: true, userId }
}

export async function actualizarComercialAdmin(data: {
  id: string
  nombre: string
  email?: string
  password?: string
  telefono: string
  ciudad: string
  metaDiaria?: number
  rol: string
  activo: boolean
}) {
  const supabase = await createAdminClient()

  // 1. Update Auth si hay email o password
  if (data.email || data.password) {
    const updateData: any = {}
    if (data.email) updateData.email = data.email
    if (data.password) updateData.password = data.password
    
    const { error: authError } = await supabase.auth.admin.updateUserById(
      data.id,
      updateData
    )
    if (authError) {
      console.error("Error actualizando auth:", authError)
      throw new Error("No se pudo actualizar credenciales: " + authError.message)
    }
  }

  // 1. Update Profile
  const { error: perfilError } = await supabase
    .from('usuarios_perfil')
    .update({
      rol: data.rol,
      nombre_completo: data.nombre,
      telefono: data.telefono,
      ciudad_zona: data.ciudad,
      activo: data.activo
    })
    .eq('id', data.id)

  if (perfilError) {
    console.error(perfilError)
    throw new Error(perfilError.message)
  }

  // 1b. Update Base Table
  const baseUpdate: any = {
    nombre: data.nombre,
    rol: data.rol,
    zona: data.ciudad
  }
  if (data.email) {
    baseUpdate.email = data.email
  }

  await supabase
    .from('usuarios')
    .update(baseUpdate)
    .eq('id', data.id)

  // 2. Update Metas if it's a comercial
  if (data.rol === 'comercial' && data.metaDiaria !== undefined) {
    const { error: metaError } = await supabase
      .from('metas_comerciales')
      .upsert({
        comercial_id: data.id,
        visitas_diarias: data.metaDiaria
      }, { onConflict: 'comercial_id' })
    
    if (metaError) console.error("Error actualizando meta:", metaError)
  }

  revalidatePath('/admin/comerciales')
  return { success: true }
}

export async function obtenerMetricasEnVivo() {
  const supabase = await createAdminClient()
  
  const hoy = new Date()
  hoy.setHours(0,0,0,0)

  const { data: visitas, error } = await supabase
    .from('visitas')
    .select(`
      id, 
      estado, 
      comercial_id, 
      alerta_fraude_checkin, 
      alerta_fraude_checkout
    `)
    .gte('created_at', hoy.toISOString())

  if (error) {
    console.error("Error obteniendo métricas en vivo:", error)
    return { visitas: [], activas: 0, comercialesEnRuta: 0, alertas: 0 }
  }

  const activas = visitas.filter(v => v.estado === 'abierta').length
  
  // Comerciales en ruta = comerciales únicos que tienen visitas hoy (activas o cerradas)
  const comercialesIds = new Set(visitas.map(v => v.comercial_id))
  const comercialesEnRuta = comercialesIds.size

  // Alertas de fraude
  const alertas = visitas.filter(v => v.alerta_fraude_checkin || v.alerta_fraude_checkout).length

  return {
    visitas,
    activas,
    comercialesEnRuta,
    alertas
  }
}



export async function obtenerDatosHistoricosAdmin() {
  const supabase = await createAdminClient()
  
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)
  
  // 1. Obtener Visitas con Relaciones
  const { data: visitas, error } = await supabase
    .from('visitas')
    .select(`
      id, 
      created_at, 
      estado, 
      comercial_id, 
      es_actividad, 
      titulo_actividad, 
      alerta_fraude_checkin, 
      alerta_fraude_checkout,
      usuarios!inner(nombre, zona),
      agencias(nombre)
    `)
    .gte('created_at', hace30Dias.toISOString())
    .order('created_at', { ascending: false })
    
  if (error || !visitas) {
    return { visitas: [], metas: [] }
  }

  // 2. Obtener Metas de los comerciales activos
  const { data: metas } = await supabase
    .from('metas_comerciales')
    .select('comercial_id, visitas_diarias')

  // 3. Obtener lista de todos los comerciales para el selector
  const { data: comerciales } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo, ciudad_zona, activo')
    .eq('rol', 'comercial')

  return {
    visitas,
    metas: metas || [],
    comerciales: comerciales || []
  }
}

export async function obtenerDirectorioEquipo() {
  const supabase = await createAdminClient()
  
  // 1. Obtener comerciales
  const { data: comerciales, error } = await supabase
    .from('usuarios_perfil')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !comerciales) return []

  // 2. Obtener metas activas
  const { data: metas } = await supabase
    .from('metas_comerciales')
    .select('comercial_id, visitas_diarias')
    .eq('activa', true)

  // 3. Obtener visitas completadas del mes actual
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0,0,0,0)

  const { data: visitas } = await supabase
    .from('visitas')
    .select('comercial_id, es_actividad')
    .eq('estado', 'completada')
    .gte('created_at', inicioMes.toISOString())

  return comerciales.map(c => {
    const metaObj = metas?.find(m => m.comercial_id === c.id)
    const meta = metaObj?.visitas_diarias !== undefined ? metaObj.visitas_diarias : 0 // 0 = Libre
    
    const misVisitas = visitas?.filter(v => v.comercial_id === c.id) || []
    const visitasReales = misVisitas.filter(v => !v.es_actividad).length
    const actividades = misVisitas.filter(v => v.es_actividad).length

    return {
      ...c,
      meta_diaria: meta,
      visitas_mes: visitasReales,
      actividades_mes: actividades
    }
  })
}
