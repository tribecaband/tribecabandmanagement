import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Plus, Search, Filter } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Event } from '../types'
import { supabase } from '../lib/supabase'
import EventCard from '../components/EventCard'
import EventModal from '../components/EventModal'
import CompactCalendar from '../components/CompactCalendar'
import { toast } from 'sonner'

export default function Dashboard() {
  const { profile, user } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')


  useEffect(() => {
    console.log('🏠 Dashboard useEffect running, about to fetch events...')
    // Set loading to false immediately so Dashboard renders
    setLoading(false)
    // Try to fetch events in background
    setTimeout(() => {
      fetchEvents()
    }, 100)
  }, [])

  // Memoized filtered events
  const memoizedFilteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchTerm === '' ||
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || event.invoice_status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [events, searchTerm, statusFilter])

  useEffect(() => {
    setFilteredEvents(memoizedFilteredEvents)
  }, [memoizedFilteredEvents])

  const getBandFormat = useCallback((musiciansCount: number): string => {
    switch (musiciansCount) {
      case 1: return 'Solo'
      case 2: return 'Dúo'
      case 3: return 'Trío'
      case 4: return 'Cuarteto'
      default: return musiciansCount >= 5 ? 'Banda' : 'Sin músicos'
    }
  }, [])

  const fetchEvents = useCallback(async () => {
    console.log('🏠 Dashboard fetchEvents called')
    
    try {
      console.log('📡 Attempting to fetch events from Supabase...')
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          event_musicians(
            musician_id,
            role,
            musicians(
              id,
              name,
              instrument
            )
          )
        `)
        .order('event_date', { ascending: true })

      if (error) {
        console.error('❌ Supabase query error:', error)
        throw error
      }
      
      console.log('✅ Events fetched successfully:', eventsData?.length || 0)
      
      // Transform the data to calculate band_format automatically and format musicians
      const eventsWithBandFormat = eventsData?.map(event => {
        const musiciansCount = event.event_musicians?.length || 0
        const calculatedBandFormat = getBandFormat(musiciansCount)
        
        // Transform event_musicians to musicians format that EventCard expects
        const musiciansObject: Record<string, string> = {}
        if (event.event_musicians) {
          event.event_musicians.forEach((em: any) => {
            if (em.musicians) {
              musiciansObject[em.musicians.instrument] = em.musicians.name
            }
          })
        }
        
        return {
          ...event,
          musicians_count: musiciansCount,
          band_format: calculatedBandFormat,
          musicians: musiciansObject, // Transform to expected format
          // Ensure numeric fields are numbers
          cache_amount: Number(event.cache_amount) || 0,
          advance_amount: Number(event.advance_amount) || 0,
          duration: event.duration ? Number(event.duration) : undefined,
          event_types: event.event_types || []
        }
      }) || []
      
      setEvents(eventsWithBandFormat)
      console.log('✅ Events processed and set')
    } catch (error) {
      console.error('❌ Dashboard: Error fetching events:', error)
      // Set empty events array on error but don't affect loading state
      setEvents([])
      toast.error('Error al cargar los eventos (continuando sin eventos)')
    }
  }, [getBandFormat])


  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }, [])

  const handleNewEvent = useCallback(() => {
    setSelectedEvent(null)
    setShowEventModal(true)
  }, [])

  const handleEventSaved = useCallback(() => {
    fetchEvents()
    setShowEventModal(false)
    setSelectedEvent(null)
  }, [fetchEvents])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])



  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      toast.success('Evento eliminado correctamente')
      fetchEvents() // Refresh the events list
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Error al eliminar el evento')
    }
  }, [fetchEvents])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendario</h2>
            <CompactCalendar
              events={events}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>
        </div>

        {/* Events Section */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">Eventos</h2>
                <button
                  onClick={() => setShowEventModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Evento
                </button>
              </div>
              
              {/* Search and Filter */}
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="scheduled">Programado</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Events List */}
            <div className="p-6">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No se encontraron eventos con los filtros aplicados.'
                      : 'Comienza creando tu primer evento.'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <button
                      onClick={() => setShowEventModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Evento
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  )
}