const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  // 1. Get all profiles
  const { data: perfiles, error: errPerfiles } = await supabase
    .from('usuarios_perfil')
    .select('*');
  
  if (errPerfiles) {
    console.error("Error fetching profiles:", errPerfiles);
    return;
  }
  
  console.log("Profiles count:", perfiles.length);
  console.log("Profiles list:");
  perfiles.forEach(p => {
    console.log(`ID: ${p.id} | Nombre: ${p.nombre_completo} | Ciudad/Zona: ${p.ciudad_zona} | Rol: ${p.rol} | Activo: ${p.activo}`);
  });

  // 2. Get legacy users table
  const { data: usuarios, error: errUsuarios } = await supabase
    .from('usuarios')
    .select('*');
  
  if (errUsuarios) {
    console.error("Error fetching legacy users:", errUsuarios);
  } else {
    console.log("\nLegacy users count:", usuarios.length);
    usuarios.forEach(u => {
      console.log(`ID: ${u.id} | Nombre: ${u.nombre} | Zona: ${u.zona} | Rol: ${u.rol}`);
    });
  }
}
run();
