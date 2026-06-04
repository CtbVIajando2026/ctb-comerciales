import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data: comerciales, error } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo, ciudad_zona, activo')
    .eq('rol', 'comercial')

  console.log("Comerciales count:", comerciales?.length)
  console.log("Comerciales error:", error)
  if (comerciales && comerciales.length > 0) {
    console.log("Sample comercial:", comerciales[0])
  }
}
run()
