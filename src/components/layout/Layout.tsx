import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Calendar,
  Users,
  Settings,
  LogOut,
  Music,
  BarChart3,
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, signOut, forceSignOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleForceSignOut = async () => {
    await forceSignOut();
    // No necesitamos navigate porque forceSignOut recarga la página
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: BarChart3,
      current: location.pathname === '/',
    },
    {
      name: 'Calendario',
      href: '/calendar',
      icon: Calendar,
      current: location.pathname === '/calendar',
    },
    {
      name: 'Usuarios',
      href: '/users',
      icon: Users,
      current: location.pathname === '/users',
      adminOnly: true,
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings',
    },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="min-h-screen bg-tribeca-amarillo">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-tribeca-celeste" />
            <span className="text-xl font-bold text-gray-900">TriBeCa</span>
          </div>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`
                      group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${
                        item.current
                          ? 'bg-tribeca-celeste text-white'
                          : 'text-gray-700 hover:bg-tribeca-celeste/10 hover:text-tribeca-celeste'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-tribeca-celeste flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Botón de forzar logout para resolver sesiones atascadas */}
          <div className="mt-2">
            <button
              onClick={handleForceSignOut}
              className="w-full text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
              title="Usar solo si la sesión está atascada"
            >
              🔄 Forzar Logout Completo
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;