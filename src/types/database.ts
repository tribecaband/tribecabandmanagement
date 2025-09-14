// Tipos generados automáticamente por Supabase
// Este archivo debe actualizarse cuando se modifique el esquema de la base de datos

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'manager' | 'musician';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'manager' | 'musician';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'manager' | 'musician';
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          date: string;
          venue: string;
          description: string | null;
          status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          venue: string;
          description?: string | null;
          status?: 'draft' | 'confirmed' | 'completed' | 'cancelled';
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          venue?: string;
          description?: string | null;
          status?: 'draft' | 'confirmed' | 'completed' | 'cancelled';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_financials: {
        Row: {
          id: string;
          event_id: string;
          total_income: number;
          total_expenses: number;
          net_profit: number;
          iva_percentage: number;
          iva_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          total_income: number;
          total_expenses: number;
          net_profit: number;
          iva_percentage: number;
          iva_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          total_income?: number;
          total_expenses?: number;
          net_profit?: number;
          iva_percentage?: number;
          iva_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_musicians: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          instrument: string;
          payment_amount: number;
          payment_status: 'pending' | 'paid';
          substitute_name?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          instrument: string;
          payment_amount: number;
          payment_status?: 'pending' | 'paid';
          substitute_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          instrument?: string;
          payment_amount?: number;
          payment_status?: 'pending' | 'paid';
          substitute_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      band_formats: {
        Row: {
          id: string;
          name: string;
          min_musicians: number;
          max_musicians: number;
          base_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          min_musicians: number;
          max_musicians: number;
          base_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          min_musicians?: number;
          max_musicians?: number;
          base_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}