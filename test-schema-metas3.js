import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('metas_comerciales').select('*')
  console.log("metas_comerciales data:", data)
  
  const { data: profiles } = await supabase.from('usuarios_perfil').select('id, nombre_completo')
  console.log("profiles:", profiles)
}
test()
