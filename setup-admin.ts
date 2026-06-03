import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan variables de entorno")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeAdmin() {
  const email = 'juanmarcav@gmail.com'
  console.log(`Buscando usuario ${email}...`)

  const { data: authData, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error("Error obteniendo usuarios:", listError)
    return
  }

  const user = authData.users.find(u => u.email === email)
  if (!user) {
    console.error("No se encontró el usuario en Supabase Auth.")
    return
  }

  console.log(`Usuario encontrado: ${user.id}. Actualizando a rol ADMIN...`)

  const { error: upsertError } = await supabase
    .from('usuarios_perfil')
    .upsert({
      id: user.id,
      rol: 'admin',
      nombre_completo: 'Juan M',
      activo: true
    })

  if (upsertError) {
    console.error("Error al crear el perfil de admin:", upsertError)
  } else {
    console.log("✅ ¡ÉXITO! Tu cuenta ha sido convertida a Administrador Supremo.")
  }
}

makeAdmin()
