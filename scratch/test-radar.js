const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' });
  const ecDateStr = formatter.format(now); // "YYYY-MM-DD"
  const inicioDiaEcuador = new Date(`${ecDateStr}T00:00:00-05:00`).toISOString();
  console.log("inicioDiaEcuador:", inicioDiaEcuador);

  const { data: visitas, error } = await supabase
    .from('visitas')
    .select(`
      id, 
      estado, 
      comercial_id, 
      alerta_fraude_checkin, 
      alerta_fraude_checkout,
      created_at,
      hora_checkin,
      hora_checkout,
      gps_lat,
      gps_lng,
      es_actividad,
      titulo_actividad,
      usuarios!inner(nombre, zona),
      agencias(nombre)
    `); // Let's try without gte first to see if we get any data

  console.log("Error:", error);
  console.log("Visitas count:", visitas ? visitas.length : 0);
  if (visitas && visitas.length > 0) {
    console.log("First visit sample:", visitas[0]);
  }
}

run();
