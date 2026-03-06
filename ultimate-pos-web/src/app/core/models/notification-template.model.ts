export interface NotificationTemplate {
  id: number;
  businessId: number;
  templateFor: string;
  emailBody?: string;
  smsBody?: string;
  subject?: string;
  autoSend: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationTemplateDto {
  templateFor: string;
  emailBody?: string;
  smsBody?: string;
  subject?: string;
  autoSend?: boolean;
}
