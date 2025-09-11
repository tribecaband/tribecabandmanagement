import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Calendar, Plus, Search, Filter, LogOut, Users as UsersIcon, Settings, Music } from 'lucide-react'
import { Event as EventType } from '../types'
import EventModal from '../components/EventModal'
import EventCard from '../components/EventCard'
import CalendarView from '../components/CalendarView'
import Users from './Users'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, profile, signOut } = useAuthStore()
  console.log('🎯 DASHBOARD COMPONENT RENDERED - User:', !!user, 'Profile:', !!profile)
  const [events, setEvents] = useState<EventType[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  
  console.log('🎯 DASHBOARD STATE - showEventModal:', showEventModal, 'loading:', loading)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    setFilteredEvents(filterEvents(events))
  }, [events, searchTerm, statusFilter])

  const getBandFormat = (musiciansCount: number): string => {
    switch (musiciansCount) {
      case 1: return 'Solo'
      case 2: return 'Dúo'
      case 3: return 'Trío'
      case 4: return 'Cuarteto'
      default: return musiciansCount >= 5 ? 'Banda' : 'Sin músicos'
    }
  }

  const fetchEvents = async () => {
    console.log('🔄 Dashboard: fetchEvents started')
    try {
      // Fetch events with their musicians
      console.log('📡 Dashboard: Making Supabase query for events')
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
      
      console.log('📊 Dashboard: Supabase query completed', { eventsData, error })

      if (error) throw error
      
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
        
        const transformedEvent = {
          ...event,
          musicians_count: musiciansCount,
          band_format: calculatedBandFormat,
          musicians: musiciansObject, // Transform to expected format
          // Ensure numeric fields are numbers
          cache_amount: Number(event.cache_amount) || 0,
          advance_amount: Number(event.advance_amount) || 0
        }
        
        console.log('🔄 Dashboard: Transformed event:', {
          name: transformedEvent.name,
          cache: transformedEvent.cache_amount,
          advance: transformedEvent.advance_amount,
          advance_type: typeof transformedEvent.advance_amount
        })
        
        return transformedEvent
      }) || []
      
      console.log('✅ Dashboard: Setting events state with', eventsWithBandFormat.length, 'events')
      setEvents(eventsWithBandFormat)
    } catch (error) {
      console.error('❌ Dashboard: Error fetching events:', error)
      toast.error('Error al cargar los eventos')
    } finally {
      console.log('🏁 Dashboard: fetchEvents finally block - setting loading to false')
      setLoading(false)
    }
    console.log('✅ Dashboard: fetchEvents completed')
  }

  const filterEvents = (events: EventType[]) => {
    return events.filter(event => {
      const matchesSearch = searchTerm === '' || 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || event.invoice_status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }

  const handleEventClick = (event: EventType) => {
    console.log('🎯 Dashboard handleEventClick - Editing event clicked!', event.id)
    console.log('🎯 Dashboard handleEventClick - Event data:', event)
    setSelectedEvent(event)
    setShowEventModal(true)
    console.log('🎯 Dashboard handleEventClick - Modal should be open for editing, showEventModal:', true)
  }

  const handleNewEvent = () => {
    console.log('🎯 Dashboard handleNewEvent - Button clicked!')
    setSelectedEvent(null)
    setShowEventModal(true)
    console.log('🎯 Dashboard handleNewEvent - Modal should be open now, showEventModal:', true)
  }

  const handleEventSaved = () => {
    console.log('🔄 Dashboard: handleEventSaved called - starting fetchEvents')
    fetchEvents()
    console.log('✅ Dashboard: handleEventSaved - closing modal and clearing selection')
    setShowEventModal(false)
    setSelectedEvent(null)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleLogout = async () => {
    await signOut()
    toast.success('Sesión cerrada correctamente')
  }

  const handleDeleteEvent = async (eventId: string) => {
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
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9ED] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2DB2CA] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9ED]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-[#2DB2CA]" />
              <h1 className="text-2xl font-bold text-gray-900">TriBeCa Band Management</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {profile?.full_name || user?.email}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-[#2DB2CA] text-[#2DB2CA]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-[#2DB2CA] text-[#2DB2CA]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-4 w-4" />
                <span>Usuarios</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'dashboard' ? (
        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Panel - Calendar */}
          <div className="w-1/3 bg-white border-r border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#2DB2CA]" />
                Calendario
              </h2>
              <CalendarView 
                events={events}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
              />
            </div>
          </div>

          {/* Right Panel - Events List */}
          <div className="flex-1 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Lista de Eventos
                </h2>
                <button
              onClick={handleNewEvent}
              className="bg-[#2DB2CA] text-white px-4 py-2 rounded-lg hover:bg-[#2DB2CA]/90 transition-colors flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Nuevo Evento</span>
            </button>
              </div>

              {/* Search and Filters */}
              <div className="flex space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="no">Sin Facturar</option>
                    <option value="yes">Facturado</option>
                    <option value="advance">Anticipo Facturado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No hay eventos para mostrar</p>
                  <p className="text-gray-400 text-sm">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'Crea tu primer evento haciendo clic en "Nuevo Evento"'
                    }
                  </p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventClick(event)}
                    onDelete={handleDeleteEvent}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <Users />
      )}

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => setShowEventModal(false)}
          onSave={handleEventSaved}
        />
      )}
    </div>
  )
}