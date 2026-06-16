const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: visitas, error } = await supabase
    .from('visitas')
    .select(`
      id,
      comercial_id,
      agencia_id,
      estado,
      created_at,
      hora_checkin,
      hora_checkout,
      usuarios:comercial_id ( nombre )
    `)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("Error fetching recent visits:", error);
  } else {
    console.log("Recent visits:");
    visitas.forEach(v => {
      console.log(`ID: ${v.id} | Comercial: ${v.usuarios?.nombre} (${v.comercial_id}) | Agencia ID: ${v.agencia_id} | Estado: ${v.estado} | Created At: ${v.created_at}`);
    });
  }
}
run();
