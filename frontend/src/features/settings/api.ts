import api from '@/shared/api/axiosInstance';
import type { UserFilters, CreateUserDto, UpdateUserDto } from './types';

export const usersApi = {
  getAll: (filters: UserFilters) =>
    api.get('/users', { params: filters }).then((r) => r.data),

  getById: (id: string) =>
    api.get(`/users/${id}`).then((r) => r.data),

  create: (data: CreateUserDto) =>
    api.post('/users', data).then((r) => r.data),

  update: (id: string, data: UpdateUserDto) =>
    api.put(`/users/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/users/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(`/users/${id}/reactivate`).then((r) => r.data),

  resetPassword: (id: string) =>
    api.patch(`/users/${id}/reset-password`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};

export const companyApi = {
  get: () => api.get('/settings').then((r) => r.data.data),
  update: (data: { name?: string; address?: string; logoUrl?: string; latitude?: number; longitude?: number }) =>
    api.put('/settings', data).then((r) => r.data.data),
};

export const holidaysApi = {
  getAll: () => api.get('/public-holidays').then((r) => r.data.data),
  create: (data: { name: string; date: string; year: number; isRecurring?: boolean }) =>
    api.post('/public-holidays', data).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/public-holidays/${id}`).then((r) => r.data),
};
