import { createClient } from '@supabase/supabase-js';

// Use actual values from .env for testing
const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mjc2ODksImV4cCI6MjA3MjMwMzY4OX0.uRuOGe-w6oWARoV9nRAm92GX61PfTEtiXnCQwqzyV6I';

console.log('🔍 Environment variables:');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing basic Supabase connection...');
    
    // Test 1: Simple count query
    console.log('Test 1: Count musicians');
    const { count, error: countError } = await supabase
      .from('musicians')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count query failed:', countError);
    } else {
      console.log('✅ Count query success:', count);
    }
    
    // Test 2: Simple select with limit
    console.log('Test 2: Select with limit');
    const { data, error } = await supabase
      .from('musicians')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Select query failed:', error);
    } else {
      console.log('✅ Select query success:', data);
    }
    
    // Test 3: Full select
    console.log('Test 3: Full select');
    const { data: allData, error: allError } = await supabase
      .from('musicians')
      .select('*');
    
    if (allError) {
      console.error('❌ Full select failed:', allError);
    } else {
      console.log('✅ Full select success:', allData?.length, 'records');
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
}

testSupabaseConnection();