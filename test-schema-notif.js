import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: cols, error } = await supabase.rpc('get_schema_info') // Or just list tables
  
  const { data: contacts } = await supabase.from('agencia_contactos').select('id, nombre, fecha_cumpleanos').limit(1)
  console.log("Contactos has fecha_cumpleanos:", Object.keys(contacts?.[0] || {}))
  
  const { data: agencias } = await supabase.from('agencias').select('id, nombre, fecha_aniversario').limit(1)
  console.log("Agencias has fecha_aniversario:", Object.keys(agencias?.[0] || {}))
  
  // Any table for scheduling/reminders?
  // Let's just list all tables
  const { data: tables } = await supabase.from('pg_tables').select('*').limit(1)
  console.log("We can't easily list tables, let's grep the codebase for tables.")
}
test()
