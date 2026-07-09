const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetPass() {
  const { data, error } = await supabase.auth.admin.updateUserById('c67502d1-5480-44cb-8915-a9a905d20a4f', {
    password: 'admin12345'
  });
  console.log("juanmarcav:", error || "OK");

  const { data: d2, error: e2 } = await supabase.auth.admin.updateUserById('b0fdda67-c8a6-4f18-91f4-2439553512a5', {
    password: 'admin12345'
  });
  console.log("gerenciainfo:", e2 || "OK");
}
resetPass();
