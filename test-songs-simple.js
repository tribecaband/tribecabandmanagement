// Script simple para probar funcionalidad de canciones
import { SongsService } from './src/services/songsService.js';

async function testSongs() {
  console.log('🎵 Testing songs with SongsService...');
  
  try {
    const songsService = new SongsService();
    
    // Test 1: Obtener todas las canciones
    console.log('\n1. Getting all songs...');
    const allSongs = await songsService.getAllSongs();
    console.log(`✅ Found ${allSongs.length} songs in repertoire`);
    
    if (allSongs.length > 0) {
      console.log('First song:', allSongs[0].title, 'by', allSongs[0].artist);
      
      // Test 2: Intentar eliminar la primera canción
      console.log('\n2. Testing delete functionality...');
      const songToDelete = allSongs[0];
      console.log(`Attempting to delete: ${songToDelete.title}`);
      
      try {
        await songsService.deleteSong(songToDelete.id);
        console.log('✅ Delete operation completed');
        
        // Verificar si se eliminó
        const songsAfterDelete = await songsService.getAllSongs();
        const stillExists = songsAfterDelete.find(s => s.id === songToDelete.id);
        
        if (stillExists) {
          console.log('❌ Song still exists after delete');
        } else {
          console.log('✅ Song successfully deleted');
          
          // Volver a agregar la canción para no perder datos
          console.log('\n3. Re-adding the deleted song...');
          await songsService.addSong({
            title: songToDelete.title,
            artist: songToDelete.artist,
            album: songToDelete.album,
            duration: songToDelete.duration,
            deezer_id: songToDelete.deezer_id,
            preview_url: songToDelete.preview_url,
            album_cover: songToDelete.album_cover
          });
          console.log('✅ Song re-added successfully');
        }
        
      } catch (deleteError) {
        console.log('❌ Delete failed:', deleteError.message);
      }
    }
    
    // Test 3: Agregar una canción de prueba
    console.log('\n4. Testing add functionality...');
    const testSong = {
      title: 'Test Song ' + Date.now(),
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      deezer_id: 'test_' + Date.now(),
      preview_url: 'https://example.com/preview.mp3',
      album_cover: 'https://example.com/cover.jpg'
    };
    
    try {
      const addedSong = await songsService.addSong(testSong);
      console.log('✅ Test song added:', addedSong.title);
      
      // Verificar persistencia
      console.log('\n5. Checking persistence...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
      
      const songsAfterAdd = await songsService.getAllSongs();
      const persistedSong = songsAfterAdd.find(s => s.deezer_id === testSong.deezer_id);
      
      if (persistedSong) {
        console.log('✅ Song persisted successfully');
        
        // Limpiar - eliminar la canción de prueba
        console.log('\n6. Cleaning up test song...');
        await songsService.deleteSong(persistedSong.id);
        console.log('✅ Test song cleaned up');
      } else {
        console.log('❌ Song disappeared after adding!');
      }
      
    } catch (addError) {
      console.log('❌ Add failed:', addError.message);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testSongs();