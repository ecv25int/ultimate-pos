import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { PushNotificationService } from '../../../core/services/push-notification.service';

@Component({
  selector: 'app-push-notifications-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">
      <h2 class="page-title">
        <mat-icon>notifications_active</mat-icon>
        Push Notifications
      </h2>

      @if (loading()) {
        <div class="spinner-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <!-- Browser support card -->
        <mat-card class="status-card" [class.warning]="!browserSupported()">
          <mat-card-content>
            <div class="status-row">
              <mat-icon>{{ browserSupported() ? 'check_circle' : 'error' }}</mat-icon>
              <div>
                <strong>Browser Support</strong>
                <p>{{ browserSupported() ? 'Your browser supports push notifications.' : 'Your browser does not support push notifications or the service worker is not enabled (production builds only).' }}</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- VAPID server card -->
        <mat-card class="status-card" [class.warning]="!serverConfigured()">
          <mat-card-content>
            <div class="status-row">
              <mat-icon>{{ serverConfigured() ? 'cloud_done' : 'cloud_off' }}</mat-icon>
              <div>
                <strong>Server Configuration</strong>
                <p>{{ serverConfigured() ? 'VAPID keys are configured on the server.' : 'VAPID keys are not configured. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in the server .env file. Generate keys with: npx web-push generate-vapid-keys' }}</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Subscribe / Unsubscribe card -->
        <mat-card class="action-card">
          <mat-card-header>
            <mat-card-title>Browser Subscription</mat-card-title>
            <mat-card-subtitle>
              {{ isSubscribed() ? 'This browser is subscribed to push notifications.' : 'Subscribe to receive real-time alerts in this browser.' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="action-row">
              @if (isSubscribed()) {
                <mat-icon class="subscribed-icon">notifications_active</mat-icon>
                <span class="subscribed-label">Subscribed</span>
                <button mat-stroked-button color="warn" (click)="unsubscribe()" [disabled]="busy()">
                  <mat-icon>notifications_off</mat-icon>
                  Unsubscribe
                </button>
              } @else {
                <mat-icon class="unsubscribed-icon">notifications_off</mat-icon>
                <span class="unsubscribed-label">Not subscribed</span>
                <button mat-raised-button color="primary" (click)="subscribe()"
                  [disabled]="busy() || !browserSupported() || !serverConfigured()">
                  <mat-icon>add_alert</mat-icon>
                  Enable Push Notifications
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- What you'll receive -->
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>What triggers push notifications?</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="trigger-list">
              <div class="trigger-item">
                <mat-icon>point_of_sale</mat-icon>
                <span>New sale confirmed</span>
              </div>
              <mat-divider></mat-divider>
              <div class="trigger-item">
                <mat-icon>warning</mat-icon>
                <span>Low stock alert</span>
              </div>
              <mat-divider></mat-divider>
              <div class="trigger-item">
                <mat-icon>shopping_cart</mat-icon>
                <span>New purchase order created</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 700px; }
    .page-title { display: flex; align-items: center; gap: 8px; font-size: 1.4rem; margin-bottom: 20px; }
    .spinner-center { display: flex; justify-content: center; padding: 40px; }
    mat-card { margin-bottom: 16px; }
    .status-card.warning { border-left: 4px solid #f59e0b; }
    .status-row { display: flex; align-items: flex-start; gap: 12px; }
    .status-row mat-icon { margin-top: 2px; color: #16a34a; }
    .status-card.warning .status-row mat-icon { color: #f59e0b; }
    .status-row p { margin: 4px 0 0; color: #6b7280; font-size: 0.875rem; }
    .action-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .subscribed-icon { color: #16a34a; }
    .subscribed-label { color: #16a34a; font-weight: 500; flex: 1; }
    .unsubscribed-icon { color: #9ca3af; }
    .unsubscribed-label { color: #9ca3af; flex: 1; }
    .trigger-list { display: flex; flex-direction: column; gap: 0; }
    .trigger-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; }
    .trigger-item mat-icon { color: #1d4ed8; }
  `],
})
export class PushNotificationsSettingsComponent implements OnInit {
  loading = signal(true);
  busy = signal(false);
  browserSupported = signal(false);
  serverConfigured = signal(false);
  isSubscribed = signal(false);

  constructor(
    private pushService: PushNotificationService,
    private snack: MatSnackBar,
  ) {}

  async ngOnInit(): Promise<void> {
    this.browserSupported.set(this.pushService.isSupported);
    const [configured, subscribed] = await Promise.all([
      this.pushService.isServerConfigured(),
      this.pushService.isSubscribed(),
    ]);
    this.serverConfigured.set(configured);
    this.isSubscribed.set(subscribed);
    this.loading.set(false);
  }

  async subscribe(): Promise<void> {
    this.busy.set(true);
    const ok = await this.pushService.subscribe();
    this.busy.set(false);
    if (ok) {
      this.isSubscribed.set(true);
      this.snack.open('Push notifications enabled for this browser.', 'OK', { duration: 4000 });
    } else {
      this.snack.open('Could not enable push notifications. Check browser permissions.', 'Dismiss', { duration: 5000 });
    }
  }

  async unsubscribe(): Promise<void> {
    this.busy.set(true);
    await this.pushService.unsubscribe();
    this.isSubscribed.set(false);
    this.busy.set(false);
    this.snack.open('Push notifications disabled for this browser.', 'OK', { duration: 4000 });
  }
}
