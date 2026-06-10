const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: visitas } = await supabase
    .from('visitas')
    .select(`
      id,
      usuarios:comercial_id ( nombre, zona ),
      agencias:agencia_id ( nombre, ciudad )
    `)
    .eq('id', '3ff654ad-7e52-4897-8926-a4ee3e1464c8')
    .single();

  const ciudad = visitas.agencias?.ciudad || visitas.usuarios?.zona || 'Quito';
  const filtroCiudad = "Cuenca";

  console.log("Visit ID: 3ff654ad-7e52-4897-8926-a4ee3e1464c8");
  console.log("ciudad:", JSON.stringify(ciudad), "length:", ciudad.length);
  console.log("filtroCiudad:", JSON.stringify(filtroCiudad), "length:", filtroCiudad.length);
  console.log("Match:", ciudad === filtroCiudad);
}
run();
