import React from 'react';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';

const Calendar: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
          <p className="mt-2 text-gray-600">
            Gestiona todos tus eventos musicales
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nuevo Evento</span>
        </button>
      </div>

      {/* Calendar placeholder */}
      <div className="card">
        <div className="flex items-center justify-center h-96 text-center">
          <div>
            <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Calendario de Eventos
            </h3>
            <p className="text-gray-500 mb-4">
              Aquí se mostrará el calendario interactivo con todos tus eventos.
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

export default Calendar;