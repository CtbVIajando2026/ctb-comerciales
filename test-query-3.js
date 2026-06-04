const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: visitas, error } = await supabase
    .from('visitas')
    .select(`
      id, created_at, comercial_id, agencia_id,
      es_actividad, titulo_actividad, temas, observaciones,
      hora_checkin, hora_checkout, estado,
      gps_lat, gps_lng,
      distancia_checkin_metros, alerta_fraude_checkin, alerta_fraude_checkout,
      usuarios:comercial_id ( nombre ),
      agencias:agencia_id ( nombre, direccion, zona, ciudad )
    `)
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Error:", error);
  console.log("Visitas count:", visitas?.length);
  if(visitas?.length > 0) console.log(JSON.stringify(visitas[0], null, 2));
}
run();
