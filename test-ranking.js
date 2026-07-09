const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const timeFilter = '2026-07';
  const [year, month] = timeFilter.split('-');
  const gteStr = `${year}-${month}-01T00:00:00-05:00`;
  const nextMonth = new Date(parseInt(year), parseInt(month), 1);
  const lteStr = `${nextMonth.getFullYear()}-${(nextMonth.getMonth()+1).toString().padStart(2, '0')}-01T00:00:00-05:00`;
  
  console.log("Filters:", { gteStr, lteStr });
  
  let query = supabase
    .from('visitas')
    .select(`comercial_id, es_actividad, usuarios!inner(zona)`)
    .eq('estado', 'completada')
    .gte('created_at', gteStr)
    .lt('created_at', lteStr);
    
  const { data, error } = await query;
  console.log("Data count:", data ? data.length : 0);
  console.log("Error:", error);
}
check();
