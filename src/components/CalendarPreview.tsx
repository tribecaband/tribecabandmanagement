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



export default function CalendarPreview({ events, selectedDate, onDateSelect, onEventClick }: CalendarPreviewProps) {
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

  const renderDayWithStyle = (day: number, dayEvents: EventType[], isSelected: boolean, isToday: boolean) => {
    const baseClasses = "h-7 w-7 flex items-center justify-center text-xs cursor-pointer rounded-md relative transition-colors"
    
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


    </div>
  )
}