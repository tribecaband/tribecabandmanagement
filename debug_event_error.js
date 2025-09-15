// Script para debuggear el error de guardado de eventos
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugEventError() {
  console.log('🔍 Debugging event save error...')

  try {
    // 1. Check the events table schema
    console.log('\n📋 Checking events table schema...')
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'events')
      .eq('table_schema', 'public')

    if (schemaError) {
      console.error('❌ Error checking schema:', schemaError)
    } else {
      console.log('✅ Events table columns:')
      columns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }

    // 2. Try to read an existing event to see its structure
    console.log('\n📊 Checking existing event structure...')
    const { data: existingEvents, error: readError } = await supabase
      .from('events')
      .select('*')
      .limit(1)

    if (readError) {
      console.error('❌ Error reading events:', readError)
    } else if (existingEvents?.[0]) {
      console.log('✅ Sample event structure:')
      const event = existingEvents[0]
      Object.keys(event).forEach(key => {
        console.log(`  - ${key}: ${typeof event[key]} = ${JSON.stringify(event[key])}`)
      })
    }

    // 3. Try a simple update to see what fails
    console.log('\n🧪 Testing simple update...')
    const testData = {
      event_types: ['boda'],
      duration: 180,
      updated_at: new Date().toISOString()
    }

    const { data: updateResult, error: updateError } = await supabase
      .from('events')
      .update(testData)
      .eq('id', '0867db05-ff3d-4180-8108-8271c0915c2c')
      .select()

    if (updateError) {
      console.error('❌ Update test failed:', updateError)
      console.log('Error details:', JSON.stringify(updateError, null, 2))
    } else {
      console.log('✅ Update test succeeded:', updateResult)
    }

  } catch (error) {
    console.error('❌ Exception during debug:', error)
  }
}

await debugEventError()