export interface PjtProject {
  id: number;
  businessId: number;
  name: string;
  contactId?: number;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'cancelled' | 'completed';
  leadId?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  createdBy: number;
  createdAt: string;
  members?: PjtProjectMember[];
  tasks?: PjtTask[];
  _count?: { tasks: number };
}

export interface PjtProjectMember {
  id: number;
  projectId: number;
  userId: number;
}

export interface PjtTask {
  id: number;
  businessId: number;
  projectId: number;
  taskId: string;
  subject: string;
  startDate?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'cancelled' | 'completed';
  createdBy: number;
  createdAt: string;
  comments?: PjtTaskComment[];
  timeLogs?: PjtTimeLog[];
  _count?: { comments: number };
}

export interface PjtTimeLog {
  id: number;
  projectId: number;
  taskId?: number;
  userId: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  note?: string;
}

export interface PjtTaskComment {
  id: number;
  taskId: number;
  userId: number;
  comment: string;
  createdAt: string;
}

export interface ProjectDashboard {
  totalProjects: number;
  byStatus: Array<{ status: string; _count: number }>;
  overdueTasksCount: number;
}

export interface CreateProjectDto {
  name: string;
  contactId?: number;
  status?: string;
  leadId?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  memberUserIds?: number[];
}

export interface CreateTaskDto {
  projectId: number;
  subject: string;
  priority?: string;
  status?: string;
  startDate?: string;
  dueDate?: string;
  description?: string;
}

export interface CreateTimeLogDto {
  projectId: number;
  taskId?: number;
  startTime: string;
  endTime?: string;
  note?: string;
}
