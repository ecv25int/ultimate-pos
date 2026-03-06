export interface CrmCampaign {
  id: number;
  businessId: number;
  name: string;
  campaignType: 'email' | 'sms';
  subject: string | null;
  emailBody: string | null;
  smsBody: string | null;
  sentOn: string | null;
  contactIds: string;
  status: 'draft' | 'sent' | 'scheduled';
  createdBy: number;
}

export interface CrmSchedule {
  id: number;
  businessId: number;
  contactId: number;
  title: string;
  status: 'pending' | 'completed' | 'cancelled';
  startDatetime: string;
  endDatetime: string;
  description: string | null;
  scheduleType: 'call' | 'sms' | 'meeting' | 'email';
  createdBy: number;
  contact?: { id: number; name: string; mobile: string };
}

export interface CrmCallLog {
  id: number;
  businessId: number;
  contactId: number | null;
  userId: number | null;
  callType: 'inbound' | 'outbound' | 'missed';
  mobileNumber: string;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  note: string | null;
  createdBy: number;
  contact?: { id: number; name: string } | null;
}

export interface CallLogsPage {
  items: CrmCallLog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CrmDashboard {
  upcomingSchedules: CrmSchedule[];
  pendingCount: number;
  completedToday: number;
  recentCalls: CrmCallLog[];
}

export interface CreateCampaignDto {
  name: string;
  campaignType: 'email' | 'sms';
  subject?: string;
  emailBody?: string;
  smsBody?: string;
  contactIds: string;
}

export interface CreateScheduleDto {
  contactId: number;
  title: string;
  scheduleType: 'call' | 'sms' | 'meeting' | 'email';
  startDatetime: string;
  endDatetime: string;
  description?: string;
}

export interface UpdateScheduleDto {
  title?: string;
  scheduleType?: string;
  startDatetime?: string;
  endDatetime?: string;
  description?: string;
  status?: string;
}

export interface CreateCallLogDto {
  contactId?: number;
  callType: 'inbound' | 'outbound' | 'missed';
  mobileNumber: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  note?: string;
}
