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
  
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const futuro = new Date(hoy)
  futuro.setDate(futuro.getDate() + 7) // Próximos 7 días

  // 1. Seguimientos (Próximos pasos de visitas)
  // Solo obtenemos los que le pertenecen al comercial
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
    .gte('proximo_paso_fecha', hoy.toISOString().split('T')[0])
    .lte('proximo_paso_fecha', futuro.toISOString().split('T')[0])

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

  // 2. Cumpleaños de contactos
  // Obtener todos los contactos activos
  const { data: contactos } = await supabase
    .from('agencia_contactos')
    .select(`
      id,
      nombre,
      fecha_cumpleanos,
      agencia:agencias(id, nombre)
    `)
    .eq('activo', true)
    .not('fecha_cumpleanos', 'is', null)

  if (contactos) {
    contactos.forEach(cont => {
      if (!cont.fecha_cumpleanos) return
      
      const fechaNac = new Date(cont.fecha_cumpleanos)
      // Ajustar el año de cumpleaños al año actual para comparar
      const cumpleEsteAno = new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate())
      
      // Si el cumple ya pasó este año, mirar si es el próximo año (poco probable en una ventana de 7 días, pero por si acaso)
      if (cumpleEsteAno < hoy) {
        cumpleEsteAno.setFullYear(hoy.getFullYear() + 1)
      }

      if (cumpleEsteAno >= hoy && cumpleEsteAno <= futuro) {
        const esHoy = cumpleEsteAno.toDateString() === hoy.toDateString()
        notificaciones.push({
          id: `cump-${cont.id}`,
          tipo: 'cumpleanos',
          titulo: `Cumpleaños de ${cont.nombre}`,
          descripcion: 'Felicita a este contacto en su día',
          fecha: cumpleEsteAno.toISOString().split('T')[0],
          agencia_id: (cont.agencia as any)?.id,
          agencia_nombre: (cont.agencia as any)?.nombre,
          contacto_id: cont.id,
          contacto_nombre: cont.nombre,
          estado: 'pendiente',
          es_hoy: esHoy
        })
      }
    })
  }

  // 3. Aniversarios de Agencias
  const { data: agencias } = await supabase
    .from('agencias')
    .select('id, nombre, fecha_aniversario')
    .eq('activa', true)
    .not('fecha_aniversario', 'is', null)

  if (agencias) {
    agencias.forEach(ag => {
      if (!ag.fecha_aniversario) return
      
      const fechaAniv = new Date(ag.fecha_aniversario)
      const anivEsteAno = new Date(hoy.getFullYear(), fechaAniv.getMonth(), fechaAniv.getDate())
      
      if (anivEsteAno < hoy) {
        anivEsteAno.setFullYear(hoy.getFullYear() + 1)
      }

      if (anivEsteAno >= hoy && anivEsteAno <= futuro) {
        const esHoy = anivEsteAno.toDateString() === hoy.toDateString()
        notificaciones.push({
          id: `aniv-${ag.id}`,
          tipo: 'aniversario',
          titulo: `Aniversario de ${ag.nombre}`,
          descripcion: 'Es el aniversario de la agencia',
          fecha: anivEsteAno.toISOString().split('T')[0],
          agencia_id: ag.id,
          agencia_nombre: ag.nombre,
          estado: 'pendiente',
          es_hoy: esHoy
        })
      }
    })
  }

  // Ordenar: primero los de hoy, luego por fecha ascendente
  return notificaciones.sort((a, b) => {
    if (a.es_hoy && !b.es_hoy) return -1
    if (!a.es_hoy && b.es_hoy) return 1
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  })
}
