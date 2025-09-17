// Script de debug para probar funcionalidad de canciones
import { SongsService } from './services/songsService';

// Función para probar las canciones
export async function debugSongs() {
  console.log('🎵 Debug: Testing songs functionality...');
  
  try {
    // Test 1: Obtener todas las canciones
    console.log('\n1. Getting all songs...');
    const allSongs = await SongsService.getAllSongs();
    console.log(`Found ${allSongs.length} songs in repertoire`);
    
    if (allSongs.length > 0) {
      const firstSong = allSongs[0];
      console.log(`First song: ${firstSong.title} by ${firstSong.artist}`);
      console.log(`Song ID: ${firstSong.id}, Added by: ${firstSong.added_by}`);
    }
    
    // Test 2: Agregar una canción de prueba
    console.log('\n2. Testing add functionality...');
    const testSong = {
      title: 'Debug Test Song',
      artist: 'Debug Artist',
      album: 'Debug Album',
      duration: 180,
      deezer_id: 'debug_' + Date.now(),
      preview_url: 'https://example.com/preview.mp3',
      album_cover: 'https://example.com/cover.jpg'
    };
    
    try {
      const addedSong = await SongsService.addSong(testSong);
      console.log('✅ Test song added successfully:', addedSong);
      
      // Verificar inmediatamente
      const songsAfterAdd = await SongsService.getAllSongs();
      const foundSong = songsAfterAdd.find(s => s.deezer_id === testSong.deezer_id);
      
      if (foundSong) {
        console.log('✅ Song found immediately after adding');
        
        // Test 3: Intentar eliminar
        console.log('\n3. Testing delete functionality...');
        try {
          await SongsService.deleteSong(foundSong.id);
          console.log('✅ Delete operation completed');
          
          // Verificar eliminación
          const songsAfterDelete = await SongsService.getAllSongs();
          const stillExists = songsAfterDelete.find(s => s.id === foundSong.id);
          
          if (stillExists) {
            console.log('❌ Song still exists after delete attempt');
          } else {
            console.log('✅ Song successfully deleted');
          }
          
        } catch (deleteError) {
          console.error('❌ Delete failed:', deleteError);
        }
        
      } else {
        console.log('❌ Song not found immediately after adding - this indicates the disappearing issue!');
      }
      
    } catch (addError) {
      console.error('❌ Add failed:', addError);
    }
    
    console.log('\n🎉 Debug test completed!');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Hacer la función disponible globalmente para testing
(window as any).debugSongs = debugSongs;

console.log('Debug script loaded. Run debugSongs() in console to test.');

// Ejecutar automáticamente después de 1 segundo
setTimeout(() => {
  console.log('🔍 Auto-executing debug test...');
  debugSongs();
}, 1000);