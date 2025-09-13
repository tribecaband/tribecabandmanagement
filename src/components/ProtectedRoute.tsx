import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuthStore()
  
  console.log('🔒 ProtectedRoute state:', { user: !!user, profile: !!profile, loading })

  if (loading) {
    console.log('🔒 ProtectedRoute: still loading, showing spinner')
    return (
      <div className="min-h-screen bg-[#FAF9ED] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2DB2CA] mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#FAF9ED] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
            <button
              onClick={() => window.history.back()}
              className="bg-[#2DB2CA] text-white px-4 py-2 rounded-lg hover:bg-[#25a0b5] transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}