import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// @ts-ignore
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user'
  permissions: {
    create: boolean
    edit: boolean
    delete: boolean
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  name: string
  event_date: string
  location: string
  contact_name: string
  contact_phone: string
  comments?: string
  cache_amount: number
  cache_includes_iva: boolean
  advance_amount: number
  advance_includes_iva: boolean
  invoice_status: 'no' | 'yes' | 'advance'
  is_active: boolean
  event_types: string[]
  musicians: Record<string, string>
  band_format?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Musician {
  id: string
  name: string
  instrument: string
  is_main: boolean
  created_at: string
}