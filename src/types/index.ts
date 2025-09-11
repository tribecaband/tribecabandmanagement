// Tipos principales para TriBeCa

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
  location: string;
  contact_name: string;
  contact_phone: string;
  event_types: string[];
  band_format: string;
  cache_amount: number;
  advance_amount: number;
  invoice_status: 'yes' | 'advance' | 'no';
  comments?: string;
  musicians_count?: number;
  musicians?: Record<string, string>;
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
  created_at: string;
  updated_at: string;
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
  venue: string;
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