import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Event, EventFilters } from '../types';

export const useEvents = (filters?: EventFilters) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('events')
      .select(`
        *,
        event_types (
          id,
          name,
          color
        )
      `)
      .order('date', { ascending: true });

    // Apply filters
    if (filters?.facturacion) {
      query = query.eq('facturacion', filters.facturacion);
    }

    if (filters?.ubicacion) {
      query = query.ilike('ubicacion', `%${filters.ubicacion}%`);
    }

    if (filters?.dateFrom) {
      query = query.gte('fecha_evento', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('fecha_evento', filters.dateTo);
    }
    if (filters?.eventTypeId) {
      query = query.eq('tipo_evento', filters.eventTypeId);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const refetch = () => {
    fetchEvents();
  };

  return {
    events,
    loading,
    error,
    refetch
  };
};

export const useUpcomingEvents = (limit: number = 5) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          event_types (
            id,
            name,
            color
          )
        `)
        .gte('fecha_evento', today)
        .order('fecha_evento', { ascending: true })
        .limit(limit);

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setEvents(data || []);
      setLoading(false);
    };

    fetchUpcomingEvents();
  }, [limit]);

  return {
    events,
    loading,
    error
  };
};

export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRevenue: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      // Fetch all events
      const { data: allEvents, error: allEventsError } = await supabase
        .from('events')
        .select('*');

      if (allEventsError) {
        setError(allEventsError.message);
        setLoading(false);
        return;
      }

      // Fetch upcoming events
      const { data: upcomingEventsData, error: upcomingError } = await supabase
        .from('events')
        .select('*')
        .gte('date', today);

      if (upcomingError) {
        setError(upcomingError.message);
        setLoading(false);
        return;
      }

      // Calculate stats
      const totalEvents = allEvents?.length || 0;
      const upcomingEvents = upcomingEventsData?.length || 0;
      
      const totalRevenue = allEvents
        ?.filter(event => event.status === 'confirmed')
        .reduce((sum, event) => sum + (event.fee || 0), 0) || 0;
      
      const pendingPayments = allEvents
        ?.filter(event => event.status === 'pending')
        .reduce((sum, event) => sum + (event.fee || 0), 0) || 0;

      setStats({
        totalEvents,
        upcomingEvents,
        totalRevenue,
        pendingPayments
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error
  };
};