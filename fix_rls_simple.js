// Script simple para probar y arreglar RLS
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAndFix() {
  console.log('🧪 Testing current musicians access...')

  // First test read access
  try {
    const { data, error } = await supabase.from('musicians').select('*').limit(5)
    if (error) {
      console.error('❌ Read error:', error)
    } else {
      console.log(`✅ Can read ${data.length} musicians`)
      console.log('Sample:', data.map(m => `${m.name} (${m.instrument})`))
    }
  } catch (err) {
    console.error('❌ Read exception:', err)
  }

  // Now test create access
  console.log('\n🧪 Testing create access...')
  try {
    const { data, error } = await supabase
      .from('musicians')
      .insert([{
        name: 'Test Musician RLS',
        instrument: 'guitarra',
        is_main: false
      }])
      .select()

    if (error) {
      console.error('❌ Create error:', error)
      console.log('Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Successfully created test musician:', data)

      // Clean up - delete the test musician
      const { error: deleteError } = await supabase
        .from('musicians')
        .delete()
        .eq('name', 'Test Musician RLS')

      if (deleteError) {
        console.warn('⚠️ Warning: Could not delete test musician:', deleteError)
      } else {
        console.log('🗑️ Test musician cleaned up')
      }
    }
  } catch (err) {
    console.error('❌ Create exception:', err)
  }

  // Check current policies
  console.log('\n🔍 Checking current policies...')
  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, roles, qual, with_check')
      .eq('tablename', 'musicians')

    if (error) {
      console.error('❌ Error checking policies:', error)
    } else {
      console.log('📋 Current policies:')
      data.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`)
        console.log(`    Roles: ${policy.roles}`)
        console.log(`    Using: ${policy.qual}`)
        console.log(`    Check: ${policy.with_check}`)
        console.log('')
      })
    }
  } catch (err) {
    console.error('❌ Policy check exception:', err)
  }
}

await testAndFix()