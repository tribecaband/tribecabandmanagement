import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzEsImV4cCI6MjA1MDU0ODk3MX0.test-key-placeholder'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthAndMusicians() {
  console.log('=== Testing Authentication and Musicians Access ===')
  
  // Check authentication status
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated')
  console.log('Auth error:', authError)
  
  // Test musicians query without authentication
  console.log('\n=== Testing Musicians Query (Unauthenticated) ===')
  const { data: musiciansData, error: musiciansError } = await supabase
    .from('musicians')
    .select('id, name, instrument, is_main')
    .order('name')
  
  console.log('Musicians data:', musiciansData)
  console.log('Musicians error:', musiciansError)
  
  if (musiciansError) {
    console.log('Error code:', musiciansError.code)
    console.log('Error message:', musiciansError.message)
    console.log('Error details:', musiciansError.details)
  }
  
  console.log('\n=== Summary ===')
  console.log('- Authentication:', session ? 'OK' : 'MISSING')
  console.log('- Musicians count:', musiciansData ? musiciansData.length : 0)
  console.log('- Has error:', !!musiciansError)
}

testAuthAndMusicians().catch(console.error)