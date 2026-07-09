import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ─── Utils ────────────────────────────────────────────────────────────────────
function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // radio de la tierra en metros
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

async function enviarTelegram(token: string, chatId: string, texto: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'Markdown' }),
  })
  if (!res.ok) throw new Error(`Telegram API error: ${await res.text()}`)
  return res.json()
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const customSecret = 'ctb-cron-2025-secret'

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && authHeader !== `Bearer ${customSecret}`) {
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

  const ecDateStr = new Date().toLocaleString("en-US", { timeZone: "America/Guayaquil" })
  const ecDate = new Date(ecDateStr)
  
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' 
  })
  const fechaEcuador = formatter.format(ecDate)
  const diaSemana = ecDate.getDay()

  if (diaSemana === 0 || diaSemana === 6) {
    return NextResponse.json({ ok: true, mensaje: 'Fuera de días laborales' })
  }

  const inicioDia = new Date(`${fechaEcuador}T00:00:00-05:00`).toISOString()
  const finDia = new Date(`${fechaEcuador}T23:59:59-05:00`).toISOString()

  const { data: comerciales } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo, ciudad_zona')
    .eq('activo', true)
    .eq('rol', 'comercial')

  if (!comerciales) return NextResponse.json({ error: 'Sin comerciales' }, { status: 500 })

  const { data: visitas } = await supabase
    .from('visitas')
    .select('comercial_id, hora_checkin, hora_checkout, gps_lat, gps_lng, es_actividad, titulo_actividad')
    .gte('hora_checkin', inicioDia)
    .lte('hora_checkin', finDia)

  const infracciones = []

  for (const comercial of comerciales) {
    const vComercial = (visitas || []).filter(v => v.comercial_id === comercial.id && v.hora_checkin)
    if (vComercial.length === 0) continue // No trabajó hoy

    // Calcular jornada
    vComercial.sort((a, b) => new Date(a.hora_checkin).getTime() - new Date(b.hora_checkin).getTime())
    const primerCheckin = new Date(vComercial[0].hora_checkin).getTime()
    
    // Buscar el último checkout disponible (o checkin si no hay checkout)
    let ultimoTiempo = primerCheckin
    for (const v of vComercial) {
      if (v.hora_checkout) {
        ultimoTiempo = Math.max(ultimoTiempo, new Date(v.hora_checkout).getTime())
      } else {
        ultimoTiempo = Math.max(ultimoTiempo, new Date(v.hora_checkin).getTime())
      }
    }
    
    const horasJornada = (ultimoTiempo - primerCheckin) / (1000 * 60 * 60)

    // Calcular distancia máxima entre cualquier par de puntos reportados hoy
    let maxDistancia = 0
    const puntos = vComercial.filter(v => v.gps_lat && v.gps_lng)
    for (let i = 0; i < puntos.length; i++) {
      for (let j = i + 1; j < puntos.length; j++) {
        const dist = calcularDistanciaMetros(puntos[i].gps_lat, puntos[i].gps_lng, puntos[j].gps_lat, puntos[j].gps_lng)
        if (dist > maxDistancia) maxDistancia = dist
      }
    }

    const movilizado = maxDistancia > 2000 // más de 2km de distancia máxima
    const jornadaLarga = horasJornada > 5

    const tieneTransporte = vComercial.some(v => v.es_actividad && v.titulo_actividad === 'Transporte / Movilización')
    const tieneAlmuerzo = vComercial.some(v => v.es_actividad && v.titulo_actividad === 'Personal / Almuerzo')

    const faltaTransporte = movilizado && !tieneTransporte
    const faltaAlmuerzo = movilizado && jornadaLarga && !tieneAlmuerzo

    if (faltaTransporte || faltaAlmuerzo) {
      infracciones.push({
        comercial,
        faltaTransporte,
        faltaAlmuerzo,
        maxDistancia,
        horasJornada
      })
    }
  }

  if (infracciones.length > 0) {
    let mensaje = `🚨 *Reporte de Cumplimiento de Rutinas*\n`
    mensaje += `_Comerciales con registros faltantes hoy (${fechaEcuador})_\n\n`

    for (const inf of infracciones) {
      mensaje += `👤 *${inf.comercial.nombre_completo}* (${inf.comercial.ciudad_zona || 'N/A'})\n`
      if (inf.faltaTransporte) {
        mensaje += `   🚫 *Falta Movilización:* Recorrió máx. ${(inf.maxDistancia/1000).toFixed(1)} km hoy sin registrar transporte.\n`
      }
      if (inf.faltaAlmuerzo) {
        mensaje += `   🍔 *Falta Almuerzo:* Trabajó ${(inf.horasJornada).toFixed(1)} horas con movilización sin registrar almuerzo.\n`
      }
      mensaje += '\n'
    }

    mensaje += `ℹ️ _Nota: El tiempo de almuerzo y transporte justifica las horas reportadas mensualmente. No se exige almuerzo ni transporte si el comercial permanece en un único lugar (distancia < 2km)._`

    try {
      await enviarTelegram(botToken, chatId, mensaje)
    } catch (e) {
      console.error("Error al enviar telegram de cumplimiento:", e)
    }
  }

  return NextResponse.json({ ok: true, revisados: comerciales.length, infractores: infracciones.length })
}
