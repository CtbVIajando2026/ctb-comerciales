const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: gData, error: gError } = await supabase.from('comercial_gamificacion').select('*');
  console.log("Gamificacion Error:", gError);
  console.log("Gamificacion Data count:", gData ? gData.length : 0);
  console.log("Sample:", gData ? gData[0] : null);
}
check();
