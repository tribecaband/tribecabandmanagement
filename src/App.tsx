import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Songs from './pages/Songs'
import Layout from './components/Layout'
import { useAuthStore } from './store/authStore'

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9ED] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2DB2CA] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const { initialize, loading } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        await initialize()
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#FAF9ED] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2DB2CA] mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="songs" element={<Songs />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#374151',
              border: '1px solid #e5e7eb',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
