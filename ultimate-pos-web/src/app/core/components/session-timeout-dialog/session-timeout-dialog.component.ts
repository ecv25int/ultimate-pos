import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

export interface SessionTimeoutDialogData {
  warningSeconds: number;
}

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="timeout-dialog">
      <div class="timeout-header">
        <mat-icon color="warn">timer</mat-icon>
        <h2 mat-dialog-title>Session Expiring Soon</h2>
      </div>

      <mat-dialog-content>
        <p>Your session will expire due to inactivity.</p>
        <div class="countdown">
          <span class="countdown-time" [class.urgent]="remainingSeconds <= 60">
            {{ formattedTime }}
          </span>
          <span class="countdown-label">remaining</span>
        </div>
        <mat-progress-bar
          mode="determinate"
          [value]="progressValue"
          [color]="remainingSeconds <= 60 ? 'warn' : 'primary'"
        ></mat-progress-bar>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onLogout()">
          <mat-icon>logout</mat-icon>
          Logout
        </button>
        <button mat-raised-button color="primary" (click)="onStayLoggedIn()">
          <mat-icon>refresh</mat-icon>
          Stay Logged In
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .timeout-dialog {
      min-width: 340px;
      max-width: 420px;
    }

    .timeout-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 24px 0;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      h2 {
        margin: 0;
        font-size: 1.2rem;
      }
    }

    mat-dialog-content {
      padding: 16px 24px;

      p {
        margin-bottom: 16px;
        color: #555;
      }
    }

    .countdown {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;
    }

    .countdown-time {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1976d2;
      font-variant-numeric: tabular-nums;
      transition: color 0.3s;

      &.urgent {
        color: #f44336;
        animation: pulse 1s infinite;
      }
    }

    .countdown-label {
      font-size: 0.95rem;
      color: #888;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    mat-dialog-actions {
      padding: 8px 24px 16px;
      gap: 8px;

      button {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  `],
})
export class SessionTimeoutDialogComponent implements OnInit, OnDestroy {
  remainingSeconds: number;
  private sub?: Subscription;

  constructor(
    private dialogRef: MatDialogRef<SessionTimeoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SessionTimeoutDialogData,
  ) {
    this.remainingSeconds = data.warningSeconds;
  }

  ngOnInit(): void {
    this.sub = interval(1000)
      .pipe(take(this.data.warningSeconds))
      .subscribe({
        next: () => {
          this.remainingSeconds--;
          if (this.remainingSeconds <= 0) {
            this.dialogRef.close('timeout');
          }
        },
        complete: () => {
          if (this.remainingSeconds <= 0) {
            this.dialogRef.close('timeout');
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get formattedTime(): string {
    const m = Math.floor(this.remainingSeconds / 60);
    const s = this.remainingSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get progressValue(): number {
    return (this.remainingSeconds / this.data.warningSeconds) * 100;
  }

  onStayLoggedIn(): void {
    this.dialogRef.close('refresh');
  }

  onLogout(): void {
    this.dialogRef.close('logout');
  }
}
