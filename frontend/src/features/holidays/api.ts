import axiosInstance from '@/shared/api/axiosInstance';
import type { PublicHoliday, CreatePublicHolidayDto, UpdatePublicHolidayDto } from './types';

function mapHoliday(raw: Record<string, unknown>): PublicHoliday {
  return {
    id: raw.id as string,
    companyId: (raw.company_id ?? raw.companyId) as string,
    name: raw.name as string,
    date: raw.date as string,
    year: Number(raw.year),
    isRecurring: Boolean(raw.is_recurring ?? raw.isRecurring ?? false),
  };
}

export async function getPublicHolidays(year?: number) {
  const params: Record<string, number> = {};
  if (year) params.year = year;
  const { data } = await axiosInstance.get('/public-holidays', { params });
  return ((data.data as Record<string, unknown>[]) || []).map(mapHoliday);
}

export async function getPublicHolidayById(id: string) {
  const { data } = await axiosInstance.get(`/public-holidays/${id}`);
  return mapHoliday(data.data);
}

export async function createPublicHoliday(dto: CreatePublicHolidayDto) {
  const { data } = await axiosInstance.post('/public-holidays', dto);
  return mapHoliday(data.data);
}

export async function updatePublicHoliday(id: string, dto: UpdatePublicHolidayDto) {
  const { data } = await axiosInstance.put(`/public-holidays/${id}`, dto);
  return mapHoliday(data.data);
}

export async function deletePublicHoliday(id: string) {
  await axiosInstance.delete(`/public-holidays/${id}`);
}
