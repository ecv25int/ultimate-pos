export interface EssentialsLeaveType {
  id: number;
  leaveType: string;
  maxLeaveCount?: number;
  leaveCountInterval?: 'month' | 'year';
  businessId: number;
}

export interface EssentialsLeave {
  id: number;
  essentialsLeaveTypeId?: number;
  businessId: number;
  userId: number;
  startDate: string;
  endDate: string;
  refNo?: string;
  status?: 'pending' | 'approved' | 'cancelled';
  reason?: string;
  statusNote?: string;
  leaveType?: EssentialsLeaveType;
}

export interface EssentialsPayroll {
  id: number;
  userId: number;
  businessId: number;
  refNo?: string;
  month: number;
  year: number;
  duration: number;
  durationUnit: string;
  amountPerUnitDuration: number;
  allowances?: string;
  deductions?: string;
  grossAmount: number;
  createdBy: number;
}

export interface EssentialsDocument {
  id: number;
  businessId: number;
  userId: number;
  type?: string;
  name: string;
  description?: string;
}

export interface EssentialsReminder {
  id: number;
  businessId: number;
  userId: number;
  name: string;
  date: string;
  time: string;
  repeat: 'one_time' | 'every_day' | 'every_week' | 'every_month';
}

export interface EssentialsDashboard {
  pendingLeaves: number;
  myApprovedLeaves: number;
  myPayrolls: number;
  upcomingReminders: number;
}

export interface CreateLeaveTypeDto { leaveType: string; maxLeaveCount?: number; leaveCountInterval?: string; }
export interface CreateLeaveDto { essentialsLeaveTypeId?: number; userId: number; startDate: string; endDate: string; reason?: string; }
export interface UpdateLeaveStatusDto { status: 'pending' | 'approved' | 'cancelled'; statusNote?: string; }
export interface CreatePayrollDto { userId: number; month: number; year: number; duration: number; durationUnit: string; amountPerUnitDuration: number; grossAmount: number; allowances?: string; deductions?: string; }
export interface CreateDocumentDto { userId: number; name: string; type?: string; description?: string; }
export interface CreateReminderDto { name: string; date: string; time: string; repeat: string; }
