import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import ws from 'ws'
dotenv.config()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
})
async function reset() {
  await supabase.from('players').delete().neq('id', 0)
  console.log('Players table cleared!')
}
reset()
