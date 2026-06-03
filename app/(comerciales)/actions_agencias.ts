"use server"

import { createClient } from "@/lib/supabase/server"

export async function crearAgenciaRapida(data: {
  nombre: string
  direccion: string
  aniversario_agencia: string | null
  contactoNombre: string
  contactoCargo: string
  contactoCumpleanos: string | null
  contactoTelefono: string | null
  contactoEmail: string | null
  otrosContactos: { nombre: string; cargo: string; cumpleanos: string | null; telefono: string | null; email: string | null }[]
  gps_lat: number | null
  gps_lng: number | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // 1. Insertar Agencia
  const { data: agencia, error: errorAgencia } = await supabase
    .from('agencias')
    .insert({
      nombre: data.nombre,
      direccion: data.direccion,
      fecha_aniversario: data.aniversario_agencia,
      gps_lat_registro: data.gps_lat,
      gps_lng_registro: data.gps_lng,
      registrada_por: user.id,
      captada_por_comercial: true,
      comercial_captador_id: user.id
    })
    .select('id, nombre')
    .single()

  if (errorAgencia) {
    console.error("Error creando agencia:", errorAgencia)
    throw new Error(errorAgencia.message)
  }

  // 2. Preparar contactos a insertar
  const contactosAInsertar = []

  if (data.contactoNombre) {
    contactosAInsertar.push({
      agencia_id: agencia.id,
      nombre: data.contactoNombre,
      cargo: data.contactoCargo || 'Gerente',
      fecha_cumpleanos: data.contactoCumpleanos || null,
      telefono: data.contactoTelefono || null,
      email: data.contactoEmail || null,
      agregado_por: user.id
    })
  }

  if (data.otrosContactos && data.otrosContactos.length > 0) {
    for (const oc of data.otrosContactos) {
      if (oc.nombre.trim()) {
        contactosAInsertar.push({
          agencia_id: agencia.id,
          nombre: oc.nombre,
          cargo: oc.cargo || 'Staff',
          fecha_cumpleanos: oc.cumpleanos || null,
          telefono: oc.telefono || null,
          email: oc.email || null,
          agregado_por: user.id
        })
      }
    }
  }

  let contactoRegistrado = null

  if (contactosAInsertar.length > 0) {
    const { data: nuevosContactos, error: errorContacto } = await supabase
      .from('agencia_contactos')
      .insert(contactosAInsertar)
      .select('id, nombre, cargo')
    
    if (errorContacto) {
      console.error("Error creando contactos:", errorContacto)
    } else if (nuevosContactos && nuevosContactos.length > 0) {
      contactoRegistrado = nuevosContactos[0] // Retornamos el Gerente para auto-seleccionarlo
    }
  }

  return { agencia, contacto: contactoRegistrado }
}

export async function obtenerAgenciasDirectorio() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agencias')
    .select(`
      id,
      nombre,
      direccion,
      temperatura,
      activa
    `)
    .order('nombre')

  if (error) {
    console.error("Error obteniendo agencias directorio:", error)
    return []
  }
  return data || []
}

export async function obtenerDetalleAgencia(id: string) {
  const supabase = await createClient()
  
  // Get agencia
  const { data: agencia, error: errorAgencia } = await supabase
    .from('agencias')
    .select('*')
    .eq('id', id)
    .single()

  if (errorAgencia || !agencia) return null

  // Get contactos
  const { data: contactos } = await supabase
    .from('agencia_contactos')
    .select('*')
    .eq('agencia_id', id)
    .eq('activo', true)
    .order('created_at')

  return { ...agencia, contactos: contactos || [] }
}

export async function actualizarAgencia(id: string, payload: {
  nombre: string
  direccion: string
  fecha_aniversario?: string | null
  contactos?: {
    id?: string
    nombre: string
    cargo: string
    telefono: string | null
    email: string | null
    fecha_cumpleanos: string | null
  }[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // 1. Update Agencia
  const { data, error } = await supabase
    .from('agencias')
    .update({
      nombre: payload.nombre,
      direccion: payload.direccion,
      fecha_aniversario: payload.fecha_aniversario
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error("Error actualizando agencia:", error)
    throw new Error(error.message)
  }

  // 2. Update or Insert Contactos
  if (payload.contactos && payload.contactos.length > 0) {
    for (const contacto of payload.contactos) {
      if (contacto.id && contacto.id.includes('-')) {
        // Update existing (UUID has hyphens)
        const { error: errContacto } = await supabase
          .from('agencia_contactos')
          .update({
            nombre: contacto.nombre,
            cargo: contacto.cargo || 'Staff',
            telefono: contacto.telefono || null,
            email: contacto.email || null,
            fecha_cumpleanos: contacto.fecha_cumpleanos || null
          })
          .eq('id', contacto.id)
          .eq('agencia_id', id)
          
        if (errContacto) console.error("Error updating contact:", errContacto)
      } else {
        // Insert new (either no ID or temporary client ID)
        if (!contacto.nombre.trim()) continue;
        const { error: errContacto } = await supabase
          .from('agencia_contactos')
          .insert({
            agencia_id: id,
            nombre: contacto.nombre,
            cargo: contacto.cargo || 'Staff',
            telefono: contacto.telefono || null,
            email: contacto.email || null,
            fecha_cumpleanos: contacto.fecha_cumpleanos || null,
            agregado_por: user.id
          })
          
        if (errContacto) console.error("Error inserting contact:", errContacto)
      }
    }
  }

  return data
}

