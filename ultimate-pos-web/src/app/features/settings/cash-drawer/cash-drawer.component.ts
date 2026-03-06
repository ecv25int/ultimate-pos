import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

const API = '/api';

@Component({
  selector: 'app-cash-drawer-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="cash-drawer-container">
      <h2 class="page-title">
        <mat-icon>point_of_sale</mat-icon>
        Cash Drawer
      </h2>
      <p class="subtitle">
        Configure the cash drawer connected to your POS terminal.
        Supports network printers / drawers via TCP and local serial ports (COM / USB).
      </p>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <!-- Config card -->
        <mat-card class="config-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>settings_ethernet</mat-icon>
            <mat-card-title>Connection Settings</mat-card-title>
            <mat-card-subtitle>
              Network drawer: enter the IP address and TCP port (typically 9100).<br>
              Serial/USB drawer: enter the device path (e.g. <code>/dev/ttyUSB0</code>
              or <code>COM3</code>) and leave the port field empty.
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline" class="field-host">
                <mat-label>Host / Port / Device path</mat-label>
                <input
                  matInput
                  [(ngModel)]="host"
                  placeholder="192.168.1.100  or  /dev/ttyUSB0  or  COM3"
                />
                <mat-hint>IP address for network printer, or serial path for USB drawer</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="field-port">
                <mat-label>TCP Port (optional)</mat-label>
                <input
                  matInput
                  type="number"
                  [(ngModel)]="port"
                  placeholder="9100"
                  min="1"
                  max="65535"
                />
                <mat-hint>Leave empty for serial/USB mode</mat-hint>
              </mat-form-field>
            </div>
          </mat-card-content>

          <mat-divider></mat-divider>

          <mat-card-actions align="end">
            <button
              mat-stroked-button
              color="accent"
              (click)="testDrawer()"
              [disabled]="testing() || !host"
              matTooltip="Sends a test pulse to the drawer using the current settings"
            >
              @if (testing()) {
                <mat-spinner diameter="16" style="display:inline-block;margin-right:6px"></mat-spinner>
              } @else {
                <mat-icon>play_circle</mat-icon>
              }
              Test Open
            </button>

            <button
              mat-flat-button
              color="primary"
              (click)="save()"
              [disabled]="saving()"
            >
              @if (saving()) {
                <mat-spinner diameter="16" style="display:inline-block;margin-right:6px"></mat-spinner>
              } @else {
                <mat-icon>save</mat-icon>
              }
              Save
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Status indicator -->
        <mat-card class="status-card" [class.configured]="!!host">
          <mat-card-content>
            <div class="status-row">
              <mat-icon [class.green]="!!host" [class.grey]="!host">
                {{ host ? 'check_circle' : 'radio_button_unchecked' }}
              </mat-icon>
              <span>
                Cash drawer is
                <strong>{{ host ? 'configured' : 'not configured' }}</strong>.
                @if (host) {
                  Mode: <strong>{{ port ? 'TCP ' + host + ':' + port : 'Serial ' + host }}</strong>
                }
              </span>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .cash-drawer-container {
      padding: 24px;
      max-width: 700px;
      margin: 0 auto;
    }
    .page-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 500;
    }
    .subtitle {
      color: #666;
      margin: 0 0 24px;
      font-size: 14px;
    }
    .loading-center {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .config-card, .status-card {
      margin-bottom: 20px;
    }
    .form-row {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .field-host { flex: 1 1 300px; }
    .field-port { flex: 0 1 160px; }
    mat-card-actions { padding: 12px 16px; gap: 8px; display: flex; }
    .status-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }
    .status-card.configured { border-left: 4px solid #4caf50; }
    mat-icon.green { color: #4caf50; }
    mat-icon.grey { color: #9e9e9e; }
  `],
})
export class CashDrawerSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  testing = signal(false);

  host = '';
  port: number | null = null;
  private businessId: number | null = null;

  ngOnInit() {
    this.http.get<any>(`${API}/business/my-business`).subscribe({
      next: (b) => {
        this.businessId = b.id;
        this.host = b.cashDrawerHost ?? '';
        this.port = b.cashDrawerPort ?? null;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load business settings', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  save() {
    if (!this.businessId) return;
    this.saving.set(true);

    const payload: any = {
      cashDrawerHost: this.host || null,
      cashDrawerPort: this.port ?? null,
    };

    this.http.patch(`${API}/business/${this.businessId}`, payload).subscribe({
      next: () => {
        this.snackBar.open('Cash drawer settings saved', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to save settings', 'Dismiss', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  testDrawer() {
    this.testing.set(true);
    this.http.post(`${API}/pos/cash-drawer/open`, {}).subscribe({
      next: () => {
        this.snackBar.open('Open command sent — drawer should have opened!', 'OK', { duration: 4000 });
        this.testing.set(false);
      },
      error: () => {
        this.snackBar.open('Test failed — check drawer connection and settings', 'Dismiss', { duration: 5000 });
        this.testing.set(false);
      },
    });
  }
}
