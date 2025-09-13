import React from 'react'
import { MapPin, ExternalLink } from 'lucide-react'
import { LocationData } from '../types'

interface LocationDisplayProps {
  location: LocationData | string | null | undefined
  showFullAddress?: boolean
  className?: string
  clickable?: boolean
}

export default function LocationDisplay({
  location,
  showFullAddress = true,
  className = "",
  clickable = true
}: LocationDisplayProps) {
  if (!location) {
    return (
      <div className={`flex items-center text-gray-400 ${className}`}>
        <MapPin size={16} className="mr-2" />
        <span className="text-sm">Sin ubicación</span>
      </div>
    )
  }

  // Función para abrir Google Maps
  const openInGoogleMaps = () => {
    if (typeof location === 'string') {
      // Formato antiguo: buscar por texto
      const encodedAddress = encodeURIComponent(location)
      window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank')
    } else {
      // Formato nuevo: usar coordenadas si están disponibles
      const { coordinates, formatted_address } = location
      if (coordinates.lat !== 0 && coordinates.lng !== 0) {
        // Usar coordenadas exactas
        window.open(`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`, '_blank')
      } else {
        // Fallback a búsqueda por dirección
        const encodedAddress = encodeURIComponent(formatted_address)
        window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank')
      }
    }
  }

  // Obtener el texto a mostrar
  const getDisplayText = () => {
    if (typeof location === 'string') {
      // Para ubicaciones en formato string, limitar a 30 caracteres
      return location.length > 30 ? location.substring(0, 30) + '...' : location
    }

    const { formatted_address, name, address_components, place_types } = location
    
    // Determinar si es un lugar (place) o solo una dirección
    const isPlace = place_types && place_types.some(type => 
      ['restaurant', 'bar', 'cafe', 'hotel', 'store', 'establishment', 'point_of_interest'].includes(type)
    )
    
    // Si es un lugar y tiene nombre, mostrar solo el nombre
    if (isPlace && name && name !== formatted_address) {
      return name
    }
    
    // Para vista compacta, mostrar solo ciudad y provincia
    if (!showFullAddress && address_components.locality) {
      return `${address_components.locality}${
        address_components.administrative_area_level_1
          ? `, ${address_components.administrative_area_level_1}`
          : ''
      }`
    }
    
    // Para dirección completa, limitar a 40 caracteres
    const addressToShow = formatted_address
    return addressToShow.length > 40 ? addressToShow.substring(0, 40) + '...' : addressToShow
  }

  // Obtener información adicional para tooltip
  const getTooltipText = () => {
    if (typeof location === 'string') {
      return location
    }

    const { coordinates, place_types, vicinity } = location
    const parts = []

    if (coordinates && coordinates.lat !== 0 && coordinates.lng !== 0) {
      parts.push(`Coordenadas: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`)
    }

    if (place_types && place_types.length > 0) {
      const types = place_types
        .filter(type => !['political', 'establishment', 'point_of_interest'].includes(type))
        .slice(0, 3)
        .join(', ')
      if (types) {
        parts.push(`Tipo: ${types}`)
      }
    }

    if (vicinity) {
      parts.push(`Área: ${vicinity}`)
    }

    return parts.join('\n') || getDisplayText()
  }

  const displayText = getDisplayText()
  const tooltipText = getTooltipText()

  if (clickable) {
    return (
      <button
        onClick={openInGoogleMaps}
        className={`flex items-center text-left hover:text-[#2DB2CA] hover:bg-blue-50 rounded px-2 py-1 transition-all group ${className}`}
        title={`Abrir en Google Maps\n\n${tooltipText}`}
      >
        <MapPin size={16} className="mr-2 flex-shrink-0 text-gray-500 group-hover:text-[#2DB2CA]" />
        <span className="text-sm truncate">{displayText}</span>
        <ExternalLink
          size={12}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"
        />
      </button>
    )
  }

  return (
    <div className={`flex items-center ${className}`} title={tooltipText}>
      <MapPin size={16} className="mr-2 flex-shrink-0 text-gray-500" />
      <span className="text-sm text-gray-700 truncate">{displayText}</span>
    </div>
  )
}

// Función auxiliar para extraer solo la ciudad de una ubicación
export function getLocationCity(location: LocationData | string | null | undefined): string {
  if (!location) return ''

  if (typeof location === 'string') {
    // Intentar extraer la ciudad del string (muy básico)
    const parts = location.split(',').map(part => part.trim())
    return parts[1] || parts[0] || ''
  }

  return location.address_components.locality ||
         location.address_components.administrative_area_level_2 ||
         'Sin especificar'
}

// Función auxiliar para verificar si una ubicación tiene coordenadas válidas
export function hasValidCoordinates(location: LocationData | string | null | undefined): boolean {
  if (!location || typeof location === 'string') return false

  const { coordinates } = location
  return coordinates.lat !== 0 && coordinates.lng !== 0
}