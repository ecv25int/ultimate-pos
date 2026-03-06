import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationTemplate, CreateNotificationTemplateDto } from '../models/notification-template.model';

@Injectable({ providedIn: 'root' })
export class NotificationTemplatesService {
  private apiUrl = `${environment.apiUrl}/notification-templates`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<NotificationTemplate[]> {
    return this.http.get<NotificationTemplate[]>(this.apiUrl);
  }

  getById(id: number): Observable<NotificationTemplate> {
    return this.http.get<NotificationTemplate>(`${this.apiUrl}/${id}`);
  }

  getByEvent(event: string): Observable<NotificationTemplate | null> {
    return this.http.get<NotificationTemplate>(`${this.apiUrl}/by-event`, {
      params: new HttpParams().set('event', event),
    });
  }

  create(dto: CreateNotificationTemplateDto): Observable<NotificationTemplate> {
    return this.http.post<NotificationTemplate>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<CreateNotificationTemplateDto>): Observable<NotificationTemplate> {
    return this.http.patch<NotificationTemplate>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
