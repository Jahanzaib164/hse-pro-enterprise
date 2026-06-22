'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ListResponse } from '@/types';

export function useList<T>(
  base: string,
  params?: Record<string, string | number | undefined>
) {
  const clean: Record<string, string | number> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') clean[k] = v;
    }
  }
  return useQuery<ListResponse<T>>({
    queryKey: [base, 'list', clean],
    queryFn: async () => {
      const { data } = await api.get(base, { params: clean });
      return data;
    },
  });
}

export function useItem<T>(base: string, id?: string) {
  return useQuery<T>({
    queryKey: [base, 'item', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`${base}/${id}`);
      return data;
    },
  });
}

export function useCreate<T>(base: string) {
  const qc = useQueryClient();
  return useMutation<T, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post(base, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [base] });
    },
  });
}

export function useUpdate<T>(base: string) {
  const qc = useQueryClient();
  return useMutation<T, Error, { id: string; payload: Record<string, unknown> }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`${base}/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [base] });
    },
  });
}

export function useDelete(base: string) {
  const qc = useQueryClient();
  return useMutation<{ deleted: string }, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`${base}/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [base] });
    },
  });
}
