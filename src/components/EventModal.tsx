import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { X, Save, Calendar, Clock, MapPin, FileText, Users, Euro, Trash2, User, DollarSign } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface EventModalProps {
  event: Event | null
  onClose: () => void
  onSave: () => void
}

interface FormData {
  title: string
  contact_person: string
  contact_phone: string
  date: string
  time: string
  duration?: number
  venue: string
  address?: string
  band_format: string
  status: string
  base_amount: number
  iva_percentage?: number
  iva_amount?: number
  total_amount?: number
  advance_amount?: number
  advance_iva_percentage?: number
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
  
  console.log('🎯 EventModal COMPONENT RENDERED - Auth state:', { user: !!user, profile: !!profile, userId: user?.id })
  console.log('🎯 EventModal COMPONENT RENDERED - Loading state:', loading)
  console.log('🎯 EventModal COMPONENT RENDERED - Event:', event?.id || 'new event')

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      title: '',
      contact_person: '',
      contact_phone: '',
      date: '',
      time: '',
      venue: '',
      address: '',
      band_format: 'trio',
      duration: 3,
      base_amount: 0,
      iva_percentage: 21,
      iva_amount: 0,
      total_amount: 0,
      advance_amount: 0,
      advance_iva_percentage: 21,
      advance_iva_amount: 0,
      advance_total: 0,
      status: 'no',
      notes: '',
      selected_musicians: []
    }
  })

  const watchedBaseAmount = watch('base_amount')
  const watchedIvaPercentage = watch('iva_percentage')
  const watchedAdvanceAmount = watch('advance_amount')
  const watchedAdvanceIvaPercentage = watch('advance_iva_percentage')
  const watchedBandFormat = watch('band_format')
  const watchedSelectedMusicians = watch('selected_musicians')

  // Calculated values for display
  const baseAmount = parseFloat(watchedBaseAmount?.toString() || '0')
  const ivaPercentage = parseFloat(watchedIvaPercentage?.toString() || '21')
  const ivaAmount = (baseAmount * ivaPercentage) / 100
  const totalAmount = baseAmount + ivaAmount

  const advanceAmount = parseFloat(watchedAdvanceAmount?.toString() || '0')
  const advanceIvaPercentage = parseFloat(watchedAdvanceIvaPercentage?.toString() || '21')
  const advanceIvaAmount = (advanceAmount * advanceIvaPercentage) / 100
  const advanceTotalAmount = advanceAmount + advanceIvaAmount

  // Band format calculation is now handled automatically in Dashboard

  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.event_date)
      reset({
        title: event.name,
        contact_person: event.contact_name,
        contact_phone: event.contact_phone || '',
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toTimeString().slice(0, 5),
        venue: event.location,
        address: event.location || '',
        band_format: event.band_format || '',
        duration: 3,
        base_amount: event.cache_amount || 0,
        iva_percentage: 21,
        iva_amount: 0,
        total_amount: event.cache_amount || 0,
        advance_amount: event.advance_amount || 0,
        advance_iva_percentage: 21,
        advance_iva_amount: 0,
        advance_total: 0,
        status: event.invoice_status,
        notes: event.comments || '',
        selected_musicians: []
      })
    }
  }, [event, reset])

  // Auto-calculate IVA and total amount for base amount
  useEffect(() => {
    const baseAmount = parseFloat(watchedBaseAmount?.toString() || '0')
    const ivaPercentage = parseFloat(watchedIvaPercentage?.toString() || '21')
    
    if (baseAmount >= 0) {
      const ivaAmount = (baseAmount * ivaPercentage) / 100
      const totalAmount = baseAmount + ivaAmount
      
      setValue('iva_amount', parseFloat(ivaAmount.toFixed(2)))
      setValue('total_amount', parseFloat(totalAmount.toFixed(2)))
    }
  }, [watchedBaseAmount, watchedIvaPercentage, setValue])

  // Auto-calculate IVA and total amount for advance
  useEffect(() => {
    const advanceAmount = parseFloat(watchedAdvanceAmount?.toString() || '0')
    const advanceIvaPercentage = parseFloat(watchedAdvanceIvaPercentage?.toString() || '21')
    
    const advanceIvaAmount = (advanceAmount * advanceIvaPercentage) / 100
    const advanceTotal = advanceAmount + advanceIvaAmount
    
    setValue('advance_iva_amount', parseFloat(advanceIvaAmount.toFixed(2)))
    setValue('advance_total', parseFloat(advanceTotal.toFixed(2)))
  }, [watchedAdvanceAmount, watchedAdvanceIvaPercentage, setValue])

  // Band format is calculated automatically, no need for manual updates

  // Base amount suggestion removed - will be handled separately if needed

  // Load musicians on component mount
  useEffect(() => {
    console.log('🔍 EventModal useEffect - Loading musicians')
    let isMounted = true
    
    const loadMusicians = async () => {
      if (!isMounted) return
      
      console.log('🔍 EventModal loadMusicians - Starting')
      setLoadingMusicians(true)
      
      try {
        // Load all musicians from Supabase
        const { data: musiciansData, error: musiciansError } = await supabase
          .from('musicians')
          .select('id, name, instrument, is_main')
          .order('name')
        
        console.log('🔍 EventModal loadMusicians - Response:', { musiciansData, musiciansError })
        
        if (musiciansError) {
          console.error('❌ Error loading musicians:', musiciansError)
          toast.error('Error al cargar los músicos')
          return
        }
        
        if (isMounted) {
          console.log('🔍 EventModal loadMusicians - Setting musicians:', musiciansData?.length || 0)
          setMusicians(musiciansData || [])
        }
      } catch (error) {
        console.error('❌ Exception loading musicians:', error)
        if (isMounted) {
          toast.error('Error al cargar los músicos')
        }
      } finally {
        if (isMounted) {
          console.log('🔍 EventModal loadMusicians - Setting loading to false')
          setLoadingMusicians(false)
        }
      }
    }
    
    loadMusicians()
    
    return () => {
      console.log('🔍 EventModal useEffect cleanup - Setting isMounted to false')
      isMounted = false
    }
  }, []) // Only run once on mount

  // Load selected musicians when editing an event
  useEffect(() => {
    if (!event?.id) return
    
    console.log('🔍 EventModal useEffect - Loading selected musicians for event:', event.id)
    let isMounted = true
    
    const loadSelectedMusicians = async () => {
      if (!isMounted) return
      
      try {
        console.log('🔍 EventModal loadSelectedMusicians - Loading from Supabase')
        const { data: eventMusiciansData, error: eventMusiciansError } = await supabase
          .from('event_musicians')
          .select('musician_id')
          .eq('event_id', event.id)
        
        console.log('🔍 EventModal loadSelectedMusicians - Response:', { eventMusiciansData, eventMusiciansError })
        
        if (eventMusiciansError) {
          console.error('❌ Error loading event musicians:', eventMusiciansError)
          return
        }
        
        const selectedMusicianIds = eventMusiciansData?.map(em => em.musician_id) || []
        
        if (isMounted) {
          console.log('🔍 EventModal loadSelectedMusicians - Setting selected musicians:', selectedMusicianIds)
          setValue('selected_musicians', selectedMusicianIds)
          
          // Update band format based on selected musicians
          if (selectedMusicianIds.length > 0) {
            const automaticFormat = getAutomaticBandFormat(selectedMusicianIds)
            console.log('🔍 EventModal loadSelectedMusicians - Setting band format:', automaticFormat)
            setValue('band_format', automaticFormat)
          }
        }
      } catch (error) {
        console.error('❌ Exception loading selected musicians:', error)
      }
    }
    
    loadSelectedMusicians()
    
    return () => {
      isMounted = false
    }
  }, [event?.id, setValue]) // Run when event ID changes

  const onSubmit = async (data: FormData) => {
    console.log('🚀 EventModal onSubmit - FUNCTION CALLED! Starting save process')
    console.log('🚀 EventModal onSubmit - Form data received:', data)
    console.log('🚀 EventModal onSubmit - Current loading state:', loading)
    console.log('🔍 EventModal onSubmit - Financial fields specifically:', {
      cache_amount: {
        original: data.base_amount,
        type: typeof data.base_amount,
        parsed: Number(data.base_amount),
        watchedValue: watchedBaseAmount
      },
      advance_amount: {
        original: data.advance_amount,
        type: typeof data.advance_amount,
        parsed: Number(data.advance_amount),
        watchedValue: watchedAdvanceAmount
      }
    })
    
    // Verificar autenticación antes de proceder
    if (!user || !profile) {
      console.error('❌ EventModal onSubmit - User not authenticated:', { user: !!user, profile: !!profile })
      toast.error('Debes estar autenticado para realizar esta acción')
      return
    }
    
    console.log('✅ EventModal onSubmit - User authenticated:', { userId: user.id, profileId: profile.id })
    
    setLoading(true)
    
    try {
      console.log('🔍 EventModal onSubmit - Creating event date time')
      const eventDateTime = new Date(`${data.date}T${data.time}`)
      console.log('🔍 EventModal onSubmit - Event date time:', eventDateTime.toISOString())
      
      // Band format is calculated automatically in Dashboard based on event_musicians count
      
      console.log('🔍 EventModal onSubmit - Preparing event data')
      const eventData = {
        name: data.title,
        contact_name: data.contact_person,
        event_date: eventDateTime.toISOString(),
        location: data.venue,
        contact_phone: data.contact_phone,
        comments: data.notes,
        cache_amount: data.base_amount,
        cache_includes_iva: false,
        advance_amount: data.advance_amount || 0,
        advance_includes_iva: false,
        invoice_status: data.status,
        is_active: true,
        event_types: [],
        musicians: {},
        band_format: 'auto', // Will be calculated automatically
        created_by: profile?.id || ''
      }
      console.log('🔍 EventModal onSubmit - Event data prepared:', eventData)

      if (event) {
        console.log('🔍 EventModal onSubmit - Updating existing event:', event.id)
        
        console.log('🔄 EventModal: Updating event with data:', {
          name: data.title,
          contact_name: data.contact_person,
          cache_amount: data.base_amount,
          advance_amount: data.advance_amount,
          invoice_status: data.status
        })
        
        console.log('🔍 EventModal: Current user info:', {
          userId: user?.id,
          userEmail: user?.email,
          profileId: profile?.id,
          profileRole: profile?.role,
          eventCreatedBy: event.created_by
        })

        // Update existing event with timeout
        console.log('🔍 EventModal: About to execute update query...')
        
        // Try without updated_at first to avoid potential RLS issues
        const updateData = {
          name: data.title,
          contact_name: data.contact_person,
          event_date: eventDateTime.toISOString(),
          location: data.venue,
          contact_phone: data.contact_phone,
          comments: data.notes,
          cache_amount: Number(data.base_amount) || 0,
          advance_amount: Number(data.advance_amount) || 0,
          invoice_status: data.status
        }
        
        console.log('🔧 EventModal: Update data prepared:', updateData)
        console.log('🔧 EventModal: Financial fields verification:', {
          cache_amount: {
            formValue: data.base_amount,
            converted: Number(data.base_amount),
            finalValue: updateData.cache_amount
          },
          advance_amount: {
            formValue: data.advance_amount,
            converted: Number(data.advance_amount),
            finalValue: updateData.advance_amount
          }
        })
        
        const { data: updateResult, error: updateError } = await supabase
          .from('events')
          .update(updateData)
          .eq('id', event.id)
          .select()
        
        console.log('🔍 EventModal: Update query completed')
        
        console.log('🔄 EventModal: Update result:', { 
          updateError, 
          updateResult, 
          rowsAffected: updateResult?.length || 0
        })
        
        // If no rows affected, there might be an RLS issue
        if (!updateError && updateResult?.length === 0) {
          console.log('⚠️ EventModal: No rows affected - possible RLS issue')
          
          // Try to diagnose by checking if we can read the event
          const { data: readTest, error: readError } = await supabase
            .from('events')
            .select('id, name, created_by')
            .eq('id', event.id)
            .single()
          
          console.log('🔍 EventModal: Read test result:', { readTest, readError })
          
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
        if (data.selected_musicians && data.selected_musicians.length > 0) {
          // First, delete existing relationships
          const { error: deleteError } = await supabase
            .from('event_musicians')
            .delete()
            .eq('event_id', event.id)
          
          if (deleteError) {
            console.warn('Warning deleting existing musicians:', deleteError.message)
          }
          
          // Then, insert new relationships
          const eventMusicians = data.selected_musicians.map(musicianId => ({
            event_id: event.id,
            musician_id: musicianId,
            role: 'main'
          }))
          
          const { error: insertError } = await supabase
            .from('event_musicians')
            .insert(eventMusicians)
          
          if (insertError) {
            console.warn('Warning inserting musicians:', insertError.message)
          }
        }
        
        console.log('✅ EventModal: Event update completed')
        toast.success('Evento actualizado correctamente')
      } else {
        console.log('🔄 EventModal: Creating new event')
        
        console.log('🔄 EventModal: Creating new event with data:', {
          name: data.title,
          contact_name: data.contact_person,
          cache_amount: data.base_amount,
          advance_amount: data.advance_amount,
          invoice_status: data.status
        })

        // Create new event
        const createData = {
          name: data.title,
          contact_name: data.contact_person,
          event_date: eventDateTime.toISOString(),
          location: data.venue,
          contact_phone: data.contact_phone,
          comments: data.notes,
          cache_amount: Number(data.base_amount) || 0,
          advance_amount: Number(data.advance_amount) || 0,
          invoice_status: data.status,
          created_by: profile?.id || user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('🔧 EventModal: Create data prepared:', createData)
        console.log('🔧 EventModal: Financial fields verification for creation:', {
          cache_amount: {
            formValue: data.base_amount,
            converted: Number(data.base_amount),
            finalValue: createData.cache_amount
          },
          advance_amount: {
            formValue: data.advance_amount,
            converted: Number(data.advance_amount),
            finalValue: createData.advance_amount
          }
        })
        
        const { data: newEvent, error: createError } = await supabase
          .from('events')
          .insert(createData)
          .select()
          .single()
        
        console.log('🔄 EventModal: Create result:', { newEvent: !!newEvent, createError })
        
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
          
          const { error: insertError } = await supabase
            .from('event_musicians')
            .insert(eventMusicians)
          
          if (insertError) {
            console.warn('Warning inserting musicians:', insertError.message)
          }
        }
        
        console.log('✅ EventModal: Event creation completed')
        toast.success('Evento creado correctamente')
      }
      
      console.log('🔍 EventModal onSubmit - Calling onSave callback')
      onSave()
      console.log('🔍 EventModal onSubmit - onSave callback completed')
    } catch (error: any) {
      console.error('❌ EventModal onSubmit - Error saving event:', error)
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al guardar el evento'
      
      if (error?.message) {
        if (error.message.includes('contact_phone')) {
          errorMessage = 'El teléfono de contacto es requerido'
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'Ya existe un evento con estos datos'
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Error de referencia en los datos'
        } else if (error.message.includes('not-null')) {
          errorMessage = 'Faltan campos requeridos'
        } else if (error.message.includes('events_invoice_status_check')) {
          errorMessage = 'Estado de facturación inválido. Selecciona una opción válida.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      console.log('🔍 EventModal onSubmit - Showing error toast:', errorMessage)
      toast.error(errorMessage)
    } finally {
      console.log('🔍 EventModal onSubmit - Setting loading to false')
      setLoading(false)
      console.log('🔍 EventModal onSubmit - Process completed')
    }
  }

  const handleDelete = async () => {
    if (!event) return
    
    setLoading(true)
    try {
      console.log('🗑️ EventModal: Starting event deletion for:', event.id);
      
      // First, delete event_musicians relationships
      const { error: deleteMusiciansError } = await supabase
        .from('event_musicians')
        .delete()
        .eq('event_id', event.id);
      
      if (deleteMusiciansError) {
        console.warn('Warning deleting event musicians:', deleteMusiciansError.message);
      } else {
        console.log('✅ EventModal: Event musicians deleted successfully');
      }
      
      // Then, delete the event
      const { error: deleteEventError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);
      
      if (deleteEventError) {
        throw new Error(`Error deleting event: ${deleteEventError.message}`);
      }
      
      console.log('✅ EventModal: Event deleted successfully');
      toast.success('Evento eliminado correctamente');
      onClose();
      onSave();
    } catch (error: any) {
      console.error('❌ EventModal: Error deleting event:', error);
      
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
          onSubmit={(e) => {
            console.log('🔥 Form onSubmit triggered - event:', e)
            console.log('🔥 Form onSubmit - about to call handleSubmit')
            return handleSubmit(
              (data) => {
                console.log('🔥 handleSubmit success callback - data:', data)
                onSubmit(data)
              },
              (errors) => {
                console.log('🔥 handleSubmit error callback - validation errors:', errors)
              }
            )(e)
          }}
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
            <div></div>
          </div>

          {/* Musicians Selection */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Users size={20} className="mr-2 text-[#2DB2CA]" />
              Selección de Músicos
            </h3>
            
            {loadingMusicians ? (
              <div className="text-center py-4">
                <p className="text-gray-600">Cargando músicos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {musicians.map((musician) => (
                  <label key={musician.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      value={musician.id}
                      checked={watchedSelectedMusicians?.includes(musician.id) || false}
                      onChange={(e) => {
                        const currentSelected = watchedSelectedMusicians || []
                        if (e.target.checked) {
                          setValue('selected_musicians', [...currentSelected, musician.id])
                        } else {
                          setValue('selected_musicians', currentSelected.filter(id => id !== musician.id))
                        }
                      }}
                      className="w-4 h-4 text-[#2DB2CA] border-gray-300 rounded focus:ring-[#2DB2CA]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{musician.name}</p>
                      <p className="text-xs text-gray-500">{musician.instrument}</p>
                      {musician.is_main && (
                        <span className="inline-block px-2 py-1 text-xs bg-[#2DB2CA] text-white rounded-full mt-1">
                          Principal
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            {musicians.length === 0 && !loadingMusicians && (
              <div className="text-center py-4">
                <p className="text-gray-600">No hay músicos disponibles</p>
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
                Duración (horas)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="12"
                {...register('duration', { min: 1, max: 12 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Lugar *
              </label>
              <input
                type="text"
                {...register('venue', { required: 'El lugar es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                placeholder="Nombre del lugar"
              />
              {errors.venue && <p className="text-red-500 text-sm mt-1">{errors.venue.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                placeholder="Dirección completa"
              />
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Facturación
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
              >
                {INVOICE_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
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
                    IVA (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('iva_percentage')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                    placeholder="21.00"
                  />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Importe IVA (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={ivaAmount.toFixed(2)}
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
                      value={totalAmount.toFixed(2)}
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
                    IVA Anticipo (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('advance_iva_percentage')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
                    placeholder="21.00"
                  />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IVA Anticipo (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={advanceIvaAmount.toFixed(2)}
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
                      value={advanceTotalAmount.toFixed(2)}
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
    </div>
  )
}