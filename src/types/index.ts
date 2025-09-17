// Tipos principales para TriBeCa

// Tipos para ubicación geográfica
export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocationAddressComponents {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_2?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
}

export interface LocationData {
  // Datos básicos para mostrar
  formatted_address: string;

  // Coordenadas para mapas y funcionalidad avanzada
  coordinates: LocationCoordinates;

  // Componentes de dirección para búsquedas y filtros
  address_components: LocationAddressComponents;

  // Metadatos de Google Places
  place_id: string;
  place_types: string[];

  // Información adicional
  name?: string;
  vicinity?: string;

  // Metadatos del sistema
  created_at: string;
  source: 'google_places' | 'geoapify' | 'manual';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'musician';
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  event_date: string;
  contact_name: string;
  contact_phone: string;
  location?: LocationData | string; // Soporte para migración gradual
  event_types: string[];
  band_format: string;
  duration?: number; // Duración en minutos
  cache_amount: number;
  cache_includes_iva?: boolean;
  advance_amount: number;
  advance_includes_iva?: boolean;
  invoice_status: 'yes' | 'advance' | 'no';
  comments?: string;
  musicians_count?: number;
  musicians?: Record<string, string>;
  substitutes?: Record<string, string>; // Sustitutos por instrumento: { 'voz': 'Nombre Sustituto', 'guitarra': 'Otro Sustituto' }
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventFinancial {
  id: string;
  event_id: string;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  iva_percentage: number;
  iva_amount: number;
  created_at: string;
  updated_at: string;
}

export interface EventMusician {
  id: string;
  event_id: string;
  user_id: string;
  instrument: string;
  payment_amount: number;
  payment_status: 'pending' | 'paid';
  substitute_name?: string; // Nombre del sustituto para este músico/instrumento
  created_at: string;
  updated_at: string;
}

// Nuevo tipo para manejar sustitutos por instrumento
export interface EventSubstitute {
  instrument: 'voz' | 'guitarra' | 'bajo' | 'bateria';
  substitute_name: string;
}

// Tipo para el músico con información de sustituto
export interface MusicianWithSubstitute {
  id: string;
  name: string;
  instrument: 'voz' | 'guitarra' | 'bajo' | 'bateria';
  is_main: boolean;
  substitute_name?: string;
}

export interface BandFormat {
  id: string;
  name: string;
  min_musicians: number;
  max_musicians: number;
  base_price: number;
  created_at: string;
  updated_at: string;
}

// Tipos para formularios
export interface CreateEventForm {
  name: string;
  date: string;
  description?: string;
}

export interface EventFinancialForm {
  total_income: number;
  total_expenses: number;
  iva_percentage: number;
}

// Tipos para el dashboard
export interface DashboardStats {
  total_events: number;
  upcoming_events: number;
  total_revenue: number;
  pending_payments: number;
}

// Tipos para autenticación
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: User['role'];
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  role: User['role'];
}

// Tipos para canciones
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // Duración en segundos
  deezer_id?: string;
  preview_url?: string;
  album_cover?: string;
  added_by?: string;
  key_signature?: string; // Tono musical en notación inglesa
  created_at: string;
}

// Tipos para la API de Deezer
export interface DeezerTrack {
  id: string;
  title: string;
  title_short: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  preview: string;
  artist: {
    id: string;
    name: string;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
  };
  album: {
    id: string;
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
    cover_big: string;
    cover_xl: string;
  };
  type: string;
}

export interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

// Formulario para agregar canciones
export interface AddSongForm {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  deezer_id?: string;
  preview_url?: string;
  album_cover?: string;
  key_signature?: string; // Tono musical en notación inglesa
}