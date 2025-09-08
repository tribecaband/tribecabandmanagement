import React, { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Euro, Users, TrendingUp, Clock } from 'lucide-react';
import CalendarComponent from '../../components/Calendar';
import SpainMap from '../../components/SpainMap';
import { useEvents, useUpcomingEvents, useDashboardStats } from '../../hooks/useEvents';
import type { Event } from '../../types';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color: string;
}> = ({ title, value, icon: Icon, trend, color }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { events, loading: eventsLoading } = useEvents();
  const { events: upcomingEvents, loading: upcomingLoading } = useUpcomingEvents(5);
  const { stats, loading: statsLoading } = useDashboardStats();

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleLocationClick = (location: string, locationEvents: Event[]) => {
    console.log(`Clicked on ${location} with ${locationEvents.length} events`);
  };

  if (statsLoading || eventsLoading || upcomingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de la actividad de TribeCa Band</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Eventos"
          value={stats.totalEvents}
          icon={CalendarIcon}
          trend="+12% este mes"
          color="bg-primary"
        />
        <StatCard
          title="Próximos Eventos"
          value={stats.upcomingEvents}
          icon={Clock}
          color="bg-secondary"
        />
        <StatCard
          title="Ingresos Totales"
          value={`€${stats.totalRevenue.toLocaleString()}`}
          icon={Euro}
          trend="+8% este mes"
          color="bg-green-500"
        />
        <StatCard
          title="Pagos Pendientes"
          value={`€${stats.pendingPayments.toLocaleString()}`}
          icon={Users}
          color="bg-yellow-500"
        />
      </div>

      {/* Calendar and Map */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CalendarComponent 
          events={events} 
          onEventClick={handleEventClick}
        />
        <SpainMap 
          events={events} 
          onLocationClick={handleLocationClick}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Próximos Eventos</h2>
          </div>
          <div className="p-6">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay eventos próximos</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{event.nombre_evento}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>
                          {new Date(event.fecha_evento).toLocaleDateString('es-ES')}
                        </span>
                        <MapPin className="h-4 w-4 ml-3 mr-1" />
                        <span>
                          {event.ubicacion}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">€{event.cache_euros}</p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          event.facturacion === 'Sí'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {event.facturacion === 'Sí' ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen Financiero */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Resumen Financiero</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ingresos este mes</span>
                <span className="font-semibold text-green-600">€4,200</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gastos este mes</span>
                <span className="font-semibold text-red-600">€1,800</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Beneficio neto</span>
                  <span className="font-bold text-green-600">€2,400</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">70% del objetivo mensual</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Miembros de la banda */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Miembros de TribeCa</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Julio', role: 'Vocalista', instrument: '🎤' },
              { name: 'Santi', role: 'Guitarrista', instrument: '🎸' },
              { name: 'Pablo', role: 'Bajista', instrument: '🎸' },
              { name: 'Javi', role: 'Batería', instrument: '🥁' },
            ].map((member) => (
              <div key={member.name} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">{member.instrument}</div>
                <h3 className="font-medium text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};