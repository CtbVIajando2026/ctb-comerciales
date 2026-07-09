const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('visitas')
    .select(`
      id, 
      created_at, 
      estado, 
      comercial_id, 
      es_actividad, 
      titulo_actividad, 
      alerta_fraude_checkin, 
      alerta_fraude_checkout,
      hora_checkin,
      hora_checkout,
      observaciones,
      temas,
      temas_texto_libre,
      registro_regalos(tipo, descripcion, cantidad, costo),
      usuarios!inner(nombre, zona),
      agencias(nombre, ciudad)
    `)
    .limit(5);

  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log("SUCCESS");
  }
}

run();
