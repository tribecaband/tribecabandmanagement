// Script para añadir el campo duration a la tabla events
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addDurationField() {
  console.log('🔧 Adding duration field to events table...')

  try {
    // Check if duration field already exists
    console.log('🔍 Checking if duration field exists...')
    const { data: existingEvent, error: readError } = await supabase
      .from('events')
      .select('duration')
      .limit(1)

    if (!readError) {
      console.log('✅ Duration field already exists!')
      return
    }

    console.log('📝 Duration field does not exist, creating it...')

    // Add duration field using raw SQL
    const addColumnSQL = `
      ALTER TABLE events
      ADD COLUMN duration INTEGER;
    `

    // We need to use the SQL editor or rpc function
    // Since we can't execute raw SQL directly, let's try a different approach
    console.log('⚠️ Cannot add duration field via JS client')
    console.log('🚫 Need to add duration field manually via Supabase dashboard')
    console.log('📋 SQL to run: ALTER TABLE events ADD COLUMN duration INTEGER;')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

await addDurationField()