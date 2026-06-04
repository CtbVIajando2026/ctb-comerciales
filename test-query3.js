const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('visitas')
    .select(`
      id, created_at, comercial_id, agencia_id,
      tipo_actividad, es_actividad, titulo_actividad,
      hora_checkin, hora_checkout, estado,
      gps_lat, gps_lng,
      distancia_gps_metros, alerta_fraude_checkin, alerta_fraude_checkout,
      tiempo_en_sitio_minutos,
      resumen_visita,
      usuarios:comercial_id ( nombre ),
      agencias:agencia_id ( nombre, direccion, zona, ciudad )
    `)
    .order('created_at', { ascending: false })
    .limit(10);
  console.log("Error:", error);
  console.log("Data:", data ? data.length : "null");
}
run();
