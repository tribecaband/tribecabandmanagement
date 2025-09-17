import React, { useState, useEffect, useCallback } from 'react'
import { Users as UsersIcon, Plus, Search, Edit, Trash2, Shield, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Profile } from '../lib/supabase'
import { toast } from 'sonner'

interface UserWithRole extends Profile {
  role: 'admin' | 'user'
}

const Users: React.FC = () => {
  const { profile, user } = useAuthStore()
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user' as 'admin' | 'user'
  })

  useEffect(() => {
    // Wait for auth to be initialized before fetching
    if (user && profile) {
      const timeoutId = setTimeout(() => {
        fetchUsers()
      }, 100)
      return () => clearTimeout(timeoutId)
    } else {
      setLoading(false)
      setError('Debes estar autenticado para ver los usuarios')
    }
  }, [user, profile, retryCount])

  const fetchUsers = useCallback(async () => {
    if (!user || !profile) {
      setError('No hay sesión activa')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Verify session is still valid
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Sesión expirada. Inicia sesión nuevamente.')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching users:', fetchError)
        
        let errorMessage = 'Error al cargar usuarios'
        
        if (fetchError.code === '42501' || fetchError.message?.includes('permission denied')) {
          errorMessage = 'Sin permisos para acceder a los usuarios. Verifica tu sesión.'
          // Try to refresh the session
          const refreshSuccess = false
          if (refreshSuccess) {
            // Retry after refresh
            setTimeout(() => fetchUsers(), 1000)
            return
          }
        } else if (fetchError.code === 'PGRST116') {
          errorMessage = 'No tienes permisos para acceder a los usuarios. Contacta al administrador.'
        } else if (fetchError.message?.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet.'
        }
        
        setError(errorMessage)
        toast.error(errorMessage)
        return
      }

      // Simulate role assignment (in real app, this would come from database)
      const usersWithRoles = data.map(user => ({
        ...user,
        role: user.role || (user.id === profile?.id ? 'admin' : 'user') as 'admin' | 'user'
      }))

      setUsers(usersWithRoles)
      setError(null)
    } catch (error: any) {
      console.error('Exception fetching users:', error)
      let errorMessage = 'Error inesperado al cargar usuarios'
      
      if (error?.message?.includes('fetch') || error?.name === 'NetworkError') {
        errorMessage = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.'
      } else if (error?.message?.includes('auth') || error?.status === 401) {
        errorMessage = 'Error de autenticación. Inicia sesión nuevamente.'
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user, profile, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        // Update user
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name
          })
          .eq('id', editingUser.id)

        if (error) throw error
        toast.success('Usuario actualizado correctamente')
      } else {
        // In a real app, you would create a new user through Supabase Auth
        toast('La creación de usuarios se implementaría con Supabase Auth')
      }

      setShowModal(false)
      setEditingUser(null)
      setFormData({ full_name: '', email: '', role: 'user' })
      fetchUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Error al guardar usuario')
    }
  }

  const handleEdit = (user: UserWithRole) => {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role
    })
    setShowModal(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      toast.success('Usuario eliminado correctamente')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error al eliminar usuario')
    }
  }

  const toggleRole = async (user: UserWithRole) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    
    // In a real app, you would update the role in the database
    toast(`Rol cambiado a ${newRole} (simulado)`)
    
    // Update local state for demo
    setUsers(users.map(u => 
      u.id === user.id ? { ...u, role: newRole } : u
    ))
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
          {!user && (
            <p className="text-sm text-gray-500 mt-2">Esperando autenticación...</p>
          )}
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
          >
            Recargar página
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <UsersIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-red-700 font-medium mb-2">Error al cargar usuarios</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => {
              setRetryCount(prev => prev + 1)
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
          >            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UsersIcon className="h-8 w-8 text-purple-500" />
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            </div>
            <button
              onClick={() => {
                setEditingUser(null)
                setFormData({ full_name: '', email: '', role: 'user' })
                setShowModal(true)
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'Sin nombre'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRole(user)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <ShieldCheck className="h-3 w-3 mr-1" />
                        ) : (
                          <Shield className="h-3 w-3 mr-1" />
                        )}
                        {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-purple-500 hover:text-purple-600 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {user.id !== profile?.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && !error && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron usuarios con ese criterio de búsqueda.' : 'Comienza agregando un nuevo usuario.'}
            </p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingUser(null)
                    setFormData({ full_name: '', email: '', role: 'user' })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
                >
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;