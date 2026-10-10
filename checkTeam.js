const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

async function checkTeam() {
  const { data: team } = await supabase.from('teams').select('*').eq('team_id', 'IA26-G4LC').single();
  console.log('Team:', JSON.stringify(team, null, 2));
  
  const { data: members } = await supabase.from('team_members').select('*').eq('team_id', 'IA26-G4LC');
  console.log('Members:', JSON.stringify(members, null, 2));
  
  if (members && members.length > 0) {
    const userIds = members.map(m => m.user_id);
    const { data: users } = await supabase.from('users').select('id, email, payment_status').in('id', userIds);
    console.log('Users:', JSON.stringify(users, null, 2));
  }
  
  if (team) {
    const { data: payments } = await supabase.from('payments').select('*').eq('team_id', team.id);
    console.log('Payments:', JSON.stringify(payments, null, 2));
  }
}

checkTeam().catch(console.error);