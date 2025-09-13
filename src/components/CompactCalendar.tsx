import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Event as EventType } from '../types'

interface CompactCalendarProps {
  events: EventType[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onEventClick: (event: EventType) => void
}

const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

const DAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function CompactCalendar({ events, selectedDate, onDateSelect, onEventClick }: CompactCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    // Convert Sunday (0) to be last day (6), and shift Monday to be first (0)
    return day === 0 ? 6 : day - 1
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
        <div key={`empty-${i}`} className="h-7 w-7"></div>
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
          className={`h-7 w-7 flex items-center justify-center text-xs cursor-pointer rounded-md relative transition-colors ${
            isSelected
              ? 'bg-[#2DB2CA] text-white font-medium'
              : isToday
              ? 'bg-[#E58483] text-white font-medium'
              : dayEvents.length > 0
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span className="z-10">{day}</span>
          {dayEvents.length > 0 && !isSelected && !isToday && (
            <div className={`absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 text-white rounded-full flex items-center justify-center text-[10px] font-medium px-0.5 ${
              dayEvents.length === 1 ? 'bg-blue-500' :
              dayEvents.length === 2 ? 'bg-orange-500' :
              dayEvents.length >= 3 ? 'bg-red-500' : 'bg-gray-400'
            }`}>
              {dayEvents.length}
            </div>
          )}
        </div>
      )
    }

    return days
  }

  const renderSelectedDateEvents = () => {
    const dayEvents = getEventsForDate(selectedDate)
    
    if (dayEvents.length === 0) {
      return (
        <div className="text-center py-3 text-gray-500 text-xs bg-gray-50 rounded-md">
          Sin eventos
        </div>
      )
    }

    return (
      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {dayEvents.slice(0, 3).map((event) => (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className="p-2 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-[#2DB2CA] transition-colors group"
          >
            <div className="font-medium text-xs text-gray-800 truncate group-hover:text-[#2DB2CA]">
              {event.name}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {new Date(event.event_date).toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
        {dayEvents.length > 3 && (
          <div className="text-xs text-gray-500 text-center py-1">
            +{dayEvents.length - 3} más
          </div>
        )}
      </div>
    )
  }

  const getTotalEventsInMonth = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    
    return events.filter(event => {
      const eventDate = new Date(event.event_date)
      return eventDate >= monthStart && eventDate <= monthEnd
    }).length
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-800">
            {MONTHS_SHORT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <p className="text-xs text-gray-500">
            {getTotalEventsInMonth()} eventos
          </p>
        </div>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Compact Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_SHORT.map((day) => (
            <div key={day} className="h-6 flex items-center justify-center text-[10px] font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Selected Date Info */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Calendar size={14} className="text-[#2DB2CA]" />
          <h4 className="text-sm font-medium text-gray-700">
            {selectedDate.toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short'
            })}
          </h4>
        </div>
        {renderSelectedDateEvents()}
      </div>

      {/* Compact Legend */}
      <div className="text-[10px] text-gray-500 space-y-1 bg-gray-50 p-2 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>1</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>2</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>3+</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-[#2DB2CA] rounded-full"></div>
            <span>Hoy/Selec.</span>
          </div>
        </div>
      </div>
    </div>
  )
}