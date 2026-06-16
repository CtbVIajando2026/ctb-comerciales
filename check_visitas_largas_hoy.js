const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  console.log(`Buscando visitas desde ${startOfDay.toISOString()} hasta ${endOfDay.toISOString()}`);

  const { data, error } = await supabase
    .from('visitas')
    .select(`
      id,
      comercial_id,
      agencia_id,
      hora_checkin,
      hora_checkout,
      usuarios:comercial_id ( nombre ),
      agencias:agencia_id ( nombre )
    `)
    .gte('hora_checkin', startOfDay.toISOString())
    .lt('hora_checkin', endOfDay.toISOString())
    .not('hora_checkout', 'is', null);

  if (error) {
    console.error("Error de Supabase:", error);
    return;
  }

  const visitasLargas = data.filter(v => {
    if (!v.hora_checkin || !v.hora_checkout) return false;
    const checkin = new Date(v.hora_checkin);
    const checkout = new Date(v.hora_checkout);
    const diffHours = (checkout - checkin) / (1000 * 60 * 60);
    return diffHours > 1;
  });

  console.log(`\nSe encontraron ${visitasLargas.length} visitas de más de 1 hora hoy:\n`);
  
  visitasLargas.forEach(v => {
    const comercial = v.usuarios?.nombre || v.comercial_id;
    const agencia = v.agencias?.nombre || v.agencia_id;
    const diffMins = Math.round((new Date(v.hora_checkout) - new Date(v.hora_checkin)) / (1000 * 60));
    console.log(`- Comercial: ${comercial} | Agencia: ${agencia} | Duración: ${diffMins} minutos`);
    console.log(`  (Check-in: ${v.hora_checkin}, Check-out: ${v.hora_checkout})\n`);
  });
}
run();
