import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ─── Helpers de fecha en hora Ecuador (UTC-5) ────────────────────────────────

function getFechaAyer(): { inicio: string; fin: string; label: string; diaSemana: string } {
  const ahora = new Date()
  const ayerEC = new Date(ahora.getTime() - 5 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000)

  const formatter = new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  })

  const parts = formatter.formatToParts(ayerEC)
  const año = parts.find(p => p.type === 'year')!.value
  const mes = parts.find(p => p.type === 'month')!.value
  const dia = parts.find(p => p.type === 'day')!.value
  const diaSemana = parts.find(p => p.type === 'weekday')!.value

  const fechaStr = `${año}-${mes}-${dia}`
  const inicio = new Date(`${fechaStr}T00:00:00-05:00`).toISOString()
  const fin = new Date(`${fechaStr}T23:59:59-05:00`).toISOString()

  const label = new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${fechaStr}T12:00:00-05:00`))

  return { inicio, fin, label: label.replace('.', ''), diaSemana }
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

  const { inicio, fin, label } = getFechaAyer()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Obtener TODOS los comerciales activos
  const { data: perfiles, error: errorP } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo, ciudad_zona')
    .eq('activo', true)
    .eq('rol', 'comercial')

  if (errorP) {
    console.error('Error consultando perfiles:', errorP)
    return NextResponse.json({ error: errorP.message }, { status: 500 })
  }

  const comercialIds = perfiles?.map(p => p.id) || []

  // 2. Obtener metas de los comerciales
  const { data: metas } = await supabase
    .from('metas_comerciales')
    .select('comercial_id, visitas_diarias')
    .in('comercial_id', comercialIds)

  // 3. Obtener Visitas
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

  if (comercialIds.length === 0) {
    mensaje = `📊 *Resumen de Visitas — ${label}*\n\n_No hay comerciales activos en el sistema._`
  } else {
    // 4. Procesar datos (incluyendo a los de 0 visitas)
    const ciudades = new Map<string, Map<string, {
      nombre: string
      visitas: number
      alertas: number
      meta: number
    }>>()

    // Inicializar todos los comerciales con 0 visitas
    for (const p of perfiles || []) {
      const ciudad = capitalizarCiudad(p.ciudad_zona || 'Sin ciudad')
      const metaObj = metas?.find(m => m.comercial_id === p.id)
      const meta = metaObj?.visitas_diarias ?? 5

      if (!ciudades.has(ciudad)) ciudades.set(ciudad, new Map())
      const comerciales = ciudades.get(ciudad)!

      comerciales.set(p.id, { nombre: p.nombre_completo, visitas: 0, alertas: 0, meta })
    }

    // Sumar las visitas reales
    for (const v of visitasReales) {
      const perfil = perfiles?.find(p => p.id === v.comercial_id)
      if (!perfil) continue // ignorar si no está en perfiles activos

      const ciudad = capitalizarCiudad(perfil.ciudad_zona || 'Sin ciudad')
      const tieneAlerta = v.alerta_fraude_checkin || v.alerta_fraude_checkout

      const entry = ciudades.get(ciudad)!.get(v.comercial_id)!
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

    lineas.push(`📊 *Resumen de Visitas — ${label}*\n`)

    for (const ciudad of ciudadesOrdenadas) {
      const comerciales = ciudades.get(ciudad)!
      lineas.push(`🏙️ *${ciudad.toUpperCase()}*`)
      lineas.push(`━━━━━━━━━━━━━━━━`)

      const lista = Array.from(comerciales.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      )

      for (const c of lista) {
        const metaAlcanzada = c.meta > 0 && c.visitas >= c.meta
        const checkMeta = metaAlcanzada ? ' ✅' : ''
        lineas.push(`👤 ${c.nombre} — *${c.visitas} visita${c.visitas !== 1 ? 's' : ''}*${checkMeta}`)
        if (c.alertas > 0) {
          lineas.push(`   ⚠️ ${c.alertas} sin coincidencia de ubicación`)
        }
        totalVisitas += c.visitas
        totalAlertas += c.alertas
      }
      lineas.push('')
    }

    const resumenAlertas = totalAlertas > 0
      ? ` | ⚠️ ${totalAlertas} alerta${totalAlertas !== 1 ? 's' : ''} de ubicación`
      : ''

    lineas.push(`📈 *TOTAL: ${totalVisitas} visita${totalVisitas !== 1 ? 's' : ''}${resumenAlertas}*`)
    mensaje = lineas.join('\n')
  }

  try {
    await enviarTelegram(botToken, chatId, mensaje)
    return NextResponse.json({ ok: true, label, visitas: visitasReales.length })
  } catch (err: any) {
    console.error('Error enviando Telegram:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
