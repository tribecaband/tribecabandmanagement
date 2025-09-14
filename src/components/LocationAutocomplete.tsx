import React, { useRef, useEffect, useState, useCallback } from 'react'
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

// Interfaces para la respuesta de Geoapify
interface GeoapifyFeature {
  type: 'Feature'
  properties: {
    name?: string
    country?: string
    country_code?: string
    state?: string
    state_code?: string
    county?: string
    county_code?: string
    postcode?: string
    city?: string
    street?: string
    housenumber?: string
    lat: number
    lon: number
    formatted: string
    address_line1?: string
    address_line2?: string
    result_type?: string
    distance?: number
    rank?: {
      confidence: number
      confidence_city_level?: number
      confidence_street_level?: number
      confidence_building_level?: number
      match_type?: string
    }
    datasource?: {
      sourcename: string
      attribution: string
      license: string
      url: string
    }
    category?: string
    timezone?: {
      name: string
      name_alt?: string
      offset_STD: string
      offset_STD_seconds: number
      offset_DST?: string
      offset_DST_seconds?: number
      abbreviation_STD?: string
      abbreviation_DST?: string
    }
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
}

interface GeoapifyResponse {
  type: 'FeatureCollection'
  features: GeoapifyFeature[]
  query: {
    text: string
    parsed: {
      housenumber?: string
      street?: string
      postcode?: string
      city?: string
      state?: string
      country?: string
    }
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
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Obtener la API key desde las variables de entorno
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY

  // Función para convertir datos de Geoapify a nuestra estructura (compatible con Google Places)
  const processGeoapifyData = (feature: GeoapifyFeature): LocationData => {
    const props = feature.properties
    const [longitude, latitude] = feature.geometry.coordinates

    // Procesar componentes de dirección manteniendo compatibilidad con Google Places
    const addressComponents = {
      street_number: props.housenumber,
      route: props.street,
      locality: props.city,
      administrative_area_level_2: props.county,
      administrative_area_level_1: props.state,
      country: props.country,
      postal_code: props.postcode
    }

    // Mapear categorías de Geoapify a tipos de Google Places
    const mapGeoapifyToGoogleTypes = (category?: string, resultType?: string): string[] => {
      const types: string[] = []
      
      if (category) {
        if (category.includes('catering.bar')) types.push('bar', 'night_club')
        if (category.includes('catering.restaurant')) types.push('restaurant')
        if (category.includes('entertainment')) types.push('entertainment')
        if (category.includes('commercial')) types.push('establishment')
      }
      
      if (resultType) {
        types.push(resultType)
      }
      
      // Agregar tipos básicos
      types.push('point_of_interest', 'establishment')
      
      return [...new Set(types)] // Eliminar duplicados
    }

    return {
      name: props.name || props.address_line1,
      source: 'geoapify' as const,
      place_id: `geoapify_${latitude}_${longitude}`,
      created_at: new Date().toISOString(),
      coordinates: {
        lat: latitude,
        lng: longitude
      },
      place_types: mapGeoapifyToGoogleTypes(props.category, props.result_type),
      formatted_address: props.formatted,
      address_components: addressComponents
    }
  }

  // Función para buscar sugerencias en Geoapify
  const searchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || !apiKey) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    setApiError(null)

    try {
      const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')
      url.searchParams.append('text', query)
      url.searchParams.append('format', 'geojson')
      url.searchParams.append('apiKey', apiKey)
      url.searchParams.append('filter', 'countrycode:es') // Filtrar por España
      url.searchParams.append('limit', '5')
      url.searchParams.append('lang', 'es')

      console.log('🔍 Buscando en Geoapify:', query)
      console.log('🌐 URL:', url.toString())

      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data: GeoapifyResponse = await response.json()
      
      console.log('✅ Respuesta de Geoapify:', data)
      
      setSuggestions(data.features || [])
      setShowSuggestions(true)
    } catch (err) {
      console.error('❌ Error al buscar sugerencias:', err)
      setApiError('Error al buscar ubicaciones')
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }, [apiKey])

  // Debounce para las búsquedas
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchSuggestions(query)
    }, 300)
  }, [searchSuggestions])

  // Manejar cambios en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    console.log('Usuario escribiendo:', newValue)

    // Si se borra el campo, limpiar los datos de ubicación
    if (onLocationDataChange && !newValue) {
      onLocationDataChange(null)
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Buscar sugerencias con debounce
    debouncedSearch(newValue)
  }

  // Manejar selección de una sugerencia
  const handleSuggestionClick = (feature: GeoapifyFeature) => {
    console.log('🖱️ CLICK DETECTADO en sugerencia:', feature.properties.formatted)
    
    const formattedAddress = feature.properties.formatted
    onChange(formattedAddress)
    
    console.log('📍 Ubicación seleccionada:', feature)
    console.log('🔄 onLocationDataChange disponible:', !!onLocationDataChange)
    
    // Procesar y enviar datos completos
    if (onLocationDataChange) {
      const locationData = processGeoapifyData(feature)
      console.log('📊 Datos procesados antes de enviar:', locationData)
      console.log('🏷️ Source del locationData:', locationData.source)
      console.log('🆔 Place ID generado:', locationData.place_id)
      onLocationDataChange(locationData)
      console.log('✅ Datos de ubicación enviados al componente padre')
    } else {
      console.log('⚠️ onLocationDataChange no está disponible')
    }
    
    setShowSuggestions(false)
    setSuggestions([])
    console.log('🔒 Sugerencias cerradas')
  }

  // Manejar clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // No cerrar si el clic es en el input o en una sugerencia
      if (inputRef.current && !inputRef.current.contains(target)) {
        // Verificar si el clic es en una sugerencia
        const suggestionElement = (target as Element).closest('[data-suggestion]')
        if (!suggestionElement) {
          setShowSuggestions(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Verificar si la API key está configurada
  if (!apiKey) {
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
        <div className="flex items-center mt-1 text-sm text-red-600">
          <AlertCircle size={14} className="mr-1" />
          <span>API key de Geoapify no configurada</span>
        </div>
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
        autoComplete="off"
      />
      
      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2DB2CA]"></div>
        </div>
      )}
      
      {/* Lista de sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((feature, index) => (
            <div
              key={`${feature.properties.lat}_${feature.properties.lon}_${index}`}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              data-suggestion="true"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🎯 onClick ejecutándose para:', feature.properties.formatted)
                handleSuggestionClick(feature)
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                console.log('🖱️ onMouseDown ejecutándose para:', feature.properties.formatted)
                handleSuggestionClick(feature)
              }}
            >
              <div className="flex items-start">
                <MapPin size={16} className="text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {feature.properties.name || feature.properties.address_line1 || feature.properties.formatted}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {feature.properties.formatted}
                  </div>
                  {feature.properties.result_type && (
                    <div className="text-xs text-blue-600 mt-1">
                      {feature.properties.result_type}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Mensaje cuando no hay resultados */}
      {showSuggestions && suggestions.length === 0 && !isLoading && value.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500">
            No se encontraron ubicaciones
          </div>
        </div>
      )}
      
      {/* Errores */}
      {(error || apiError) && (
        <div className="flex items-center mt-1 text-sm text-red-600">
          <AlertCircle size={14} className="mr-1" />
          <span>{error || apiError}</span>
        </div>
      )}
    </div>
  )
}