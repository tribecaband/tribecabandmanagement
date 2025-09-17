import { DeezerSearchResponse, DeezerTrack } from '../types';

// Lista de proxies CORS de respaldo (actualizados 2024)
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.cors.lol/?url=',
  'https://cors.bridged.cc/',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/'
];

const DEEZER_API_BASE = 'https://api.deezer.com';
const REQUEST_TIMEOUT = 8000; // 8 segundos
const MAX_RETRIES = 5; // Más intentos con más proxies
const FAST_TIMEOUT = 4000; // Timeout rápido para primer intento

// Cache simple para evitar llamadas repetidas
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Función para limpiar cache expirado
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
};

// Función para obtener datos del cache
const getCachedData = (key: string): any | null => {
  cleanExpiredCache();
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < entry.ttl) {
    return entry.data;
  }
  return null;
};

// Función para guardar en cache
const setCachedData = (key: string, data: any, ttl: number = CACHE_TTL) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

// Función auxiliar para construir URL con proxy
const buildProxyUrl = (endpoint: string, proxyIndex: number = 0): string => {
  const proxy = CORS_PROXIES[proxyIndex % CORS_PROXIES.length];
  
  // Manejar diferentes formatos de proxy
  if (proxy.includes('cors.bridged.cc')) {
    return `${proxy}${endpoint}`;
  } else {
    return `${proxy}${encodeURIComponent(endpoint)}`;
  }
};

// Función para hacer petición con timeout y manejo mejorado de cancelación
const fetchWithTimeout = async (url: string, timeout: number = REQUEST_TIMEOUT, externalSignal?: AbortSignal): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Combinar señales de cancelación (timeout y externa)
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    // Silenciar errores de cancelación para evitar ruido en consola
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
      throw new Error('REQUEST_CANCELLED');
    }
    throw error;
  }
};

// Datos mock para fallback
const getMockSearchResults = (query: string): DeezerSearchResponse => {
  return {
    data: [
      {
        id: 'mock-1',
        title: `Resultado simulado para "${query}"`,
        artist: { name: 'Artista de ejemplo' },
        album: { title: 'Álbum de ejemplo', cover_medium: '' },
        duration: 180,
        preview: '',
        link: ''
      }
    ],
    total: 1,
    next: undefined
  };
};

export class DeezerService {
  // Controlador para cancelar búsquedas pendientes
  private static currentSearchController: AbortController | null = null;

  /**
   * Buscar canciones en la API de Deezer con sistema de retry y cache
   * @param query Término de búsqueda
   * @param limit Número máximo de resultados (por defecto 25)
   * @returns Promise con los resultados de la búsqueda
   */
  static async searchTracks(query: string, limit: number = 25): Promise<DeezerSearchResponse> {
    // Cancelar búsqueda anterior si existe
    if (this.currentSearchController) {
      this.currentSearchController.abort();
    }

    // Crear nuevo controlador para esta búsqueda
    this.currentSearchController = new AbortController();
    const searchSignal = this.currentSearchController.signal;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return { data: [], total: 0, next: undefined };
    }

    // Verificar cache primero
    const cacheKey = `search:${trimmedQuery}:${limit}`;
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log('Resultado obtenido del cache');
      return cachedResult;
    }

    const encodedQuery = encodeURIComponent(trimmedQuery);
    const deezerUrl = `${DEEZER_API_BASE}/search?q=${encodedQuery}&type=track&limit=${limit}`;
    
    // Intentar con diferentes proxies
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Verificar si la búsqueda fue cancelada
      if (searchSignal.aborted) {
        throw new Error('REQUEST_CANCELLED');
      }

      try {
        const proxyUrl = buildProxyUrl(deezerUrl, attempt);
        
        // Usar timeout optimizado según el intento
        const timeoutForAttempt = attempt === 0 ? FAST_TIMEOUT : REQUEST_TIMEOUT;
        
        const response = await fetchWithTimeout(proxyUrl, timeoutForAttempt, searchSignal);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data: DeezerSearchResponse = await response.json();
        
        // Validar estructura de respuesta
        if (!data || typeof data !== 'object' || !Array.isArray(data.data)) {
          throw new Error('Estructura de respuesta inválida');
        }
        
        // Guardar en cache y retornar
        setCachedData(cacheKey, data);
        console.log(`Búsqueda exitosa con proxy ${attempt + 1}`);
        return data;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        
        // Si la petición fue cancelada, no mostrar error
        if (errorMsg === 'REQUEST_CANCELLED') {
          throw error;
        }
        
        // Filtrar errores de red comunes para evitar ruido en consola
        const isNetworkError = errorMsg.includes('ERR_ABORTED') || 
                              errorMsg.includes('ERR_NETWORK') ||
                              errorMsg.includes('ERR_INTERNET_DISCONNECTED') ||
                              errorMsg.includes('Failed to fetch');
        
        // Solo mostrar advertencia para errores reales (no de red/cancelación)
        if (!isNetworkError || attempt > 2) {
          console.warn(`Proxy ${attempt + 1} (${CORS_PROXIES[attempt % CORS_PROXIES.length]}) falló:`, errorMsg);
        }
        
        // Si es el último intento, continuar al fallback
        if (attempt === MAX_RETRIES - 1) {
          console.error('Todos los proxies fallaron, usando datos mock');
          break;
        }
        
        // Esperar un poco antes del siguiente intento (menos tiempo para el primer retry)
        const waitTime = attempt === 0 ? 200 : 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Verificar una vez más si fue cancelada antes del fallback
    if (searchSignal.aborted) {
      throw new Error('REQUEST_CANCELLED');
    }

    // Fallback: retornar datos mock
    console.warn('Usando datos simulados debido a fallos de conectividad');
    const mockData = getMockSearchResults(trimmedQuery);
    setCachedData(cacheKey, mockData, 30000); // Cache por 30 segundos
    return mockData;
  }

  /**
   * Obtener información detallada de una canción por ID con sistema de retry y cache
   * @param trackId ID de la canción en Deezer
   * @returns Promise con la información de la canción
   */
  static async getTrackById(trackId: string): Promise<DeezerTrack> {
    if (!trackId || trackId.trim() === '') {
      throw new Error('ID de canción inválido');
    }

    // Verificar cache primero
    const cacheKey = `track:${trackId}`;
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log('Información de canción obtenida del cache');
      return cachedResult;
    }

    const deezerUrl = `${DEEZER_API_BASE}/track/${trackId}`;
    
    // Intentar con diferentes proxies
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const proxyUrl = buildProxyUrl(deezerUrl, attempt);
        console.log(`Obteniendo canción - Intento ${attempt + 1}/${MAX_RETRIES}`);
        
        const response = await fetchWithTimeout(proxyUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data: DeezerTrack = await response.json();
        
        // Validar estructura de respuesta
        if (!data || typeof data !== 'object' || !data.id) {
          throw new Error('Estructura de respuesta inválida');
        }
        
        // Guardar en cache y retornar
        setCachedData(cacheKey, data);
        console.log(`Información de canción obtenida exitosamente`);
        return data;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.warn(`Intento ${attempt + 1} para obtener canción falló:`, errorMsg);
        
        // Si es el último intento, lanzar error
        if (attempt === MAX_RETRIES - 1) {
          console.error('No se pudo obtener información de la canción después de todos los intentos');
          throw new Error(`No se pudo obtener la información de la canción. Último error: ${errorMsg}`);
        }
        
        // Esperar un poco antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    
    // Este punto no debería alcanzarse, pero por seguridad
    throw new Error('Error inesperado al obtener información de la canción');
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

  /**
   * Validar si una URL de preview es válida
   * @param url URL del preview
   * @returns true si la URL es válida
   */
  static isValidPreviewUrl(url: string): boolean {
    try {
      new URL(url);
      return url.includes('dzcdn.net') || url.includes('deezer.com');
    } catch {
      return false;
    }
  }
}