import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Calendar, Users, Music, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import SessionAlert from './SessionAlert'

const Layout: React.FC = () => {
  const location = useLocation()
  const { profile, user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const navigationItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: Calendar,
      description: 'Eventos y calendario'
    },
    {
      path: '/users',
      label: 'Usuarios',
      icon: Users,
      description: 'Gestión de usuarios'
    },
    {
      path: '/songs',
      label: 'Canciones',
      icon: Music,
      description: 'Repertorio musical'
    }
  ]

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-[#FAF9ED]">
      {/* Session Alert */}
      <SessionAlert />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-[#2DB2CA]" />
              <h1 className="text-2xl font-bold text-gray-900">TriBeCa Band Management</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {profile?.full_name || user?.email}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-t border-gray-200">
            {navigationItems.map((item) => {
               const Icon = item.icon
               const isActive = isActivePath(item.path)
               
               return (
                 <Link
                   key={item.path}
                   to={item.path}
                   className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                     isActive
                       ? 'border-purple-500 text-purple-600'
                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                   }`}
                 >
                   <div className="flex items-center space-x-2">
                     <Icon className="h-4 w-4" />
                     <span>{item.label}</span>
                   </div>
                 </Link>
               )
             })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout