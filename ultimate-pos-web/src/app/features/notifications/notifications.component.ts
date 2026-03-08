import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from '../../core/services/notifications.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import {
  Notification,
  NOTIFICATION_ICON,
  NOTIFICATION_COLOR,
} from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="notif-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">notifications</mat-icon>
          <div>
            <h1>Notifications</h1>
            <p class="subtitle">Stay informed about your business activity</p>
          </div>
        </div>
        <div class="header-actions">
          <mat-slide-toggle [(ngModel)]="unreadOnly" (change)="onFilterChange()">
            Unread only
          </mat-slide-toggle>
          <button
            mat-stroked-button
            color="primary"
            (click)="markAllRead()"
            [disabled]="notifications().length === 0"
          >
            <mat-icon>done_all</mat-icon>
            Mark all read
          </button>
          <button
            mat-stroked-button
            color="warn"
            (click)="clearAll()"
            [disabled]="notifications().length === 0"
          >
            <mat-icon>delete_sweep</mat-icon>
            Clear all
          </button>
          <button
            mat-icon-button
            matTooltip="Check low stock"
            color="accent"
            (click)="triggerLowStockCheck()"
          >
            <mat-icon>inventory_2</mat-icon>
          </button>
        </div>
      </div>

      <!-- Notification list -->
      @if (isLoading()) {
        <div class="loading">
          <mat-spinner diameter="40" />
        </div>
      } @else if (notifications().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">notifications_none</mat-icon>
          <h3>No notifications</h3>
          <p>{{ unreadOnly ? 'No unread notifications.' : "You're all caught up!" }}</p>
        </div>
      } @else {
        <mat-card class="list-card">
          <mat-card-content>
            @for (n of notifications(); track n.id) {
              <div class="notif-item" [class.unread]="!n.isRead" (click)="onNotifClick(n)">
                <div class="notif-icon-wrap" [style.background]="notifColor(n.type) + '22'">
                  <mat-icon [style.color]="notifColor(n.type)">
                    {{ notifIcon(n.type) }}
                  </mat-icon>
                </div>
                <div class="notif-content">
                  <div class="notif-title">{{ n.title }}</div>
                  <div class="notif-message">{{ n.message }}</div>
                  <div class="notif-time">{{ formatDate(n.createdAt) }}</div>
                </div>
                <div class="notif-actions">
                  @if (!n.isRead) {
                    <button
                      mat-icon-button
                      matTooltip="Mark as read"
                      (click)="markRead(n, $event)"
                    >
                      <mat-icon>mark_email_read</mat-icon>
                    </button>
                  }
                  <button
                    mat-icon-button
                    matTooltip="Delete"
                    color="warn"
                    (click)="deleteNotif(n, $event)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              <mat-divider />
            }
          </mat-card-content>
        </mat-card>

        <mat-paginator
          [length]="total()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons
        />
      }

      <!-- Email Delivery Settings -->
      <div class="email-settings-card">
        <div class="email-settings-header">
          <mat-icon class="email-icon">email</mat-icon>
          <div>
            <h2>Email Delivery</h2>
            <p class="subtitle">Configure SMTP to receive notifications by email</p>
          </div>
        </div>

        <div class="email-status-row">
          <div class="status-indicator" [class.configured]="emailStatus?.configured" [class.not-configured]="emailStatus && !emailStatus.configured">
            <mat-icon>{{ emailStatus?.configured ? 'check_circle' : 'cancel' }}</mat-icon>
            <span>{{ emailStatus?.configured ? 'Email delivery is active' : 'Not configured — add SMTP settings to .env' }}</span>
          </div>

          <div class="smtp-details" *ngIf="emailStatus?.configured">
            <span class="detail-chip"><mat-icon inline>dns</mat-icon> {{ emailStatus?.provider }}</span>
            <span class="detail-chip"><mat-icon inline>alternate_email</mat-icon> {{ emailStatus?.from }}</span>
          </div>
        </div>

        <div class="email-info-box">
          <mat-icon>info</mat-icon>
          <div>
            <strong>What triggers email notifications?</strong>
            <ul>
              <li>Low stock alerts — emailed to all admin/manager users when stock drops below threshold</li>
              <li>Set SMTP vars in <code>.env</code>: <code>MAIL_HOST</code>, <code>MAIL_PORT</code>, <code>MAIL_USER</code>, <code>MAIL_PASS</code>, <code>MAIL_FROM</code></li>
              <li>SendGrid: use <code>host=smtp.sendgrid.net</code>, <code>user=apikey</code>, <code>pass=YOUR_SENDGRID_KEY</code></li>
            </ul>
          </div>
        </div>

        <div class="email-actions">
          <button mat-stroked-button (click)="loadEmailStatus()" [disabled]="loadingEmailStatus">
            <mat-icon>refresh</mat-icon>
            Refresh Status
          </button>
          <button mat-flat-button color="primary"
            (click)="sendTestEmail()"
            [disabled]="!emailStatus?.configured || sendingTestEmail">
            <mat-icon>send</mat-icon>
            {{ sendingTestEmail ? 'Sending…' : 'Send Test Email' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-title { display: flex; align-items: center; gap: 16px; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .loading { display: flex; justify-content: center; padding: 60px; }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #666;
    }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; display: block; margin: 0 auto 16px; }
    .empty-state h3 { margin: 0 0 8px; font-size: 20px; }

    .list-card { margin-bottom: 16px; }
    .list-card mat-card-content { padding: 0 !important; }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 14px 20px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .notif-item:hover { background: #f5f5f5; }
    .notif-item.unread { background: #f0f4ff; }

    .notif-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notif-content { flex: 1; min-width: 0; }
    .notif-title { font-weight: 500; font-size: 14px; margin-bottom: 2px; }
    .notif-item.unread .notif-title { font-weight: 700; }
    .notif-message { font-size: 13px; color: #555; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-time { font-size: 12px; color: #999; }

    .notif-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

    /* Email settings */
    .email-settings-card {
      margin-top: 28px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 24px;
    }
    .email-settings-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
    .email-icon { font-size: 36px; width: 36px; height: 36px; color: #2563eb; margin-top: 2px; }
    .email-settings-header h2 { margin: 0 0 4px; font-size: 18px; font-weight: 600; }
    .email-status-row { margin-bottom: 16px; }
    .status-indicator { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 500; margin-bottom: 10px; }
    .status-indicator.configured { color: #059669; }
    .status-indicator.not-configured { color: #dc2626; }
    .smtp-details { display: flex; gap: 12px; flex-wrap: wrap; }
    .detail-chip { display: inline-flex; align-items: center; gap: 4px; background: #f3f4f6; padding: 4px 10px; border-radius: 20px; font-size: 13px; color: #374151; }
    .email-info-box { display: flex; gap: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; font-size: 13px; color: #1e40af; }
    .email-info-box mat-icon { color: #2563eb; flex-shrink: 0; margin-top: 2px; }
    .email-info-box ul { margin: 6px 0 0; padding-left: 18px; }
    .email-info-box li { margin-bottom: 4px; }
    .email-info-box code { background: #dbeafe; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
    .email-actions { display: flex; gap: 12px; align-items: center; }
  `],
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  total = signal(0);
  isLoading = signal(true);

  unreadOnly = false;
  page = 1;
  pageSize = 20;

  emailStatus: { configured: boolean; provider: string | null; from: string | null } | null = null;
  loadingEmailStatus = false;
  sendingTestEmail = false;

  readonly notifIcon = (type: string) =>
    NOTIFICATION_ICON[type as keyof typeof NOTIFICATION_ICON] ?? 'notifications';
  readonly notifColor = (type: string) =>
    NOTIFICATION_COLOR[type as keyof typeof NOTIFICATION_COLOR] ?? '#9e9e9e';

  constructor(
    private notifService: NotificationsService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.load();
    this.loadEmailStatus();
  }

  loadEmailStatus() {
    this.loadingEmailStatus = true;
    this.notifService.getEmailStatus().subscribe({
      next: (status) => {
        this.emailStatus = status;
        this.loadingEmailStatus = false;
      },
      error: () => { this.loadingEmailStatus = false; },
    });
  }

  sendTestEmail() {
    this.sendingTestEmail = true;
    this.notifService.sendTestEmail().subscribe({
      next: (res) => {
        this.sendingTestEmail = false;
        if (res.sent) {
          this.snackBar.open('Test email sent successfully!', 'OK', { duration: 4000 });
        } else if (!res.configured) {
          this.snackBar.open('SMTP not configured. Add MAIL_* vars to .env.', 'Close', { duration: 5000 });
        } else {
          this.snackBar.open(res.reason ?? 'Could not send test email.', 'Close', { duration: 5000 });
        }
      },
      error: () => {
        this.sendingTestEmail = false;
        this.snackBar.open('Failed to send test email.', 'Close', { duration: 4000 });
      },
    });
  }

  load() {
    this.isLoading.set(true);
    this.notifService
      .getAll({ unreadOnly: this.unreadOnly, page: this.page, limit: this.pageSize })
      .subscribe({
        next: (res) => {
          this.notifications.set(res.data);
          this.total.set(res.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onFilterChange() {
    this.page = 1;
    this.load();
  }

  onPageChange(ev: PageEvent) {
    this.page = ev.pageIndex + 1;
    this.pageSize = ev.pageSize;
    this.load();
  }

  onNotifClick(n: Notification) {
    if (!n.isRead) this.markRead(n);
    if (n.link) this.router.navigateByUrl(n.link);
  }

  markRead(n: Notification, event?: Event) {
    event?.stopPropagation();
    this.notifService.markAsRead(n.id).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
        );
        this.notifService.decrementUnread();
      },
    });
  }

  markAllRead() {
    this.notifService.markAllRead().subscribe({
      next: (res) => {
        this.notifications.update((list) => list.map((x) => ({ ...x, isRead: true })));
        this.notifService.resetUnread();
        this.snackBar.open(`${res.updated} notifications marked as read`, 'Dismiss', { duration: 3000 });
      },
    });
  }

  deleteNotif(n: Notification, event: Event) {
    event.stopPropagation();
    this.notifService.delete(n.id).subscribe({
      next: () => {
        this.notifications.update((list) => list.filter((x) => x.id !== n.id));
        this.total.update((t) => t - 1);
        if (!n.isRead) this.notifService.decrementUnread();
      },
    });
  }

  clearAll() {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Clear All', message: 'Delete all notifications?', confirmColor: 'warn' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.notifService.clearAll().subscribe({
        next: (res) => {
          this.notifications.set([]);
          this.total.set(0);
          this.notifService.resetUnread();
          this.snackBar.open(`${res.deleted} notifications cleared`, 'Dismiss', { duration: 3000 });
        },
      });
    });
  }

  triggerLowStockCheck() {
    this.notifService.triggerLowStockCheck().subscribe({
      next: () => {
        this.snackBar.open('Low stock check complete — reload to see new alerts', 'Reload', { duration: 5000 })
          .onAction().subscribe(() => this.load());
        this.load();
      },
    });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  }
}
