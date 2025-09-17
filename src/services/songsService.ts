import { supabase } from '../lib/supabase';
import { Song, AddSongForm, DeezerTrack } from '../types';

export class SongsService {
  /**
   * Obtener todas las canciones
   * @returns Promise con el array de canciones
   */
  static async getAllSongs(): Promise<Song[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener canciones:', error);
        throw new Error('No se pudieron cargar las canciones');
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllSongs:', error);
      throw error;
    }
  }

  /**
   * Buscar canciones por título o artista
   * @param query Término de búsqueda
   * @returns Promise con el array de canciones filtradas
   */
  static async searchSongs(query: string): Promise<Song[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al buscar canciones:', error);
        throw new Error('No se pudo realizar la búsqueda');
      }

      return data || [];
    } catch (error) {
      console.error('Error en searchSongs:', error);
      throw error;
    }
  }

  /**
   * Agregar una nueva canción
   * @param songData Datos de la canción a agregar
   * @returns Promise con la canción creada
   */
  static async addSong(songData: AddSongForm): Promise<Song> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('songs')
        .insert({
          ...songData,
          added_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error al agregar canción:', error);
        throw new Error('No se pudo agregar la canción');
      }

      return data;
    } catch (error) {
      console.error('Error en addSong:', error);
      throw error;
    }
  }

  /**
   * Agregar canción desde Deezer
   * @param deezerTrack Datos de la canción de Deezer
   * @returns Promise con la canción creada
   */
  static async addSongFromDeezer(deezerTrack: DeezerTrack): Promise<Song> {
    try {
      // Verificar si la canción ya existe por deezer_id
      const { data: existingSong } = await supabase
        .from('songs')
        .select('id')
        .eq('deezer_id', deezerTrack.id)
        .single();

      if (existingSong) {
        throw new Error('Esta canción ya está en tu repertorio');
      }

      const songData: AddSongForm = {
        title: deezerTrack.title,
        artist: deezerTrack.artist.name,
        album: deezerTrack.album.title,
        duration: deezerTrack.duration,
        deezer_id: deezerTrack.id,
        // No guardamos preview_url ya que expira - se obtendrá dinámicamente
        album_cover: deezerTrack.album.cover_medium,
        key_signature: '' // Asignar tono vacío por defecto
      };

      return await this.addSong(songData);
    } catch (error) {
      console.error('Error en addSongFromDeezer:', error);
      throw error;
    }
  }

  /**
   * Eliminar una canción
   * @param songId ID de la canción a eliminar
   * @returns Promise que se resuelve cuando se elimina la canción
   */
  static async deleteSong(songId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) {
        console.error('Error al eliminar canción:', error);
        throw new Error('No se pudo eliminar la canción');
      }
    } catch (error) {
      console.error('Error en deleteSong:', error);
      throw error;
    }
  }

  /**
   * Actualizar el tono de una canción
   * @param songId ID de la canción
   * @param keySignature Nueva tonalidad
   * @returns Promise que se resuelve cuando se actualiza el tono
   */
  static async updateSongKeySignature(songId: string, keySignature: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('songs')
        .update({ key_signature: keySignature || null })
        .eq('id', songId);

      if (error) {
        console.error('Error al actualizar tono:', error);
        throw new Error('No se pudo actualizar el tono de la canción');
      }
    } catch (error) {
      console.error('Error en updateSongKeySignature:', error);
      throw error;
    }
  }

  /**
   * Obtener canción por ID
   * @param songId ID de la canción
   * @returns Promise con la canción
   */
  static async getSongById(songId: string): Promise<Song | null> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single();

      if (error) {
        console.error('Error al obtener canción:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en getSongById:', error);
      return null;
    }
  }

  /**
   * Formatear duración de segundos a formato mm:ss
   * @param seconds Duración en segundos
   * @returns Duración formateada
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}