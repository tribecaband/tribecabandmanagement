import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { X, Save, Calendar, Clock, FileText, Users, Euro, Trash2, User, ChevronDown, Check, Plus } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Event as EventType, LocationData } from '../types'
import LocationAutocomplete from './LocationAutocomplete'

interface EventModalProps {
  event: EventType | null
  onClose: () => void
  onSave: () => void
}

interface FormData {
  title: string
  contact_person: string
  contact_phone: string
  location: string
  date: string
  time: string
  duration?: number
  band_format: string
  status: string
  base_amount: number
  base_has_iva?: boolean
  iva_amount?: number
  total_amount?: number
  advance_amount?: number
  advance_has_iva?: boolean
  advance_iva_amount?: number
  advance_total?: number
  notes?: string
  selected_musicians: string[]
}

interface Musician {
  id: string
  name: string
  instrument: string
  is_main: boolean
}

// Band format is now calculated automatically based on event_musicians count

// Custom Dropdown Component for Musician Selection
interface CustomDropdownProps {
  options: { id: string; name: string; is_main: boolean }[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  substituteCount: number
  instrument: string
  onAddNewMusician: (instrument: string) => void
}

function CustomDropdown({ options, value, onChange, placeholder, substituteCount, instrument, onAddNewMusician }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.id === value)

  const displayText = selectedOption
    ? `${selectedOption.name}${selectedOption.is_main ? ' ★' : ''}${substituteCount > 0 ? ` (+${substituteCount} sustitutos)` : ''}`
    : (substituteCount > 0 ? `${placeholder} (+${substituteCount} opciones)` : placeholder)

  // Sort options: main musicians first, then alphabetical
  const sortedOptions = [...options].sort((a, b) => {
    if (a.is_main && !b.is_main) return -1
    if (!a.is_main && b.is_main) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm border rounded-lg text-left focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent transition-all duration-200 flex items-center justify-between ${
          selectedOption
            ? 'border-[#2DB2CA] bg-blue-50 text-blue-800 font-medium'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          size={16}
          className={`ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          } ${selectedOption ? 'text-blue-600' : 'text-gray-400'}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 text-gray-500"
          >
            {substituteCount > 0 ? `Sin seleccionar (+${substituteCount} opciones)` : 'Sin seleccionar'}
          </button>

          {sortedOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm focus:outline-none flex items-center justify-between group ${
                option.id === value
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <span className="flex items-center">
                {option.name}
                {option.is_main && (
                  <span className="ml-2 text-[#2DB2CA] text-xs">★</span>
                )}
              </span>
              {option.id === value && (
                <Check size={14} className="text-blue-600" />
              )}
            </button>
          ))}

          {/* Add new musician option */}
          <button
            type="button"
            onClick={() => {
              onAddNewMusician(instrument)
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm focus:outline-none flex items-center justify-between group border-t border-gray-100 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700"
          >
            <span className="flex items-center">
              <Plus size={14} className="mr-2" />
              Añadir nuevo músico
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

const BAND_FORMATS = [
  { value: 'solo', label: 'Solo (1 músico)', musicians: 1 },
  { value: 'duo', label: 'Dúo (2 músicos)', musicians: 2 },
  { value: 'trio', label: 'Trío (3 músicos)', musicians: 3 },
  { value: 'quartet', label: 'Cuarteto (4 músicos)', musicians: 4 },
  { value: 'quintet', label: 'Quinteto (5 músicos)', musicians: 5 },
  { value: 'sextet', label: 'Sexteto (6 músicos)', musicians: 6 }
]

const INVOICE_STATUS_OPTIONS = [
  { value: 'no', label: 'Sin Facturar' },
  { value: 'yes', label: 'Facturado' },
  { value: 'advance', label: 'Anticipo Facturado' }
]

// Function to get automatic band format based on selected musicians
const getAutomaticBandFormat = (selectedMusicianIds: string[]): string => {
  const count = selectedMusicianIds.length
  const format = BAND_FORMATS.find(f => f.musicians === count)
  return format ? format.value : 'custom'
}

export default function EventModal({ event, onClose, onSave }: EventModalProps) {
  const { profile, user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [musicians, setMusicians] = useState<Musician[]>([])
  const [loadingMusicians, setLoadingMusicians] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [musiciansError, setMusiciansError] = useState<string | null>(null)
  const [autoRetryAttempts, setAutoRetryAttempts] = useState(0)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [showNewMusicianModal, setShowNewMusicianModal] = useState(false)
  const [selectedInstrumentForNew, setSelectedInstrumentForNew] = useState<string>('')
  const [newMusicianName, setNewMusicianName] = useState('')
  const [creatingMusician, setCreatingMusician] = useState(false)
  
  // Función para manejar cambios en los datos de ubicación
  const handleLocationDataChange = (newLocationData: LocationData | null) => {
    console.log('🔄 EventModal recibiendo nuevos datos de ubicación:', newLocationData)
    console.log('🏷️ Source de los nuevos datos:', newLocationData?.source)
    console.log('🆔 Place ID de los nuevos datos:', newLocationData?.place_id)
    setLocationData(newLocationData)
    console.log('✅ LocationData actualizado en EventModal')
  }
  
  // Helper to avoid hanging requests (wraps a function that returns a Promise)
  async function withTimeout<T>(fn: () => Promise<T>, ms: number, label: string): Promise<T> {
    return await Promise.race<T>([
      fn(),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms))
    ])
  }
  

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      title: '',
      contact_person: '',
      contact_phone: '',
      location: '',
      date: '',
      time: '',
      band_format: 'trio',
      duration: 180, // Cambiado a minutos (3 horas = 180 minutos)
      base_amount: 0,
      base_has_iva: false,
      iva_amount: 0,
      total_amount: 0,
      advance_amount: 0,
      advance_has_iva: false,
      advance_iva_amount: 0,
      advance_total: 0,
      status: 'no',
      notes: '',
      selected_musicians: []
    }
  })

  const watchedBaseAmount = watch('base_amount')
  const watchedBaseHasIva = watch('base_has_iva')
  const watchedAdvanceAmount = watch('advance_amount')
  const watchedAdvanceHasIva = watch('advance_has_iva')
  const watchedSelectedMusicians = watch('selected_musicians')
  const watchedLocation = watch('location')
  const watchedDuration = watch('duration')

  // Función para formatear minutos a horas y minutos
  const formatDuration = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0 minutos'
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours === 0) {
      return `${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`
    } else if (remainingMinutes === 0) {
      return `${hours} hora${hours !== 1 ? 's' : ''}`
    } else {
      return `${hours} hora${hours !== 1 ? 's' : ''} y ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`
    }
  }

  // Memoized calculated values for display
  const calculatedAmounts = useMemo(() => {
    const baseAmount = parseFloat(watchedBaseAmount?.toString() || '0')
    const baseIvaPercentage = watchedBaseHasIva ? 21 : 0
    const ivaAmount = (baseAmount * baseIvaPercentage) / 100
    const totalAmount = baseAmount + ivaAmount

    const advanceAmount = parseFloat(watchedAdvanceAmount?.toString() || '0')
    const advanceIvaPercentage = watchedAdvanceHasIva ? 21 : 0
    const advanceIvaAmount = (advanceAmount * advanceIvaPercentage) / 100
    const advanceTotalAmount = advanceAmount + advanceIvaAmount

    return {
      baseAmount,
      ivaAmount,
      totalAmount,
      advanceAmount,
      advanceIvaAmount,
      advanceTotalAmount
    }
  }, [watchedBaseAmount, watchedBaseHasIva, watchedAdvanceAmount, watchedAdvanceHasIva])

  const { baseAmount, ivaAmount, totalAmount, advanceAmount, advanceIvaAmount, advanceTotalAmount } = calculatedAmounts

  // Band format calculation is now handled automatically in Dashboard

  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.event_date)

      // Determinar el valor de location para el formulario
      let locationValue = ''
      let locationDataValue: LocationData | null = null

      if (event.location) {
        if (typeof event.location === 'string') {
          // Formato antiguo: solo texto
          locationValue = event.location
        } else {
          // Formato nuevo: objeto LocationData
          locationDataValue = event.location
          
          // Determinar si es un lugar (place) o solo una dirección
          const isPlace = event.location.place_types && 
            event.location.place_types.some(type => 
              ['restaurant', 'bar', 'cafe', 'hotel', 'store', 'establishment', 'point_of_interest'].includes(type)
            )
          
          // Si es un lugar y tiene nombre, mostrar el nombre
          if (isPlace && event.location.name && event.location.name !== event.location.formatted_address) {
            locationValue = event.location.name
          } else {
            // Si no es un lugar o no tiene nombre, mostrar la dirección completa
            locationValue = event.location.formatted_address
          }
        }
      }

      setLocationData(locationDataValue)

      reset({
        title: event.name,
        contact_person: event.contact_name,
        contact_phone: event.contact_phone || '',
        location: locationValue,
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toTimeString().slice(0, 5),
        band_format: event.band_format || '',
        duration: event.duration || 180, // Usar duración del evento o 180 minutos por defecto
        base_amount: event.cache_amount || 0,
        base_has_iva: !!event.cache_includes_iva,
        iva_amount: 0,
        total_amount: event.cache_amount || 0,
        advance_amount: event.advance_amount || 0,
        advance_has_iva: !!event.advance_includes_iva,
        advance_iva_amount: 0,
        advance_total: 0,
        status: event.invoice_status,
        notes: event.comments || '',
        selected_musicians: []
      })
    } else {
      // Limpiar datos cuando no hay evento
      setLocationData(null)
    }
  }, [event, reset])

  // Auto-calculate IVA and total amount for base amount
  useEffect(() => {
    const baseAmountVal = parseFloat(watchedBaseAmount?.toString() || '0')
    const ivaPercent = watchedBaseHasIva ? 21 : 0
    if (baseAmountVal >= 0) {
      const ivaAmt = (baseAmountVal * ivaPercent) / 100
      const totalAmt = baseAmountVal + ivaAmt
      setValue('iva_amount', parseFloat(ivaAmt.toFixed(2)))
      setValue('total_amount', parseFloat(totalAmt.toFixed(2)))
    }
  }, [watchedBaseAmount, watchedBaseHasIva, setValue])

  // Auto-calculate IVA and total amount for advance
  useEffect(() => {
    const advanceAmountVal = parseFloat(watchedAdvanceAmount?.toString() || '0')
    const advIvaPercent = watchedAdvanceHasIva ? 21 : 0
    const advIvaAmt = (advanceAmountVal * advIvaPercent) / 100
    const advTotal = advanceAmountVal + advIvaAmt
    setValue('advance_iva_amount', parseFloat(advIvaAmt.toFixed(2)))
    setValue('advance_total', parseFloat(advTotal.toFixed(2)))
  }, [watchedAdvanceAmount, watchedAdvanceHasIva, setValue])

  // Band format is calculated automatically, no need for manual updates

  // Base amount suggestion removed - will be handled separately if needed

  // Memoized function to load musicians
  const loadMusicians = useCallback(async () => {
    console.log('🎵 loadMusicians called - Auth state:', { 
      user: !!user, 
      profile: !!profile,
      userId: user?.id,
      profileId: profile?.id 
    })
    
    // Only try to load if user is authenticated
    if (!user || !profile) {
      console.log('🚫 No user or profile, aborting musicians load')
      setLoadingMusicians(false)
      setMusicians([])
      return
    }

    console.log('🔄 Starting musicians load...')
    setLoadingMusicians(true)
    setMusiciansError(null)
    
    try {
      // Verify session is still valid before making the request
      console.log('🔍 Checking session validity...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      const sessionExpiresAt = session?.expires_at ? new Date(session.expires_at * 1000) : null
      const now = new Date()
      const isExpired = sessionExpiresAt ? sessionExpiresAt < now : false
      const expiresInMinutes = sessionExpiresAt ? Math.floor((sessionExpiresAt.getTime() - now.getTime()) / (1000 * 60)) : null
      
      console.log('📋 Session check result:', { 
        hasSession: !!session, 
        sessionError,
        expiresAt: sessionExpiresAt?.toISOString(),
        isExpired,
        expiresInMinutes
      })
      
      // If session expires in less than 5 minutes, proactively refresh it
      if (session && expiresInMinutes !== null && expiresInMinutes < 5) {
        console.log('⏰ Session expires soon, proactively refreshing...')
        const refreshSuccess = false
        console.log('📋 Proactive refresh result:', refreshSuccess)
      }
      
      if (!session) {
        console.error('❌ No active session when loading musicians')
        console.log('🔄 Attempting to refresh session before giving up...')
        
        // Try to refresh session before giving up
        const refreshSuccess = false
        console.log('📋 Emergency refresh result:', refreshSuccess)
        
        if (refreshSuccess) {
          console.log('✅ Session refreshed successfully, retrying musicians load...')
          setTimeout(() => loadMusicians(), 500)
          return
        }
        
        // If refresh failed, user needs to sign in again
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        setMusicians([])
        setMusiciansError('No hay sesión activa')
        return
      }
      
      console.log('✅ Session is valid, making musicians query...')

      const { data: musiciansData, error: musiciansError } = await supabase
        .from('musicians')
        .select('id, name, instrument, is_main')
        .order('name')
      
      console.log('📊 Musicians query result:', { 
        dataCount: musiciansData?.length || 0, 
        hasError: !!musiciansError,
        errorCode: musiciansError?.code,
        errorMessage: musiciansError?.message 
      })
      
      if (musiciansError) {
        console.error('❌ Error loading musicians:', musiciansError)
        let errorMessage = 'Error al cargar los músicos'
        
        // Handle specific error types
        if (musiciansError.code === '42501' || musiciansError.message?.includes('permission denied')) {
          errorMessage = 'Sin permisos para acceder a los músicos. Intentando renovar sesión...'
          console.log('🔄 Attempting session refresh due to permission error...')
          
          // Try to refresh the session using the auth store and auto-retry once
          const refreshSuccess = false
          console.log('📋 Session refresh result:', refreshSuccess)
          
          if (refreshSuccess && autoRetryAttempts < 1) {
            console.log('✅ Session refreshed, retrying musicians load...')
            setAutoRetryAttempts(prev => prev + 1)
            setTimeout(() => {
              loadMusicians()
            }, 1000)
            return
          } else {
            console.log('❌ Session refresh failed or max retries reached:', { refreshSuccess, autoRetryAttempts })
            errorMessage = 'No se pudo renovar la sesión. Inicia sesión nuevamente.'
          }
        } else if (musiciansError.code === 'PGRST116') {
          errorMessage = 'No tienes permisos para acceder a los músicos. Contacta al administrador.'
        } else if (musiciansError.message?.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet.'
        } else {
          errorMessage = `Error: ${musiciansError.message || 'Error desconocido'}`
        }
        
        toast.error(errorMessage)
        setMusicians([])
        setMusiciansError(errorMessage)
      } else {
        console.log('✅ Musicians loaded successfully:', musiciansData?.length || 0, 'musicians')
        setMusicians(musiciansData || [])
        setAutoRetryAttempts(0) // Reset retry counter on successful load
        if (musiciansData?.length === 0) {
          console.log('⚠️ No musicians found in database')
          toast.warning('No hay músicos registrados en el sistema.')
        }
      }
    } catch (error: any) {
      console.error('❌ Exception loading musicians:', error)
      let errorMessage = 'Error inesperado al cargar músicos'
      
      if (error?.message?.includes('fetch') || error?.name === 'NetworkError') {
        errorMessage = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.'
      } else if (error?.message?.includes('auth') || error?.status === 401) {
        errorMessage = 'Error de autenticación. Inicia sesión nuevamente.'
      }
      
      toast.error(errorMessage)
      setMusicians([])
      setMusiciansError(errorMessage)
    } finally {
      setLoadingMusicians(false)
    }
  }, [user, profile])

  // Function to handle adding new musician
  const handleAddNewMusician = useCallback((instrument: string) => {
    setSelectedInstrumentForNew(instrument)
    setNewMusicianName('')
    setShowNewMusicianModal(true)
  }, [])

  // Function to create new musician
  const createNewMusician = useCallback(async () => {
    if (!newMusicianName.trim() || !selectedInstrumentForNew || !user) {
      toast.error('El nombre del músico es requerido')
      return
    }

    setCreatingMusician(true)
    try {
      const { data: newMusician, error } = await supabase
        .from('musicians')
        .insert([{
          name: newMusicianName.trim(),
          instrument: selectedInstrumentForNew,
          is_main: false // New musicians are substitutes by default
        }])
        .select()
        .single()

      if (error) throw error

      // Add to local musicians state
      setMusicians(prev => [...prev, newMusician])

      // Auto-select the new musician
      const currentSelected = watchedSelectedMusicians || []
      // Remove any previously selected musician from this instrument
      const instrumentMusicians = musicians.filter(m => m.instrument === selectedInstrumentForNew)
      const filteredSelected = currentSelected.filter(
        id => !instrumentMusicians.map(m => m.id).includes(id)
      )
      setValue('selected_musicians', [...filteredSelected, newMusician.id])

      toast.success(`Músico "${newMusicianName}" añadido correctamente`)
      setShowNewMusicianModal(false)
      setNewMusicianName('')
      setSelectedInstrumentForNew('')
    } catch (error: any) {
      console.error('Error creating musician:', error)
      toast.error(`Error al crear músico: ${error.message || 'Error desconocido'}`)
    } finally {
      setCreatingMusician(false)
    }
  }, [newMusicianName, selectedInstrumentForNew, user, musicians, watchedSelectedMusicians, setValue])

  // Load musicians on component mount and when authentication changes
  useEffect(() => {
    // Add a small delay to ensure auth state is settled
    const timeoutId = setTimeout(() => {
      loadMusicians()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [loadMusicians, retryCount])

  // Memoized function to load selected musicians
  const loadSelectedMusicians = useCallback(async (eventId: string) => {
    // Only try to load if user is authenticated
    if (!user || !profile) {
      return
    }

    try {
      // Verify session is still valid
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('No active session when loading selected musicians')
        return
      }

      const { data: eventMusiciansData, error: eventMusiciansError } = await supabase
        .from('event_musicians')
        .select('musician_id')
        .eq('event_id', eventId)
      
      if (eventMusiciansError) {
        console.error('❌ Error loading event musicians:', eventMusiciansError)
        
        if (eventMusiciansError.code === '42501' || eventMusiciansError.message?.includes('permission denied')) {
          toast.error('Sin permisos para cargar los músicos del evento. Verifica tu sesión.')
          // Try to refresh the session
          // Session check removed
        }
        return
      }
      
      const selectedMusicianIds = eventMusiciansData?.map(em => em.musician_id) || []
      setValue('selected_musicians', selectedMusicianIds)
      
      // Update band format based on selected musicians
      if (selectedMusicianIds.length > 0) {
        const automaticFormat = getAutomaticBandFormat(selectedMusicianIds)
        setValue('band_format', automaticFormat)
      }
    } catch (error) {
      console.error('❌ Exception loading selected musicians:', error)
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.')
      }
    }
  }, [setValue, user, profile])

  // Load selected musicians when editing an event
  useEffect(() => {
    if (event?.id && user && profile) {
      // Add a small delay to ensure musicians are loaded first
      const timeoutId = setTimeout(() => {
        loadSelectedMusicians(event.id)
      }, 200)
      
      return () => clearTimeout(timeoutId)
    }
  }, [event?.id, loadSelectedMusicians, user, profile])

  // Auto-select all principal musicians when creating a new event
  useEffect(() => {
    if (!event && musicians.length > 0 && user && profile) {
      const principalMusicians = musicians.filter(musician => musician.is_main)
      const principalMusicianIds = principalMusicians.map(musician => musician.id)
      
      if (principalMusicianIds.length > 0) {
        setValue('selected_musicians', principalMusicianIds)
        
        // Update band format based on selected musicians
        const automaticFormat = getAutomaticBandFormat(principalMusicianIds)
        setValue('band_format', automaticFormat)
      }
    }
  }, [event, musicians, setValue, user, profile])

  const onSubmit = async (data: FormData) => {
    console.log('🚀 EventModal onSubmit - Iniciando envío del formulario');
    console.log('📍 LocationData actual:', locationData);
    console.log('📝 Form data location:', data.location);
    
    // Verificar autenticación antes de proceder
    if (!user || !profile) {
      toast.error('Debes estar autenticado para realizar esta acción')
      return
    }
    
    // Prevent double submit if a save is already in progress
    if (loading) {
      return
    }
    setLoading(true)
    
    let saveSucceeded = false
    try {
      const eventDateTime = new Date(`${data.date}T${data.time}`)
      if (event) {
        const updateData = {
          name: data.title,
          contact_name: data.contact_person,
          event_date: eventDateTime.toISOString(),
          contact_phone: data.contact_phone,
          location: locationData || {
            formatted_address: data.location,
            coordinates: { lat: 0, lng: 0 },
            address_components: {},
            place_id: '',
            place_types: [],
            created_at: new Date().toISOString(),
            source: 'manual' as const
          }, // Usar datos completos o crear un objeto manual
          duration: Number(data.duration) || 180,
          comments: data.notes,
          cache_amount: Number(data.base_amount) || 0,
          cache_includes_iva: !!data.base_has_iva,
          advance_amount: Number(data.advance_amount) || 0,
          advance_includes_iva: !!data.advance_has_iva,
          invoice_status: data.status
        }
        console.log('🔄 Datos para actualización:', updateData);
        console.log('📍 Location data que se enviará:', updateData.location);
        const updateResp: any = await withTimeout(
          async () => await supabase
            .from('events')
            .update(updateData)
            .eq('id', event.id)
            .select(),
          15000,
          'Update event'
        )
        const { data: updateResult, error: updateError } = updateResp
        
        // If no rows affected, there might be an RLS issue
        if (!updateError && updateResult?.length === 0) {
          // Try to diagnose by checking if we can read the event
          const readResp: any = await withTimeout(
            async () => await supabase
              .from('events')
              .select('id, name, created_by')
              .eq('id', event.id)
              .single(),
            10000,
            'Read event after failed update'
          )
          const { data: readTest, error: readError } = readResp
          
          if (readError || !readTest) {
            throw new Error('Cannot read event - RLS permissions issue')
          } else {
            throw new Error('Event exists but cannot be updated - check RLS update policies')
          }
        }
        
        if (updateError) {
          throw new Error(`Error updating event: ${updateError.message}`)
        }
        
        // Update event_musicians relationships
        // Always clear existing relationships, then reinsert if any are selected
        {
          const deleteResp: any = await withTimeout(
            async () => await supabase
              .from('event_musicians')
              .delete()
              .eq('event_id', event.id),
            10000,
            'Delete event_musicians (update)'
          )
          const { error: deleteError } = deleteResp
          if (deleteError) {
            console.warn('Warning deleting existing musicians:', deleteError.message)
          }
          if (data.selected_musicians && data.selected_musicians.length > 0) {
            const eventMusicians = data.selected_musicians.map(musicianId => ({
              event_id: event.id,
              musician_id: musicianId,
              role: 'main'
            }))
            const insertResp: any = await withTimeout(
              async () => await supabase
                .from('event_musicians')
                .insert(eventMusicians),
              10000,
              'Insert event_musicians (update)'
            )
            const { error: insertError } = insertResp
            if (insertError) {
              console.warn('Warning inserting musicians:', insertError.message)
            }
          }
        }
        
        toast.success('Evento actualizado correctamente')
      } else {
        // Create new event
        const createData = {
          name: data.title,
          contact_name: data.contact_person,
          event_date: eventDateTime.toISOString(),
          contact_phone: data.contact_phone,
          location: locationData || {
            formatted_address: data.location,
            coordinates: { lat: 0, lng: 0 },
            address_components: {},
            place_id: '',
            place_types: [],
            created_at: new Date().toISOString(),
            source: 'manual' as const
          }, // Usar datos completos o crear un objeto manual
          duration: Number(data.duration) || 180,
          comments: data.notes,
          cache_amount: Number(data.base_amount) || 0,
          cache_includes_iva: !!data.base_has_iva,
          advance_amount: Number(data.advance_amount) || 0,
          advance_includes_iva: !!data.advance_has_iva,
          invoice_status: data.status,
          created_by: profile?.id || user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('➕ Datos para creación:', createData);
        console.log('📍 Location data que se enviará:', createData.location);
        
        const createResp: any = await withTimeout(
          async () => await supabase
            .from('events')
            .insert(createData)
            .select()
            .single(),
          15000,
          'Create event'
        )
        const { data: newEvent, error: createError } = createResp
        
        if (createError) {
          throw new Error(`Error creating event: ${createError.message}`)
        }
        
        // Insert event_musicians relationships
        if (data.selected_musicians && data.selected_musicians.length > 0 && newEvent) {
          const eventMusicians = data.selected_musicians.map(musicianId => ({
            event_id: newEvent.id,
            musician_id: musicianId,
            role: 'main'
          }))
          
          const insertResp2: any = await withTimeout(
            async () => {
              const resp = await supabase
                .from('event_musicians')
                .insert(eventMusicians)
              return resp
            },
            10000,
            'Insert event_musicians (create)'
          )
          const { error: insertError, data: insertData } = insertResp2
          if (insertError) {
            console.warn('Warning inserting musicians:', insertError.message)
          }
        }
        
        toast.success('Evento creado correctamente')
      }
      // Mark DB save as successful before calling UI callbacks
      saveSucceeded = true
      try {
        onSave()
      } catch (cbErr) {
        console.warn('Event saved, but onSave callback failed:', cbErr)
        toast.warning('Evento guardado, pero hubo un problema actualizando la vista. Intenta recargar.')
      }
    } catch (error: any) {
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al guardar el evento'

      const rawMessage = (error?.message || error?.msg || error?.error_description || error?.code || '').toString()
      if (rawMessage) {
        if (rawMessage.includes('contact_phone')) {
          errorMessage = 'El teléfono de contacto es requerido'
        } else if (rawMessage.includes('duplicate key')) {
          errorMessage = 'Ya existe un evento con estos datos'
        } else if (rawMessage.includes('foreign key')) {
          errorMessage = 'Error de referencia en los datos'
        } else if (rawMessage.includes('not-null')) {
          errorMessage = 'Faltan campos requeridos'
        } else if (rawMessage.includes('events_invoice_status_check')) {
          errorMessage = 'Estado de facturación inválido. Selecciona una opción válida.'
        } else if (rawMessage.toLowerCase().includes('timeout')) {
          errorMessage = 'Tiempo de espera agotado guardando. Verifica conexión y vuelve a intentar.'
        } else {
          errorMessage = `Error: ${rawMessage}`
        }
      } else {
        // Fallback si el error no tiene mensaje
        errorMessage = 'Error desconocido al guardar. Revisa permisos (RLS) o la conexión e inténtalo de nuevo.'
      }

      if (saveSucceeded) {
        // Do not report as save failure if DB save already succeeded
        const infoMsg = 'Evento guardado, pero hubo un problema posterior. La vista podría no haberse actualizado.'
        toast.warning(infoMsg)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event) return
    
    setLoading(true)
    try {
      // First, delete event_musicians relationships
      const { error: deleteMusiciansError } = await supabase
        .from('event_musicians')
        .delete()
        .eq('event_id', event.id);
      
      if (deleteMusiciansError) {
        console.warn('Warning deleting event musicians:', deleteMusiciansError.message);
      }
      
      // Then, delete the event
      const { error: deleteEventError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);
      
      if (deleteEventError) {
        throw new Error(`Error deleting event: ${deleteEventError.message}`);
      }
      
      toast.success('Evento eliminado correctamente');
      onClose();
      onSave();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      
      let errorMessage = 'Error al eliminar el evento';
      if (error?.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {event ? 'Editar Evento' : 'Nuevo Evento'}
          </h2>
          <div className="flex items-center space-x-2">
            {event && profile?.role === 'admin' && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-6"
        >
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Título del Evento *
              </label>
              <input
                type="text"
                {...register('title', { required: 'El título es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                placeholder="Ej: Boda María y Juan"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                Persona de Contacto *
              </label>
              <input
                type="text"
                {...register('contact_person', { required: 'La persona de contacto es requerida' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                placeholder="Nombre de la persona de contacto"
              />
              {errors.contact_person && <p className="text-red-500 text-sm mt-1">{errors.contact_person.message}</p>}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono de Contacto *
              </label>
              <input
                type="tel"
                {...register('contact_phone', { required: 'El teléfono de contacto es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                placeholder="Ej: +34 600 123 456"
              />
              {errors.contact_phone && <p className="text-red-500 text-sm mt-1">{errors.contact_phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación *
              </label>
              <LocationAutocomplete
                value={watchedLocation || ''}
                onChange={(value) => setValue('location', value)}
                onLocationDataChange={handleLocationDataChange}
                placeholder="Buscar ubicación del evento..."
                required
                error={errors.location?.message}
              />
              <input
                type="hidden"
                {...register('location', { required: 'La ubicación es requerida' })}
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
            </div>
          </div>

          {/* Musicians Selection */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Users size={20} className="mr-2 text-[#2DB2CA]" />
              Selección de Músicos
            </h3>
            
            {loadingMusicians ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2DB2CA]"></div>
                  <p className="text-gray-600">Cargando músicos...</p>
                </div>
              </div>
            ) : musiciansError ? (
              <div className="text-center py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                  <p className="text-red-700 text-sm mb-2">⚠️ Error al cargar músicos</p>
                  <p className="text-red-600 text-xs">{musiciansError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAutoRetryAttempts(0) // Reset auto-retry attempts
                    setRetryCount(prev => prev + 1)
                  }}
                  className="px-4 py-2 bg-[#2DB2CA] text-white rounded-lg hover:bg-[#25a0b8] transition-colors text-sm"
                >
                  Reintentar carga
                </button>
              </div>
            ) : musicians.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  // Group musicians by instrument
                  const groupedMusicians = musicians.reduce((acc, musician) => {
                    if (!acc[musician.instrument]) {
                      acc[musician.instrument] = []
                    }
                    acc[musician.instrument].push(musician)
                    return acc
                  }, {} as Record<string, Musician[]>)

                  const instrumentLabels = {
                    voz: 'Voz',
                    guitarra: 'Guitarra',
                    bajo: 'Bajo',
                    bateria: 'Batería'
                  }

                  return Object.entries(groupedMusicians).map(([instrument, instrumentMusicians]) => {
                    const selectedMusician = instrumentMusicians.find(m => watchedSelectedMusicians?.includes(m.id))
                    const substituteCount = instrumentMusicians.filter(m => !m.is_main).length

                    return (
                      <div key={instrument} className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-3 text-sm">
                          {instrumentLabels[instrument as keyof typeof instrumentLabels] || instrument}
                        </h4>

                        <CustomDropdown
                          options={instrumentMusicians.map(m => ({
                            id: m.id,
                            name: m.name,
                            is_main: m.is_main
                          }))}
                          value={selectedMusician?.id || ''}
                          onChange={(value) => {
                            const currentSelected = watchedSelectedMusicians || []
                            // Remove any previously selected musician from this instrument
                            const filteredSelected = currentSelected.filter(
                              id => !instrumentMusicians.map(m => m.id).includes(id)
                            )
                            // Add new selection if any
                            if (value) {
                              setValue('selected_musicians', [...filteredSelected, value])
                            } else {
                              setValue('selected_musicians', filteredSelected)
                            }
                          }}
                          placeholder="Sin seleccionar"
                          substituteCount={substituteCount}
                          instrument={instrument}
                          onAddNewMusician={handleAddNewMusician}
                        />
                      </div>
                    )
                  })
                })()}
              </div>
            ) : null}
            
            {musicians.length === 0 && !loadingMusicians && !musiciansError && (
              <div className="text-center py-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                  <p className="text-yellow-700 text-sm mb-2">ℹ️ No hay músicos</p>
                  <p className="text-yellow-600 text-xs">
                    {user && profile ? 'No hay músicos registrados en el sistema.' : 'Debes iniciar sesión para ver los músicos'}
                  </p>
                </div>
                {user && profile && (
                  <button
                    type="button"
                    onClick={() => {
                      setAutoRetryAttempts(0) // Reset auto-retry attempts
                      setRetryCount(prev => prev + 1)
                    }}
                    className="px-4 py-2 bg-[#2DB2CA] text-white rounded-lg hover:bg-[#25a0b8] transition-colors text-sm"
                  >
                    Reintentar carga
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Fecha *
              </label>
              <input
                type="date"
                {...register('date', { required: 'La fecha es requerida' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Hora *
              </label>
              <input
                type="time"
                {...register('time', { required: 'La hora es requerida' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
              />
              {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Duración (minutos) *
              </label>
              <input
                type="number"
                step="15"
                min="15"
                max="720"
                {...register('duration', { 
                  required: 'La duración es requerida',
                  min: { value: 15, message: 'La duración mínima es 15 minutos' },
                  max: { value: 720, message: 'La duración máxima es 12 horas (720 minutos)' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                placeholder="Ej: 90, 120, 180..."
              />
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>}
              {watchedDuration && watchedDuration > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Equivale a:</span> {formatDuration(watchedDuration)}
                </p>
              )}
            </div>
          </div>


          {/* Band Format and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="inline mr-1" />
                Formato de Banda (Automático)
              </label>
              <input
                type="text"
                {...register('band_format')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                readOnly
                value={(() => {
                  const selectedCount = watchedSelectedMusicians?.length || 0
                  const format = BAND_FORMATS.find(f => f.musicians === selectedCount)
                  return format ? format.label : selectedCount > 0 ? `Formato personalizado (${selectedCount} músicos)` : 'Selecciona músicos'
                })()}
              />
              <p className="text-xs text-gray-500 mt-1">
                El formato se determina automáticamente según los músicos seleccionados
              </p>
            </div>


          </div>

          {/* Financial Information */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Euro size={20} className="mr-2 text-[#2DB2CA]" />
              Información Financiera
            </h3>
            
            {/* Base Amount Row */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Importe Base</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importe Base (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('base_amount', { 
                      required: 'El importe base es requerido',
                      min: { value: 0, message: 'El importe debe ser positivo' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.base_amount && <p className="text-red-500 text-sm mt-1">{errors.base_amount.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    &nbsp;
                  </label>
                  <div className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      {...register('base_has_iva')}
                      className="w-4 h-4 text-[#2DB2CA] border-gray-300 rounded focus:ring-[#2DB2CA]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Aplicar IVA (21%)</span>
                  </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Importe IVA (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={calculatedAmounts.ivaAmount.toFixed(2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={calculatedAmounts.totalAmount.toFixed(2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-semibold"
                      readOnly
                    />
                  </div>
              </div>
            </div>

            {/* Advance Payment Row */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Anticipo</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importe Anticipo (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('advance_amount', {
                      min: { value: 0, message: 'El anticipo debe ser positivo' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.advance_amount && <p className="text-red-500 text-sm mt-1">{errors.advance_amount.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    &nbsp;
                  </label>
                  <div className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      {...register('advance_has_iva')}
                      className="w-4 h-4 text-[#2DB2CA] border-gray-300 rounded focus:ring-[#2DB2CA]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Aplicar IVA (21%) al anticipo</span>
                  </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IVA Anticipo (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={calculatedAmounts.advanceIvaAmount.toFixed(2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Anticipo (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={calculatedAmounts.advanceTotalAmount.toFixed(2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-semibold"
                      readOnly
                    />
                  </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
              placeholder="Notas adicionales sobre el evento..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2DB2CA] text-white px-6 py-2 rounded-lg hover:bg-[#25a0b5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{loading ? 'Guardando...' : 'Guardar Evento'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Musician Modal */}
      {showNewMusicianModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Añadir Nuevo Músico
            </h3>
            <p className="text-gray-600 mb-4">
              Instrumento: <span className="font-medium text-[#2DB2CA]">
                {selectedInstrumentForNew === 'voz' ? 'Voz' :
                 selectedInstrumentForNew === 'guitarra' ? 'Guitarra' :
                 selectedInstrumentForNew === 'bajo' ? 'Bajo' :
                 selectedInstrumentForNew === 'bateria' ? 'Batería' :
                 selectedInstrumentForNew}
              </span>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Músico *
              </label>
              <input
                type="text"
                value={newMusicianName}
                onChange={(e) => setNewMusicianName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !creatingMusician) {
                    createNewMusician()
                  }
                  if (e.key === 'Escape') {
                    setShowNewMusicianModal(false)
                  }
                }}
                placeholder="Nombre completo del músico"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => {
                  setShowNewMusicianModal(false)
                  setNewMusicianName('')
                  setSelectedInstrumentForNew('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={creatingMusician}
              >
                Cancelar
              </button>
              <button
                onClick={createNewMusician}
                disabled={creatingMusician || !newMusicianName.trim()}
                className="bg-[#2DB2CA] text-white px-6 py-2 rounded-lg hover:bg-[#25a0b5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>{creatingMusician ? 'Creando...' : 'Crear Músico'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}