const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const userId = '487ba38d-8df8-4424-9228-f690f24c5f8e';

async function run() {
  console.log("Creating profile in usuarios_perfil for user:", userId);
  
  const { data, error } = await supabase
    .from('usuarios_perfil')
    .insert({
      id: userId,
      rol: 'comercial',
      nombre_completo: 'Juan Marca',
      telefono: '0999999999',
      ciudad_zona: 'Quito',
      activo: true
    })
    .select();
    
  if (error) {
    console.error("Error creating profile:", error);
  } else {
    console.log("Successfully created profile:", data);
  }
}
run();
