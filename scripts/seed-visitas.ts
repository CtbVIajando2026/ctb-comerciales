import { createClient } from '@supabase/supabase-js'

// Inicializar cliente de Supabase (usamos llaves de admin para saltar RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Función auxiliar para obtener fechas aleatorias en los últimos 30 días
function getRandomDateInLast30Days() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30) // de 0 a 29 días atrás
  const hours = Math.floor(Math.random() * (17 - 8 + 1)) + 8 // entre 8 AM y 5 PM
  const minutes = Math.floor(Math.random() * 60)
  
  const date = new Date(now)
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hours, minutes, 0, 0)
  
  return date
}

// Coordenadas base por ciudad
const coordsBase = {
  'Quito': { lat: -0.180653, lng: -78.467834 },
  'Guayaquil': { lat: -2.196160, lng: -79.886208 },
  'Cuenca': { lat: -2.900128, lng: -79.005896 }
}

async function seedData() {
  console.log('🌱 Iniciando inyección de datos históricos...')

  // 1. Obtener comerciales
  const { data: comerciales, error: errComerciales } = await supabase
    .from('usuarios_perfil')
    .select('*')
    .eq('rol', 'comercial')

  if (errComerciales || !comerciales || comerciales.length === 0) {
    console.error('❌ No se encontraron comerciales.')
    process.exit(1)
  }

  for (const c of comerciales) {
    const { data: existingUser } = await supabase.from('usuarios').select('id').eq('id', c.id).single()
    if (!existingUser) {
      await supabase.from('usuarios').upsert({
        id: c.id,
        nombre: c.nombre_completo,
        email: c.nombre_completo.replace(' ', '').toLowerCase() + '@demo.com',
        rol: 'comercial',
        zona: c.ciudad_zona
      })
    }
  }

  console.log(`👤 Comerciales encontrados y sincronizados: ${comerciales.length}`)

  // 2. Obtener agencias
  const { data: agencias, error: errAgencias } = await supabase
    .from('agencias')
    .select('id')
  
  if (errAgencias || !agencias || agencias.length === 0) {
    console.error('❌ No se encontraron agencias.')
    process.exit(1)
  }

  console.log(`🏢 Agencias encontradas: ${agencias.length}`)

  const visitasFake = []
  const TOTAL_VISITAS = 150

  for (let i = 0; i < TOTAL_VISITAS; i++) {
    // Seleccionar comercial aleatorio
    const comercial = comerciales[Math.floor(Math.random() * comerciales.length)]
    // Seleccionar agencia aleatoria
    const agencia = agencias[Math.floor(Math.random() * agencias.length)]
    
    // Obtener coordenadas de la ciudad del comercial (o Quito por defecto)
    const ciudad = comercial.ciudad_zona && coordsBase[comercial.ciudad_zona as keyof typeof coordsBase] 
      ? comercial.ciudad_zona as keyof typeof coordsBase 
      : 'Quito'
    
    // Añadir un pequeño jitter a las coordenadas (variación aleatoria)
    const lat = coordsBase[ciudad].lat + (Math.random() - 0.5) * 0.05
    const lng = coordsBase[ciudad].lng + (Math.random() - 0.5) * 0.05

    // Determinar estado aleatorio (70% completada, 20% cancelada/fraude, 10% abierta)
    const rand = Math.random()
    let estado = 'completada'
    let alertaFraude = false
    let horaCheckout = null
    
    const horaCheckinDate = getRandomDateInLast30Days()
    const horaCheckin = horaCheckinDate.toISOString()

    if (rand < 0.7) {
      estado = 'completada'
      // Checkout entre 15 y 45 mins después
      const checkoutDate = new Date(horaCheckinDate)
      checkoutDate.setMinutes(checkoutDate.getMinutes() + 15 + Math.floor(Math.random() * 30))
      horaCheckout = checkoutDate.toISOString()
    } else if (rand < 0.9) {
      estado = 'completada'
      alertaFraude = true // Hubo fraude detectado
      const checkoutDate = new Date(horaCheckinDate)
      checkoutDate.setMinutes(checkoutDate.getMinutes() + 5 + Math.floor(Math.random() * 10))
      horaCheckout = checkoutDate.toISOString()
    } else {
      estado = 'abierta'
      // Si está abierta, idealmente debería ser de hoy, pero para efectos de la demo, lo dejamos histórico
    }

    visitasFake.push({
      comercial_id: comercial.id,
      agencia_id: agencia.id,
      estado,
      gps_lat: lat,
      gps_lng: lng,
      hora_checkin: horaCheckin,
      hora_checkout: horaCheckout,
      alerta_fraude_checkin: alertaFraude,
      alerta_fraude_checkout: Math.random() > 0.9 ? true : false,
      created_at: horaCheckin // Para que el histórico cuadre
    })
  }

  // Insertar en lotes de 50
  const BATCH_SIZE = 50
  let insertados = 0

  for (let i = 0; i < visitasFake.length; i += BATCH_SIZE) {
    const batch = visitasFake.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('visitas').insert(batch)
    
    if (error) {
      console.error('❌ Error insertando lote:', error)
    } else {
      insertados += batch.length
      console.log(`✅ Insertados ${insertados}/${TOTAL_VISITAS}`)
    }
  }

  console.log('🎉 Inyección completada exitosamente!')
}

seedData()
