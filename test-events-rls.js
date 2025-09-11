import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mjc2ODksImV4cCI6MjA3MjMwMzY4OX0.uRuOGe-w6oWARoV9nRAm92GX61PfTEtiXnCQwqzyV6I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventsRLS() {
  try {
    console.log('🔍 Testing events table RLS...');
    
    // Test 1: Read events
    console.log('\nTest 1: Read events');
    const { data: readData, error: readError } = await supabase
      .from('events')
      .select('id, name, cache_amount, advance_amount, created_by')
      .limit(3);
    
    if (readError) {
      console.error('❌ Read failed:', readError);
    } else {
      console.log('✅ Read success:', readData?.length, 'events');
      console.log('Sample event:', readData?.[0]);
    }
    
    // Test 2: Try to update an existing event (if any)
    if (readData && readData.length > 0) {
      const testEvent = readData[0];
      console.log('\nTest 2: Update event');
      console.log('Original event:', testEvent);
      
      const { data: updateData, error: updateError } = await supabase
        .from('events')
        .update({ advance_amount: 123 })
        .eq('id', testEvent.id)
        .select();
      
      if (updateError) {
        console.error('❌ Update failed:', updateError);
      } else {
        console.log('✅ Update result:', updateData);
        console.log('Rows affected:', updateData?.length || 0);
        
        // Check if update actually worked
        const { data: verifyData } = await supabase
          .from('events')
          .select('advance_amount')
          .eq('id', testEvent.id)
          .single();
        
        console.log('Verification - advance_amount after update:', verifyData?.advance_amount);
      }
    }
    
    // Test 3: Check current user/session
    console.log('\nTest 3: Check current user');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User check failed:', userError);
    } else {
      console.log('Current user:', user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : 'Not authenticated');
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
}

testEventsRLS();