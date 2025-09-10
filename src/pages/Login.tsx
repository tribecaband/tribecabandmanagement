import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Music } from 'lucide-react'
import toast from 'react-hot-toast'

interface LoginForm {
  email: string
  password: string
}

interface PasswordChangeForm {
  newPassword: string
  confirmPassword: string
}

export default function Login() {
  const { user, signIn, updatePassword } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const loginForm = useForm<LoginForm>()
  const passwordForm = useForm<PasswordChangeForm>()

  // Redirect if already logged in
  if (user && !isChangingPassword) {
    return <Navigate to="/" replace />
  }

  const handleLogin = async (data: LoginForm) => {
    setLoading(true)
    const result = await signIn(data.email, data.password)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      // Check if it's first login (temporary password)
      if (data.password === 'temporal123') {
        setIsChangingPassword(true)
        toast.success('Bienvenido. Por favor, cambia tu contraseña temporal.')
      } else {
        toast.success('¡Bienvenido a TriBeCa!')
      }
    }
    setLoading(false)
  }

  const handlePasswordChange = async (data: PasswordChangeForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (data.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    const result = await updatePassword(data.newPassword)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Contraseña actualizada correctamente')
      setIsChangingPassword(false)
    }
    setLoading(false)
  }

  if (isChangingPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2DB2CA] to-[#E58483] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2DB2CA] rounded-full mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Cambiar Contraseña</h1>
            <p className="text-gray-600">Por favor, establece una nueva contraseña segura</p>
          </div>

          <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...passwordForm.register('newPassword', { required: 'La contraseña es requerida' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent transition-all"
                  placeholder="Ingresa tu nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                {...passwordForm.register('confirmPassword', { required: 'Confirma tu contraseña' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent transition-all"
                placeholder="Confirma tu nueva contraseña"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2DB2CA] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#25a0b5] focus:ring-2 focus:ring-[#2DB2CA] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2DB2CA] to-[#E58483] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2DB2CA] rounded-full mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">TriBeCa</h1>
          <p className="text-gray-600">Gestión de Eventos Musicales</p>
        </div>

        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              {...loginForm.register('email', { 
                required: 'El email es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent transition-all"
              placeholder="tu@email.com"
            />
            {loginForm.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...loginForm.register('password', { required: 'La contraseña es requerida' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent transition-all"
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {loginForm.formState.errors.password && (
              <p className="text-red-500 text-sm mt-1">{loginForm.formState.errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2DB2CA] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#25a0b5] focus:ring-2 focus:ring-[#2DB2CA] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>¿Problemas para acceder? Contacta al administrador</p>
        </div>
      </div>
    </div>
  )
}