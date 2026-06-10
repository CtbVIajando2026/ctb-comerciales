import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ─── Helpers de fecha en hora Ecuador (UTC-5) ────────────────────────────────

function getMesAnterior(): { inicio: string; fin: string; label: string } {
  const ahora = new Date()
  const horaEC = new Date(ahora.getTime() - 5 * 60 * 60 * 1000)

  // Obtener año y mes en curso
  let año = horaEC.getUTCFullYear()
  let mes = horaEC.getUTCMonth() // 0-11

  // Si estamos en Enero (0), el mes anterior es Diciembre (11) del año pasado
  if (mes === 0) {
    mes = 11
    año -= 1
  } else {
    mes -= 1
  }

  // Formato YYYY-MM
  const mesStr = (mes + 1).toString().padStart(2, '0')
  const fechaStr = `${año}-${mesStr}`

  // Calcular el último día del mes
  const ultimoDia = new Date(año, mes + 1, 0).getDate()
  
  // Inicio: 1 del mes anterior a las 00:00:00 EC
  const inicio = new Date(`${fechaStr}-01T00:00:00-05:00`).toISOString()
  
  // Fin: último día del mes anterior a las 23:59:59 EC
  const fin = new Date(`${fechaStr}-${ultimoDia}T23:59:59-05:00`).toISOString()

  // Label: "Mayo 2026"
  const formatter = new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    month: 'long',
    year: 'numeric'
  })
  
  // Usamos el día 15 para evitar problemas de zonas horarias al formatear
  const fechaCentroMes = new Date(`${fechaStr}-15T12:00:00-05:00`)
  let label = formatter.format(fechaCentroMes)
  label = label.charAt(0).toUpperCase() + label.slice(1) // Capitalizar

  return { inicio, fin, label }
}

function capitalizarCiudad(c: string) {
  return c.trim().charAt(0).toUpperCase() + c.trim().slice(1).toLowerCase()
}

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

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!botToken || !chatId) {
    return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 })
  }

  const { inicio, fin, label } = getMesAnterior()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Obtener Visitas del mes completo
  const { data: visitas, error } = await supabase
    .from('visitas')
    .select('comercial_id, alerta_fraude_checkin, alerta_fraude_checkout, es_actividad')
    .eq('estado', 'completada')
    .gte('hora_checkout', inicio)
    .lte('hora_checkout', fin)

  if (error) {
    console.error('Error consultando visitas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filtrar solo reales
  const visitasReales = (visitas || []).filter(v => !v.es_actividad)

  let mensaje = ''

  if (visitasReales.length === 0) {
    mensaje = `📅 *REPORTE MENSUAL — ${label}*\n\n_No se registraron visitas en todo el mes._`
  } else {
    // 2. Obtener perfiles
    const comercialIds = Array.from(new Set(visitasReales.map(v => v.comercial_id)))
    const { data: perfiles } = await supabase
      .from('usuarios_perfil')
      .select('id, nombre_completo, ciudad_zona')
      .in('id', comercialIds)

    // 3. Procesar datos
    const ciudades = new Map<string, Map<string, {
      nombre: string
      visitas: number
      alertas: number
    }>>()

    for (const v of visitasReales) {
      const perfil = perfiles?.find(p => p.id === v.comercial_id)
      const ciudad = capitalizarCiudad(perfil?.ciudad_zona || 'Sin ciudad')
      const nombre = perfil?.nombre_completo || 'Desconocido'
      const tieneAlerta = v.alerta_fraude_checkin || v.alerta_fraude_checkout

      if (!ciudades.has(ciudad)) ciudades.set(ciudad, new Map())
      const comerciales = ciudades.get(ciudad)!

      if (!comerciales.has(v.comercial_id)) {
        comerciales.set(v.comercial_id, { nombre, visitas: 0, alertas: 0 })
      }

      const entry = comerciales.get(v.comercial_id)!
      entry.visitas++
      if (tieneAlerta) entry.alertas++
    }

    const ORDEN_CIUDADES = ['Cuenca', 'Guayaquil', 'Quito']
    const ciudadesOrdenadas = Array.from(ciudades.keys()).sort((a, b) => {
      const ia = ORDEN_CIUDADES.indexOf(a)
      const ib = ORDEN_CIUDADES.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })

    let totalVisitas = 0
    let totalAlertas = 0
    let lineas: string[] = []

    lineas.push(`📅 *REPORTE MENSUAL — ${label}*\n`)

    for (const ciudad of ciudadesOrdenadas) {
      const comerciales = ciudades.get(ciudad)!
      
      let visitasCiudad = 0
      let alertasCiudad = 0
      
      for (const c of comerciales.values()) {
        visitasCiudad += c.visitas
        alertasCiudad += c.alertas
      }
      
      lineas.push(`🏙️ *${ciudad.toUpperCase()}* — _${visitasCiudad} visitas_`)
      lineas.push(`━━━━━━━━━━━━━━━━`)

      const lista = Array.from(comerciales.values()).sort((a, b) =>
        b.visitas - a.visitas // Ordenar por cantidad de visitas descendente
      )

      for (const c of lista) {
        lineas.push(`🏆 ${c.nombre}: *${c.visitas}*`)
        if (c.alertas > 0) {
          lineas.push(`   ⚠️ ${c.alertas} fuera de rango GPS`)
        }
        totalVisitas += c.visitas
        totalAlertas += c.alertas
      }
      lineas.push('')
    }

    const resumenAlertas = totalAlertas > 0
      ? `\n🚨 *Atención:* Hubo ${totalAlertas} visita${totalAlertas !== 1 ? 's' : ''} fuera de rango GPS en el mes.`
      : '\n✅ *Excelente:* 0 alertas de GPS en el mes.'

    lineas.push(`📈 *GRAN TOTAL DEL MES: ${totalVisitas} VISITAS*${resumenAlertas}`)
    mensaje = lineas.join('\n')
  }

  try {
    await enviarTelegram(botToken, chatId, mensaje)
    return NextResponse.json({ ok: true, label, visitas: visitasReales.length })
  } catch (err: any) {
    console.error('Error enviando Telegram mensual:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
