import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('metas_comerciales').upsert({ comercial_id: '8f97410e-114e-41b0-ba98-660ee44faaa1', visitas_diarias: 0 }, { onConflict: 'comercial_id' })
  console.log("Upsert result:", error || "Success")
}
test()
