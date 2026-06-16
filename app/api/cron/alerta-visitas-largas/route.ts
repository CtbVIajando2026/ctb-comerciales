import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ─── Envío a Telegram ─────────────────────────────────────────────────────────
async function enviarTelegram(token: string, chatId: string, texto: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      parse_mode: 'Markdown',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Telegram API error: ${err}`)
  }

  return res.json()
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const customSecret = 'ctb-cron-2025-secret'

  if (authHeader !== `Bearer ${cronSecret}` && authHeader !== `Bearer ${customSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!botToken || !chatId) {
    return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ─── Validar Jornada Laboral (Hora Ecuador UTC-5) ───────────────────────────
  const ahora = new Date()
  const horaEcuador = new Date(ahora.getTime() - 5 * 60 * 60 * 1000)
  const diaSemana = horaEcuador.getUTCDay()
  const horaLocal = horaEcuador.getUTCHours()

  if (diaSemana === 0 || diaSemana === 6 || horaLocal < 9 || horaLocal >= 18) {
    return NextResponse.json({ ok: true, mensaje: 'Fuera de la jornada laboral de Ecuador (09am - 06pm)' })
  }

  // Calcular la fecha límite (hace 60 minutos en UTC)
  const limite = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Buscar visitas abiertas hace más de 60 minutos que no han sido notificadas
  const { data: visitasLargas, error } = await supabase
    .from('visitas')
    .select(`
      id,
      hora_checkin,
      comercial_id,
      agencias!visitas_agencia_id_fkey(nombre)
    `)
    .eq('estado', 'abierta')
    .eq('alerta_larga_enviada', false)
    .lt('hora_checkin', limite)

  if (error) {
    console.error('Error consultando visitas largas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!visitasLargas || visitasLargas.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'No hay visitas largas pendientes de notificación.' })
  }

  // Obtener los nombres de los usuarios (comerciales) 
  // Para evitar problemas de nombres de relación, hacemos una segunda consulta a usuarios_perfil
  const comercialIds = visitasLargas.map(v => v.comercial_id)
  
  const { data: perfiles } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo')
    .in('id', comercialIds)

  let enviadas = 0

  for (const visita of visitasLargas) {
    const perfil = perfiles?.find(p => p.id === visita.comercial_id)
    const comercialNombre = perfil?.nombre_completo || 'Un comercial'
    
    // Obtener nombre de la agencia
    const agenciaObj = visita.agencias as any
    const agenciaNombre = agenciaObj?.nombre || 'una agencia'
    
    // Formatear hora inicio a hora local Ecuador (UTC-5)
    const horaInicio = new Date(visita.hora_checkin).toLocaleTimeString('es-EC', {
      timeZone: 'America/Guayaquil',
      hour: '2-digit',
      minute: '2-digit'
    })

    const mensaje = `⚠️ *Alerta de Visita Larga*\n\n*${comercialNombre}* lleva más de 1 hora en *${agenciaNombre}*.\n\n🕒 Inicio: ${horaInicio}`

    try {
      await enviarTelegram(botToken, chatId, mensaje)
      
      // Marcar como notificada en la base de datos
      await supabase
        .from('visitas')
        .update({ alerta_larga_enviada: true })
        .eq('id', visita.id)
        
      enviadas++
    } catch (err: any) {
      console.error(`Error procesando visita ${visita.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, enviadas })
}
