const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('visitas')
    .select('id, dist_checkin_agencia_m, dist_checkout_checkin_m, alerta_ubicacion, distancia_checkin_metros, alerta_fraude_checkin')
    .limit(10);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Visits data:", data);
  }
}
run();
