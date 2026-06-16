const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const limite = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  console.log("Limite:", limite);

  const { data, error } = await supabase
    .from('visitas')
    .select(`
      id,
      hora_checkin,
      comercial_id,
      agencias!visitas_agencia_id_fkey(nombre)
    `)
    .eq('estado', 'abierta')
    // .eq('alerta_larga_enviada', false)
    .lt('hora_checkin', limite)
    .limit(1);

  if (error) {
    console.error("Error with !visitas_agencia_id_fkey:", error.message);
    
    // Try the fallback
    const { data: data2, error: err2 } = await supabase
      .from('visitas')
      .select(`
        id,
        hora_checkin,
        comercial_id,
        agencias:agencia_id(nombre)
      `)
      .eq('estado', 'abierta')
      .lt('hora_checkin', limite)
      .limit(1);
    
    if (err2) {
      console.error("Error with agencias:agencia_id:", err2.message);
    } else {
      console.log("Fallback succeeded:", data2);
    }
  } else {
    console.log("Original query succeeded:", data);
  }
}
run();
