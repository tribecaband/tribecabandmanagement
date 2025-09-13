import { create } from 'zustand'
import { supabase, type Profile } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        console.log('✅ SignIn successful, setting user:', data.user.email)
        set({ user: data.user })
        
        // Try to fetch profile in background, don't block login
        setTimeout(async () => {
          try {
            console.log('🔍 Attempting to fetch profile in background...')
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', data.user.email)
              .single()
            
            if (profileData) {
              console.log('✅ Profile loaded successfully')
              set({ profile: profileData })
            } else {
              console.log('⚠️ No profile data found')
            }
          } catch (profileError) {
            console.error('⚠️ Profile fetch failed (non-blocking):', profileError)
          }
        }, 100)
      }

      console.log('✅ SignIn completed successfully')
      return {}
    } catch (error) {
      console.error('❌ SignIn error:', error)
      return { error: 'Error inesperado al iniciar sesión' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  initialize: async () => {
    console.log('🚀 Initialize starting...')
    
    try {
      // Get current session if exists
      console.log('🔍 Checking for existing session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.log('⚠️ Error getting session:', error)
      } else if (session?.user) {
        console.log('✅ Found existing session for:', session.user.email)
        set({ user: session.user })
        
        // Try to get profile in background
        setTimeout(async () => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', session.user.email)
              .single()
            
            if (profileData) {
              set({ profile: profileData })
            }
          } catch (profileError) {
            console.log('⚠️ Profile fetch failed (non-blocking):', profileError)
          }
        }, 100)
      } else {
        console.log('ℹ️ No existing session found')
      }

      // Setup auth listener for future changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth event:', event)
        if (event === 'SIGNED_IN' && session?.user) {
          set({ user: session.user })
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null })
        }
      })
      
    } catch (error) {
      console.error('❌ Initialize error:', error)
    } finally {
      set({ loading: false })
      console.log('✅ Initialize completed')
    }
  },
}))