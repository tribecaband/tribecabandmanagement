import React from 'react'
import { Calendar, Users, Clock, Phone, FileText, User, XCircle } from 'lucide-react'
import { Event as EventType } from '../types'
import LocationDisplay from './LocationDisplay'

interface EventCardProps {
  event: EventType
  onClick: () => void
  onDelete?: (eventId: string) => void
}

export default function EventCard({ event, onClick, onDelete }: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes?: number): string => {
    if (!minutes || minutes <= 0) return ''

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours === 0) {
      return `${remainingMinutes}min`
    } else if (remainingMinutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${remainingMinutes}min`
    }
  }


  const getBandFormatText = (format: string) => {
    if (!format) return 'Banda'
    switch (format.toLowerCase()) {
      case 'solo':
        return 'Solo'
      case 'dúo':
      case 'duo':
        return 'Dúo'
      case 'trío':
      case 'trio':
        return 'Trío'
      case 'cuarteto':
      case 'quartet':
        return 'Cuarteto'
      case 'quinteto':
      case 'quintet':
        return 'Quinteto'
      case 'sexteto':
      case 'sextet':
        return 'Sexteto'
      case 'banda':
      case 'band':
        return 'Banda'
      default:
        return format
    }
  }

  const getEventTypeText = (types: string[] = []) => {
    if (!types || types.length === 0) return 'Evento'
    const firstType = types[0]
    switch (firstType.toLowerCase()) {
      case 'boda':
      case 'wedding':
        return 'Boda'
      case 'corporativo':
      case 'corporate':
        return 'Corporativo'
      case 'privado':
      case 'private':
        return 'Privado'
      case 'concierto':
      case 'concert':
        return 'Concierto'
      case 'fiesta':
        return 'Fiesta'
      case 'celebracion':
        return 'Celebración'
      case 'otros':
        return 'Otros'
      default:
        // Capitalize first letter for any unmatched type
        return firstType.charAt(0).toUpperCase() + firstType.slice(1)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || amount === 0) return ''
    return amount.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + ' €'
  }

  // Always format with fixed number of decimals (used for IVA breakdown)
  const formatCurrencyFixed = (amount: number, decimals: number) => {
    const safe = Number.isFinite(Number(amount)) ? Number(amount) : 0
    return safe.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + ' €'
  }

  // IVA calculations (21%) for display
  const IVA_RATE = 0.21
  const cacheIvaAmount = event.cache_includes_iva ? (Number(event.cache_amount) || 0) * IVA_RATE : 0
  const advanceIvaAmount = event.advance_includes_iva ? (Number(event.advance_amount) || 0) * IVA_RATE : 0



  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 hover:shadow-md transition-shadow"
    >
      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-3 items-start">
        {/* Left Section: Basic Info */}
        <div className="col-span-4">
          <div className="flex items-start space-x-2">
            {/* Name and Date/Time together */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-800 truncate leading-tight">{event.name || 'Sin nombre'}</h3>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                <span>• {getEventTypeText(event.event_types)}</span>
                <span className="flex items-center space-x-1">
                  <Calendar size={10} className="text-[#2DB2CA]" />
                  <span>{formatDate(event.event_date)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock size={10} className="text-[#2DB2CA]" />
                  <span>{formatTime(event.event_date)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock size={10} className="text-green-600" />
                  <span className="text-green-600 font-medium">{formatDuration(event.duration || 180)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section: Financial & Status - Compact */}
        <div className="col-span-4">
          <div className="text-xs space-y-0.5">
            <div>
              <span className="font-medium text-gray-600">Caché:</span>
              <span className="font-semibold text-gray-800 ml-1">{formatCurrency(event.cache_amount)}</span>
              {event.cache_includes_iva && (
                <span className="text-gray-500 ml-1">(+{formatCurrencyFixed(cacheIvaAmount, 2)} IVA)</span>
              )}
            </div>
            {(Number(event.advance_amount) > 0) && (
              <div>
                <span className="font-medium text-gray-600">Anticipo:</span>
                <span className="font-semibold text-gray-800 ml-1">{formatCurrency(event.advance_amount)}</span>
                {event.advance_includes_iva && (
                  <span className="text-gray-500 ml-1">(+{formatCurrencyFixed(advanceIvaAmount, 2)} IVA)</span>
                )}
              </div>
            )}
          </div>
          
          {/* Format and Alta status */}
          <div className="flex items-center space-x-3 text-xs mt-1">
            <div className="flex items-center space-x-1">
              <span className="font-medium text-gray-600">¿Alta?</span>
              <span className="text-red-600 font-medium">No</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users size={10} className="text-[#2DB2CA]" />
              <span className="font-medium text-gray-600">{getBandFormatText(event.band_format)}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Contact and Actions - Compact */}
        <div className="col-span-4">
          <div className="flex items-start justify-between">
            {/* Contact Info Compact */}
            <div className="text-xs text-gray-600 flex-1 space-y-1">
              {(event.contact_name || event.contact_phone) && (
                <div className="flex items-center space-x-1">
                  <User size={10} className="text-[#2DB2CA]" />
                  <span className="font-medium">{event.contact_name || 'Sin nombre'}</span>
                  {event.contact_phone && (
                    <>
                      <Phone size={10} className="text-[#2DB2CA] ml-2" />
                      <span>{event.contact_phone}</span>
                    </>
                  )}
                </div>
              )}
              {/* Ubicación */}
              {event.location && (
                <LocationDisplay
                  location={event.location}
                  showFullAddress={false}
                  className="text-xs max-w-[200px]"
                  clickable={true}
                />
              )}
            </div>

            {/* Action Buttons - Horizontal and smaller */}
            <div className="flex items-center space-x-1 ml-2">
              <button 
                onClick={onClick}
                className="p-1.5 text-[#F4A261] hover:bg-orange-50 rounded-md transition-colors border border-orange-200 hover:border-orange-300" 
                title="Editar evento"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              
              {onDelete && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`¿Estás seguro de que quieres eliminar el evento "${event.name}"?`)) {
                      onDelete(event.id)
                    }
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border border-red-200 hover:border-red-300" 
                  title="Eliminar evento"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Comments and Musicians (if any) - Ultra Compact */}
      {(event.comments || (event.musicians && Object.keys(event.musicians).length > 0)) && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            {/* Comments section - takes available space */}
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              {event.comments && (
                <>
                  <FileText size={9} className="text-[#2DB2CA] flex-shrink-0" />
                  <span className="font-medium">Comentarios:</span>
                  <span className="truncate">{event.comments}</span>
                </>
              )}
            </div>
            
            {/* Musicians section - always positioned on the right */}
            {event.musicians && Object.keys(event.musicians).length > 0 && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                <span className="font-medium">Músicos:</span>
                <span className="text-xs">
                  {Object.entries(event.musicians).map(([instrument, musician], index, array) => (
                    <span key={instrument}>
                      <span className="capitalize">{instrument}</span>: <span className="font-medium">{musician}</span>
                      {index < array.length - 1 && ', '}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}