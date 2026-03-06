import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  /** Stream of unread notification count, polled every 60 seconds */
  readonly unreadCount$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  /** Begin polling for unread count (call once from AppComponent or layout) */
  startPolling(intervalMs = 60_000): void {
    timer(0, intervalMs)
      .pipe(switchMap(() => this.getUnreadCount()))
      .subscribe({
        next: (res) => this.unreadCount$.next(res.count),
        error: () => {}, // silent fail
      });
  }

  getAll(params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Observable<NotificationListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.unreadOnly) queryParams['unreadOnly'] = 'true';
    if (params?.page) queryParams['page'] = String(params.page);
    if (params?.limit) queryParams['limit'] = String(params.limit);

    return this.http.get<NotificationListResponse>(this.apiUrl, {
      params: queryParams,
    });
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(
      `${this.apiUrl}/mark-all-read`,
      {},
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  clearAll(): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${this.apiUrl}/clear-all`);
  }

  triggerLowStockCheck(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/low-stock-check`,
      {},
    );
  }

  getEmailStatus(): Observable<{ configured: boolean; provider: string | null; from: string | null }> {
    return this.http.get<{ configured: boolean; provider: string | null; from: string | null }>(
      `${this.apiUrl}/email-status`,
    );
  }

  sendTestEmail(): Observable<{ sent: boolean; configured: boolean; reason?: string }> {
    return this.http.post<{ sent: boolean; configured: boolean; reason?: string }>(
      `${this.apiUrl}/send-test-email`,
      {},
    );
  }

  /** Decrement local unread count after marking one as read */
  decrementUnread(): void {
    const current = this.unreadCount$.value;
    if (current > 0) this.unreadCount$.next(current - 1);
  }

  /** Reset local unread count to 0 after mark-all-read */
  resetUnread(): void {
    this.unreadCount$.next(0);
  }
}
