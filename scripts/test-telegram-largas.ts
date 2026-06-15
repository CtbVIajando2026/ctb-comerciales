import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Cargar variables de entorno manualmente desde .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8')
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^#][^\s=]+)\s*=\s*(.*)$/)
    if (match) {
      process.env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1')
    }
  })
}

const botToken = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!botToken || !chatId || !supabaseUrl || !supabaseKey) {
  console.error("Faltan credenciales en .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function enviarTelegram(texto: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      parse_mode: 'Markdown',
    }),
  })
  if (!res.ok) throw new Error(await res.text())
}

async function run() {
  console.log("Consultando visitas del día de hoy mayores a 1 hora...")
  
  // Fecha inicio del día (Ecuador UTC-5)
  const ahora = new Date()
  const offset = -5
  const hoyEcuador = new Date(ahora.getTime() + (offset * 60 * 60 * 1000))
  const inicioDia = new Date(hoyEcuador)
  inicioDia.setUTCHours(5, 0, 0, 0) // 00:00:00 local es 05:00:00 UTC
  
  const { data: visitas, error } = await supabase
    .from('visitas')
    .select(`
      id,
      hora_checkin,
      hora_checkout,
      estado,
      comercial_id,
      agencia_id,
      agencias!visitas_agencia_id_fkey(nombre)
    `)
    .gte('hora_checkin', inicioDia.toISOString())
    
  if (error) {
    console.error("Error consultando:", error)
    return
  }
  
  // Obtener perfiles
  const comercialIds = visitas.map(v => v.comercial_id)
  const { data: perfiles } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo')
    .in('id', comercialIds)

  const visitasLargas = visitas.filter(v => {
    const inicio = new Date(v.hora_checkin).getTime()
    const fin = v.hora_checkout ? new Date(v.hora_checkout).getTime() : Date.now()
    const diffMinutos = (fin - inicio) / 1000 / 60
    return diffMinutos > 60
  })

  if (visitasLargas.length === 0) {
    console.log("No se encontraron visitas de más de 1 hora el día de hoy.")
    await enviarTelegram("✅ *Prueba Sistema:* El día de hoy ningún comercial ha excedido 1 hora de visita.")
    return
  }

  console.log(`Encontradas ${visitasLargas.length} visitas largas. Enviando Telegram...`)
  
  let mensaje = "⚠️ *Prueba - Visitas > 1 hora (Hoy)*\n\n"
  
  for (const v of visitasLargas) {
    const perfil = perfiles?.find(p => p.id === v.comercial_id)
    const comercialNombre = perfil?.nombre_completo || 'Un comercial'
    const agenciaObj = v.agencias as any
    const agenciaNombre = agenciaObj?.nombre || 'una agencia'
    
    const inicio = new Date(v.hora_checkin).getTime()
    const fin = v.hora_checkout ? new Date(v.hora_checkout).getTime() : Date.now()
    const diffMinutos = Math.floor((fin - inicio) / 1000 / 60)
    
    const estado = v.estado === 'abierta' ? '*(En Curso)*' : '(Completada)'
    
    mensaje += `👤 ${comercialNombre} en ${agenciaNombre}\n`
    mensaje += `⏱ Tiempo: ${diffMinutos} minutos ${estado}\n\n`
  }
  
  await enviarTelegram(mensaje)
  console.log("Mensaje enviado con éxito!")
}

run().catch(console.error)
