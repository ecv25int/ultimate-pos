import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';

interface SmsPreferences {
  lowStockAlert: boolean;
  saleConfirmation: boolean;
  paymentReminder: boolean;
}

const PREFS_KEY = 'sms_notification_prefs';

@Component({
  selector: 'app-sms-notifications-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="sms-settings-container">
      <h2 class="page-title">
        <mat-icon>sms</mat-icon>
        SMS Notifications
      </h2>
      <p class="subtitle">
        Configure SMS alerts sent via Twilio. Requires
        <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>, and
        <code>TWILIO_PHONE_NUMBER</code> set in the server environment.
      </p>

      <!-- Status card -->
      <mat-card class="status-card" [class.configured]="smsStatus().configured">
        <mat-card-content>
          <div class="status-row">
            <mat-icon [class.green]="smsStatus().configured" [class.red]="!smsStatus().configured">
              {{ smsStatus().configured ? 'check_circle' : 'cancel' }}
            </mat-icon>
            <span>
              Twilio is
              <strong>{{ smsStatus().configured ? 'configured and ready' : 'not configured' }}</strong>
              on the server.
            </span>
            @if (statusLoading()) {
              <mat-spinner diameter="20"></mat-spinner>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Notification toggles -->
      <mat-card class="prefs-card">
        <mat-card-header>
          <mat-card-title>Notification Types</mat-card-title>
          <mat-card-subtitle>Toggle which events trigger an SMS</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-label">Low Stock Alert</div>
              <div class="toggle-desc">
                Send an SMS to admin/manager users when a product falls below its alert quantity.
              </div>
            </div>
            <mat-slide-toggle [(ngModel)]="prefs.lowStockAlert" (change)="savePrefs()"></mat-slide-toggle>
          </div>

          <mat-divider></mat-divider>

          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-label">Sale Confirmation</div>
              <div class="toggle-desc">
                Send an SMS to the customer after a sale is completed (requires mobile number on the contact).
              </div>
            </div>
            <mat-slide-toggle [(ngModel)]="prefs.saleConfirmation" (change)="savePrefs()"></mat-slide-toggle>
          </div>

          <mat-divider></mat-divider>

          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-label">Payment Reminder</div>
              <div class="toggle-desc">
                Send an SMS reminder to customers with overdue invoices.
              </div>
            </div>
            <mat-slide-toggle [(ngModel)]="prefs.paymentReminder" (change)="savePrefs()"></mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Test SMS -->
      <mat-card class="test-card">
        <mat-card-header>
          <mat-card-title>Send Test SMS</mat-card-title>
          <mat-card-subtitle>Verify your Twilio configuration by sending a test message</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Mobile Number (E.164 format, e.g. +12025551234)</mat-label>
            <input matInput [(ngModel)]="testMobile" placeholder="+1234567890" />
            <mat-icon matSuffix>phone</mat-icon>
          </mat-form-field>
          <button
            mat-raised-button
            color="primary"
            [disabled]="!testMobile || testLoading() || !smsStatus().configured"
            (click)="sendTest()"
          >
            @if (testLoading()) {
              <mat-spinner diameter="18" style="display:inline-block"></mat-spinner>
            } @else {
              <mat-icon>send</mat-icon>
            }
            Send Test SMS
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .sms-settings-container {
      padding: 1.5rem;
      max-width: 1400px;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .subtitle {
      color: #666;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }

    .status-card {
      margin-bottom: 1.5rem;
      border-left: 4px solid #ef4444;
    }
    .status-card.configured {
      border-left-color: #22c55e;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .green { color: #22c55e; }
    .red { color: #ef4444; }

    .prefs-card {
      margin-bottom: 1.5rem;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;
      gap: 1rem;
    }

    .toggle-info {
      flex: 1;
    }

    .toggle-label {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .toggle-desc {
      font-size: 0.85rem;
      color: #666;
    }

    .test-card {
      margin-bottom: 1.5rem;
    }

    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }
  `],
})
export class SmsNotificationsSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  smsStatus = signal<{ configured: boolean }>({ configured: false });
  statusLoading = signal(true);
  testLoading = signal(false);
  testMobile = '';

  prefs: SmsPreferences = {
    lowStockAlert: true,
    saleConfirmation: true,
    paymentReminder: true,
  };

  ngOnInit(): void {
    this.loadPrefs();
    this.checkStatus();
  }

  private loadPrefs(): void {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) {
      try {
        this.prefs = { ...this.prefs, ...JSON.parse(saved) };
      } catch {
        // ignore corrupt storage
      }
    }
  }

  savePrefs(): void {
    localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs));
  }

  private checkStatus(): void {
    this.statusLoading.set(true);
    this.http
      .get<{ configured: boolean }>(`${environment.apiUrl}/notifications/sms/status`)
      .subscribe({
        next: (res) => {
          this.smsStatus.set(res);
          this.statusLoading.set(false);
        },
        error: () => this.statusLoading.set(false),
      });
  }

  sendTest(): void {
    if (!this.testMobile) return;
    this.testLoading.set(true);
    this.http
      .post(`${environment.apiUrl}/notifications/sms/test`, { mobile: this.testMobile })
      .subscribe({
        next: () => {
          this.testLoading.set(false);
          this.snackBar.open('Test SMS sent successfully!', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.testLoading.set(false);
          const msg = err?.error?.message ?? 'Failed to send SMS';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
        },
      });
  }
}
