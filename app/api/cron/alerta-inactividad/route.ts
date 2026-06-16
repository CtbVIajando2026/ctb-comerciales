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
    return NextResponse.json({ error: 'Configuración de Telegram incompleta' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Obtener fecha y hora en Ecuador (UTC-5)
  const ecDateStr = new Date().toLocaleString("en-US", { timeZone: "America/Guayaquil" })
  const ecDate = new Date(ecDateStr)
  
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'America/Guayaquil', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
  const fechaEcuador = formatter.format(ecDate) // YYYY-MM-DD
  const diaSemana = ecDate.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const hora = ecDate.getHours()
  const minutos = ecDate.getMinutes()

  // 2. Validar que sea de Lunes (1) a Viernes (5)
  if (diaSemana === 0 || diaSemana === 6) {
    return NextResponse.json({ ok: true, mensaje: 'Fuera de días laborales (Fin de semana)' })
  }

  // 3. Validar jornada laboral (09:00 a 18:00 hora Ecuador)
  const minutosTotales = hora * 60 + minutos
  const inicioJornada = 9 * 60       // 09:00 AM
  const finJornada = 18 * 60        // 18:00 (06:00 PM)

  if (minutosTotales < inicioJornada || minutosTotales > finJornada) {
    return NextResponse.json({ ok: true, mensaje: 'Fuera de la jornada laboral de Ecuador (09am - 06pm)' })
  }

  // 4. Obtener todos los comerciales activos
  const { data: comerciales, error: errorC } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo, ciudad_zona')
    .eq('activo', true)
    .eq('rol', 'comercial')

  if (errorC || !comerciales) {
    console.error('Error cargando comerciales:', errorC)
    return NextResponse.json({ error: errorC?.message || 'Error cargando comerciales' }, { status: 500 })
  }

  const inicioDiaEcuador = new Date(`${fechaEcuador}T00:00:00-05:00`).toISOString()
  let alertasEnviadas = 0

  for (const comercial of comerciales) {
    // 5. Verificar si tiene justificación hoy
    const { data: justificacion } = await supabase
      .from('justificaciones_comerciales')
      .select('id')
      .eq('comercial_id', comercial.id)
      .eq('fecha', fechaEcuador)
      .maybeSingle()

    if (justificacion) {
      console.log(`Comercial ${comercial.nombre_completo} justificado hoy, saltando.`)
      continue
    }

    // 6. Obtener visitas/actividades del comercial hoy
    const { data: visitas, error: errorV } = await supabase
      .from('visitas')
      .select('id, hora_checkin, hora_checkout, estado, es_actividad, titulo_actividad')
      .eq('comercial_id', comercial.id)
      .gte('created_at', inicioDiaEcuador)
      .order('created_at', { ascending: false })

    if (errorV) {
      console.error(`Error cargando visitas para comercial ${comercial.id}:`, errorV)
      continue
    }

    // Si tiene una visita activa en curso, está activo. Saltar.
    const tieneVisitaActiva = visitas?.some(v => v.estado === 'abierta')
    if (tieneVisitaActiva) {
      console.log(`Comercial ${comercial.nombre_completo} tiene una visita abierta ahora, saltando.`)
      continue
    }

    // Calcular inicio de la inactividad actual
    let inicioInactividad: Date
    let ultimoRegistroStr = ''

    const completedVisits = visitas?.filter(v => v.estado === 'completada') || []

    if (completedVisits.length > 0) {
      // Ordenar por hora_checkout de la más nueva a la más vieja
      const sortedCompleted = [...completedVisits].sort(
        (a, b) => new Date(b.hora_checkout!).getTime() - new Date(a.hora_checkout!).getTime()
      )
      const ultimaVisita = sortedCompleted[0]
      inicioInactividad = new Date(ultimaVisita.hora_checkout!)
      
      const tipoReg = ultimaVisita.es_actividad ? `actividad ("${ultimaVisita.titulo_actividad}")` : 'visita a agencia'
      const horaOutStr = new Date(ultimaVisita.hora_checkout!).toLocaleTimeString('es-EC', {
        timeZone: 'America/Guayaquil',
        hour: '2-digit',
        minute: '2-digit'
      })
      ultimoRegistroStr = `Cerró ${tipoReg} a las ${horaOutStr}`
    } else {
      // No tiene registros hoy, el inicio de inactividad es el inicio de la jornada (09:00 AM)
      inicioInactividad = new Date(`${fechaEcuador}T09:00:00-05:00`)
      ultimoRegistroStr = 'Sin registros el día de hoy'
    }

    // Calcular minutos de inactividad
    const diffMs = ecDate.getTime() - inicioInactividad.getTime()
    const diffMinutes = diffMs / 1000 / 60

    // Si lleva más de 30 minutos inactivo
    if (diffMinutes >= 30) {
      const inicioInactividadISO = inicioInactividad.toISOString()

      // Verificar si ya notificamos sobre esta inactividad específica para evitar spam
      const { data: yaNotificado } = await supabase
        .from('alertas_inactividad')
        .select('id')
        .eq('comercial_id', comercial.id)
        .eq('fecha', fechaEcuador)
        .eq('inicio_inactividad', inicioInactividadISO)
        .maybeSingle()

      if (!yaNotificado) {
        const tiempoInactivoStr = diffMinutes >= 60 
          ? `${Math.floor(diffMinutes / 60)}h ${Math.round(diffMinutes % 60)}m`
          : `${Math.round(diffMinutes)} minutos`

        const mensaje = `⚠️ *Alerta de Inactividad (Ecuador)*\n\n` +
                        `👤 Comercial: *${comercial.nombre_completo}*\n` +
                        `📍 Ciudad: *${comercial.ciudad_zona || 'No especificada'}*\n` +
                        `⏱ Tiempo inactivo: *${tiempoInactivoStr}*\n` +
                        `📋 Último evento: ${ultimoRegistroStr}.`

        try {
          await enviarTelegram(botToken, chatId, mensaje)
          
          // Registrar en la BD que ya fue notificado para este gap
          await supabase
            .from('alertas_inactividad')
            .insert({
              comercial_id: comercial.id,
              fecha: fechaEcuador,
              inicio_inactividad: inicioInactividadISO
            })

          alertasEnviadas++
        } catch (err) {
          console.error(`Error enviando notificación de inactividad para ${comercial.nombre_completo}:`, err)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, mensaje: `Revisión completada. Alertas enviadas: ${alertasEnviadas}` })
}
