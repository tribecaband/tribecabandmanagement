import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Event } from '../lib/supabase'

interface CalendarViewProps {
  events: Event[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onEventClick: (event: Event) => void
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function CalendarView({ events, selectedDate, onDateSelect, onEventClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.event_date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
    onDateSelect(newMonth)
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    onDateSelect(clickedDate)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10"></div>
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const dayEvents = getEventsForDate(date)
      const isSelected = date.toDateString() === selectedDate.toDateString()
      const isToday = date.toDateString() === new Date().toDateString()

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-10 w-10 flex items-center justify-center text-sm cursor-pointer rounded-lg relative transition-colors ${
            isSelected
              ? 'bg-[#2DB2CA] text-white'
              : isToday
              ? 'bg-[#E58483] text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          <span className="z-10">{day}</span>
          {dayEvents.length > 0 && (
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#F4A261] rounded-full"></div>
          )}
        </div>
      )
    }

    return days
  }

  const renderEventsList = () => {
    const dayEvents = getEventsForDate(selectedDate)
    
    if (dayEvents.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 text-sm">
          No hay eventos para esta fecha
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {dayEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-l-4 border-[#2DB2CA]"
          >
            <div className="font-medium text-sm text-gray-800 truncate">{event.name}</div>
            <div className="text-xs text-gray-600 mt-1">
              {new Date(event.event_date).toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })} - {event.location}
            </div>
            <div className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
              event.invoice_status === 'yes' 
                ? 'bg-green-100 text-green-800'
                : event.invoice_status === 'advance'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {event.invoice_status === 'yes' ? 'Facturado' : 
               event.invoice_status === 'advance' ? 'Anticipo' : 'Sin facturar'}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-800">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Events for selected date */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Eventos - {selectedDate.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long' 
          })}
        </h4>
        <div className="max-h-64 overflow-y-auto">
          {renderEventsList()}
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#2DB2CA] rounded"></div>
          <span>Fecha seleccionada</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#E58483] rounded"></div>
          <span>Hoy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#F4A261] rounded-full"></div>
          <span>Tiene eventos</span>
        </div>
      </div>
    </div>
  )
}