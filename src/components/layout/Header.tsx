import React, { useState } from 'react';
import { Bell, User, LogOut, Settings, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

export const Header: React.FC = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Debug log para verificar el perfil
  console.log('[Header DEBUG] Current profile:', profile);
  console.log('[Header DEBUG] Profile role:', profile?.role);
  console.log('[Header DEBUG] Profile full_name:', profile?.full_name);
  console.log('[Header DEBUG] Profile email:', profile?.email);
  console.log('[Header DEBUG] Profile object keys:', profile ? Object.keys(profile) : 'null');
  
  // Debug específico para el renderizado
  const displayRole = profile?.role || 'user';
  const displayName = profile?.full_name || 'Usuario';
  console.log('[Header DEBUG] Will display role:', displayRole);
  console.log('[Header DEBUG] Will display name:', displayName);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRefreshProfile = async () => {
    setIsRefreshing(true);
    console.log('[Header DEBUG] Manual refresh triggered');
    try {
      console.log('[Header DEBUG] Calling refreshProfile...');
      await refreshProfile();
      console.log('[Header DEBUG] refreshProfile completed');
    } catch (error) {
      console.error('[Header DEBUG] Error refreshing profile:', error);
    } finally {
      setIsRefreshing(false);
      console.log('[Header DEBUG] Refresh process finished');
    }
  };

  // Función de debug para limpiar caché
  const handleDebugClearCache = () => {
    console.log('[Header DEBUG] Clearing localStorage and forcing reload');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <header className="bg-contrast border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Gestión de Eventos Musicales
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Botón de debug temporal */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDebugClearCache}
            className="bg-red-100 border-red-300 text-red-700 hover:bg-red-200"
          >
            🐛 Clear Cache
          </Button>
          
          {/* Notificaciones */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-alert rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    {displayRole}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefreshProfile} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Actualizando...' : 'Actualizar Perfil'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};