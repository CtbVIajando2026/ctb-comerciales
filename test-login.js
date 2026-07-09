const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'juanmarcav@gmail.com',
    password: 'admin12345'
  });
  console.log("LOGIN JUAN:", !!data.user, error?.message || 'OK');

  const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({
    email: 'gerenciainfo@ctbviajando.com',
    password: 'admin12345'
  });
  console.log("LOGIN GERENCIA:", !!d2.user, e2?.message || 'OK');
}
testLogin();
