import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

const API = '/api';

interface ScheduledReport {
  id: number;
  name: string;
  reportType: string;
  frequency: string;
  recipients: string[];
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

const REPORT_TYPES = [
  { value: 'sales_summary', label: 'Sales Summary' },
  { value: 'profit_loss', label: 'Profit & Loss' },
  { value: 'inventory', label: 'Inventory Snapshot' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'contacts', label: 'New Contacts' },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Daily (at 06:00)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

@Component({
  selector: 'app-scheduled-reports-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">
          <mat-icon>event_repeat</mat-icon>
          Scheduled Reports
        </h2>
        <button mat-raised-button color="primary" (click)="showForm.set(true)" *ngIf="!showForm()">
          <mat-icon>add</mat-icon>
          New Schedule
        </button>
      </div>

      <!-- Create form -->
      @if (showForm()) {
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>{{ editing() ? 'Edit Schedule' : 'New Scheduled Report' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" class="report-form">
              <mat-form-field appearance="outline">
                <mat-label>Report Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g. Weekly Sales Summary" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Report Type</mat-label>
                <mat-select formControlName="reportType">
                  @for (rt of reportTypes; track rt.value) {
                    <mat-option [value]="rt.value">{{ rt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Frequency</mat-label>
                <mat-select formControlName="frequency">
                  @for (f of frequencies; track f.value) {
                    <mat-option [value]="f.value">{{ f.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <!-- Recipients -->
              <div class="recipients-section">
                <label class="recipients-label">Recipients</label>
                <div class="recipient-chips">
                  @for (email of recipientList(); track email) {
                    <mat-chip-set>
                      <mat-chip [removable]="true" (removed)="removeRecipient(email)">
                        {{ email }}
                        <mat-icon matChipRemove>cancel</mat-icon>
                      </mat-chip>
                    </mat-chip-set>
                  }
                </div>
                <div class="add-recipient-row">
                  <mat-form-field appearance="outline" class="recipient-input">
                    <mat-label>Add email</mat-label>
                    <input matInput #emailInput type="email" placeholder="user@example.com"
                      (keydown.enter)="addRecipient(emailInput.value); emailInput.value=''" />
                  </mat-form-field>
                  <button mat-icon-button color="primary" type="button"
                    (click)="addRecipient(emailInput.value); emailInput.value=''">
                    <mat-icon>add_circle</mat-icon>
                  </button>
                </div>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" type="button"
                  (click)="saveReport()" [disabled]="form.invalid || recipientList().length === 0 || saving()">
                  {{ saving() ? 'Saving…' : (editing() ? 'Update' : 'Create Schedule') }}
                </button>
                <button mat-button type="button" (click)="cancelForm()">Cancel</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- List -->
      @if (loading()) {
        <div class="spinner-center"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (reports().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content>
            <p class="empty-text">No scheduled reports yet. Create one to automatically email reports on a recurring schedule.</p>
          </mat-card-content>
        </mat-card>
      } @else {
        @for (report of reports(); track report.id) {
          <mat-card class="report-card" [class.inactive]="!report.isActive">
            <mat-card-content>
              <div class="report-row">
                <div class="report-info">
                  <strong>{{ report.name }}</strong>
                  <div class="report-meta">
                    <span class="badge type-badge">{{ labelFor(report.reportType, reportTypes) }}</span>
                    <span class="badge freq-badge">{{ labelFor(report.frequency, frequencies) }}</span>
                    <span class="recipients-summary">→ {{ report.recipients.length }} recipient(s)</span>
                  </div>
                  <div class="report-dates">
                    @if (report.lastRunAt) {
                      <span>Last run: {{ report.lastRunAt | date:'medium' }}</span>
                    }
                    @if (report.nextRunAt) {
                      <span> · Next: {{ report.nextRunAt | date:'medium' }}</span>
                    }
                  </div>
                </div>
                <div class="report-actions">
                  <mat-slide-toggle [checked]="report.isActive"
                    (change)="toggleActive(report, $event.checked)" color="primary">
                  </mat-slide-toggle>
                  <button mat-icon-button (click)="editReport(report)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteReport(report)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-title { display: flex; align-items: center; gap: 8px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; margin: 0; }
    mat-card { margin-bottom: 16px; }
    .form-card { border-left: 4px solid #1d4ed8; }
    .report-form { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
    .report-form mat-form-field { width: 100%; }
    .recipients-section { display: flex; flex-direction: column; gap: 8px; }
    .recipients-label { font-size: 0.875rem; color: rgba(0,0,0,.6); }
    .recipient-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .add-recipient-row { display: flex; align-items: flex-start; gap: 4px; }
    .recipient-input { flex: 1; }
    .form-actions { display: flex; gap: 8px; align-items: center; }
    .spinner-center { display: flex; justify-content: center; padding: 40px; }
    .empty-text { color: #9ca3af; font-style: italic; }
    .report-card { transition: opacity 0.2s; }
    .report-card.inactive { opacity: 0.55; }
    .report-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .report-info { flex: 1; }
    .report-meta { display: flex; gap: 6px; margin: 4px 0; flex-wrap: wrap; align-items: center; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
    .type-badge { background: #dbeafe; color: #1d4ed8; }
    .freq-badge { background: #dcfce7; color: #15803d; }
    .recipients-summary { color: #6b7280; font-size: 0.8rem; }
    .report-dates { font-size: 0.78rem; color: #9ca3af; margin-top: 2px; }
    .report-actions { display: flex; align-items: center; gap: 4px; }
  `],
})
export class ScheduledReportsSettingsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  editing = signal<ScheduledReport | null>(null);
  reports = signal<ScheduledReport[]>([]);
  recipientList = signal<string[]>([]);

  reportTypes = REPORT_TYPES;
  frequencies = FREQUENCIES;

  form: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snack: MatSnackBar,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      reportType: ['sales_summary', Validators.required],
      frequency: ['weekly', Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadReports();
  }

  async loadReports(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await firstValueFrom(this.http.get<ScheduledReport[]>(`${API}/reports/schedules`));
      this.reports.set(list);
    } catch {
      this.snack.open('Failed to load scheduled reports', 'Dismiss', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  addRecipient(email: string): void {
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) return;
    if (!this.recipientList().includes(trimmed)) {
      this.recipientList.update((list) => [...list, trimmed]);
    }
  }

  removeRecipient(email: string): void {
    this.recipientList.update((list) => list.filter((e) => e !== email));
  }

  editReport(report: ScheduledReport): void {
    this.editing.set(report);
    this.form.patchValue({ name: report.name, reportType: report.reportType, frequency: report.frequency });
    this.recipientList.set(Array.isArray(report.recipients) ? [...report.recipients] : []);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
    this.form.reset({ reportType: 'sales_summary', frequency: 'weekly' });
    this.recipientList.set([]);
  }

  async saveReport(): Promise<void> {
    if (this.form.invalid || this.recipientList().length === 0) return;
    this.saving.set(true);
    const payload = { ...this.form.value, recipients: this.recipientList() };
    const existing = this.editing();
    try {
      if (existing) {
        const updated = await firstValueFrom(
          this.http.patch<ScheduledReport>(`${API}/reports/schedules/${existing.id}`, payload),
        );
        this.reports.update((list) => list.map((r) => r.id === updated.id ? updated : r));
        this.snack.open('Schedule updated', 'OK', { duration: 3000 });
      } else {
        const created = await firstValueFrom(
          this.http.post<ScheduledReport>(`${API}/reports/schedules`, payload),
        );
        this.reports.update((list) => [created, ...list]);
        this.snack.open('Schedule created', 'OK', { duration: 3000 });
      }
      this.cancelForm();
    } catch (err: any) {
      this.snack.open(err?.error?.message ?? 'Save failed', 'Dismiss', { duration: 4000 });
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(report: ScheduledReport, isActive: boolean): Promise<void> {
    try {
      const updated = await firstValueFrom(
        this.http.patch<ScheduledReport>(`${API}/reports/schedules/${report.id}`, { isActive }),
      );
      this.reports.update((list) => list.map((r) => r.id === updated.id ? updated : r));
    } catch {
      this.snack.open('Failed to update schedule', 'Dismiss', { duration: 3000 });
    }
  }

  async deleteReport(report: ScheduledReport): Promise<void> {
    if (!confirm(`Delete "${report.name}"?`)) return;
    try {
      await firstValueFrom(this.http.delete(`${API}/reports/schedules/${report.id}`));
      this.reports.update((list) => list.filter((r) => r.id !== report.id));
      this.snack.open('Schedule deleted', 'OK', { duration: 3000 });
    } catch {
      this.snack.open('Delete failed', 'Dismiss', { duration: 3000 });
    }
  }

  labelFor(value: string, list: { value: string; label: string }[]): string {
    return list.find((i) => i.value === value)?.label ?? value;
  }
}
