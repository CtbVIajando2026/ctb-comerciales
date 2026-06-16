const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Mock user ID of Juan Marca
const userId = '487ba38d-8df8-4424-9228-f690f24c5f8e';

async function run() {
  try {
    console.log("Simulating obtenerMeticasDashboard for user:", userId);
    
    // 1. Get meta
    console.log("Fetching meta...");
    const { data: meta, error: metaErr } = await supabase
      .from('metas_comerciales')
      .select('visitas_diarias')
      .eq('comercial_id', userId)
      .eq('activa', true)
      .single();
    
    console.log("Meta data:", meta, "Meta error:", metaErr);

    // 2. Visitas
    console.log("Fetching visitas...");
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' });
    const ecDateStr = formatter.format(now);
    const inicioDiaEcuador = new Date(`${ecDateStr}T00:00:00-05:00`).toISOString();
    
    const { data: visitas, error: visitasErr } = await supabase
      .from('visitas')
      .select(`
        id,
        es_actividad,
        titulo_actividad,
        hora_checkin,
        hora_checkout,
        estado,
        alerta_fraude_checkin,
        alerta_fraude_checkout,
        observaciones,
        temas,
        temas_texto_libre,
        gps_lat,
        gps_lng,
        agencia:agencias(nombre, temperatura)
      `)
      .eq('comercial_id', userId)
      .gte('created_at', inicioDiaEcuador)
      .order('created_at', { ascending: false });

    console.log("Visitas count:", visitas?.length, "Visitas error:", visitasErr);

    // 4. Justificacion
    console.log("Fetching justificacion...");
    const { data: justificacion, error: justErr } = await supabase
      .from('justificaciones_comerciales')
      .select('id')
      .eq('comercial_id', userId)
      .eq('fecha', ecDateStr)
      .single();
      
    console.log("Justificacion data:", justificacion, "Justificacion error:", justErr);

    // 5. Perfil
    console.log("Fetching perfil...");
    let perfil = null;
    const { data: perfilData, error: perfErr } = await supabase
      .from('usuarios_perfil')
      .select('nombre_completo, ciudad_zona')
      .eq('id', userId)
      .maybeSingle();
    
    console.log("Perfil data:", perfilData, "Perfil error:", perfErr);
    perfil = perfilData;

    if (!perfil) {
      console.log("Profile not found in usuarios_perfil, falling back to usuarios...");
      const { data: usuarioData, error: userErr } = await supabase
        .from('usuarios')
        .select('nombre, zona')
        .eq('id', userId)
        .maybeSingle();
      
      console.log("Usuario table data:", usuarioData, "Usuario table error:", userErr);
      if (usuarioData) {
        perfil = {
          nombre_completo: usuarioData.nombre,
          ciudad_zona: usuarioData.zona
        };
      }
    }

    console.log("Final profile object:", perfil);

    const metaDiaria = meta?.visitas_diarias !== undefined ? meta.visitas_diarias : 5;
    
    const result = {
      visitas: visitas || [],
      meta: metaDiaria,
      justificacionHoy: !!justificacion,
      perfil: perfil
    };
    
    console.log("Result:", result);
  } catch (err) {
    console.error("CRITICAL EXCEPTION THROWS:", err);
  }
}
run();
