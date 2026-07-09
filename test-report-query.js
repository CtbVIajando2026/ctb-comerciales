import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const query = supabase
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
      hora_checkin,
      hora_checkout,
      usuarios!inner(nombre, zona),
      agencias(nombre, ciudad)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data, error } = await query
  
  if (error) {
    console.error("SUPABASE ERROR:", error)
  } else {
    console.log("SUCCESS, found", data.length, "rows")
  }
}

test()
