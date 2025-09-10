import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-2 text-gray-600">
          Personaliza tu experiencia en TriBeCa
        </p>
      </div>

      {/* Settings placeholder */}
      <div className="card">
        <div className="flex items-center justify-center h-96 text-center">
          <div>
            <SettingsIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Configuración del Sistema
            </h3>
            <p className="text-gray-500 mb-4">
              Aquí podrás configurar preferencias, notificaciones y más.
            </p>
            <p className="text-sm text-gray-400">
              Esta funcionalidad será implementada por el agente de desarrollo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;