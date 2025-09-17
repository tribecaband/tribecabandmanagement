// Script para probar la funcionalidad de canciones con las políticas RLS corregidas
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrusbvjeuthdmvwcgynv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXNidmpldXRoZG12d2NneW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mjc2ODksImV4cCI6MjA3MjMwMzY4OX0.uRuOGe-w6oWARoV9nRAm92GX61PfTEtiXnCQwqzyV6I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSongsFunctionality() {
  try {
    console.log('🎵 Testing songs functionality...');
    
    // Test 1: Verificar autenticación
    console.log('\n1. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ User not authenticated. Attempting to sign in...');
      
      // Intentar autenticarse (necesitarás credenciales válidas)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com', // Cambiar por email válido
        password: 'password123' // Cambiar por password válido
      });
      
      if (signInError) {
        console.log('❌ Authentication failed:', signInError.message);
        console.log('Please update the credentials in the script or sign in manually.');
        return;
      }
      
      console.log('✅ Authentication successful');
    } else {
      console.log('✅ User authenticated:', user.email);
    }
    
    // Test 2: Listar canciones existentes
    console.log('\n2. Listing existing songs...');
    const { data: existingSongs, error: listError } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (listError) {
      console.log('❌ Error listing songs:', listError.message);
    } else {
      console.log(`✅ Found ${existingSongs.length} existing songs`);
      existingSongs.forEach(song => {
        console.log(`   - ${song.title} by ${song.artist} (ID: ${song.id})`);
      });
    }
    
    // Test 3: Agregar una canción de prueba
    console.log('\n3. Adding a test song...');
    const testSong = {
      title: 'Test Song ' + Date.now(),
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      deezer_id: 'test_' + Date.now(),
      preview_url: 'https://example.com/preview.mp3',
      album_cover: 'https://example.com/cover.jpg'
    };
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    const { data: newSong, error: insertError } = await supabase
      .from('songs')
      .insert({
        ...testSong,
        added_by: currentUser?.id
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Error adding song:', insertError.message);
      console.log('Full error:', insertError);
    } else {
      console.log('✅ Song added successfully:', newSong.title);
      console.log('   Song ID:', newSong.id);
      
      // Test 4: Verificar que la canción persiste
      console.log('\n4. Verifying song persistence...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', newSong.id)
        .single();
      
      if (verifyError) {
        console.log('❌ Song disappeared! Error:', verifyError.message);
      } else {
        console.log('✅ Song persists in database:', verifyData.title);
      }
      
      // Test 5: Eliminar la canción de prueba
      console.log('\n5. Testing song deletion...');
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .eq('id', newSong.id);
      
      if (deleteError) {
        console.log('❌ Error deleting song:', deleteError.message);
        console.log('Full error:', deleteError);
      } else {
        console.log('✅ Song deleted successfully');
        
        // Verificar que se eliminó
        const { data: deletedCheck, error: deletedError } = await supabase
          .from('songs')
          .select('*')
          .eq('id', newSong.id)
          .single();
        
        if (deletedError && deletedError.code === 'PGRST116') {
          console.log('✅ Song successfully removed from database');
        } else {
          console.log('❌ Song still exists in database');
        }
      }
    }
    
    // Test 6: Verificar políticas RLS
    console.log('\n6. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'songs' })
      .select();
    
    if (policiesError) {
      console.log('⚠️  Could not check policies (this is normal):', policiesError.message);
    } else {
      console.log('✅ RLS policies active');
    }
    
    console.log('\n🎉 Songs functionality test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Ejecutar las pruebas
testSongsFunctionality();