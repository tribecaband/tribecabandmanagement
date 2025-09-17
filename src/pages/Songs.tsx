import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Music, Play, Trash2, Clock, User, Album, Pause } from 'lucide-react';
import { Song, DeezerTrack } from '../types';
import { SongsService } from '../services/songsService';
import { DeezerService } from '../services/deezerService';
import { toast } from 'sonner';
import KeySignatureSelector from '../components/KeySignatureSelector';
import '../test-songs-debug';

const Songs: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [unifiedQuery, setUnifiedQuery] = useState('');
  const [repertoireFilter, setRepertoireFilter] = useState('');
  const [deezerResults, setDeezerResults] = useState<DeezerTrack[]>([]);
  const [deezerLoading, setDeezerLoading] = useState(false);
  const [addingFromDeezer, setAddingFromDeezer] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; songId: string; title: string }>({ isOpen: false, songId: '', title: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Cargar canciones al montar el componente
  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setLoading(true);
      const songsData = await SongsService.getAllSongs();
      setSongs(songsData);
    } catch (error) {
      console.error('Error al cargar canciones:', error);
      toast.error('Error al cargar las canciones');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar canciones localmente
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(repertoireFilter.toLowerCase()) ||
    song.artist.toLowerCase().includes(repertoireFilter.toLowerCase()) ||
    (song.album && song.album.toLowerCase().includes(repertoireFilter.toLowerCase()))
  );

  // Buscar en Deezer con debounce
  const searchDeezer = useCallback(async (query: string) => {
    if (!query.trim()) {
      setDeezerResults([]);
      return;
    }

    try {
      setDeezerLoading(true);
      const results = await DeezerService.searchTracks(query, 8);
      // Filtrar canciones que ya están en el repertorio
      const filteredResults = results.data.filter(track => 
        !songs.some(song => 
          song.title.toLowerCase() === track.title.toLowerCase() && 
          song.artist.toLowerCase() === track.artist.name.toLowerCase()
        )
      );
      setDeezerResults(filteredResults);
    } catch (error) {
      // Solo mostrar error si no es una cancelación de petición
      if (error instanceof Error && error.message !== 'REQUEST_CANCELLED') {
        console.error('Error al buscar en Deezer:', error);
        toast.error('Error al buscar en Deezer');
      }
      // Si es una cancelación, simplemente no actualizar los resultados
      if (error instanceof Error && error.message === 'REQUEST_CANCELLED') {
        return; // No limpiar resultados ni cambiar loading state
      }
      setDeezerResults([]);
    } finally {
      // Solo cambiar loading state si no fue una cancelación
      setDeezerLoading(false);
    }
  }, [songs]);

  // Efecto para búsqueda de Deezer con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (unifiedQuery.trim()) {
        searchDeezer(unifiedQuery);
        setShowDropdown(true);
      } else {
        setDeezerResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [unifiedQuery, searchDeezer]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar audio al desmontar
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  // Limpiar event listeners cuando cambia el audio
  useEffect(() => {
    if (audioElement) {
      const handleTimeUpdate = () => {
        setAudioProgress(audioElement.currentTime);
      };

      const handleLoadedMetadata = () => {
        setAudioDuration(audioElement.duration);
      };

      const handleEnded = () => {
        setCurrentlyPlaying(null);
        setCurrentSongId(null);
        setIsLoading(false);
        setAudioProgress(0);
      };

      const handleError = () => {
        toast.error('Error al reproducir el preview');
        setCurrentlyPlaying(null);
        setCurrentSongId(null);
        setIsLoading(false);
        setAudioProgress(0);
      };

      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.addEventListener('ended', handleEnded);
      audioElement.addEventListener('error', handleError);

      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.removeEventListener('error', handleError);
      };
    }
  }, [audioElement]);

  // Funciones de reproducción de audio
  const handlePlayPreview = async (previewUrl: string, trackId: string) => {
    try {
      // Si ya hay algo reproduciéndose, pausarlo completamente
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement.src = ''; // Limpiar la fuente
        audioElement.load(); // Forzar la limpieza del elemento
        
        // Si es la misma canción, solo pausar
        if (currentlyPlaying === trackId && currentSongId === trackId) {
          setCurrentlyPlaying(null);
          setCurrentSongId(null);
          setIsLoading(false);
          setAudioProgress(0);
          setAudioElement(null);
          return;
        }
      }

      // Limpiar estado anterior completamente
      setCurrentlyPlaying(null);
      setCurrentSongId(null);
      setAudioProgress(0);
      setAudioDuration(0);
      setAudioElement(null);
      
      // Establecer estado de carga
      setIsLoading(true);
      setCurrentSongId(trackId);

      // Crear nuevo elemento de audio
      const audio = new Audio();
      audio.volume = 0.7;
      audio.preload = 'metadata';
      
      // Promesa para manejar la carga del audio
      const audioLoadPromise = new Promise<void>((resolve, reject) => {
        const handleCanPlay = () => {
          setIsLoading(false);
          setCurrentlyPlaying(trackId);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (event: Event) => {
          console.error('Error al cargar audio:', previewUrl, event);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          reject(new Error('Error al cargar el audio'));
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
      });
      
      // Establecer el nuevo audio y la fuente
      setAudioElement(audio);
      audio.src = previewUrl;
      
      // Esperar a que el audio esté listo y luego reproducir
      await audioLoadPromise;
      
      // Intentar reproducir solo después de que esté listo
      try {
        await audio.play();
      } catch (playError: any) {
        // Manejar específicamente el AbortError
        if (playError.name === 'AbortError') {
          console.log('Reproducción interrumpida por otra acción');
          return; // No mostrar error al usuario, es comportamiento esperado
        }
        throw playError; // Re-lanzar otros errores
      }
      
    } catch (error: any) {
      console.error('Error al reproducir preview:', error);
      
      // Solo mostrar toast de error si no es un AbortError
      if (error.name !== 'AbortError') {
        toast.error('Error al reproducir el preview');
      }
      
      // Limpiar estado en caso de error
      setCurrentlyPlaying(null);
      setCurrentSongId(null);
      setIsLoading(false);
      setAudioProgress(0);
      setAudioElement(null);
    }
  };

  // Nueva función para reproducir canciones guardadas usando deezer_id
  const handlePlaySavedSong = async (song: Song, trackId: string) => {
    try {
      // Si ya hay algo reproduciéndose, pausarlo completamente
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement.src = ''; // Limpiar la fuente
        audioElement.load(); // Forzar la limpieza del elemento
        
        // Si es la misma canción, solo pausar
        if (currentlyPlaying === trackId && currentSongId === trackId) {
          setCurrentlyPlaying(null);
          setCurrentSongId(null);
          setIsLoading(false);
          setAudioProgress(0);
          setAudioElement(null);
          return;
        }
      }

      // Limpiar estado anterior completamente
      setCurrentlyPlaying(null);
      setCurrentSongId(null);
      setAudioProgress(0);
      setAudioDuration(0);
      setAudioElement(null);
      
      // Establecer estado de carga
      setIsLoading(true);
      setCurrentSongId(trackId);

      // Obtener URL de preview fresca usando deezer_id
      let previewUrl: string | null = null;
      
      if (song.deezer_id) {
        previewUrl = await DeezerService.getPreviewUrl(song.deezer_id);
      }
      
      // Si no se pudo obtener URL fresca, usar la guardada como fallback
      if (!previewUrl && song.preview_url && DeezerService.isValidPreviewUrl(song.preview_url)) {
        previewUrl = song.preview_url;
        console.warn('Usando preview URL guardada como fallback para:', song.title);
      }
      
      if (!previewUrl) {
        throw new Error('Esta canción no tiene preview disponible en este momento');
      }

      // Crear nuevo elemento de audio
      const audio = new Audio();
      audio.volume = 0.7;
      audio.preload = 'metadata';
      
      // Promesa para manejar la carga del audio
      const audioLoadPromise = new Promise<void>((resolve, reject) => {
        const handleCanPlay = () => {
          setIsLoading(false);
          setCurrentlyPlaying(trackId);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (event: Event) => {
          console.error('Error al cargar audio:', previewUrl, event);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          reject(new Error('Error al cargar el audio'));
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
      });
      
      // Establecer el nuevo audio y la fuente
      setAudioElement(audio);
      audio.src = previewUrl;
      
      // Esperar a que el audio esté listo y luego reproducir
      await audioLoadPromise;
      
      // Intentar reproducir solo después de que esté listo
      try {
        await audio.play();
      } catch (playError: any) {
        // Manejar específicamente el AbortError
        if (playError.name === 'AbortError') {
          console.log('Reproducción interrumpida por otra acción');
          return; // No mostrar error al usuario, es comportamiento esperado
        }
        throw playError; // Re-lanzar otros errores
      }
      
    } catch (error: any) {
      console.error('Error al reproducir preview de canción guardada:', error);
      
      // Solo mostrar toast de error si no es un AbortError
      if (error.name !== 'AbortError') {
        let errorMessage = 'Error al reproducir el preview';
        
        if (error.message?.includes('preview disponible')) {
          errorMessage = 'Esta canción no tiene preview disponible';
        } else if (error.message?.includes('cargar el audio')) {
          errorMessage = 'No se pudo cargar el audio de la canción';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Error de conexión. Verifica tu internet';
        }
        
        toast.error(errorMessage);
      }
      
      // Limpiar estado en caso de error
      setCurrentlyPlaying(null);
      setCurrentSongId(null);
      setIsLoading(false);
      setAudioProgress(0);
      setAudioElement(null);
    }
  };

  const handlePausePreview = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = ''; // Limpiar la fuente
      setCurrentlyPlaying(null);
      setCurrentSongId(null);
      setIsLoading(false);
      setAudioProgress(0);
      setAudioElement(null);
    }
  };

  // Componente de barra de progreso circular
  const CircularProgress: React.FC<{ 
    progress: number; 
    duration: number; 
    size: number; 
    strokeWidth: number;
    isPlaying: boolean;
  }> = ({ progress, duration, size, strokeWidth, isPlaying }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    if (!isPlaying || duration === 0) return null;

    return (
      <svg
        className="absolute inset-0 transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Círculo de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Círculo de progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2DB2CA"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-200 ease-out"
        />
      </svg>
    );
  };

  // Agregar canción desde Deezer
  const handleAddFromDeezer = async (track: DeezerTrack) => {
    try {
      setAddingFromDeezer(track.id);
      await SongsService.addSongFromDeezer(track);
      toast.success(`"${track.title}" agregada al repertorio`);
      await loadSongs();
      // Limpiar búsqueda de Deezer después de agregar
      setUnifiedQuery('');
      setDeezerResults([]);
      setShowDropdown(false);
    } catch (error: any) {
      console.error('Error al agregar canción:', error);
      toast.error(error.message || 'Error al agregar la canción');
    } finally {
      setAddingFromDeezer(null);
    }
  };

  // Abrir modal de confirmación para eliminar
  const handleDeleteSong = (songId: string, title: string) => {
    setDeleteModal({ isOpen: true, songId, title });
  };

  // Confirmar eliminación de canción
  const confirmDeleteSong = async () => {
    if (!deleteModal.songId) return;

    try {
      setIsDeleting(true);
      await SongsService.deleteSong(deleteModal.songId);
      toast.success('Canción eliminada');
      await loadSongs();
      setDeleteModal({ isOpen: false, songId: '', title: '' });
    } catch (error) {
      console.error('Error al eliminar canción:', error);
      toast.error('Error al eliminar la canción');
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancelar eliminación
  const cancelDeleteSong = () => {
    setDeleteModal({ isOpen: false, songId: '', title: '' });
  };

  // Actualizar tono de canción
  const handleUpdateKeySignature = async (songId: string, newKey: string) => {
    try {
      await SongsService.updateSongKeySignature(songId, newKey);
      // Actualizar el estado local
      setSongs(prev => prev.map(song => 
        song.id === songId ? { ...song, key_signature: newKey } : song
      ));
      toast.success('Tono actualizado');
    } catch (error) {
      console.error('Error al actualizar tono:', error);
      toast.error('Error al actualizar el tono');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando canciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <Music className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold text-gray-900">Canciones</h1>
          <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {songs.length} canciones
          </span>
        </div>
      </div>
        {/* Búsqueda unificada */}
        <div className="mb-8 relative">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar y agregar canciones desde Deezer..."
              value={unifiedQuery}
              onChange={(e) => setUnifiedQuery(e.target.value)}
              onFocus={() => unifiedQuery && deezerResults.length > 0 && setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm text-lg"
            />
            {deezerLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
              </div>
            )}
          </div>

          {/* Dropdown de resultados de Deezer */}
          {showDropdown && unifiedQuery && deezerResults.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center text-sm text-gray-600">
                  <Plus className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="font-medium">Agregar desde Deezer</span>
                  <span className="ml-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    {deezerResults.length}
                  </span>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {deezerResults.slice(0, 8).map((track) => {
                  const isAlreadyInRepertoire = songs.some(song => 
                    song.title.toLowerCase() === track.title.toLowerCase() && 
                    song.artist.toLowerCase() === track.artist.name.toLowerCase()
                  );
                  const isPlaying = currentlyPlaying === track.id && currentSongId === track.id;
                  const isLoadingTrack = isLoading && currentSongId === track.id;
                  
                  return (
                    <div key={track.id} className={`flex items-center p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                      isAlreadyInRepertoire ? 'bg-gray-25' : ''
                    }`}>
                      {/* Thumbnail con botón de reproducción */}
                      <div className="relative flex-shrink-0 mr-3">
                        {track.album?.cover_small ? (
                          <div className="relative group">
                            <img
                              src={track.album.cover_small}
                              alt={track.album.title || track.title}
                              className={`w-12 h-12 rounded-md object-cover ${
                                isAlreadyInRepertoire ? 'opacity-75' : ''
                              }`}
                            />
                            {track.preview && (
                              <button
                                onClick={() => isPlaying ? handlePausePreview() : handlePlayPreview(track.preview!, track.id)}
                                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md"
                                disabled={isLoadingTrack}
                              >
                                <div className={`relative p-1.5 rounded-full bg-white bg-opacity-90 transform transition-all duration-200 ${
                                  isPlaying || isLoadingTrack ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                                }`}>
                                  <CircularProgress
                                    progress={audioProgress}
                                    duration={audioDuration}
                                    size={24}
                                    strokeWidth={2}
                                    isPlaying={isPlaying}
                                  />
                                  {isLoadingTrack ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-800 border-t-transparent" />
                                  ) : isPlaying ? (
                                    <Pause className="h-3 w-3 text-gray-800" />
                                  ) : (
                                    <Play className="h-3 w-3 text-gray-800 ml-0.5" />
                                  )}
                                </div>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                            <Music className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Información de la canción */}
                      <div className="flex-1 min-w-0 mr-3">
                        <h3 className="font-medium text-gray-900 truncate text-sm" title={track.title}>
                          {track.title}
                        </h3>
                        <div className="flex items-center text-xs text-gray-600 mt-0.5">
                          <span className="truncate" title={track.artist.name}>{track.artist.name}</span>
                          {track.album && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="truncate" title={track.album.title}>{track.album.title}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{DeezerService.formatDuration(track.duration)}</span>
                        </div>
                      </div>

                      {/* Botón de agregar */}
                      <div className="flex-shrink-0">
                        {isAlreadyInRepertoire && (
                          <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            <Music className="h-3 w-3 mr-1" />
                            <span>En repertorio</span>
                          </div>
                        )}
                        {!isAlreadyInRepertoire && (
                          <button
                            onClick={() => handleAddFromDeezer(track)}
                            disabled={addingFromDeezer === track.id}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingFromDeezer === track.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            <span className="hidden sm:inline">Agregar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>



        {/* Mensaje cuando no hay resultados de Deezer */}
        {unifiedQuery && !deezerLoading && deezerResults.length === 0 && filteredSongs.length === 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron canciones en tu repertorio ni en Deezer</p>
            <p className="text-sm text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        )}

        {/* Tu Repertorio */}
        {filteredSongs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Music className="h-5 w-5 mr-2 text-purple-500" />
              Tu Repertorio
              <span className="ml-2 bg-purple-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                {filteredSongs.length}
              </span>
            </h2>
            
            {/* Buscador del repertorio */}
            {songs.length > 0 && (
              <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Filtrar canciones del repertorio..."
                  value={repertoireFilter}
                  onChange={(e) => setRepertoireFilter(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            )}
            
            {/* Tabla para desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto" style={{overflow: 'visible'}}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Canción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Artista
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duración
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tono
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSongs.map((song) => {
                      const isPlaying = currentlyPlaying === `song-${song.id}` && currentSongId === `song-${song.id}`;
                      
                      return (
                        <tr key={song.id} className="hover:bg-gray-50 transition-colors">
                          {/* Título con imagen */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 relative group">
                                {song.album_cover ? (
                                  <>
                                    <img
                                      className="h-12 w-12 rounded-lg object-cover"
                                      src={song.album_cover}
                                      alt={song.album || song.title}
                                    />
                                    {(song.deezer_id || (song.preview_url && DeezerService.isValidPreviewUrl(song.preview_url))) && (
                              <button
                                onClick={() => isPlaying && currentSongId === `song-${song.id}` ? handlePausePreview() : handlePlaySavedSong(song, `song-${song.id}`)}
                                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg"
                                disabled={isLoading && currentSongId === `song-${song.id}`}
                              >
                                <div className={`relative p-1.5 rounded-full bg-white bg-opacity-90 transform transition-all duration-200 ${
                                  (isPlaying && currentSongId === `song-${song.id}`) || (isLoading && currentSongId === `song-${song.id}`) ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                                }`}>
                                  <CircularProgress
                                    progress={audioProgress}
                                    duration={audioDuration}
                                    size={20}
                                    strokeWidth={2}
                                    isPlaying={isPlaying && currentSongId === `song-${song.id}`}
                                  />
                                  {isLoading && currentSongId === `song-${song.id}` ? (
                                    <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-gray-800 border-t-transparent" />
                                  ) : (isPlaying && currentSongId === `song-${song.id}`) ? (
                                    <Pause className="h-2.5 w-2.5 text-gray-800" />
                                  ) : (
                                    <Play className="h-2.5 w-2.5 text-gray-800 ml-0.5" />
                                  )}
                                </div>
                              </button>
                            )}
                                  </>
                                ) : (
                                  <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Music className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={song.title}>
                                  {song.title}
                                </div>
                                {song.album && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs" title={song.album}>
                                    {song.album}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          {/* Artista */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 truncate max-w-xs" title={song.artist}>
                              {song.artist}
                            </div>
                          </td>
                          
                          {/* Duración */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {song.duration ? SongsService.formatDuration(song.duration) : '-'}
                            </div>
                          </td>
                          
                          {/* Tono - editable */}
                          <td className="px-6 py-4 whitespace-nowrap relative" style={{overflow: 'visible'}}>
                            <div className="w-32 relative" style={{overflow: 'visible'}}>
                              <KeySignatureSelector
                                value={song.key_signature || ''}
                                onChange={(newKey) => handleUpdateKeySignature(song.id, newKey)}
                              />
                            </div>
                          </td>
                          

                          
                          {/* Acciones */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteSong(song.id, song.title)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1 rounded"
                              title="Eliminar canción"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden space-y-4">
              {filteredSongs.map((song) => {
                const isPlaying = currentlyPlaying === `song-${song.id}` && currentSongId === `song-${song.id}`;
                
                return (
                  <div key={song.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-start space-x-3">
                      {/* Imagen del álbum */}
                      <div className="flex-shrink-0 relative group">
                        {song.album_cover ? (
                          <>
                            <img
                              className="h-16 w-16 rounded-lg object-cover"
                              src={song.album_cover}
                              alt={song.album || song.title}
                            />
                            {(song.deezer_id || (song.preview_url && DeezerService.isValidPreviewUrl(song.preview_url))) && (
                               <button
                                 onClick={() => isPlaying && currentSongId === `song-${song.id}` ? handlePausePreview() : handlePlaySavedSong(song, `song-${song.id}`)}
                                 className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg"
                                 disabled={isLoading && currentSongId === `song-${song.id}`}
                               >
                                 <div className={`relative p-2 rounded-full bg-white bg-opacity-90 transform transition-all duration-200 ${
                                   (isPlaying && currentSongId === `song-${song.id}`) || (isLoading && currentSongId === `song-${song.id}`) ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                                 }`}>
                                   <CircularProgress
                                     progress={audioProgress}
                                     duration={audioDuration}
                                     size={24}
                                     strokeWidth={2}
                                     isPlaying={isPlaying && currentSongId === `song-${song.id}`}
                                   />
                                   {isLoading && currentSongId === `song-${song.id}` ? (
                                     <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-800 border-t-transparent" />
                                   ) : (isPlaying && currentSongId === `song-${song.id}`) ? (
                                     <Pause className="h-3 w-3 text-gray-800" />
                                   ) : (
                                     <Play className="h-3 w-3 text-gray-800 ml-0.5" />
                                   )}
                                 </div>
                               </button>
                             )}
                          </>
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Music className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Información de la canción */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate" title={song.title}>
                          {song.title}
                        </h3>
                        <p className="text-sm text-gray-600 truncate" title={song.artist}>
                          {song.artist}
                        </p>
                        {song.album && (
                          <p className="text-xs text-gray-500 truncate" title={song.album}>
                            {song.album}
                          </p>
                        )}
                        
                        {/* Información adicional */}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {song.duration && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {SongsService.formatDuration(song.duration)}
                            </span>
                          )}
                        </div>
                        
                        {/* Selector de tono */}
                        <div className="mt-2">
                          <KeySignatureSelector
                            value={song.key_signature || ''}
                            onChange={(newKey) => handleUpdateKeySignature(song.id, newKey)}
                            size="sm"
                          />
                        </div>
                      </div>
                      
                      {/* Controles */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteSong(song.id, song.title)}
                          className="text-red-500 hover:text-red-600 transition-colors p-1 rounded"
                          title="Eliminar canción"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay canciones filtradas */}
        {filteredSongs.length === 0 && songs.length > 0 && repertoireFilter.trim() !== '' && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron canciones en tu repertorio que coincidan con "<span className="font-medium">{repertoireFilter}</span>".</p>
          </div>
        )}

        {/* Estado vacío */}
        {!unifiedQuery && songs.length === 0 && (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No hay canciones en tu repertorio
            </h3>
            <p className="text-gray-500 mb-6">
              Comienza escribiendo en el buscador para encontrar y agregar canciones desde Deezer
            </p>
          </div>
        )}
        
        {/* Modal de confirmación para eliminar */}
        {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Eliminar canción
                  </h3>
                  <p className="text-sm text-gray-500">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  ¿Estás seguro de que quieres eliminar{' '}
                  <span className="font-semibold text-gray-900">"{deleteModal.title}"</span>{' '}
                  de tu repertorio?
                </p>
              </div>
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={cancelDeleteSong}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteSong}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Songs;