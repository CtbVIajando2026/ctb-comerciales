const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const timeFilter = '2026-07';
  const filtroZona = 'Global';
  const [year, month] = timeFilter.split('-');
  const gteStr = `${year}-${month}-01T00:00:00-05:00`;
  const nextMonth = new Date(parseInt(year), parseInt(month), 1);
  const lteStr = `${nextMonth.getFullYear()}-${(nextMonth.getMonth()+1).toString().padStart(2, '0')}-01T00:00:00-05:00`;
  
  let query = supabase.from('visitas').select(`comercial_id, es_actividad, usuarios!inner(zona)`).eq('estado', 'completada').gte('created_at', gteStr).lt('created_at', lteStr);
  const { data: visitas } = await query;
  
  const mapa = {};
  visitas.forEach(v => {
    if (!mapa[v.comercial_id]) mapa[v.comercial_id] = { visitas: 0, actividades: 0 };
    if (v.es_actividad) mapa[v.comercial_id].actividades += 1;
    else mapa[v.comercial_id].visitas += 1;
  });
  
  const { data: gamificacion } = await supabase.from('comercial_gamificacion').select('*');
  
  const result = (gamificacion || []).map(g => {
    const stats = mapa[g.comercial_id] || { visitas: 0, actividades: 0 };
    return {
      comercial_id: g.comercial_id,
      ...stats,
      puntos_mes_actual: g.puntos_mes_actual || 0,
      xp_total: g.xp_total || 0,
      racha_dias: g.racha_dias || 0
    };
  });
  
  console.log(result);
}
check();
