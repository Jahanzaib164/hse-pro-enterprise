'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  DashboardKpis,
  IncidentTrendPoint,
  DashboardSummary,
  RiskMatrixPoint,
} from '@/types';

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard-summary');
      return data;
    },
  });
}

export function useRiskMatrix() {
  return useQuery<RiskMatrixPoint[]>({
    queryKey: ['dashboard', 'risk-matrix'],
    queryFn: async () => {
      const { data } = await api.get('/reports/risk-matrix-data');
      return data.data;
    },
  });
}

export function useTopOpenActions() {
  return useQuery({
    queryKey: ['dashboard', 'top-open-actions'],
    queryFn: async () => {
      const { data } = await api.get('/corrective-actions', {
        params: { status: 'OPEN', limit: 5 },
      });
      return (data.data || data.items || data) as any[];
    },
  });
}

export function useExpiringPermits() {
  return useQuery({
    queryKey: ['dashboard', 'expiring-permits'],
    queryFn: async () => {
      const { data } = await api.get('/permits', {
        params: { status: 'ACTIVE', limit: 50 },
      });
      return (data.data || data.items || data) as any[];
    },
  });
}

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
      const { data } = await api.get('/reports/incident-trend');
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
