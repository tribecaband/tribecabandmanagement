import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Event as EventType } from '../types'

interface CalendarPreviewProps {
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

type IndicatorStyle = 'badges' | 'dots' | 'bars' | 'background' | 'hybrid'

const STYLES = [
  { id: 'badges' as const, name: '1. Badges con números', description: 'Badges coloridos según cantidad' },
  { id: 'dots' as const, name: '2. Dots indicadores', description: 'Puntos minimalistas' },
  { id: 'bars' as const, name: '3. Barras de densidad', description: 'Barras que se llenan' },
  { id: 'background' as const, name: '4. Background con intensidad', description: 'Fondo colorido sutil' },
  { id: 'hybrid' as const, name: '5. Híbrido (Recomendado)', description: 'Fondo + badges' }
]

export default function CalendarPreview({ events, selectedDate, onDateSelect, onEventClick }: CalendarPreviewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const [currentStyle, setCurrentStyle] = useState<IndicatorStyle>('badges')

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

  const renderDayWithStyle = (day: number, dayEvents: EventType[], isSelected: boolean, isToday: boolean) => {
    const baseClasses = "h-7 w-7 flex items-center justify-center text-xs cursor-pointer rounded-md relative transition-colors"
    
    switch (currentStyle) {
      case 'badges':
        return (
          <div
            key={day}
            onClick={() => handleDateClick(day)}
            className={`${baseClasses} ${
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
              <div className={`absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold px-1 ${
                dayEvents.length === 1 ? 'bg-blue-500 text-white' :
                dayEvents.length === 2 ? 'bg-orange-500 text-white' :
                dayEvents.length >= 3 ? 'bg-red-500 text-white' : 'bg-gray-400'
              }`}>
                {dayEvents.length}
              </div>
            )}
          </div>
        )

      case 'dots':
        return (
          <div
            key={day}
            onClick={() => handleDateClick(day)}
            className={`${baseClasses} ${
              isSelected
                ? 'bg-[#2DB2CA] text-white font-medium'
                : isToday
                ? 'bg-[#E58483] text-white font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="z-10">{day}</span>
            {dayEvents.length > 0 && !isSelected && !isToday && (
              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                {Array.from({ length: Math.min(dayEvents.length, 3) }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                    dayEvents.length === 1 ? 'bg-green-500' :
                    dayEvents.length === 2 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`} />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[8px] text-gray-600 font-bold">+</div>
                )}
              </div>
            )}
          </div>
        )

      case 'bars':
        return (
          <div
            key={day}
            onClick={() => handleDateClick(day)}
            className={`${baseClasses} ${
              isSelected
                ? 'bg-[#2DB2CA] text-white font-medium'
                : isToday
                ? 'bg-[#E58483] text-white font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="z-10">{day}</span>
            {dayEvents.length > 0 && !isSelected && !isToday && (
              <div className="absolute bottom-0 left-0 right-0 h-1">
                <div className={`h-full rounded-b-md ${
                  dayEvents.length === 1 ? 'bg-green-400 w-1/3' :
                  dayEvents.length === 2 ? 'bg-orange-400 w-2/3' :
                  dayEvents.length >= 3 ? 'bg-red-500 w-full' : ''
                }`} />
              </div>
            )}
          </div>
        )

      case 'background':
        return (
          <div
            key={day}
            onClick={() => handleDateClick(day)}
            className={`${baseClasses} ${
              isSelected
                ? 'bg-[#2DB2CA] text-white font-medium'
                : isToday
                ? 'bg-[#E58483] text-white font-medium' 
                : dayEvents.length === 1
                ? 'bg-green-100 text-green-800 hover:bg-green-200 font-medium'
                : dayEvents.length === 2
                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 font-medium'
                : dayEvents.length >= 3
                ? 'bg-red-100 text-red-800 hover:bg-red-200 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="z-10">{day}</span>
          </div>
        )

      case 'hybrid':
        return (
          <div
            key={day}
            onClick={() => handleDateClick(day)}
            className={`${baseClasses} ${
              isSelected
                ? 'bg-[#2DB2CA] text-white font-medium'
                : isToday  
                ? 'bg-[#E58483] text-white font-medium'
                : dayEvents.length > 0
                ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 font-medium border border-blue-200'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="z-10">{day}</span>
            {dayEvents.length > 1 && !isSelected && !isToday && (
              <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                dayEvents.length === 2 ? 'bg-orange-500 text-white' :
                dayEvents.length >= 3 ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {dayEvents.length}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
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

      days.push(renderDayWithStyle(day, dayEvents, isSelected, isToday))
    }

    return days
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
      {/* Style Selector */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Elige el estilo de indicadores:</h3>
        <div className="space-y-2">
          {STYLES.map((style) => (
            <label key={style.id} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="calendar-style"
                value={style.id}
                checked={currentStyle === style.id}
                onChange={(e) => setCurrentStyle(e.target.value as IndicatorStyle)}
                className="w-4 h-4 text-[#2DB2CA] border-gray-300 focus:ring-[#2DB2CA]"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{style.name}</div>
                <div className="text-xs text-gray-500">{style.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Calendar Header */}
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

      {/* Calendar Grid */}
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

      {/* Legend for current style */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Leyenda - {STYLES.find(s => s.id === currentStyle)?.name}:</h4>
        <div className="text-[10px] text-gray-600 space-y-1">
          {currentStyle === 'badges' && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 bg-blue-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">1</div>
                <span>1 evento</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 bg-orange-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">2</div>
                <span>2 eventos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">3+</div>
                <span>3+ eventos</span>
              </div>
            </>
          )}
          {currentStyle === 'dots' && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>1 evento</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-0.5"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div></div>
                <span>2 eventos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-0.5"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div></div>
                <span>3+ eventos</span>
              </div>
            </>
          )}
          {currentStyle === 'bars' && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-1 bg-green-400 rounded"></div>
                <span>1 evento</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-1 bg-orange-400 rounded"></div>
                <span>2 eventos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-1 bg-red-500 rounded"></div>
                <span>3+ eventos</span>
              </div>
            </>
          )}
          {currentStyle === 'background' && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 text-green-800 rounded text-xs flex items-center justify-center font-medium">15</div>
                <span>1 evento</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-orange-100 text-orange-800 rounded text-xs flex items-center justify-center font-medium">16</div>
                <span>2 eventos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-100 text-red-800 rounded text-xs flex items-center justify-center font-medium">17</div>
                <span>3+ eventos</span>
              </div>
            </>
          )}
          {currentStyle === 'hybrid' && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs flex items-center justify-center font-medium">15</div>
                <span>1 evento (solo fondo)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative w-6 h-6 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs flex items-center justify-center font-medium">
                  16
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">2</div>
                </div>
                <span>2+ eventos (fondo + badge)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}