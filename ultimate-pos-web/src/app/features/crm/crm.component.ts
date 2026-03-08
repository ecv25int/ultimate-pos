import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { CrmService } from '../../core/services/crm.service';
import { CrmCampaign, CrmSchedule, CrmCallLog, CallLogsPage, CrmDashboard } from '../../core/models/crm.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    DatePipe,
  ],
  template: `
<div class="crm-container">
  <div class="page-header">
    <div class="header-title">
      <mat-icon class="header-icon">people_alt</mat-icon>
      <div>
        <h1>CRM</h1>
        <p class="subtitle">Schedules, campaigns &amp; call logs</p>
      </div>
    </div>
  </div>

  @if (dashboard) {
  <div class="stats-row">
    <mat-card class="stat-card">
      <mat-card-content>
        <div class="stat-content">
          <mat-icon class="stat-icon orange">pending_actions</mat-icon>
          <div>
            <div class="stat-number">{{ dashboard.pendingCount }}</div>
            <div class="stat-label">Pending Schedules</div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
    <mat-card class="stat-card">
      <mat-card-content>
        <div class="stat-content">
          <mat-icon class="stat-icon green">task_alt</mat-icon>
          <div>
            <div class="stat-number">{{ dashboard.completedToday }}</div>
            <div class="stat-label">Completed Today</div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
    <mat-card class="stat-card">
      <mat-card-content>
        <div class="stat-content">
          <mat-icon class="stat-icon blue">event_upcoming</mat-icon>
          <div>
            <div class="stat-number">{{ dashboard.upcomingSchedules.length }}</div>
            <div class="stat-label">Upcoming (7 days)</div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  </div>
  }

  <mat-tab-group animationDuration="200ms">

    <!-- ─── SCHEDULES TAB ────────────────────────────────────────── -->
    <mat-tab label="Schedules">
      <div class="tab-content">
        <div class="section-header">
          <h2>Follow-ups & Meetings</h2>
          <div class="filter-row">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="scheduleFilter.status" (selectionChange)="loadSchedules()">
                <mat-option value="">All</mat-option>
                <mat-option value="pending">Pending</mat-option>
                <mat-option value="completed">Completed</mat-option>
                <mat-option value="cancelled">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Type</mat-label>
              <mat-select [(ngModel)]="scheduleFilter.type" (selectionChange)="loadSchedules()">
                <mat-option value="">All</mat-option>
                <mat-option value="call">Call</mat-option>
                <mat-option value="sms">SMS</mat-option>
                <mat-option value="meeting">Meeting</mat-option>
                <mat-option value="email">Email</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="openScheduleForm()">
              <mat-icon>add</mat-icon> New Schedule
            </button>
          </div>
        </div>

        @if (loadingSchedules) {
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        } @else {
          <table mat-table [dataSource]="schedules" class="full-width-table">
            <ng-container matColumnDef="contact">
              <th mat-header-cell *matHeaderCellDef>Contact</th>
              <td mat-cell *matCellDef="let s">{{ s.contact?.name ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let s">{{ s.title }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let s">
                <mat-chip [class]="'chip-type-' + s.scheduleType">
                  {{ s.scheduleType | titlecase }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="start">
              <th mat-header-cell *matHeaderCellDef>Start</th>
              <td mat-cell *matCellDef="let s">{{ s.startDatetime | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let s">
                <mat-chip [class]="'chip-sched-' + s.status">{{ s.status | titlecase }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let s">
                <button mat-icon-button matTooltip="Mark Complete" color="primary"
                  (click)="completeSchedule(s.id)">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="Delete"
                  (click)="deleteSchedule(s.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="scheduleColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: scheduleColumns;"></tr>
          </table>
          @if (schedules.length === 0) {
            <p class="empty-state">No schedules found.</p>
          }
        }

        @if (showScheduleForm) {
          <mat-card class="form-panel">
            <mat-card-header>
              <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>schedule</mat-icon></div>
              <mat-card-title>New Schedule</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="scheduleForm" (ngSubmit)="saveSchedule()">
                <mat-form-field appearance="outline">
                  <mat-label>Contact ID</mat-label>
                  <input matInput type="number" formControlName="contactId" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Title</mat-label>
                  <input matInput formControlName="title" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Type</mat-label>
                  <mat-select formControlName="scheduleType">
                    <mat-option value="call">Call</mat-option>
                    <mat-option value="sms">SMS</mat-option>
                    <mat-option value="meeting">Meeting</mat-option>
                    <mat-option value="email">Email</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Start</mat-label>
                  <input matInput type="datetime-local" formControlName="startDatetime" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>End</mat-label>
                  <input matInput type="datetime-local" formControlName="endDatetime" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="2"></textarea>
                </mat-form-field>
                <div class="form-actions">
                  <button mat-button type="button" (click)="showScheduleForm = false">Cancel</button>
                  <button mat-raised-button color="primary" type="submit"
                    [disabled]="scheduleForm.invalid || saving">
                    {{ saving ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </mat-tab>

    <!-- ─── CAMPAIGNS TAB ───────────────────────────────────────── -->
    <mat-tab label="Campaigns">
      <div class="tab-content">
        <div class="section-header">
          <h2>Marketing Campaigns</h2>
          <button mat-raised-button color="primary" (click)="openCampaignForm()">
            <mat-icon>add</mat-icon> New Campaign
          </button>
        </div>

        @if (loadingCampaigns) {
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        } @else {
          <table mat-table [dataSource]="campaigns" class="full-width-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let c">{{ c.name }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let c">
                <mat-chip>{{ c.campaignType | uppercase }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let c">
                <mat-chip [class]="'chip-camp-' + c.status">{{ c.status | titlecase }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="sentOn">
              <th mat-header-cell *matHeaderCellDef>Sent On</th>
              <td mat-cell *matCellDef="let c">{{ c.sentOn ? (c.sentOn | date:'short') : '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let c">
                @if (c.status === 'draft') {
                  <button mat-icon-button matTooltip="Mark Sent" color="primary"
                    (click)="markCampaignSent(c.id)">
                    <mat-icon>send</mat-icon>
                  </button>
                }
                <button mat-icon-button color="warn" matTooltip="Delete"
                  (click)="deleteCampaign(c.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="campaignColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: campaignColumns;"></tr>
          </table>
          @if (campaigns.length === 0) {
            <p class="empty-state">No campaigns found.</p>
          }
        }

        @if (showCampaignForm) {
          <mat-card class="form-panel">
            <mat-card-header>
              <div mat-card-avatar class="card-avatar-icon purple"><mat-icon>campaign</mat-icon></div>
              <mat-card-title>New Campaign</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="campaignForm" (ngSubmit)="saveCampaign()">
                <mat-form-field appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Type</mat-label>
                  <mat-select formControlName="campaignType">
                    <mat-option value="email">Email</mat-option>
                    <mat-option value="sms">SMS</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Subject</mat-label>
                  <input matInput formControlName="subject" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Email Body</mat-label>
                  <textarea matInput formControlName="emailBody" rows="3"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>SMS Body</mat-label>
                  <textarea matInput formControlName="smsBody" rows="2"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Contact IDs (JSON array, e.g. [1,2,3])</mat-label>
                  <input matInput formControlName="contactIds" placeholder="[1,2,3]" />
                </mat-form-field>
                <div class="form-actions">
                  <button mat-button type="button" (click)="showCampaignForm = false">Cancel</button>
                  <button mat-raised-button color="primary" type="submit"
                    [disabled]="campaignForm.invalid || saving">
                    {{ saving ? 'Saving...' : 'Save Draft' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </mat-tab>

    <!-- ─── CALL LOGS TAB ────────────────────────────────────────── -->
    <mat-tab label="Call Logs">
      <div class="tab-content">
        <div class="section-header">
          <h2>Call History</h2>
          <button mat-raised-button color="primary" (click)="openCallLogForm()">
            <mat-icon>add_call</mat-icon> Log Call
          </button>
        </div>

        @if (loadingCallLogs) {
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        } @else {
          <table mat-table [dataSource]="callLogs" class="full-width-table">
            <ng-container matColumnDef="contact">
              <th mat-header-cell *matHeaderCellDef>Contact</th>
              <td mat-cell *matCellDef="let l">{{ l.contact?.name ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="mobile">
              <th mat-header-cell *matHeaderCellDef>Mobile</th>
              <td mat-cell *matCellDef="let l">{{ l.mobileNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let l">
                <mat-chip [class]="'chip-call-' + l.callType">{{ l.callType | titlecase }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="duration">
              <th mat-header-cell *matHeaderCellDef>Duration (s)</th>
              <td mat-cell *matCellDef="let l">{{ l.duration ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="note">
              <th mat-header-cell *matHeaderCellDef>Note</th>
              <td mat-cell *matCellDef="let l">{{ l.note ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let l">
                <button mat-icon-button color="warn" matTooltip="Delete"
                  (click)="deleteCallLog(l.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="callLogColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: callLogColumns;"></tr>
          </table>
          @if (callLogs.length === 0) {
            <p class="empty-state">No call logs found.</p>
          }

          @if (callLogsPage && callLogsPage.totalPages > 1) {
            <div class="pagination">
              <button mat-button [disabled]="callPage === 1" (click)="callPage = callPage - 1; loadCallLogs()">Prev</button>
              <span>{{ callPage }} / {{ callLogsPage.totalPages }}</span>
              <button mat-button [disabled]="callPage >= callLogsPage.totalPages"
                (click)="callPage = callPage + 1; loadCallLogs()">Next</button>
            </div>
          }
        }

        @if (showCallLogForm) {
          <mat-card class="form-panel">
            <mat-card-header>
              <div mat-card-avatar class="card-avatar-icon green"><mat-icon>call</mat-icon></div>
              <mat-card-title>Log a Call</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="callLogForm" (ngSubmit)="saveCallLog()">
                <mat-form-field appearance="outline">
                  <mat-label>Mobile Number</mat-label>
                  <input matInput formControlName="mobileNumber" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Contact ID (optional)</mat-label>
                  <input matInput type="number" formControlName="contactId" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Call Type</mat-label>
                  <mat-select formControlName="callType">
                    <mat-option value="inbound">Inbound</mat-option>
                    <mat-option value="outbound">Outbound</mat-option>
                    <mat-option value="missed">Missed</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Duration (seconds)</mat-label>
                  <input matInput type="number" formControlName="duration" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Note</mat-label>
                  <textarea matInput formControlName="note" rows="2"></textarea>
                </mat-form-field>
                <div class="form-actions">
                  <button mat-button type="button" (click)="showCallLogForm = false">Cancel</button>
                  <button mat-raised-button color="primary" type="submit"
                    [disabled]="callLogForm.invalid || saving">
                    {{ saving ? 'Saving...' : 'Log' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </mat-tab>
  </mat-tab-group>
</div>
  `,
  styles: [`
    .crm-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-title { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { border-radius: 12px; overflow: hidden; }
    .stat-content { display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0; }
    .stat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; border-radius: 10px; padding: 0.5rem; }
    .stat-icon.blue   { color: #1976d2; background: #e3f2fd; }
    .stat-icon.green  { color: #388e3c; background: #e8f5e9; }
    .stat-icon.orange { color: #f57c00; background: #fff3e0; }
    .stat-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .stat-number { font-size: 1.75rem; font-weight: 700; line-height: 1; color: #1a1a1a; }
    .stat-label { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
    .tab-content { padding: 1.5rem 0; }
    .section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
    .filter-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .filter-field { width: 160px; }
    .full-width-table { width: 100%; }
    .form-panel { max-width: 600px; margin-top: 1.5rem; border-radius: 12px; overflow: hidden; }
    .card-avatar-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; }
    .card-avatar-icon.blue   { color: #1976d2; background: #e3f2fd; }
    .card-avatar-icon.green  { color: #388e3c; background: #e8f5e9; }
    .card-avatar-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .card-avatar-icon mat-icon { font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
    form { display: flex; flex-direction: column; gap: 12px; }
    mat-form-field { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 12px; }
    .empty-state { color: rgba(0,0,0,.4); text-align: center; padding: 24px; }
    .chip-sched-pending   { background: #fff3e0 !important; color: #e65100 !important; }
    .chip-sched-completed { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .chip-sched-cancelled { background: #ffebee !important; color: #c62828 !important; }
    .chip-camp-draft      { background: #f5f5f5 !important; color: #616161 !important; }
    .chip-camp-sent       { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .chip-camp-scheduled  { background: #e3f2fd !important; color: #1565c0 !important; }
    .chip-call-inbound    { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .chip-call-outbound   { background: #e3f2fd !important; color: #1565c0 !important; }
    .chip-call-missed     { background: #ffebee !important; color: #c62828 !important; }
    .chip-type-call    { background: #e3f2fd !important; color: #1565c0 !important; }
    .chip-type-sms     { background: #f3e5f5 !important; color: #6a1b9a !important; }
    .chip-type-meeting { background: #fff3e0 !important; color: #e65100 !important; }
    .chip-type-email   { background: #e8f5e9 !important; color: #2e7d32 !important; }
    @media (max-width: 900px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
  `],
})
export class CrmComponent implements OnInit {
  private crmService = inject(CrmService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  dashboard: CrmDashboard | null = null;
  schedules: CrmSchedule[] = [];
  campaigns: CrmCampaign[] = [];
  callLogs: CrmCallLog[] = [];
  callLogsPage: CallLogsPage | null = null;
  callPage = 1;

  loadingSchedules = false;
  loadingCampaigns = false;
  loadingCallLogs = false;
  saving = false;

  showScheduleForm = false;
  showCampaignForm = false;
  showCallLogForm = false;

  scheduleFilter: { status?: string; type?: string } = {};

  scheduleColumns = ['contact', 'title', 'type', 'start', 'status', 'actions'];
  campaignColumns = ['name', 'type', 'status', 'sentOn', 'actions'];
  callLogColumns = ['contact', 'mobile', 'type', 'duration', 'note', 'actions'];

  scheduleForm: FormGroup = this.fb.group({
    contactId: [null, [Validators.required, Validators.min(1)]],
    title: ['', Validators.required],
    scheduleType: ['call', Validators.required],
    startDatetime: ['', Validators.required],
    endDatetime: ['', Validators.required],
    description: [''],
  });

  campaignForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    campaignType: ['email', Validators.required],
    subject: [''],
    emailBody: [''],
    smsBody: [''],
    contactIds: ['[]'],
  });

  callLogForm: FormGroup = this.fb.group({
    mobileNumber: ['', Validators.required],
    contactId: [null],
    callType: ['outbound', Validators.required],
    duration: [null],
    note: [''],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.crmService.getDashboard().subscribe({ next: (d) => (this.dashboard = d) });
    this.loadSchedules();
    this.loadCampaigns();
    this.loadCallLogs();
  }

  loadSchedules(): void {
    this.loadingSchedules = true;
    this.crmService.getSchedules(this.scheduleFilter).subscribe({
      next: (s) => { this.schedules = s; this.loadingSchedules = false; },
      error: () => (this.loadingSchedules = false),
    });
  }

  loadCampaigns(): void {
    this.loadingCampaigns = true;
    this.crmService.getCampaigns().subscribe({
      next: (c) => { this.campaigns = c; this.loadingCampaigns = false; },
      error: () => (this.loadingCampaigns = false),
    });
  }

  loadCallLogs(): void {
    this.loadingCallLogs = true;
    this.crmService.getCallLogs({ page: this.callPage }).subscribe({
      next: (p) => { this.callLogsPage = p; this.callLogs = p.items; this.loadingCallLogs = false; },
      error: () => (this.loadingCallLogs = false),
    });
  }

  // ─── Schedule ────────────────────────────────────────────────────────────

  openScheduleForm(): void {
    this.scheduleForm.reset({ scheduleType: 'call' });
    this.showScheduleForm = true;
  }

  saveSchedule(): void {
    if (this.scheduleForm.invalid) return;
    this.saving = true;
    const v = this.scheduleForm.value;
    const dto = {
      ...v,
      startDatetime: new Date(v.startDatetime).toISOString(),
      endDatetime: new Date(v.endDatetime).toISOString(),
    };
    this.crmService.createSchedule(dto).subscribe({
      next: () => {
        this.saving = false;
        this.showScheduleForm = false;
        this.loadSchedules();
        this.crmService.getDashboard().subscribe({ next: (d) => (this.dashboard = d) });
        this.snackBar.open('Schedule created', 'OK', { duration: 2500 });
      },
      error: (e: { error?: { message?: string } }) => {
        this.saving = false;
        this.snackBar.open(e.error?.message ?? 'Error', 'OK', { duration: 3000 });
      },
    });
  }

  completeSchedule(id: number): void {
    this.crmService.updateSchedule(id, { status: 'completed' }).subscribe({
      next: () => {
        this.loadSchedules();
        this.crmService.getDashboard().subscribe({ next: (d) => (this.dashboard = d) });
        this.snackBar.open('Marked complete', 'OK', { duration: 2000 });
      },
    });
  }

  deleteSchedule(id: number): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Schedule', message: 'Delete schedule?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.crmService.deleteSchedule(id).subscribe({
        next: () => { this.loadSchedules(); this.snackBar.open('Deleted', 'OK', { duration: 2000 }); },
      });
    });
  }

  // ─── Campaign ────────────────────────────────────────────────────────────

  openCampaignForm(): void {
    this.campaignForm.reset({ campaignType: 'email', contactIds: '[]' });
    this.showCampaignForm = true;
  }

  saveCampaign(): void {
    if (this.campaignForm.invalid) return;
    this.saving = true;
    this.crmService.createCampaign(this.campaignForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.showCampaignForm = false;
        this.loadCampaigns();
        this.snackBar.open('Campaign saved', 'OK', { duration: 2500 });
      },
      error: (e: { error?: { message?: string } }) => {
        this.saving = false;
        this.snackBar.open(e.error?.message ?? 'Error', 'OK', { duration: 3000 });
      },
    });
  }

  markCampaignSent(id: number): void {
    this.crmService.updateCampaignStatus(id, 'sent').subscribe({
      next: () => { this.loadCampaigns(); this.snackBar.open('Marked as sent', 'OK', { duration: 2000 }); },
    });
  }

  deleteCampaign(id: number): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Campaign', message: 'Delete campaign?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.crmService.deleteCampaign(id).subscribe({
        next: () => { this.loadCampaigns(); this.snackBar.open('Deleted', 'OK', { duration: 2000 }); },
      });
    });
  }

  // ─── Call Log ────────────────────────────────────────────────────────────

  openCallLogForm(): void {
    this.callLogForm.reset({ callType: 'outbound' });
    this.showCallLogForm = true;
  }

  saveCallLog(): void {
    if (this.callLogForm.invalid) return;
    this.saving = true;
    this.crmService.createCallLog(this.callLogForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.showCallLogForm = false;
        this.loadCallLogs();
        this.snackBar.open('Call logged', 'OK', { duration: 2500 });
      },
      error: (e: { error?: { message?: string } }) => {
        this.saving = false;
        this.snackBar.open(e.error?.message ?? 'Error', 'OK', { duration: 3000 });
      },
    });
  }

  deleteCallLog(id: number): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Call Log', message: 'Delete this call log?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.crmService.deleteCallLog(id).subscribe({
        next: () => { this.loadCallLogs(); this.snackBar.open('Deleted', 'OK', { duration: 2000 }); },
      });
    });
  }
}
