import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import Login from './pages/Login';
import { LoginPage } from './pages/auth/LoginPage';
import AuthCallback from './pages/auth/AuthCallback';

import { DashboardPage } from './pages/dashboard/DashboardPage';
import EventsPage from './pages/events/EventsPage';
import EventListingPage from './pages/events/EventListingPage';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Crear cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});

// Componentes de páginas placeholder



import AccountingPage from './pages/accounting/AccountingPage';

import AdminPage from './pages/admin/AdminPage';



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="App">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={
                <ProtectedRoute requireAuth={false}>
                  <LoginPage />
                </ProtectedRoute>
              } />
              <Route path="/auth/callback" element={
                <ProtectedRoute requireAuth={false}>
                  <AuthCallback />
                </ProtectedRoute>
              } />

              
              {/* Rutas protegidas */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="events" element={
                  <ProtectedRoute requiredPermission="can_create_events">
                    <EventsPage />
                  </ProtectedRoute>
                } />
                <Route path="events/list" element={<EventListingPage />} />
                <Route path="accounting" element={
                  <ProtectedRoute requiredPermission="can_view_accounting">
                    <AccountingPage />
                  </ProtectedRoute>
                } />
                <Route path="admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPage />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* Ruta por defecto */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;