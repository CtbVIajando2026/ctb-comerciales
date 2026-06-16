'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calcularDistanciaMetros } from '@/lib/geolocation'

// --- AGENCIAS Y CONTACTOS ---

export async function buscarAgencias(query: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agencias')
    .select('*')
    .ilike('nombre', `%${query}%`)
    .eq('activa', true)
    .limit(10)
    
  if (error) {
    console.error("Error buscando agencias:", error)
    return []
  }
  return data || []
}

export async function obtenerContactos(agenciaId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agencia_contactos')
    .select('*')
    .eq('agencia_id', agenciaId)
    .eq('activo', true)
    
  if (error) {
    console.error("Error obteniendo contactos:", error)
    return []
  }
  return data || []
}

export async function crearContacto(agenciaId: string, nombre: string, cargo?: string, telefono?: string, email?: string, cumpleanos?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data, error } = await supabase
    .from('agencia_contactos')
    .insert({
      agencia_id: agenciaId,
      nombre,
      cargo: cargo || 'Staff',
      telefono: telefono || null,
      email: email || null,
      fecha_cumpleanos: cumpleanos ? new Date(cumpleanos).toISOString() : null,
      agregado_por: user.id
    })
    .select()
    .single()

  if (error) {
    console.error("Error creando contacto:", error)
    return null
  }
  return data
}

// --- VISITAS (CHECK-IN / CHECK-OUT) ---

export async function iniciarVisita(data: {
  agencia_id: string,
  contacto_id?: string | null,
  gps_lat?: number | null,
  gps_lng?: number | null,
  timer_programado_min?: number | null
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autenticado" }

    // Evitar múltiples visitas abiertas
    const { data: visitaActiva } = await supabase
      .from('visitas')
      .select('id')
      .eq('comercial_id', user.id)
      .eq('estado', 'abierta')
      .maybeSingle()

    if (visitaActiva) {
      return { success: false, error: "Ya tienes una visita en curso. Debes finalizarla antes de iniciar otra." }
    }

    let distanciaCheckin: number | null = null;
    let alertaFraudeCheckin = false;

    if (data.gps_lat && data.gps_lng) {
      const { data: agencia } = await supabase
        .from('agencias')
        .select('gps_lat_referencia, gps_lng_referencia, gps_lat_registro, gps_lng_registro')
        .eq('id', data.agencia_id)
        .single()
        
      if (agencia) {
        const latAgencia = agencia.gps_lat_referencia || agencia.gps_lat_registro
        const lngAgencia = agencia.gps_lng_referencia || agencia.gps_lng_registro
        if (latAgencia && lngAgencia) {
          distanciaCheckin = calcularDistanciaMetros(data.gps_lat, data.gps_lng, latAgencia, lngAgencia)
          if (distanciaCheckin > 500) {
            alertaFraudeCheckin = true
          }
        }
      }
    }

    const { data: visita, error } = await supabase
      .from('visitas')
      .insert({
        comercial_id: user.id,
        agencia_id: data.agencia_id,
        contacto_id: data.contacto_id || null,
        gps_lat: data.gps_lat,
        gps_lng: data.gps_lng,
        distancia_checkin_metros: distanciaCheckin,
        alerta_fraude_checkin: alertaFraudeCheckin,
        timer_programado_min: data.timer_programado_min,
        estado: 'abierta'
      })
      .select()
      .single()

    if (error) {
      console.error("Error iniciando visita:", error)
      return { success: false, error: error.message }
    }

    revalidatePath('/comerciales/dashboard')
    return { success: true, data: visita }
  } catch (e: any) {
    console.error("Excepción en iniciarVisita:", e)
    return { success: false, error: e.message || "Ocurrió un error inesperado." }
  }
}

export async function obtenerCatalogoRegalos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalogo_regalos')
    .select('*')
    .eq('estado', true)
    .order('nombre')

  if (error) {
    console.error("Error obteniendo catalogo:", error)
    return []
  }
  return data || []
}

export async function cerrarVisita(visitaId: string, data: {
  gps_lat_checkout?: number | null,
  gps_lng_checkout?: number | null,
  temas: string[],
  temas_texto_libre?: string | null,
  observaciones?: string | null,
  proximo_paso?: string | null,
  proximo_paso_fecha?: string | null,
  hora_checkout_local?: string | null,
  entregas?: any[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const entregas = data.entregas || []

  let distanciaCheckout: number | null = null;
  let alertaFraudeCheckout = false;

  if (data.gps_lat_checkout && data.gps_lng_checkout) {
    const { data: v } = await supabase
      .from('visitas')
      .select('agencia_id')
      .eq('id', visitaId)
      .single()
      
    if (v?.agencia_id) {
      const { data: agencia } = await supabase
        .from('agencias')
        .select('gps_lat_referencia, gps_lng_referencia, gps_lat_registro, gps_lng_registro')
        .eq('id', v.agencia_id)
        .single()
        
      if (agencia) {
        const latAgencia = agencia.gps_lat_referencia || agencia.gps_lat_registro
        const lngAgencia = agencia.gps_lng_referencia || agencia.gps_lng_registro
        if (latAgencia && lngAgencia) {
          distanciaCheckout = calcularDistanciaMetros(data.gps_lat_checkout, data.gps_lng_checkout, latAgencia, lngAgencia)
          if (distanciaCheckout > 500) {
            alertaFraudeCheckout = true
          }
        }
      }
    }
  }

  const { data: visita, error } = await supabase
    .from('visitas')
    .update({
      gps_lat_checkout: data.gps_lat_checkout,
      gps_lng_checkout: data.gps_lng_checkout,
      distancia_checkout_metros: distanciaCheckout,
      alerta_fraude_checkout: alertaFraudeCheckout,
      temas: data.temas,
      temas_texto_libre: data.temas_texto_libre,
      observaciones: data.observaciones,
      proximo_paso: data.proximo_paso,
      proximo_paso_fecha: data.proximo_paso_fecha,
      hora_checkout: data.hora_checkout_local,
      estado: 'completada'
    })
    .eq('id', visitaId)
    .eq('comercial_id', user.id) // Seguridad extra
    .select()
    .single()

  if (error) {
    console.error("Error cerrando visita:", error)
    throw new Error(error.message)
  }

  // Insertar entregas si las hay
  if (entregas.length > 0) {
    const entregasInsert = entregas.map((e: any) => ({
      visita_id: visitaId,
      regalo_id: e.regalo_id,
      cantidad: e.cantidad,
      entregado_a: e.entregado_a
    }))
    
    const { error: entregasError } = await supabase
      .from('visita_entregas')
      .insert(entregasInsert)
      
    if (entregasError) {
      console.error("Error guardando entregas:", entregasError)
    }
  }

  // Revisar Meta (Gamificación)
  const { data: meta } = await supabase
    .from('metas_comerciales')
    .select('visitas_diarias')
    .eq('comercial_id', user.id)
    .eq('activa', true)
    .single()
  const metaDiaria = meta?.visitas_diarias !== undefined ? meta.visitas_diarias : 5 // Meta fallback de 5

  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' })
  const ecDateStr = formatter.format(now)
  const inicioDiaEcuador = new Date(`${ecDateStr}T00:00:00-05:00`).toISOString()

  const { count } = await supabase
    .from('visitas')
    .select('*', { count: 'exact', head: true })
    .eq('comercial_id', user.id)
    .eq('estado', 'completada')
    .gte('hora_checkout', inicioDiaEcuador)

  const meta_alcanzada = count === metaDiaria

  revalidatePath('/comerciales/dashboard')
  return { ...visita, meta_alcanzada }
}

export async function iniciarActividad(
  titulo: string, 
  solicitante: string, 
  gps_lat?: number | null, 
  gps_lng?: number | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data, error } = await supabase
    .from('visitas')
    .insert({
      comercial_id: user.id,
      es_actividad: true,
      titulo_actividad: titulo,
      solicitante_actividad: solicitante,
      gps_lat: gps_lat,
      gps_lng: gps_lng,
      estado: 'abierta'
    })
    .select()
    .single()

  if (error) {
    console.error("Error iniciando actividad:", error)
    throw new Error(error.message)
  }

  revalidatePath('/comerciales/dashboard')
  return data
}

// --- DASHBOARD DATA ---

export async function obtenerMeticasDashboard() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // 1. Obtener la meta
    let metaDiaria = 5
    try {
      const { data: meta } = await supabase
        .from('metas_comerciales')
        .select('visitas_diarias')
        .eq('comercial_id', user.id)
        .eq('activa', true)
        .maybeSingle()
      
      if (meta?.visitas_diarias !== undefined) {
        metaDiaria = meta.visitas_diarias
      }
    } catch (e) {
      console.error("[Dashboard] Error obteniendo meta:", e)
    }

    // 2. Visitas y actividades de hoy (desde las 00:00:00 en Ecuador) más la visita activa (incluso si fue ayer)
    let visitas: any[] = []
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' })
    const ecDateStr = formatter.format(now)
    const inicioDiaEcuador = new Date(`${ecDateStr}T00:00:00-05:00`).toISOString()

    try {
      // Obtener la visita activa del comercial (sin límite de fecha)
      const { data: visitaActiva } = await supabase
        .from('visitas')
        .select(`
          id,
          es_actividad,
          titulo_actividad,
          hora_checkin,
          hora_checkout,
          estado,
          alerta_fraude_checkin,
          alerta_fraude_checkout,
          observaciones,
          temas,
          temas_texto_libre,
          gps_lat,
          gps_lng,
          agencia:agencias(nombre, temperatura)
        `)
        .eq('comercial_id', user.id)
        .eq('estado', 'abierta')
        .maybeSingle()

      // Obtener visitas completadas hoy
      const { data: visitasCompletadas } = await supabase
        .from('visitas')
        .select(`
          id,
          es_actividad,
          titulo_actividad,
          hora_checkin,
          hora_checkout,
          estado,
          alerta_fraude_checkin,
          alerta_fraude_checkout,
          observaciones,
          temas,
          temas_texto_libre,
          gps_lat,
          gps_lng,
          agencia:agencias(nombre, temperatura)
        `)
        .eq('comercial_id', user.id)
        .gte('created_at', inicioDiaEcuador)
        .eq('estado', 'completada')
        .order('created_at', { ascending: false })

      const completadas = visitasCompletadas || []
      visitas = visitaActiva ? [visitaActiva, ...completadas] : completadas
    } catch (e) {
      console.error("[Dashboard] Error obteniendo visitas:", e)
    }

    // 4. Justificación
    let justificacionHoy = false
    try {
      const { data: justificacion } = await supabase
        .from('justificaciones_comerciales')
        .select('id')
        .eq('comercial_id', user.id)
        .eq('fecha', ecDateStr)
        .maybeSingle()
      justificacionHoy = !!justificacion
    } catch (e) {
      console.error("[Dashboard] Error obteniendo justificación:", e)
    }

    // 5. Perfil
    let perfil = null
    try {
      const { data: perfilData } = await supabase
        .from('usuarios_perfil')
        .select('nombre_completo, ciudad_zona')
        .eq('id', user.id)
        .maybeSingle()
      perfil = perfilData
    } catch (e) {
      console.error("[Dashboard] Error obteniendo perfil:", e)
    }

    if (!perfil) {
      try {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('nombre, zona')
          .eq('id', user.id)
          .maybeSingle()

        if (usuarioData) {
          perfil = {
            nombre_completo: usuarioData.nombre,
            ciudad_zona: usuarioData.zona
          }
        }
      } catch (e) {
        console.error("[Dashboard] Error obteniendo usuario legacy:", e)
      }
    }

    return {
      visitas,
      meta: metaDiaria,
      justificacionHoy,
      perfil
    }
  } catch (error: any) {
    if (error && (error.digest === 'DYNAMIC_SERVER_USAGE' || error.message?.includes('Dynamic server usage'))) {
      throw error
    }
    console.error("[Dashboard] Critical error in obtenerMeticasDashboard:", error)
    return {
      visitas: [],
      meta: 5,
      justificacionHoy: false,
      perfil: null
    }
  }
}

export async function obtenerDirectorioEquipoComercial() {
  const supabase = await createClient()
  
  // 1. Obtener comerciales
  const { data: comerciales, error } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo, ciudad_zona, telefono, rol, activo')
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (error || !comerciales) return []

  // 2. Obtener metas activas
  const { data: metas } = await supabase
    .from('metas_comerciales')
    .select('comercial_id, visitas_diarias')
    .eq('activa', true)

  // 3. Obtener visitas completadas del mes actual
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit' })
  const ecMonthStr = formatter.format(now) // "YYYY-MM"
  const inicioMesEcuador = new Date(`${ecMonthStr}-01T00:00:00-05:00`).toISOString()

  const { data: visitas } = await supabase
    .from('visitas')
    .select('comercial_id, es_actividad')
    .eq('estado', 'completada')
    .gte('created_at', inicioMesEcuador)

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

export async function actualizarUbicacionTiempoReal(lat: number, lng: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { error } = await supabase
    .from('comercial_ubicaciones_live')
    .upsert({
      comercial_id: user.id,
      gps_lat: lat,
      gps_lng: lng,
      updated_at: new Date().toISOString()
    }, { onConflict: 'comercial_id' })

  if (error) {
    console.error("Error guardando ubicación en vivo:", error)
    return { success: false, error: error.message }
  }
  return { success: true }
}
