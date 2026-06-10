const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("=== DIAGNÓSTICO DE VISITAS DE MATEO COELLAR (9 JUN 2026) ===");
  
  // Buscar el usuario "Mateo Coellar" para saber su ID
  const { data: usuario, error: errU } = await supabase
    .from('usuarios_perfil')
    .select('id, nombre_completo, ciudad_zona')
    .ilike('nombre_completo', '%Mateo%');
  
  console.log("Comercial Mateo:", usuario, "Error:", errU);
  
  if (!usuario || usuario.length === 0) {
    console.log("No se encontró al comercial Mateo Coellar en usuarios_perfil.");
    return;
  }
  
  const comercialId = usuario[0].id;
  
  // Consultar visitas de este comercial creadas el 9 de junio
  const { data: visitas, error: errV } = await supabase
    .from('visitas')
    .select(`
      id,
      created_at,
      es_actividad,
      titulo_actividad,
      comercial_id,
      agencia_id,
      usuarios:comercial_id ( nombre, zona ),
      agencias:agencia_id ( nombre, ciudad, zona )
    `)
    .eq('comercial_id', comercialId)
    .gte('created_at', '2026-06-09T00:00:00Z')
    .lte('created_at', '2026-06-09T23:59:59Z');
  
  console.log(`Visitas encontradas (${visitas?.length || 0}):`, JSON.stringify(visitas, null, 2));
  console.log("Error visitas:", errV);
  
  // Consultar todas las visitas sin filtro de fecha para ver sus creados en la DB
  const { data: todasVisitas } = await supabase
    .from('visitas')
    .select(`
      id,
      created_at,
      es_actividad,
      titulo_actividad,
      comercial_id,
      agencia_id,
      usuarios:comercial_id ( nombre, zona ),
      agencias:agencia_id ( nombre, ciudad, zona )
    `)
    .eq('comercial_id', comercialId)
    .limit(10)
    .order('created_at', { ascending: false });
    
  console.log("Últimas 10 visitas de Mateo:", JSON.stringify(todasVisitas, null, 2));
}

run();
