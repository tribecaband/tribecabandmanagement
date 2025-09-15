// Script para verificar si el campo duration existe en la tabla events
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDurationField() {
  console.log('🔍 Checking if duration field exists in events table...')

  try {
    // Test if we can select duration field
    console.log('🧪 Testing duration field access...')
    const { data, error } = await supabase
      .from('events')
      .select('id, duration')
      .limit(1)

    if (error) {
      console.error('❌ Duration field does not exist:', error.message)
      console.log('📋 Need to add duration field manually via Supabase dashboard')
      console.log('📝 SQL to run: ALTER TABLE events ADD COLUMN duration INTEGER;')
      return false
    } else {
      console.log('✅ Duration field exists!')
      console.log('📊 Sample data:', data)
      return true
    }

  } catch (error) {
    console.error('❌ Exception:', error)
    return false
  }
}

async function testDurationUpdate() {
  console.log('\n🧪 Testing duration update...')

  try {
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('id')
      .limit(1)

    if (fetchError || !events?.[0]) {
      console.error('❌ No events found to test with')
      return
    }

    const testEvent = events[0]
    console.log(`📝 Testing with event ID: ${testEvent.id}`)

    const { data, error } = await supabase
      .from('events')
      .update({ duration: 240 }) // 4 hours
      .eq('id', testEvent.id)
      .select()

    if (error) {
      console.error('❌ Duration update failed:', error.message)
    } else {
      console.log('✅ Duration update succeeded:', data)
    }

  } catch (error) {
    console.error('❌ Exception during update test:', error)
  }
}

const fieldExists = await checkDurationField()
if (fieldExists) {
  await testDurationUpdate()
}