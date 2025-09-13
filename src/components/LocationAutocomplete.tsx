import React, { useRef, useEffect, useState } from 'react'
import { MapPin, AlertCircle } from 'lucide-react'
import { LocationData } from '../types'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onLocationDataChange?: (locationData: LocationData | null) => void
  placeholder?: string
  className?: string
  required?: boolean
  error?: string
}

interface GoogleMapsPlace {
  formatted_address?: string
  place_id?: string
  name?: string
  vicinity?: string
  types?: string[]
  geometry?: {
    location: {
      lat: () => number
      lng: () => number
    }
  }
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

interface GoogleMapsPlaces {
  Autocomplete: new (
    input: HTMLInputElement,
    options?: {
      types?: string[]
      componentRestrictions?: { country: string }
      fields?: string[]
    }
  ) => {
    addListener: (event: string, callback: () => void) => void
    getPlace: () => GoogleMapsPlace
  }
  PlacesService: new (
    attrContainer: HTMLElement
  ) => {
    textSearch: (
      request: { query: string },
      callback: (results: GoogleMapsPlace[], status: string) => void
    ) => void
  }
  PlacesServiceStatus: {
    OK: string
    ZERO_RESULTS: string
    OVER_QUERY_LIMIT: string
    REQUEST_DENIED: string
    INVALID_REQUEST: string
    UNKNOWN_ERROR: string
  }
}

interface GoogleMapsEvent {
  clearInstanceListeners: (instance: unknown) => void
}

declare global {
  interface Window {
    google: {
      maps: {
        places: GoogleMapsPlaces
        event: GoogleMapsEvent
      }
    }
    initGoogleMaps: () => void
  }
}

export default function LocationAutocomplete({
  value,
  onChange,
  onLocationDataChange,
  placeholder = "Buscar ubicación...",
  className = "",
  required = false,
  error
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<{
    addListener: (event: string, callback: () => void) => void
    getPlace: () => GoogleMapsPlace
  } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Función para convertir datos de Google Places a nuestra estructura
  const processPlaceData = (place: GoogleMapsPlace): LocationData | null => {
    if (!place.formatted_address || !place.place_id || !place.geometry?.location) {
      return null
    }

    // Procesar componentes de dirección
    const addressComponents: any = {}
    if (place.address_components) {
      place.address_components.forEach(component => {
        if (component.types.includes('street_number')) {
          addressComponents.street_number = component.long_name
        } else if (component.types.includes('route')) {
          addressComponents.route = component.long_name
        } else if (component.types.includes('locality')) {
          addressComponents.locality = component.long_name
        } else if (component.types.includes('administrative_area_level_2')) {
          addressComponents.administrative_area_level_2 = component.long_name
        } else if (component.types.includes('administrative_area_level_1')) {
          addressComponents.administrative_area_level_1 = component.long_name
        } else if (component.types.includes('country')) {
          addressComponents.country = component.long_name
        } else if (component.types.includes('postal_code')) {
          addressComponents.postal_code = component.long_name
        }
      })
    }

    return {
      formatted_address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      address_components: addressComponents,
      place_id: place.place_id,
      place_types: place.types || [],
      name: place.name,
      vicinity: place.vicinity,
      created_at: new Date().toISOString(),
      source: 'google_places'
    }
  }

  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      // Si ya está cargado Google Maps
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true)
        return
      }

      // Si ya existe el script
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        return
      }

      // Función callback global
      window.initGoogleMaps = () => {
        setIsLoaded(true)
      }

      // Crear y cargar el script
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAAQ4jvjWoR52eg3icv7bI24zG3-Lf5-_k&libraries=places&callback=initGoogleMaps`
      script.async = true
      script.defer = true
      script.onerror = () => {
        setApiError('Error al cargar Google Maps API')
      }
      document.head.appendChild(script)
    }

    loadGoogleMapsAPI()
  }, [])

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) {
      return
    }

    try {
      console.log('Inicializando Google Maps Autocomplete...');
      
      // Crear la instancia de Autocomplete con todos los campos necesarios
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'es' },
          fields: [
            'place_id',
            'formatted_address',
            'name',
            'vicinity',
            'geometry',
            'address_components',
            'types'
          ]
        }
      );
      
      autocompleteRef.current = autocomplete;
      console.log('Autocomplete inicializado correctamente:', autocomplete);
      
      // IMPORTANTE: Usar el método correcto para añadir el listener
      autocomplete.addListener('place_changed', function() {
        console.log('🔍 EVENTO PLACE_CHANGED DISPARADO!');
        
        try {
          // Obtener el lugar seleccionado
          const place = autocomplete.getPlace();
          
          // Verificar si place es un objeto válido
          if (!place) {
            console.error('❌ Error: place es null o undefined');
            return;
          }
          
          // Usar console.dir para una mejor visualización del objeto
          console.log('===== RESPUESTA DE GOOGLE MAPS =====');
          console.dir(place);
          
          // Mostrar propiedades principales
          console.log('📍 DATOS PRINCIPALES:');
          console.log('- Dirección formateada:', place.formatted_address || 'No disponible');
          console.log('- Place ID:', place.place_id || 'No disponible');
          console.log('- Nombre:', place.name || 'No disponible');
          console.log('- Vecindario:', place.vicinity || 'No disponible');
          console.log('- Tipos:', place.types ? place.types.join(', ') : 'No disponible');
          
          // Mostrar coordenadas si existen
          if (place.geometry && place.geometry.location) {
            try {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              console.log('🌍 COORDENADAS:', { lat, lng });
              
              // Mostrar URL de Google Maps para estas coordenadas
              console.log(`🔗 Ver en Google Maps: https://www.google.com/maps?q=${lat},${lng}`);
            } catch (e) {
              console.error('❌ Error al obtener coordenadas:', e);
            }
          } else {
            console.log('❌ No hay datos de geometría disponibles');
          }
          
          // Mostrar componentes de dirección
          if (place.address_components && Array.isArray(place.address_components)) {
            console.log('🏠 COMPONENTES DE DIRECCIÓN:');
            place.address_components.forEach(component => {
              console.log(`- ${component.long_name} (${component.types.join(', ')})`);
            });
          }
          
          console.log('===== FIN DE RESPUESTA =====');
          
          // Actualizar el valor del input
          if (place.formatted_address) {
            onChange(place.formatted_address);
            
            // Procesar y enviar datos completos
            if (onLocationDataChange) {
              const locationData = processPlaceData(place);
              onLocationDataChange(locationData);
              console.log('✅ Datos de ubicación procesados:', locationData);
            }
          }
        } catch (error) {
          console.error('❌ Error en el evento place_changed:', error);
        }
      });
    } catch (err) {
      setApiError('Error al inicializar el autocompletado')
      console.error('Error initializing autocomplete:', err)
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isLoaded, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Añadir console.log para ver cuando el usuario escribe
    console.log('Usuario escribiendo:', newValue)

    // Si se borra el campo o el usuario escribe manualmente, limpiar los datos de ubicación
    if (onLocationDataChange && !newValue) {
      onLocationDataChange(null)
    }
    
    // Verificar si el input tiene un valor que coincide con una selección
    // Este es un enfoque alternativo para detectar cuando se selecciona una ubicación
    setTimeout(() => {
      if (inputRef.current) {
        const currentValue = inputRef.current.value;
        if (currentValue !== newValue && currentValue.length > 0) {
          console.log('📢 SELECCIÓN DETECTADA');
          console.log('📍 Valor seleccionado:', currentValue);
          
          // Usar la API de Places para buscar detalles sobre esta ubicación
          if (window.google && window.google.maps && window.google.maps.places) {
            try {
              // Crear un servicio de Places
              const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
              
              // Buscar lugares que coincidan con el texto
              placesService.textSearch(
                { query: currentValue },
                (results, status) => {
                  if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    const place = results[0];
                    console.log('✅ DATOS DEL LUGAR ENCONTRADO:');
                    console.dir(place);
                    
                    // Mostrar detalles principales
                    console.log('📍 DETALLES:');
                    console.log('- Nombre:', place.name);
                    console.log('- Dirección:', place.formatted_address);
                    console.log('- Place ID:', place.place_id);
                    console.log('- Tipos:', place.types ? place.types.join(', ') : 'No disponible');
                    
                    // Mostrar coordenadas
                    if (place.geometry && place.geometry.location) {
                      const lat = place.geometry.location.lat();
                      const lng = place.geometry.location.lng();
                      console.log('🌍 COORDENADAS:', { lat, lng });
                      console.log(`🔗 Ver en Google Maps: https://www.google.com/maps?q=${lat},${lng}`);
                      
                      // Crear y enviar los datos de ubicación
                      if (onLocationDataChange) {
                        const locationData: LocationData = {
                          formatted_address: place.formatted_address,
                          coordinates: {
                            lat: lat,
                            lng: lng
                          },
                          address_components: {},
                          place_id: place.place_id,
                          place_types: place.types || [],
                          name: place.name,
                          vicinity: place.vicinity,
                          created_at: new Date().toISOString(),
                          source: 'google_places' as const
                        };
                        onLocationDataChange(locationData);
                        console.log('✅ Datos de ubicación procesados:', locationData);
                      }
                    }
                  } else {
                    console.log('⚠️ No se encontraron resultados para:', currentValue);
                    console.log('Status:', status);
                  }
                }
              );
            } catch (error) {
              console.error('❌ Error al buscar el lugar:', error);
            }
          }
        }
      }
    }, 300); // Esperar un poco para dar tiempo a que se actualice el valor
  }

  if (apiError) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <MapPin size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent ${
            error ? 'border-red-500' : ''
          }`}
        />
        {(error || apiError) && (
          <div className="flex items-center mt-1 text-sm text-red-600">
            <AlertCircle size={14} className="mr-1" />
            <span>{error || apiError}</span>
          </div>
        )}
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <MapPin size={16} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="Cargando autocompletado..."
          required={required}
          disabled
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
        />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <MapPin size={16} className="text-gray-400" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent ${
          error ? 'border-red-500' : ''
        }`}
      />
      {error && (
        <div className="flex items-center mt-1 text-sm text-red-600">
          <AlertCircle size={14} className="mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}