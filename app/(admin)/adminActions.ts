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

export async function obtenerMetricasEnVivo(fechaStr?: string) {
  const supabase = await createAdminClient()
  
  // Si no se proporciona fechaStr, usamos el día de hoy en Ecuador
  let targetDateStr = fechaStr
  if (!targetDateStr) {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' })
    targetDateStr = formatter.format(now) // "YYYY-MM-DD"
  }
  
  const inicioDiaEcuador = new Date(`${targetDateStr}T00:00:00-05:00`).toISOString()
  const finDiaEcuador = new Date(`${targetDateStr}T23:59:59.999-05:00`).toISOString()

  // 1. Obtener visitas de ese día
  const { data: visitas, error } = await supabase
    .from('visitas')
    .select(`
      id, 
      estado, 
      comercial_id, 
      alerta_fraude_checkin, 
      alerta_fraude_checkout,
      created_at,
      hora_checkin,
      hora_checkout,
      gps_lat,
      gps_lng,
      es_actividad,
      titulo_actividad,
      usuarios!inner(nombre, zona),
      agencias(nombre)
    `)
    .gte('created_at', inicioDiaEcuador)
    .lte('created_at', finDiaEcuador)

  // 2. Obtener lista de todos los comerciales para los filtros
  const { data: todosComerciales } = await supabase
    .from('usuarios')
    .select('nombre, zona')
    .eq('rol', 'comercial')
    .order('nombre')

  // 3. Obtener ubicaciones en tiempo real
  const { data: ubicacionesLive } = await supabase
    .from('comercial_ubicaciones_live')
    .select('comercial_id, gps_lat, gps_lng, updated_at, usuarios(nombre, zona)')

  if (error) {
    console.error("Error obteniendo métricas en vivo:", error)
    return { 
      visitas: [], 
      activas: 0, 
      comercialesEnRuta: 0, 
      alertas: 0,
      todosComerciales: todosComerciales || [],
      ubicacionesLive: []
    }
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
    alertas,
    todosComerciales: todosComerciales || [],
    ubicacionesLive: ubicacionesLive || []
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

  // 3. Obtener visitas completadas de los últimos 30 días
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)

  const { data: visitas } = await supabase
    .from('visitas')
    .select('comercial_id, es_actividad, created_at')
    .eq('estado', 'completada')
    .gte('created_at', hace30Dias.toISOString())

  return comerciales.map(c => {
    const metaObj = metas?.find(m => m.comercial_id === c.id)
    const meta = metaObj?.visitas_diarias !== undefined ? metaObj.visitas_diarias : 0 // 0 = Libre
    
    const misVisitas = visitas?.filter(v => v.comercial_id === c.id) || []

    return {
      ...c,
      meta_diaria: meta,
      visitas_historial: misVisitas
    }
  })
}

export async function eliminarVisitaAdmin(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.from('visitas').delete().eq('id', id)
  if (error) {
    console.error("Error eliminando visita:", error)
    throw new Error(error.message)
  }
  revalidatePath('/admin/visitas')
  return { success: true }
}

export async function eliminarAgenciaAdmin(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.from('agencias').delete().eq('id', id)
  if (error) {
    console.error("Error eliminando agencia:", error)
    throw new Error(error.message)
  }
  revalidatePath('/admin/agencias')
  return { success: true }
}

export async function obtenerDatosParaFiltrosReportes() {
  const supabase = await createAdminClient()
  
  // 1. Obtener Sedes (ciudades únicas de agencias o zonas únicas)
  // Utilizaremos las zonas de los usuarios comerciales y/o ciudades
  const { data: sedes } = await supabase
    .from('usuarios_perfil')
    .select('ciudad_zona')
    .not('ciudad_zona', 'is', null)

  const sedesUnicas = Array.from(new Set(sedes?.map(s => s.ciudad_zona) || []))

  // 2. Obtener Asesores
  const { data: asesores } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo, ciudad_zona')
    .eq('rol', 'comercial')
    .order('nombre_completo')

  return {
    sedes: sedesUnicas.filter(Boolean).sort(),
    asesores: asesores || []
  }
}

export async function generarDataReporte(filtros: { 
  fechaInicio?: string, 
  fechaFin?: string, 
  sede?: string, 
  asesorId?: string 
}) {
  const supabase = await createAdminClient()
  
  let query = supabase
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
      hora_checkin,
      hora_checkout,
      observaciones,
      temas,
      temas_texto_libre,
      registro_regalos(tipo, descripcion, cantidad, costo),
      usuarios!inner(nombre, zona),
      agencias(nombre, ciudad)
    `)
    .order('created_at', { ascending: false })

  if (filtros.fechaInicio) {
    const start = new Date(`${filtros.fechaInicio}T00:00:00-05:00`).toISOString()
    query = query.gte('created_at', start)
  }
  
  if (filtros.fechaFin) {
    const end = new Date(`${filtros.fechaFin}T23:59:59.999-05:00`).toISOString()
    query = query.lte('created_at', end)
  }

  if (filtros.asesorId && filtros.asesorId !== 'TODOS') {
    query = query.eq('comercial_id', filtros.asesorId)
  }
  
  // Filtrar por sede si aplica (usando inner join con usuarios)
  if (filtros.sede && filtros.sede !== 'TODAS LAS SEDES') {
    query = query.eq('usuarios.zona', filtros.sede)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error obteniendo datos para reporte:", error)
    throw new Error(error.message)
  }

  return data || []
}
