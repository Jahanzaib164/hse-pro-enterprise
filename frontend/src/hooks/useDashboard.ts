'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DashboardKpis, IncidentTrendPoint } from '@/types';

export function useDashboardKpis() {
  return useQuery<DashboardKpis>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/kpis');
      return data;
    },
  });
}

export function useIncidentTrend() {
  return useQuery<IncidentTrendPoint[]>({
    queryKey: ['dashboard', 'incident-trend'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/incident-trend');
      return data.data;
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/recent-activity');
      return data.data;
    },
  });
}
