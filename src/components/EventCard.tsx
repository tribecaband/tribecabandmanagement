import React from 'react'
import { Calendar, MapPin, Users, Clock, Euro, Phone, FileText } from 'lucide-react'
import { Event } from '../lib/supabase'

interface EventCardProps {
  event: Event
  onClick: () => void
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const getBandFormatText = (format: string) => {
    switch (format) {
      case 'solo':
        return 'Solo'
      case 'duo':
        return 'Dúo'
      case 'trio':
        return 'Trío'
      case 'quartet':
        return 'Cuarteto'
      case 'quintet':
        return 'Quinteto'
      case 'sextet':
        return 'Sexteto'
      case 'band':
        return 'Banda'
      default:
        return format
    }
  }

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'wedding':
        return 'Boda'
      case 'corporate':
        return 'Corporativo'
      case 'private':
        return 'Privado'
      case 'concert':
        return 'Concierto'
      default:
        return type
    }
  }



  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-1.5 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-1.5 items-center">
        {/* Left Section: Event Info */}
        <div className="col-span-8">
          {/* Header: Name, Type, Date, Time */}
          <div className="flex items-center space-x-2 mb-0.5">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{event.name}</h3>
            <span className="text-xs text-gray-500 whitespace-nowrap">• {getEventTypeText(event.event_type)}</span>
            <div className="flex items-center space-x-1.5 text-xs text-gray-600">
              <div className="flex items-center space-x-0.5">
                <Calendar size={11} className="text-[#2DB2CA]" />
                <span className="whitespace-nowrap">{formatDate(event.event_date)}</span>
              </div>
              <div className="flex items-center space-x-0.5">
                <Clock size={11} className="text-[#2DB2CA]" />
                <span className="whitespace-nowrap">{formatTime(event.event_date)}</span>
              </div>
            </div>
          </div>

          {/* Location and Format */}
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <div className="flex items-center space-x-0.5 flex-1 min-w-0">
              <MapPin size={11} className="text-[#2DB2CA] flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center space-x-0.5 whitespace-nowrap">
              <Users size={11} className="text-[#2DB2CA]" />
              <span>{getBandFormatText(event.band_format)}</span>
              <span className="text-gray-400">• 3h</span>
            </div>
          </div>
        </div>

        {/* Right Section: Status and Pricing */}
        <div className="col-span-4 flex items-center justify-end space-x-1.5">
          {/* Pricing */}
          <div className="text-right">
            <div className="flex items-center justify-end space-x-0.5 text-sm font-medium text-gray-800">
              <Euro size={11} className="text-[#F4A261]" />
              <span>
                {event.cache_amount?.toLocaleString('es-ES', { 
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0 
                })}€
              </span>
            </div>
            {event.advance_amount && event.advance_amount > 0 && (
              <div className="text-xs text-gray-500 leading-tight">
                Anticipo: {event.advance_amount}€
              </div>
            )}
          </div>
          
          {/* Status Badge */}
          <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(event.invoice_status)}`}>
            {getStatusText(event.invoice_status)}
          </div>
        </div>
      </div>

      {/* Bottom Section: Contact, Status, Comments (if any) */}
      {(event.contact_name || event.contact_phone || event.invoice_sent || event.payment_received || event.comments) && (
        <div className="mt-1 pt-1 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            {/* Contact Info */}
            <div className="flex items-center space-x-2 text-gray-600">
              {event.contact_name && (
                <span className="font-medium">{event.contact_name}</span>
              )}
              {event.contact_phone && (
                <div className="flex items-center space-x-0.5">
                  <Phone size={9} className="text-[#2DB2CA]" />
                  <span>{event.contact_phone}</span>
                </div>
              )}
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-1.5 text-xs">
              {event.invoice_sent && (
                <span className="text-green-600">✓ Facturado</span>
              )}
              {event.payment_received && (
                <span className="text-green-600">✓ Pagado</span>
              )}
            </div>
          </div>
          
          {/* Comments */}
          {event.comments && (
            <div className="flex items-start space-x-0.5 text-xs text-gray-500 mt-0.5">
              <FileText size={9} className="text-[#2DB2CA] mt-0.5 flex-shrink-0" />
              <span className="flex-1 line-clamp-2 leading-tight">{event.comments}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}