'use server'

import { createClient } from '@/lib/supabase/server'

export type Notificacion = {
  id: string
  tipo: 'seguimiento' | 'cumpleanos' | 'aniversario'
  titulo: string
  descripcion: string
  fecha: string
  agencia_id: string
  agencia_nombre: string
  contacto_id?: string
  contacto_nombre?: string
  estado: 'pendiente' | 'pasado'
  es_hoy: boolean
}

export async function obtenerNotificaciones(comercialId: string): Promise<Notificacion[]> {
  const supabase = await createClient()
  const notificaciones: Notificacion[] = []
  
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' })
  const ecDateStr = formatter.format(now)
  const [y, m, d] = ecDateStr.split('-').map(Number)
  const hoy = new Date(y, m - 1, d, 0, 0, 0, 0)
  
  const futuro7Dias = new Date(hoy)
  futuro7Dias.setDate(futuro7Dias.getDate() + 7)

  // 0. Obtener la ciudad del comercial
  const { data: perfil } = await supabase
    .from('usuarios_perfil')
    .select('ciudad_zona')
    .eq('id', comercialId)
    .maybeSingle()
    
  let ciudadComercial = perfil?.ciudad_zona

  if (!ciudadComercial) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('zona')
      .eq('id', comercialId)
      .maybeSingle()
    ciudadComercial = usuario?.zona || 'Quito'
  }

  // 1. Seguimientos (Próximos pasos de visitas) - Ventana de 7 días, propios del comercial
  const { data: seguimientos } = await supabase
    .from('visitas')
    .select(`
      id,
      proximo_paso,
      proximo_paso_fecha,
      agencia:agencias(id, nombre)
    `)
    .eq('comercial_id', comercialId)
    .not('proximo_paso_fecha', 'is', null)
    .gte('proximo_paso_fecha', ecDateStr)
    .lte('proximo_paso_fecha', futuro7Dias.toISOString().split('T')[0])

  if (seguimientos) {
    seguimientos.forEach(seg => {
      const fechaObj = new Date(seg.proximo_paso_fecha + 'T00:00:00')
      const esHoy = fechaObj.toDateString() === hoy.toDateString()
      notificaciones.push({
        id: `seg-${seg.id}`,
        tipo: 'seguimiento',
        titulo: 'Seguimiento Programado',
        descripcion: seg.proximo_paso || 'Visita de seguimiento',
        fecha: seg.proximo_paso_fecha,
        agencia_id: (seg.agencia as any)?.id,
        agencia_nombre: (seg.agencia as any)?.nombre,
        estado: 'pendiente',
        es_hoy: esHoy
      })
    })
  }

  // 2. Cumpleaños de contactos - Top 3 próximos, filtrados por ciudad
  const { data: contactos } = await supabase
    .from('agencia_contactos')
    .select(`
      id,
      nombre,
      fecha_cumpleanos,
      agencia:agencias!inner(id, nombre, ciudad)
    `)
    .eq('activo', true)
    .eq('agencias.ciudad', ciudadComercial)
    .not('fecha_cumpleanos', 'is', null)

  const proximosCumples: { data: any, fechaCalculada: Date }[] = []
  if (contactos) {
    contactos.forEach(cont => {
      if (!cont.fecha_cumpleanos) return
      
      const fechaNac = new Date(cont.fecha_cumpleanos)
      const cumpleEsteAno = new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate())
      
      if (cumpleEsteAno < hoy) {
        cumpleEsteAno.setFullYear(hoy.getFullYear() + 1)
      }

      proximosCumples.push({
        data: cont,
        fechaCalculada: cumpleEsteAno
      })
    })
    
    // Ordenar por fecha calculada y tomar los 3 primeros
    proximosCumples.sort((a, b) => a.fechaCalculada.getTime() - b.fechaCalculada.getTime())
    const top3Cumples = proximosCumples.slice(0, 3)

    top3Cumples.forEach(cump => {
      const cont = cump.data
      const esHoy = cump.fechaCalculada.toDateString() === hoy.toDateString()
      notificaciones.push({
        id: `cump-${cont.id}`,
        tipo: 'cumpleanos',
        titulo: `Cumpleaños de ${cont.nombre}`,
        descripcion: 'Felicita a este contacto en su día',
        fecha: cump.fechaCalculada.toISOString().split('T')[0],
        agencia_id: (cont.agencia as any)?.id,
        agencia_nombre: (cont.agencia as any)?.nombre,
        contacto_id: cont.id,
        contacto_nombre: cont.nombre,
        estado: 'pendiente',
        es_hoy: esHoy
      })
    })
  }

  // 3. Aniversarios de Agencias - Top 3 próximos, filtrados por ciudad
  const { data: agencias } = await supabase
    .from('agencias')
    .select('id, nombre, fecha_aniversario')
    .eq('activa', true)
    .eq('ciudad', ciudadComercial)
    .not('fecha_aniversario', 'is', null)

  const proximosAniv: { data: any, fechaCalculada: Date }[] = []
  if (agencias) {
    agencias.forEach(ag => {
      if (!ag.fecha_aniversario) return
      
      const fechaAniv = new Date(ag.fecha_aniversario)
      const anivEsteAno = new Date(hoy.getFullYear(), fechaAniv.getMonth(), fechaAniv.getDate())
      
      if (anivEsteAno < hoy) {
        anivEsteAno.setFullYear(hoy.getFullYear() + 1)
      }

      proximosAniv.push({
        data: ag,
        fechaCalculada: anivEsteAno
      })
    })

    // Ordenar y tomar los 3 primeros
    proximosAniv.sort((a, b) => a.fechaCalculada.getTime() - b.fechaCalculada.getTime())
    const top3Aniv = proximosAniv.slice(0, 3)

    top3Aniv.forEach(aniv => {
      const ag = aniv.data
      const esHoy = aniv.fechaCalculada.toDateString() === hoy.toDateString()
      notificaciones.push({
        id: `aniv-${ag.id}`,
        tipo: 'aniversario',
        titulo: `Aniversario de ${ag.nombre}`,
        descripcion: 'Es el aniversario de la agencia',
        fecha: aniv.fechaCalculada.toISOString().split('T')[0],
        agencia_id: ag.id,
        agencia_nombre: ag.nombre,
        estado: 'pendiente',
        es_hoy: esHoy
      })
    })
  }

  // Ordenar la lista final: primero los de hoy, luego por fecha ascendente
  return notificaciones.sort((a, b) => {
    if (a.es_hoy && !b.es_hoy) return -1
    if (!a.es_hoy && b.es_hoy) return 1
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  })
}
