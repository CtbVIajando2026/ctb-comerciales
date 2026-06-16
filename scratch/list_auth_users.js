const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing auth users:", error);
    return;
  }
  
  console.log("Auth users count:", users.length);
  for (const user of users) {
    console.log(`Email: ${user.email} | ID: ${user.id} | Metadata:`, user.user_metadata);
    
    // Check if profile exists
    const { data: perfil } = await supabase
      .from('usuarios_perfil')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    console.log(`  Profile: ${perfil ? 'YES' : 'NO'} | Legacy: ${usuario ? 'YES' : 'NO'}`);
    if (perfil) {
      console.log(`    Nombre: ${perfil.nombre_completo} | Ciudad: ${perfil.ciudad_zona}`);
    }
  }
}
run();
