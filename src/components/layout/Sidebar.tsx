import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  List,
  Calculator,
  Settings,
  Music,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission?: string;
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/events',
    icon: Calendar,
    label: 'Eventos',
  },
  {
    to: '/events/list',
    icon: List,
    label: 'Listado',
  },
  {
    to: '/accounting',
    icon: Calculator,
    label: 'Contabilidad',
    permission: 'can_view_accounting',
  },
  {
    to: '/admin',
    icon: Settings,
    label: 'Administración',
    permission: 'can_manage_users',
  },
];

export const Sidebar: React.FC = () => {
  const { hasPermission, isAdmin } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return isAdmin || hasPermission(item.permission as any);
  });

  return (
    <aside className="w-64 bg-contrast shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Music className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">TribeCa</h1>
            <p className="text-sm text-gray-600">Band Management</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        <ul className="space-y-1 px-3">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-contrast'
                        : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="bg-primary/5 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-gray-900">Miembros</p>
              <p className="text-xs text-gray-600">
                🎤 Julio • 🎸 Santi • 🎸 Pablo • 🥁 Javi
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};