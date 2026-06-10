const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Get all visits and their created_at dates
  const { data: visitas, error: vError } = await supabase
    .from('visitas')
    .select('id, created_at, comercial_id, usuarios(nombre)')
    .order('created_at', { ascending: false });

  if (vError) console.error("Visits error:", vError);
  console.log("Total visits in database:", visitas ? visitas.length : 0);
  if (visitas) {
    visitas.slice(0, 10).forEach(v => {
      console.log(`Visit ID: ${v.id}, Created At: ${v.created_at}, Comercial: ${v.usuarios?.nombre}`);
    });
  }

  // 2. Get all users
  const { data: users, error: uError } = await supabase
    .from('usuarios')
    .select('id, nombre, rol');
  if (uError) console.error("Users error:", uError);
  console.log("Total users in database:", users ? users.length : 0);
  if (users) {
    console.log("Users:", users);
  }
}

run();
