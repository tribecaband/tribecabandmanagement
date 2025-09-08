import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, Calendar, Clock, Euro, User, Phone } from 'lucide-react';
import { Event, EventFormData } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  isEditing: boolean;
  onSave: () => void;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  isEditing,
  onSave
}) => {
  const { hasPermission } = useAuth();
  const [formData, setFormData] = useState<EventFormData>({
    nombre_evento: '',
    fecha_evento: '',
    hora_evento: '',
    ubicacion: '',
    comunidad_autonoma: '',
    facturacion: 'No',
    requiere_alta: false,
    tipo_evento: '',
    formato_banda: 'Banda',
    cache_euros: 0,
    anticipo_euros: 0,
    persona_contacto: '',
    telefono_contacto: '',
    voz: 'Julio',
    guitarra: 'Santi',
    bajo: 'Pablo',
    bateria: 'Javi',
    comentarios: ''
  });

  const [loading, setLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>([]);

  // Load event types
  useEffect(() => {
    const loadEventTypes = async () => {
      const { data } = await supabase
        .from('event_types')
        .select('name')
        .order('name');
      
      if (data) {
        setEventTypes(data.map(type => type.name));
      }
    };

    if (isOpen) {
      loadEventTypes();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (event && isEditing) {
      setFormData({
        nombre_evento: event.nombre_evento,
        fecha_evento: event.fecha_evento,
        hora_evento: event.hora_evento,
        ubicacion: event.ubicacion,
        comunidad_autonoma: event.comunidad_autonoma,
        facturacion: event.facturacion,
        requiere_alta: event.requiere_alta,
        tipo_evento: event.tipo_evento,
        formato_banda: event.formato_banda,
        cache_euros: event.cache_euros,
        anticipo_euros: event.anticipo_euros,
        persona_contacto: event.persona_contacto,
        telefono_contacto: event.telefono_contacto,
        voz: event.voz,
        guitarra: event.guitarra,
        bajo: event.bajo,
        bateria: event.bateria,
        comentarios: event.comentarios
      });
    } else if (!isEditing) {
      // Reset form for new event
      setFormData({
        nombre_evento: '',
        fecha_evento: '',
        hora_evento: '',
        ubicacion: '',
        comunidad_autonoma: '',
        facturacion: 'No',
        requiere_alta: false,
        tipo_evento: '',
        formato_banda: 'Banda',
        cache_euros: 0,
        anticipo_euros: 0,
        persona_contacto: '',
        telefono_contacto: '',
        voz: 'Julio',
        guitarra: 'Santi',
        bajo: 'Pablo',
        bateria: 'Javi',
        comentarios: ''
      });
    }
  }, [event, isEditing, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check permissions for creating new events
    if (!isEditing || !event) {
      if (!hasPermission('can_create_events')) {
        toast.error('No tienes permisos para crear eventos');
        return;
      }
    }
    
    setLoading(true);

    try {
      const eventData = {
        ...formData,
        // Add coordinates (mock for now - will be enhanced with geolocation)
        latitud: 40.4168, // Madrid coordinates as default
        longitud: -3.7038
      };

      if (isEditing && event) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
        toast.success('Evento actualizado correctamente');
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) throw error;
        toast.success('Evento creado correctamente');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Error al guardar el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Evento' : isEditing === false && event ? 'Ver Evento' : 'Nuevo Evento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información Básica
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_evento}
                  onChange={(e) => handleInputChange('nombre_evento', e.target.value)}
                  disabled={!isEditing && !!event}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Ej: Boda en Hotel Palace"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_evento}
                    onChange={(e) => handleInputChange('fecha_evento', e.target.value)}
                    disabled={!isEditing && !!event}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.hora_evento}
                    onChange={(e) => handleInputChange('hora_evento', e.target.value)}
                    disabled={!isEditing && !!event}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ubicacion}
                  onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                  disabled={!isEditing && !!event}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Ej: Hotel Palace, Madrid"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comunidad Autónoma *
                </label>
                <select
                  required
                  value={formData.comunidad_autonoma}
                  onChange={(e) => handleInputChange('comunidad_autonoma', e.target.value)}
                  disabled={!isEditing && !!event}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Madrid">Madrid</option>
                  <option value="Castilla-La Mancha">Castilla-La Mancha</option>
                  <option value="Castilla y León">Castilla y León</option>
                  <option value="Extremadura">Extremadura</option>
                  <option value="Andalucía">Andalucía</option>
                  <option value="Cataluña">Cataluña</option>
                  <option value="Valencia">Valencia</option>
                  <option value="País Vasco">País Vasco</option>
                  <option value="Galicia">Galicia</option>
                  <option value="Aragón">Aragón</option>
                  <option value="Asturias">Asturias</option>
                  <option value="Cantabria">Cantabria</option>
                  <option value="La Rioja">La Rioja</option>
                  <option value="Murcia">Murcia</option>
                  <option value="Navarra">Navarra</option>
                  <option value="Islas Baleares">Islas Baleares</option>
                  <option value="Islas Canarias">Islas Canarias</option>
                </select>
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Detalles del Evento
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Evento
                </label>
                <select
                  value={formData.tipo_evento}
                  onChange={(e) => handleInputChange('tipo_evento', e.target.value)}
                  disabled={!isEditing && !!event}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Seleccionar...</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato de Banda *
                </label>
                <select
                  required
                  value={formData.formato_banda}
                  onChange={(e) => handleInputChange('formato_banda', e.target.value)}
                  disabled={!isEditing && !!event}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="Banda">Banda</option>
                  <option value="Trío">Trío</option>
                  <option value="Dúo">Dúo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado de Facturación *
                </label>
                <select
                  required
                  value={formData.facturacion}
                  onChange={(e) => handleInputChange('facturacion', e.target.value)}
                  disabled={!isEditing && !!event}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="No">Pendiente</option>
                  <option value="Anticipo">Anticipo</option>
                  <option value="Sí">Confirmado</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiere_alta"
                  checked={formData.requiere_alta}
                  onChange={(e) => handleInputChange('requiere_alta', e.target.checked)}
                  disabled={!isEditing && !!event}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-50"
                />
                <label htmlFor="requiere_alta" className="ml-2 text-sm text-gray-700">
                  Requiere alta en Hacienda
                </label>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Información Económica
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caché (€) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.cache_euros}
                    onChange={(e) => handleInputChange('cache_euros', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing && !!event}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anticipo (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.anticipo_euros}
                    onChange={(e) => handleInputChange('anticipo_euros', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing && !!event}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Información de Contacto
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Persona de Contacto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.persona_contacto}
                  onChange={(e) => handleInputChange('persona_contacto', e.target.value)}
                  disabled={!isEditing && !!event}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Nombre del contacto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono de Contacto *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefono_contacto}
                  onChange={(e) => handleInputChange('telefono_contacto', e.target.value)}
                  disabled={!isEditing && !!event}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Ej: +34 600 123 456"
                />
              </div>
            </div>

            {/* Band Members */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Formación de la Banda</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voz
                  </label>
                  <select
                    value={formData.voz}
                    onChange={(e) => handleInputChange('voz', e.target.value)}
                    disabled={!isEditing && !!event}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="Julio">Julio</option>
                    <option value="Sustituto">Sustituto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guitarra
                  </label>
                  <select
                    value={formData.guitarra}
                    onChange={(e) => handleInputChange('guitarra', e.target.value)}
                    disabled={!isEditing && !!event}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="Santi">Santi</option>
                    <option value="Sustituto">Sustituto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bajo
                  </label>
                  <select
                    value={formData.bajo}
                    onChange={(e) => handleInputChange('bajo', e.target.value)}
                    disabled={!isEditing && !!event}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="Pablo">Pablo</option>
                    <option value="Sustituto">Sustituto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batería
                  </label>
                  <select
                    value={formData.bateria}
                    onChange={(e) => handleInputChange('bateria', e.target.value)}
                    disabled={!isEditing && !!event}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="Javi">Javi</option>
                    <option value="Sustituto">Sustituto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentarios
              </label>
              <textarea
                rows={4}
                value={formData.comentarios}
                onChange={(e) => handleInputChange('comentarios', e.target.value)}
                disabled={!isEditing && !!event}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Notas adicionales sobre el evento..."
              />
            </div>
          </div>

          {/* Actions */}
          {(isEditing || !event) && (
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEditing ? 'Actualizar' : 'Crear'} Evento
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EventModal;