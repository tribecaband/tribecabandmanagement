import React, { useState, useEffect } from 'react';
import { Euro, TrendingUp, TrendingDown, Calendar, FileText, Download, Filter } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { Event } from '../../types';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface FinancialSummary {
  totalRevenue: number;
  confirmedRevenue: number;
  pendingRevenue: number;
  advancePayments: number;
  totalEvents: number;
  confirmedEvents: number;
  pendingEvents: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  events: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

const AccountingPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date());
  
  const { events, loading } = useEvents();
  
  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'month':
        return {
          start: startOfMonth(selectedPeriod),
          end: endOfMonth(selectedPeriod)
        };
      case 'year':
        return {
          start: startOfYear(selectedPeriod),
          end: endOfYear(selectedPeriod)
        };
      case 'custom':
        return {
          start: startDate ? new Date(startDate) : startOfMonth(now),
          end: endDate ? new Date(endDate) : endOfMonth(now)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  // Filter events by date range
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.fecha_evento);
    const { start, end } = getDateRange();
    return eventDate >= start && eventDate <= end;
  });

  // Calculate financial summary
  const financialSummary: FinancialSummary = {
    totalRevenue: filteredEvents.reduce((sum, event) => sum + event.cache_euros, 0),
    confirmedRevenue: filteredEvents
      .filter(event => event.facturacion === 'Sí')
      .reduce((sum, event) => sum + event.cache_euros, 0),
    pendingRevenue: filteredEvents
      .filter(event => event.facturacion === 'No')
      .reduce((sum, event) => sum + event.cache_euros, 0),
    advancePayments: filteredEvents.reduce((sum, event) => sum + event.anticipo_euros, 0),
    totalEvents: filteredEvents.length,
    confirmedEvents: filteredEvents.filter(event => event.facturacion === 'Sí').length,
    pendingEvents: filteredEvents.filter(event => event.facturacion === 'No').length
  };

  // Generate monthly data for charts
  const generateMonthlyData = (): MonthlyData[] => {
    const monthsData: { [key: string]: { revenue: number; events: number } } = {};
    
    filteredEvents.forEach(event => {
      const monthKey = format(new Date(event.fecha_evento), 'MMM yyyy', { locale: es });
      if (!monthsData[monthKey]) {
        monthsData[monthKey] = { revenue: 0, events: 0 };
      }
      monthsData[monthKey].revenue += event.cache_euros;
      monthsData[monthKey].events += 1;
    });

    return Object.entries(monthsData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        events: data.events
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  // Generate status distribution data
  const statusData: StatusData[] = [
    {
      name: 'Confirmados',
      value: financialSummary.confirmedEvents,
      color: '#10B981'
    },
    {
      name: 'Pendientes',
      value: financialSummary.pendingEvents,
      color: '#F59E0B'
    },
    {
      name: 'Con Anticipo',
      value: filteredEvents.filter(event => event.facturacion === 'Anticipo').length,
      color: '#3B82F6'
    }
  ];

  const monthlyData = generateMonthlyData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const exportToCSV = () => {
    const csvData = filteredEvents.map(event => ({
      'Nombre del Evento': event.nombre_evento,
      'Fecha': format(new Date(event.fecha_evento), 'dd/MM/yyyy'),
      'Ubicación': event.ubicacion,
      'Caché': event.cache_euros,
      'Anticipo': event.anticipo_euros,
      'Estado': event.facturacion,
      'Formato': event.formato_banda,
      'Tipo': event.tipo_evento
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contabilidad_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contabilidad</h1>
          <p className="text-gray-600 mt-1">Resumen financiero y reportes</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Período:</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'month'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'year'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Año
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'custom'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Personalizado
            </button>
          </div>

          {dateRange !== 'custom' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newDate = dateRange === 'month' 
                    ? subMonths(selectedPeriod, 1)
                    : subYears(selectedPeriod, 1);
                  setSelectedPeriod(newDate);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <span className="font-medium text-gray-900 min-w-[120px] text-center">
                {dateRange === 'month'
                  ? format(selectedPeriod, 'MMMM yyyy', { locale: es })
                  : format(selectedPeriod, 'yyyy')
                }
              </span>
              <button
                onClick={() => {
                  const newDate = dateRange === 'month'
                    ? new Date(selectedPeriod.getFullYear(), selectedPeriod.getMonth() + 1, 1)
                    : new Date(selectedPeriod.getFullYear() + 1, 0, 1);
                  setSelectedPeriod(newDate);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
          )}

          {dateRange === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-gray-500">a</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialSummary.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Euro className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmados</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.confirmedRevenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(financialSummary.pendingRevenue)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Anticipos</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(financialSummary.advancePayments)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por Mes</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estado</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detalle de Eventos</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEvents.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caché
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anticipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{event.nombre_evento}</div>
                        <div className="text-sm text-gray-500">{event.formato_banda}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(event.fecha_evento), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.ubicacion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(event.cache_euros)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.anticipo_euros > 0 ? formatCurrency(event.anticipo_euros) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.facturacion === 'Sí'
                          ? 'bg-green-100 text-green-800'
                          : event.facturacion === 'Anticipo'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.facturacion === 'Sí' ? 'Confirmado' : event.facturacion === 'Anticipo' ? 'Anticipo' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos</h3>
              <p className="text-gray-600">No se encontraron eventos en el período seleccionado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingPage;