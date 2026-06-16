const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  // Find a recent open visit or just any visit to use for the test
  const { data: visitas, error } = await supabase
    .from('visitas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (visitas && visitas.length > 0) {
    const visita = visitas[0];
    console.log("Modifying visita ID:", visita.id);
    
    // Set checkin to 2 hours ago, estado to 'abierta', and alerta_larga_enviada to false
    const checkinTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { error: updateError } = await supabase
      .from('visitas')
      .update({
        estado: 'abierta',
        alerta_larga_enviada: false,
        hora_checkin: checkinTime,
        hora_checkout: null
      })
      .eq('id', visita.id);

    if (updateError) {
      console.error("Error updating:", updateError);
    } else {
      console.log("Visita modified successfully to trigger alert!");
    }
  }
}
run();
