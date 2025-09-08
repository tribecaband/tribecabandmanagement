export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Coordenadas de las principales ciudades españolas
export const SPANISH_CITIES_COORDINATES: Record<string, GeolocationCoordinates> = {
  'Madrid': { latitude: 40.4168, longitude: -3.7038 },
  'Barcelona': { latitude: 41.3851, longitude: 2.1734 },
  'Valencia': { latitude: 39.4699, longitude: -0.3763 },
  'Sevilla': { latitude: 37.3891, longitude: -5.9845 },
  'Bilbao': { latitude: 43.2627, longitude: -2.9253 },
  'Málaga': { latitude: 36.7213, longitude: -4.4214 },
  'Zaragoza': { latitude: 41.6488, longitude: -0.8891 },
  'Murcia': { latitude: 37.9922, longitude: -1.1307 },
  'Palma': { latitude: 39.5696, longitude: 2.6502 },
  'Las Palmas': { latitude: 28.1248, longitude: -15.4300 },
  'Valladolid': { latitude: 41.6523, longitude: -4.7245 },
  'Vigo': { latitude: 42.2406, longitude: -8.7207 },
  'Gijón': { latitude: 43.5322, longitude: -5.6611 },
  'Hospitalet': { latitude: 41.3598, longitude: 2.1074 },
  'Vitoria': { latitude: 42.8467, longitude: -2.6716 },
  'Granada': { latitude: 37.1773, longitude: -3.5986 },
  'Elche': { latitude: 38.2622, longitude: -0.7011 },
  'Oviedo': { latitude: 43.3614, longitude: -5.8593 },
  'Badalona': { latitude: 41.4501, longitude: 2.2471 },
  'Cartagena': { latitude: 37.6000, longitude: -0.9864 },
  'Terrassa': { latitude: 41.5640, longitude: 2.0084 },
  'Jerez': { latitude: 36.6866, longitude: -6.1364 },
  'Sabadell': { latitude: 41.5431, longitude: 2.1089 },
  'Móstoles': { latitude: 40.3230, longitude: -3.8644 },
  'Santa Cruz': { latitude: 28.4636, longitude: -16.2518 },
  'Pamplona': { latitude: 42.8125, longitude: -1.6458 },
  'Almería': { latitude: 36.8381, longitude: -2.4597 },
  'Fuenlabrada': { latitude: 40.2842, longitude: -3.8009 },
  'Leganés': { latitude: 40.3167, longitude: -3.7667 },
  'Santander': { latitude: 43.4623, longitude: -3.8099 },
  'Burgos': { latitude: 42.3439, longitude: -3.6969 },
  'Castellón': { latitude: 39.9864, longitude: -0.0513 },
  'Getafe': { latitude: 40.3058, longitude: -3.7325 },
  'Albacete': { latitude: 38.9943, longitude: -1.8585 },
  'Alcorcón': { latitude: 40.3459, longitude: -3.8264 },
  'Logroño': { latitude: 42.4627, longitude: -2.4449 },
  'Badajoz': { latitude: 38.8794, longitude: -6.9706 },
  'Salamanca': { latitude: 40.9701, longitude: -5.6635 },
  'Huelva': { latitude: 37.2614, longitude: -6.9447 },
  'Marbella': { latitude: 36.5108, longitude: -4.8850 },
  'Tarragona': { latitude: 41.1189, longitude: 1.2445 },
  'León': { latitude: 42.5987, longitude: -5.5671 },
  'Cádiz': { latitude: 36.5297, longitude: -6.2920 },
  'Dos Hermanas': { latitude: 37.2820, longitude: -5.9200 },
  'Torrejón': { latitude: 40.4559, longitude: -3.4760 },
  'Parla': { latitude: 40.2378, longitude: -3.7681 },
  'Alcalá de Henares': { latitude: 40.4817, longitude: -3.3616 },
  'Reus': { latitude: 41.1560, longitude: 1.1074 },
  'Girona': { latitude: 41.9794, longitude: 2.8214 }
};

/**
 * Obtiene la ubicación actual del usuario usando la API de geolocalización del navegador
 */
export const getCurrentPosition = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocalización no soportada por este navegador'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: getGeolocationErrorMessage(error.code)
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  });
};

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 */
export const calculateDistance = (
  coord1: GeolocationCoordinates,
  coord2: GeolocationCoordinates
): number => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Encuentra la ciudad más cercana a unas coordenadas dadas
 */
export const findNearestCity = (
  userCoords: GeolocationCoordinates
): { city: string; distance: number } | null => {
  let nearestCity = null;
  let minDistance = Infinity;

  for (const [city, coords] of Object.entries(SPANISH_CITIES_COORDINATES)) {
    const distance = calculateDistance(userCoords, coords);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity ? { city: nearestCity, distance: minDistance } : null;
};

/**
 * Encuentra ciudades dentro de un radio específico
 */
export const findCitiesWithinRadius = (
  userCoords: GeolocationCoordinates,
  radiusKm: number
): Array<{ city: string; distance: number }> => {
  const nearbyCities: Array<{ city: string; distance: number }> = [];

  for (const [city, coords] of Object.entries(SPANISH_CITIES_COORDINATES)) {
    const distance = calculateDistance(userCoords, coords);
    if (distance <= radiusKm) {
      nearbyCities.push({ city, distance });
    }
  }

  return nearbyCities.sort((a, b) => a.distance - b.distance);
};

/**
 * Convierte grados a radianes
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Obtiene un mensaje de error legible para códigos de error de geolocalización
 */
const getGeolocationErrorMessage = (code: number): string => {
  switch (code) {
    case 1:
      return 'Permiso de geolocalización denegado';
    case 2:
      return 'Posición no disponible';
    case 3:
      return 'Tiempo de espera agotado';
    default:
      return 'Error desconocido de geolocalización';
  }
};

/**
 * Formatea la distancia en un texto legible
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};