import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { firstValueFrom } from 'rxjs';

const API = '/api';

interface BackupMeta {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

@Component({
  selector: 'app-backup-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <h2 class="page-title">
        <mat-icon>backup</mat-icon>
        Backup &amp; Restore
      </h2>

      <!-- Info card -->
      <mat-card class="info-card">
        <mat-card-content>
          <div class="info-row">
            <mat-icon>schedule</mat-icon>
            <div>
              <strong>Automatic Daily Backup</strong>
              <p>The server automatically creates a compressed <code>.sql.gz</code> database backup every night at 02:00. The last 14 backups are retained automatically.</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Manual backup -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Manual Backup</mat-card-title>
          <mat-card-subtitle>Create and download a fresh database backup right now</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <button mat-raised-button color="primary" (click)="downloadBackup()" [disabled]="downloading()">
            @if (downloading()) {
              <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
              Creating backup…
            } @else {
              <ng-container>
                <mat-icon>cloud_download</mat-icon>
                Download Backup Now
              </ng-container>
            }
          </button>
        </mat-card-content>
      </mat-card>

      <!-- Restore (staging only) -->
      <mat-card class="restore-card">
        <mat-card-header>
          <mat-card-title>Restore Database</mat-card-title>
          <mat-card-subtitle>Upload a <code>.sql.gz</code> file to restore — <strong>staging environments only</strong></mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="restore-row">
            <input #fileInput type="file" accept=".sql.gz,application/gzip" style="display:none"
              (change)="onRestoreFileSelected($event)" />
            <button mat-stroked-button color="warn" (click)="fileInput.click()" [disabled]="restoring()">
              <mat-icon>restore</mat-icon>
              Choose .sql.gz &amp; Restore
            </button>
            @if (restoring()) {
              <mat-spinner diameter="24" style="margin-left:12px"></mat-spinner>
            }
          </div>
          <p class="warning-text">⚠️ This will overwrite the current database. Proceed only on staging.</p>
        </mat-card-content>
      </mat-card>

      <!-- Backup file list -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Available Backups</mat-card-title>
          <mat-card-subtitle>Stored on the server in the <code>backups/</code> folder</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <div class="spinner-center"><mat-spinner diameter="36"></mat-spinner></div>
          } @else if (backups().length === 0) {
            <p class="empty-text">No backups found yet. Run a manual backup or wait for the nightly job.</p>
          } @else {
            <table mat-table [dataSource]="backups()" class="full-width">
              <ng-container matColumnDef="filename">
                <th mat-header-cell *matHeaderCellDef>Filename</th>
                <td mat-cell *matCellDef="let row">{{ row.filename }}</td>
              </ng-container>
              <ng-container matColumnDef="size">
                <th mat-header-cell *matHeaderCellDef>Size</th>
                <td mat-cell *matCellDef="let row">{{ formatBytes(row.sizeBytes) }}</td>
              </ng-container>
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'medium' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 800px; }
    .page-title { display: flex; align-items: center; gap: 8px; font-size: 1.4rem; margin-bottom: 20px; }
    mat-card { margin-bottom: 16px; }
    .info-card { border-left: 4px solid #1d4ed8; }
    .info-row { display: flex; align-items: flex-start; gap: 12px; }
    .info-row mat-icon { color: #1d4ed8; margin-top: 2px; }
    .info-row p { margin: 4px 0 0; color: #6b7280; font-size: 0.875rem; }
    .restore-card { border-left: 4px solid #f59e0b; }
    .restore-row { display: flex; align-items: center; }
    .warning-text { margin: 10px 0 0; color: #b45309; font-size: 0.85rem; }
    .spinner-center { display: flex; justify-content: center; padding: 24px; }
    .empty-text { color: #9ca3af; font-style: italic; }
    .full-width { width: 100%; }
  `],
})
export class BackupSettingsComponent implements OnInit {
  loading = signal(true);
  downloading = signal(false);
  restoring = signal(false);
  backups = signal<BackupMeta[]>([]);
  displayedColumns = ['filename', 'size', 'createdAt'];

  constructor(private http: HttpClient, private snack: MatSnackBar) {}

  async ngOnInit(): Promise<void> {
    await this.loadBackups();
  }

  async loadBackups(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await firstValueFrom(this.http.get<BackupMeta[]>(`${API}/backup`));
      this.backups.set(list);
    } catch {
      this.snack.open('Failed to load backup list', 'Dismiss', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  async downloadBackup(): Promise<void> {
    this.downloading.set(true);
    try {
      const blob = await firstValueFrom(
        this.http.get(`${API}/backup/download`, { responseType: 'blob' }),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.sql.gz`;
      a.click();
      URL.revokeObjectURL(url);
      this.snack.open('Backup downloaded successfully', 'OK', { duration: 4000 });
      await this.loadBackups();
    } catch {
      this.snack.open('Backup failed — check server logs', 'Dismiss', { duration: 5000 });
    } finally {
      this.downloading.set(false);
    }
  }

  async onRestoreFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!confirm(`Are you sure you want to restore the database from "${file.name}"? This will overwrite all current data.`)) {
      return;
    }

    this.restoring.set(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await firstValueFrom(this.http.post(`${API}/backup/restore`, formData));
      this.snack.open('Database restored successfully', 'OK', { duration: 5000 });
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Restore failed — check server logs';
      this.snack.open(msg, 'Dismiss', { duration: 6000 });
    } finally {
      this.restoring.set(false);
      input.value = '';
    }
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
}
