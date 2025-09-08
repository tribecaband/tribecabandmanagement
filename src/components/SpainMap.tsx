import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SpainMap.css';
import type { Event } from '../types';
import { 
  getCurrentPosition, 
  findNearestCity, 
  findCitiesWithinRadius, 
  formatDistance,
  SPANISH_CITIES_COORDINATES,
  type GeolocationCoordinates 
} from '../utils/geolocation';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SpainMapProps {
  events: Event[];
  onLocationClick?: (location: string, events: Event[]) => void;
}

// Coordenadas reales de las ciudades españolas (latitud, longitud)
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'Madrid': { lat: 40.4168, lng: -3.7038 },
  'Barcelona': { lat: 41.3851, lng: 2.1734 },
  'Valencia': { lat: 39.4699, lng: -0.3763 },
  'Sevilla': { lat: 37.3891, lng: -5.9845 },
  'Bilbao': { lat: 43.2627, lng: -2.9253 },
  'Málaga': { lat: 36.7213, lng: -4.4214 },
  'Zaragoza': { lat: 41.6488, lng: -0.8891 },
  'Murcia': { lat: 37.9922, lng: -1.1307 },
  'Palma': { lat: 39.5696, lng: 2.6502 },
  'Las Palmas': { lat: 28.1248, lng: -15.4300 },
  'Valladolid': { lat: 41.6523, lng: -4.7245 },
  'Vigo': { lat: 42.2406, lng: -8.7207 },
  'Gijón': { lat: 43.5322, lng: -5.6611 },
  'Hospitalet': { lat: 41.3598, lng: 2.1074 },
  'Vitoria': { lat: 42.8467, lng: -2.6716 },
  'Granada': { lat: 37.1773, lng: -3.5986 },
  'Elche': { lat: 38.2622, lng: -0.7011 },
  'Oviedo': { lat: 43.3614, lng: -5.8593 },
  'Badalona': { lat: 41.4501, lng: 2.2471 },
  'Cartagena': { lat: 37.6000, lng: -0.9864 },
  'Terrassa': { lat: 41.5640, lng: 2.0084 },
  'Jerez': { lat: 36.6868, lng: -6.1362 },
  'Sabadell': { lat: 41.5431, lng: 2.1090 },
  'Móstoles': { lat: 40.3230, lng: -3.8644 },
  'Santa Cruz': { lat: 28.4636, lng: -16.2518 },
  'Pamplona': { lat: 42.8125, lng: -1.6458 },
  'Almería': { lat: 36.8381, lng: -2.4597 },
  'Fuenlabrada': { lat: 40.2842, lng: -3.7947 },
  'Leganés': { lat: 40.3267, lng: -3.7636 },
  'Santander': { lat: 43.4623, lng: -3.8099 },
  'Burgos': { lat: 42.3439, lng: -3.6969 },
  'Castellón': { lat: 39.9864, lng: -0.0513 },
  'Getafe': { lat: 40.3058, lng: -3.7327 },
  'Albacete': { lat: 38.9942, lng: -1.8564 },
  'Alcorcón': { lat: 40.3459, lng: -3.8240 },
  'Logroño': { lat: 42.4627, lng: -2.4449 },
  'Badajoz': { lat: 38.8794, lng: -6.9707 },
  'Salamanca': { lat: 40.9701, lng: -5.6635 },
  'Huelva': { lat: 37.2614, lng: -6.9447 },
  'Marbella': { lat: 36.5108, lng: -4.8852 },
  'Tarragona': { lat: 41.1189, lng: 1.2445 },
  'León': { lat: 42.5987, lng: -5.5671 },
  'Cádiz': { lat: 36.5297, lng: -6.2920 },
  'Dos Hermanas': { lat: 37.2820, lng: -5.9200 },
  'Torrejón': { lat: 40.4552, lng: -3.4700 },
  'Parla': { lat: 40.2370, lng: -3.7680 },
  'Alcalá de Henares': { lat: 40.4817, lng: -3.3616 },
  'Reus': { lat: 41.1560, lng: 1.1074 },
  'Girona': { lat: 41.9794, lng: 2.8214 }
};

const SpainMap: React.FC<SpainMapProps> = ({ events, onLocationClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<GeolocationCoordinates | null>(null);
  const [nearestCity, setNearestCity] = useState<{ city: string; distance: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Agrupar eventos por ubicación
  const eventsByLocation = events.reduce((acc, event) => {
    const location = event.ubicacion;
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map centered on Spain
    const map = L.map(mapRef.current).setView([40.0, -4.0], 6);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // Add markers layer
    markersRef.current.addTo(map);
    
    mapInstanceRef.current = map;
    setMapLoaded(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Add markers for each location with events
    Object.entries(eventsByLocation).forEach(([location, locationEvents]) => {
      const coords = cityCoordinates[location];
      if (!coords) return;

      const markerColor = getMarkerColor(location);
      const eventCount = locationEvents.length;

      // Create custom icon based on event status
      const iconHtml = `
        <div style="
          background-color: ${markerColor};
          width: ${Math.max(20, eventCount * 4)}px;
          height: ${Math.max(20, eventCount * 4)}px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${eventCount > 9 ? '10px' : '12px'};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${eventCount > 1 ? eventCount : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [Math.max(20, eventCount * 4), Math.max(20, eventCount * 4)],
        iconAnchor: [Math.max(10, eventCount * 2), Math.max(10, eventCount * 2)]
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon })
        .bindPopup(`
          <div>
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${location}</h3>
            <p style="margin: 0 0 4px 0;">${eventCount} evento(s)</p>
            <button 
              onclick="window.selectLocation('${location}')"
              style="
                background: #3B82F6;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              "
            >
              Ver detalles
            </button>
          </div>
        `);

      marker.on('mouseover', () => setHoveredLocation(location));
      marker.on('mouseout', () => setHoveredLocation(null));
      marker.on('click', () => handleLocationClick(location));

      markersRef.current.addLayer(marker);
    });

    // Add global function for popup button
    (window as any).selectLocation = (location: string) => {
      handleLocationClick(location);
    };

  }, [eventsByLocation, mapLoaded]);

  // Add user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    const userMarker = L.marker([userLocation.latitude, userLocation.longitude])
      .bindPopup('Tu ubicación')
      .addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(userMarker);
      }
    };
  }, [userLocation]);

  const handleLocationClick = (location: string) => {
    setSelectedLocation(location);
    onLocationClick?.(location, eventsByLocation[location] || []);
  };

  const handleGetUserLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);
      
      const nearest = findNearestCity(coords);
      setNearestCity(nearest);
      
      // Auto-select nearest city if it has events
      if (nearest && eventsByLocation[nearest.city]) {
        setSelectedLocation(nearest.city);
      }
    } catch (error: any) {
      setLocationError(error.message);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const getNearbyEvents = () => {
    if (!userLocation) return [];
    
    const nearbyCities = findCitiesWithinRadius(userLocation, 100); // 100km radius
    const nearbyEvents: Array<Event & { distance: number; city: string }> = [];
    
    nearbyCities.forEach(({ city, distance }) => {
      const cityEvents = eventsByLocation[city] || [];
      cityEvents.forEach(event => {
        nearbyEvents.push({ ...event, distance, city });
      });
    });
    
    return nearbyEvents.sort((a, b) => a.distance - b.distance).slice(0, 5);
  };

  const getMarkerColor = (location: string) => {
    const locationEvents = eventsByLocation[location] || [];
    if (locationEvents.length === 0) return '#9CA3AF'; // gray-400
    
    const hasConfirmed = locationEvents.some(e => e.facturacion === 'Sí');
    const hasPending = locationEvents.some(e => e.facturacion !== 'Sí');
    
    if (hasConfirmed && hasPending) return '#F59E0B'; // amber-500
    if (hasConfirmed) return '#10B981'; // emerald-500
    return '#EF4444'; // red-500
  };

  const getMarkerSize = (count: number) => {
    if (count === 0) return 4;
    if (count === 1) return 6;
    if (count <= 3) return 8;
    return 10;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Mapa de Eventos en España
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGetUserLocation}
              disabled={isLoadingLocation}
              className="flex items-center space-x-2 px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
            >
              <Navigation className={`h-4 w-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
              <span>{isLoadingLocation ? 'Ubicando...' : 'Mi ubicación'}</span>
            </button>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-600">Confirmados</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">Mixtos</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Pendientes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* Leaflet Map Container */}
          <div 
            ref={mapRef} 
            className="w-full h-96 border border-gray-200 rounded-lg"
            style={{ minHeight: '384px' }}
          />

          {/* Tooltip */}
          {hoveredLocation && eventsByLocation[hoveredLocation] && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-sm pointer-events-none z-[1000]">
              <div className="font-medium">{hoveredLocation}</div>
              <div>{eventsByLocation[hoveredLocation].length} evento(s)</div>
            </div>
          )}
        </div>

        {/* Location status */}
        {locationError && (
          <div className="mt-4 p-3 bg-alert/10 border border-alert/20 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-alert" />
            <span className="text-sm text-alert">{locationError}</span>
          </div>
        )}
        
        {nearestCity && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary">
              <strong>Ciudad más cercana:</strong> {nearestCity.city} ({formatDistance(nearestCity.distance)})
            </p>
          </div>
        )}

        {/* Nearby events */}
        {userLocation && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-3">Eventos cercanos (100km)</h3>
            <div className="space-y-2">
              {getNearbyEvents().length === 0 ? (
                <p className="text-gray-500 text-sm">No hay eventos cercanos a tu ubicación</p>
              ) : (
                getNearbyEvents().map(event => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{event.nombre_evento}</h4>
                      <p className="text-sm text-gray-600">
                        {event.city} • {formatDistance(event.distance)} • {new Date(event.fecha_evento).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">€{event.cache_euros}</p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          event.facturacion === 'Sí'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {event.facturacion === 'Sí' ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Selected location details */}
        {selectedLocation && eventsByLocation[selectedLocation] && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">
              Eventos en {selectedLocation} ({eventsByLocation[selectedLocation].length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {eventsByLocation[selectedLocation].map(event => (
                <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.nombre_evento}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(event.fecha_evento).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">€{event.cache_euros}</p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          event.facturacion === 'Sí'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {event.facturacion === 'Sí' ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpainMap;