// Tipos principales de la aplicación

export interface Event {
  id: string;
  nombre_evento: string;
  fecha_evento: string;
  hora_evento: string;
  ubicacion: string;
  latitud: number;
  longitud: number;
  comunidad_autonoma: string;
  facturacion: 'No' | 'Sí' | 'Anticipo';
  requiere_alta: boolean;
  tipo_evento: string;
  formato_banda: 'Banda' | 'Trío' | 'Dúo';
  cache_euros: number;
  anticipo_euros: number;
  persona_contacto: string;
  telefono_contacto: string;
  voz: 'Julio' | 'Sustituto';
  guitarra: 'Santi' | 'Sustituto';
  bajo: 'Pablo' | 'Sustituto';
  bateria: 'Javi' | 'Sustituto';
  comentarios: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  permissions: UserPermissions | null;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  can_create_events: boolean;
  can_edit_events: boolean;
  can_delete_events: boolean;
  can_view_accounting: boolean;
  can_manage_users: boolean;
}

export interface EventType {
  id: string;
  name: string;
  created_at: string;
}

// Tipos para formularios
export interface EventFormData {
  nombre_evento: string;
  fecha_evento: string;
  hora_evento: string;
  ubicacion: string;
  comunidad_autonoma: string;
  facturacion: 'No' | 'Sí' | 'Anticipo';
  requiere_alta: boolean;
  tipo_evento: string;
  formato_banda: 'Banda' | 'Trío' | 'Dúo';
  cache_euros: number;
  anticipo_euros: number;
  persona_contacto: string;
  telefono_contacto: string;
  voz: 'Julio' | 'Sustituto';
  guitarra: 'Santi' | 'Sustituto';
  bajo: 'Pablo' | 'Sustituto';
  bateria: 'Javi' | 'Sustituto';
  comentarios: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
}

// Tipos para filtros y búsquedas
export interface EventFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_evento?: string;
  comunidad_autonoma?: string;
  facturacion?: 'No' | 'Sí' | 'Anticipo' | '';
  formato_banda?: 'Banda' | 'Trío' | 'Dúo' | '';
  eventTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  location?: string;
  ubicacion?: string;
}

export interface EventFormData {
  nombre_evento: string;
  fecha_evento: string;
  hora_evento: string;
  ubicacion: string;
  comunidad_autonoma: string;
  facturacion: 'No' | 'Sí' | 'Anticipo';
  requiere_alta: boolean;
  tipo_evento: string;
  formato_banda: 'Banda' | 'Trío' | 'Dúo';
  cache_euros: number;
  anticipo_euros: number;
  persona_contacto: string;
  telefono_contacto: string;
  voz: 'Julio' | 'Sustituto';
  guitarra: 'Santi' | 'Sustituto';
  bajo: 'Pablo' | 'Sustituto';
  bateria: 'Javi' | 'Sustituto';
  comentarios: string;
}

export interface EventSortOptions {
  field: 'fecha_evento' | 'cache_euros' | 'ubicacion' | 'tipo_evento';
  direction: 'asc' | 'desc';
}

// Tipos para estadísticas
export interface DashboardStats {
  eventos_mes: number;
  ingresos_totales: number;
  ingresos_pendientes: number;
  proximos_eventos: Event[];
}

// Tipos para geolocalización
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeolocationResult {
  coordinates: Coordinates;
  address: string;
  comunidad_autonoma: string;
}

// Tipos para la API de Supabase
export interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
}