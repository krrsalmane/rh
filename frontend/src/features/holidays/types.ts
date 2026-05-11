export interface PublicHoliday {
  id: string;
  companyId: string;
  name: string;
  date: string;
  year: number;
  isRecurring: boolean;
}

export interface CreatePublicHolidayDto {
  name: string;
  date: string;
  year: number;
  isRecurring?: boolean;
}

export type UpdatePublicHolidayDto = Partial<CreatePublicHolidayDto>;
