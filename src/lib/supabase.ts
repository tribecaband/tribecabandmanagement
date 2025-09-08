import { createClient } from '@supabase/supabase-js';

// Variables de entorno para Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
  );
}

// Cliente de Supabase con configuración optimizada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Deshabilitado para manejar manualmente las invitaciones
    flowType: 'pkce' // Usar PKCE para mejor rendimiento
  },
  global: {
    headers: {
      'x-client-info': 'tribeca-band-management'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Tipos de la base de datos
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          nombre_evento: string;
          fecha_evento: string;
          hora_evento: string;
          ubicacion: string;
          latitud: number | null;
          longitud: number | null;
          comunidad_autonoma: string | null;
          facturacion: 'No' | 'Sí' | 'Anticipo';
          requiere_alta: boolean;
          tipo_evento: string | null;
          formato_banda: 'Banda' | 'Trío' | 'Dúo';
          cache_euros: number;
          anticipo_euros: number;
          persona_contacto: string | null;
          telefono_contacto: string | null;
          voz: 'Julio' | 'Sustituto';
          guitarra: 'Santi' | 'Sustituto';
          bajo: 'Pablo' | 'Sustituto';
          bateria: 'Javi' | 'Sustituto';
          comentarios: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre_evento: string;
          fecha_evento: string;
          hora_evento: string;
          ubicacion: string;
          latitud?: number | null;
          longitud?: number | null;
          comunidad_autonoma?: string | null;
          facturacion?: 'No' | 'Sí' | 'Anticipo';
          requiere_alta?: boolean;
          tipo_evento?: string | null;
          formato_banda?: 'Banda' | 'Trío' | 'Dúo';
          cache_euros?: number;
          anticipo_euros?: number;
          persona_contacto?: string | null;
          telefono_contacto?: string | null;
          voz?: 'Julio' | 'Sustituto';
          guitarra?: 'Santi' | 'Sustituto';
          bajo?: 'Pablo' | 'Sustituto';
          bateria?: 'Javi' | 'Sustituto';
          comentarios?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre_evento?: string;
          fecha_evento?: string;
          hora_evento?: string;
          ubicacion?: string;
          latitud?: number | null;
          longitud?: number | null;
          comunidad_autonoma?: string | null;
          facturacion?: 'No' | 'Sí' | 'Anticipo';
          requiere_alta?: boolean;
          tipo_evento?: string | null;
          formato_banda?: 'Banda' | 'Trío' | 'Dúo';
          cache_euros?: number;
          anticipo_euros?: number;
          persona_contacto?: string | null;
          telefono_contacto?: string | null;
          voz?: 'Julio' | 'Sustituto';
          guitarra?: 'Santi' | 'Sustituto';
          bajo?: 'Pablo' | 'Sustituto';
          bateria?: 'Javi' | 'Sustituto';
          comentarios?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_types: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      user_permissions: {
        Row: {
          id: string;
          user_id: string;
          can_create_events: boolean;
          can_edit_events: boolean;
          can_delete_events: boolean;
          can_view_accounting: boolean;
          can_manage_users: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          can_create_events?: boolean;
          can_edit_events?: boolean;
          can_delete_events?: boolean;
          can_view_accounting?: boolean;
          can_manage_users?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          can_create_events?: boolean;
          can_edit_events?: boolean;
          can_delete_events?: boolean;
          can_view_accounting?: boolean;
          can_manage_users?: boolean;
          updated_at?: string;
        };
      };
    };
  };
};