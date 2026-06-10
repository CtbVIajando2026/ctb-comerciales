const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("=== DIAGNÓSTICO DE LA TABLA usuarios ===");
  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('id, nombre, zona, rol');
  
  console.log("Usuarios en la base de datos:", usuarios);
  console.log("Error:", error);
}

run();
