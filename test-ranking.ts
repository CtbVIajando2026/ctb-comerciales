import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)

  const { data: visitas, error } = await supabase
    .from('visitas')
    .select(`
      id, 
      created_at, 
      estado, 
      comercial_id, 
      es_actividad, 
      titulo_actividad, 
      alerta_fraude_checkin, 
      alerta_fraude_checkout,
      usuarios!inner(nombre, zona),
      agencias(nombre)
    `)
    .gte('created_at', hace30Dias.toISOString())
    .order('created_at', { ascending: false })

  console.log("Visitas count:", visitas?.length)
  console.log("Visitas error:", error)
  if (visitas && visitas.length > 0) {
    console.log("Sample visita:", visitas[0])
  }
}
run()
