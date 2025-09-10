import React, { useState, useEffect } from 'react'
import { Users as UsersIcon, Plus, Search, Edit, Trash2, Shield, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Profile } from '../lib/supabase'
import toast from 'react-hot-toast'

interface UserWithRole extends Profile {
  role: 'admin' | 'user'
}

const Users: React.FC = () => {
  const { profile } = useAuthStore()
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user' as 'admin' | 'user'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Simulate role assignment (in real app, this would come from database)
      const usersWithRoles = data.map(user => ({
        ...user,
        role: user.id === profile?.id ? 'admin' : 'user' as 'admin' | 'user'
      }))

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

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
      <div className="min-h-screen bg-[#FAF9ED] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2DB2CA] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9ED] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UsersIcon className="h-8 w-8 text-[#2DB2CA]" />
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            </div>
            <button
              onClick={() => {
                setEditingUser(null)
                setFormData({ full_name: '', email: '', role: 'user' })
                setShowModal(true)
              }}
              className="bg-[#2DB2CA] hover:bg-[#2DB2CA]/90 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
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
                        <div className="h-10 w-10 rounded-full bg-[#2DB2CA] flex items-center justify-center">
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
                            ? 'bg-[#2DB2CA]/10 text-[#2DB2CA]'
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
                          className="text-[#2DB2CA] hover:text-[#2DB2CA]/80 p-1"
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron usuarios con ese criterio de búsqueda.' : 'Comienza agregando un nuevo usuario.'}
            </p>
          </div>
        )}
      </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2DB2CA] focus:border-transparent"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2DB2CA] hover:bg-[#2DB2CA]/90 rounded-md transition-colors"
                >
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users