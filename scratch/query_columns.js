const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envPath = '/Users/juanmarcav/Development/CTB Comerciales/ctb-ventas/.env.local';
const envs = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)$/);
  if(match) envs[match[1]] = match[2].replace(/^[\"']|[\"']$/g, '');
});
const supabase = createClient(envs.NEXT_PUBLIC_SUPABASE_URL, envs.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('alertas_inactividad').select('*').limit(1);
  console.log(error || (data && data.length ? Object.keys(data[0]) : 'Empty table but query succeeded'));
}
run();
