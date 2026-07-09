const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('visitas')
    .select(`
      id,
      registro_regalos(tipo, cantidad, descripcion, costo)
    `)
    .limit(1);
  console.log(error);
}
run();
