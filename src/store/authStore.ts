import { create } from 'zustand'
import { supabase, type Profile } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error?: string }>
  fetchProfile: () => Promise<void>
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
        set({ user: data.user })
        await get().fetchProfile()
      }

      return {}
    } catch (error) {
      return { error: 'Error inesperado al iniciar sesión' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  updatePassword: async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'Error al actualizar la contraseña' }
    }
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
            role: user.user_metadata?.role || 'user',
            permissions: { create: false, edit: false, delete: false }
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          return
        }

        set({ profile: newProfile })
        return
      }

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      set({ profile: data })
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          set({ user: session.user })
          await get().fetchProfile()
        } else {
          set({ user: null, profile: null })
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set({ loading: false })
    }
  },
}))