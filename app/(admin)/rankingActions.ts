"use server"

import { createAdminClient } from "@/lib/supabase/server"

export async function obtenerRankingAgregado(timeFilter: string, filtroZona: string) {
  const supabase = await createAdminClient()
  
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = formatter.formatToParts(now)
  const y = parts.find(p => p.type === 'year')?.value || '2026'
  const m = parts.find(p => p.type === 'month')?.value || '01'
  const d = parts.find(p => p.type === 'day')?.value || '01'
  const ecNowDateStr = `${y}-${m}-${d}`

  let gteStr = ""
  let lteStr = ""

  if (timeFilter === 'hoy') {
    gteStr = `${ecNowDateStr}T00:00:00-05:00`
    lteStr = `${ecNowDateStr}T23:59:59-05:00`
  } else if (timeFilter === 'semana') {
    const hace7Dias = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const p7 = formatter.formatToParts(hace7Dias)
    const y7 = p7.find(p => p.type === 'year')?.value || '2026'
    const m7 = p7.find(p => p.type === 'month')?.value || '01'
    const d7 = p7.find(p => p.type === 'day')?.value || '01'
    gteStr = `${y7}-${m7}-${d7}T00:00:00-05:00`
    lteStr = `${ecNowDateStr}T23:59:59-05:00`
  } else if (timeFilter.length === 7) { // YYYY-MM
    const [year, month] = timeFilter.split('-')
    gteStr = `${year}-${month}-01T00:00:00-05:00`
    const nextMonth = new Date(parseInt(year), parseInt(month), 1)
    const pNext = formatter.formatToParts(nextMonth)
    const yN = pNext.find(p => p.type === 'year')?.value || '2026'
    const mN = pNext.find(p => p.type === 'month')?.value || '01'
    lteStr = `${yN}-${mN}-01T00:00:00-05:00` 
  } else if (timeFilter.length === 4) { // YYYY
    gteStr = `${timeFilter}-01-01T00:00:00-05:00`
    const nextYear = parseInt(timeFilter) + 1
    lteStr = `${nextYear}-01-01T00:00:00-05:00` 
  }

  let query = supabase
    .from('visitas')
    .select(`
      comercial_id, 
      es_actividad,
      usuarios!inner(zona)
    `)
    .eq('estado', 'completada')

  if (gteStr) query = query.gte('created_at', gteStr)
  if (lteStr && (timeFilter.length === 7 || timeFilter.length === 4)) {
    query = query.lt('created_at', lteStr)
  } else if (lteStr) {
    query = query.lte('created_at', lteStr)
  }

  if (filtroZona !== 'Global') {
    query = query.eq('usuarios.zona', filtroZona)
  }

  const { data: visitas, error } = await query

  if (error || !visitas) {
    return []
  }

  // Agregacion en el servidor para evitar enviar miles de visitas por red
  const mapa: Record<string, { visitas: number, actividades: number }> = {}
  visitas.forEach(v => {
    if (!mapa[v.comercial_id]) {
      mapa[v.comercial_id] = { visitas: 0, actividades: 0 }
    }
    if (v.es_actividad) {
      mapa[v.comercial_id].actividades += 1
    } else {
      mapa[v.comercial_id].visitas += 1
    }
  })

  // Fetch Gamification Stats
  const { data: gamificacion } = await supabase.from('comercial_gamificacion').select('*')
  
  // Return stats for EVERY comercial that has gamificacion (basically everyone)
  // merging the visit counts from `mapa`
  return (gamificacion || []).map(g => {
    const stats = mapa[g.comercial_id] || { visitas: 0, actividades: 0 }
    return {
      comercial_id: g.comercial_id,
      ...stats,
      puntos_mes_actual: g.puntos_mes_actual || 0,
      xp_total: g.xp_total || 0,
      racha_dias: g.racha_dias || 0
    }
  })
}
