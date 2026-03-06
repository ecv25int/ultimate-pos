import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EssentialsService } from '../../core/services/essentials.service';
import {
  EssentialsLeaveType, EssentialsLeave, EssentialsPayroll,
  EssentialsDocument, EssentialsReminder, EssentialsDashboard,
} from '../../core/models/essentials.model';

@Component({
  selector: 'app-essentials',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule,
    MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header"><h1>HR & Essentials</h1></div>

      <div class="dashboard-cards" *ngIf="dashboard()">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.pendingLeaves }}</div>
            <div class="stat-label">Pending Leaves</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.myApprovedLeaves }}</div>
            <div class="stat-label">My Approved Leaves</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.myPayrolls }}</div>
            <div class="stat-label">My Payrolls</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.upcomingReminders }}</div>
            <div class="stat-label">Upcoming Reminders</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <!-- LEAVES TAB -->
        <mat-tab label="Leaves">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>Apply for Leave</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="leaveForm" (ngSubmit)="submitLeave()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Leave Type</mat-label>
                      <mat-select formControlName="essentialsLeaveTypeId">
                        <mat-option *ngFor="let lt of leaveTypes()" [value]="lt.id">{{ lt.leaveType }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Start Date</mat-label>
                      <input matInput type="date" formControlName="startDate" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>End Date</mat-label>
                      <input matInput type="date" formControlName="endDate" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Reason</mat-label>
                      <input matInput formControlName="reason" />
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="leaveForm.invalid">Apply</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <div *ngIf="loading()" class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
                <table mat-table [dataSource]="leaves()" *ngIf="!loading()">
                  <ng-container matColumnDef="userId">
                    <th mat-header-cell *matHeaderCellDef>User ID</th>
                    <td mat-cell *matCellDef="let r">{{ r.userId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="startDate">
                    <th mat-header-cell *matHeaderCellDef>Start</th>
                    <td mat-cell *matCellDef="let r">{{ r.startDate | date:'mediumDate' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="endDate">
                    <th mat-header-cell *matHeaderCellDef>End</th>
                    <td mat-cell *matCellDef="let r">{{ r.endDate | date:'mediumDate' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let r"><mat-chip>{{ r.status }}</mat-chip></td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-button color="primary" (click)="updateLeaveStatus(r.id, 'approved')">Approve</button>
                      <button mat-button color="warn" (click)="updateLeaveStatus(r.id, 'cancelled')">Cancel</button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="leaveCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: leaveCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- PAYROLLS TAB -->
        <mat-tab label="Payrolls">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>New Payroll</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="payrollForm" (ngSubmit)="submitPayroll()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>User ID</mat-label>
                      <input matInput type="number" formControlName="userId" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Month</mat-label>
                      <input matInput type="number" formControlName="month" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Year</mat-label>
                      <input matInput type="number" formControlName="year" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Duration</mat-label>
                      <input matInput type="number" formControlName="duration" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Duration Unit</mat-label>
                      <mat-select formControlName="durationUnit">
                        <mat-option value="hours">Hours</mat-option>
                        <mat-option value="days">Days</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Gross Amount</mat-label>
                      <input matInput type="number" formControlName="grossAmount" />
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="payrollForm.invalid">Create Payroll</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="payrolls()">
                  <ng-container matColumnDef="userId">
                    <th mat-header-cell *matHeaderCellDef>User ID</th>
                    <td mat-cell *matCellDef="let r">{{ r.userId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="month">
                    <th mat-header-cell *matHeaderCellDef>Month</th>
                    <td mat-cell *matCellDef="let r">{{ r.month }}/{{ r.year }}</td>
                  </ng-container>
                  <ng-container matColumnDef="grossAmount">
                    <th mat-header-cell *matHeaderCellDef>Gross</th>
                    <td mat-cell *matCellDef="let r">{{ r.grossAmount }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="warn" (click)="deletePayroll(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="payrollCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: payrollCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- DOCUMENTS TAB -->
        <mat-tab label="Documents">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>Add Document</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="docForm" (ngSubmit)="submitDoc()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Type</mat-label>
                      <input matInput formControlName="type" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>User ID</mat-label>
                      <input matInput type="number" formControlName="userId" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <input matInput formControlName="description" />
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="docForm.invalid">Add</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="documents()">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let r">{{ r.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let r">{{ r.type }}</td>
                  </ng-container>
                  <ng-container matColumnDef="userId">
                    <th mat-header-cell *matHeaderCellDef>User ID</th>
                    <td mat-cell *matCellDef="let r">{{ r.userId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="warn" (click)="deleteDoc(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="docCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: docCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- REMINDERS TAB -->
        <mat-tab label="Reminders">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>Add Reminder</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="reminderForm" (ngSubmit)="submitReminder()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Date</mat-label>
                      <input matInput type="date" formControlName="date" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Time (HH:MM:SS)</mat-label>
                      <input matInput formControlName="time" placeholder="09:00:00" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Repeat</mat-label>
                      <mat-select formControlName="repeat">
                        <mat-option value="no">No</mat-option>
                        <mat-option value="daily">Daily</mat-option>
                        <mat-option value="weekly">Weekly</mat-option>
                        <mat-option value="monthly">Monthly</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="reminderForm.invalid">Add</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="reminders()">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let r">{{ r.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let r">{{ r.date | date:'mediumDate' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="repeat">
                    <th mat-header-cell *matHeaderCellDef>Repeat</th>
                    <td mat-cell *matCellDef="let r">{{ r.repeat }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="warn" (click)="deleteReminder(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="reminderCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: reminderCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- LEAVE TYPES TAB -->
        <mat-tab label="Leave Types">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>Add Leave Type</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="leaveTypeForm" (ngSubmit)="submitLeaveType()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Leave Type Name</mat-label>
                      <input matInput formControlName="leaveType" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Max Leave Count</mat-label>
                      <input matInput type="number" formControlName="maxLeaveCount" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Interval</mat-label>
                      <mat-select formControlName="leaveCountInterval">
                        <mat-option value="month">Month</mat-option>
                        <mat-option value="year">Year</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="leaveTypeForm.invalid">Add</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="leaveTypes()">
                  <ng-container matColumnDef="leaveType">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let r">{{ r.leaveType }}</td>
                  </ng-container>
                  <ng-container matColumnDef="maxLeaveCount">
                    <th mat-header-cell *matHeaderCellDef>Max Count</th>
                    <td mat-cell *matCellDef="let r">{{ r.maxLeaveCount }}</td>
                  </ng-container>
                  <ng-container matColumnDef="leaveCountInterval">
                    <th mat-header-cell *matHeaderCellDef>Interval</th>
                    <td mat-cell *matCellDef="let r">{{ r.leaveCountInterval }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="warn" (click)="deleteLeaveType(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="leaveTypeCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: leaveTypeCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { margin-bottom: 16px; }
    .dashboard-cards { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card { min-width: 140px; }
    .stat-value { font-size: 1.8rem; font-weight: 700; }
    .stat-label { font-size: 0.85rem; color: #666; }
    .tab-content { padding: 16px 0; display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
    .full-width { width: 100%; }
    .loading-container { display: flex; justify-content: center; padding: 24px; }
    mat-form-field { min-width: 180px; }
    table { width: 100%; }
  `],
})
export class EssentialsComponent implements OnInit {
  private svc = inject(EssentialsService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  dashboard = signal<EssentialsDashboard | null>(null);
  leaveTypes = signal<EssentialsLeaveType[]>([]);
  leaves = signal<EssentialsLeave[]>([]);
  payrolls = signal<EssentialsPayroll[]>([]);
  documents = signal<EssentialsDocument[]>([]);
  reminders = signal<EssentialsReminder[]>([]);

  leaveCols = ['userId', 'startDate', 'endDate', 'status', 'actions'];
  payrollCols = ['userId', 'month', 'grossAmount', 'actions'];
  docCols = ['name', 'type', 'userId', 'actions'];
  reminderCols = ['name', 'date', 'repeat', 'actions'];
  leaveTypeCols = ['leaveType', 'maxLeaveCount', 'leaveCountInterval', 'actions'];

  leaveTypeForm = this.fb.group({ leaveType: ['', Validators.required], maxLeaveCount: [null as number | null], leaveCountInterval: ['year'] });
  leaveForm = this.fb.group({ essentialsLeaveTypeId: [null as number | null], startDate: ['', Validators.required], endDate: ['', Validators.required], reason: [null as string | null] });
  payrollForm = this.fb.group({ userId: [null as number | null, Validators.required], month: [null as number | null, Validators.required], year: [null as number | null, Validators.required], duration: [null as number | null, Validators.required], durationUnit: ['hours', Validators.required], grossAmount: [0] });
  docForm = this.fb.group({ name: ['', Validators.required], type: [null as string | null], userId: [null as number | null, Validators.required], description: [null as string | null] });
  reminderForm = this.fb.group({ name: ['', Validators.required], date: ['', Validators.required], time: ['09:00:00', Validators.required], repeat: ['no', Validators.required] });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.svc.getDashboard().subscribe(d => this.dashboard.set(d));
    this.svc.getLeaveTypes().subscribe(d => this.leaveTypes.set(d));
    this.svc.getLeaves().subscribe(d => { this.leaves.set(d); this.loading.set(false); });
    this.svc.getPayrolls().subscribe(d => this.payrolls.set(d));
    this.svc.getDocuments().subscribe(d => this.documents.set(d));
    this.svc.getReminders().subscribe(d => this.reminders.set(d));
  }

  submitLeaveType() {
    if (this.leaveTypeForm.invalid) return;
    this.svc.createLeaveType(this.leaveTypeForm.value as any).subscribe({ next: () => { this.snack.open('Saved', 'Close', { duration: 2000 }); this.leaveTypeForm.reset({ leaveCountInterval: 'year' }); this.loadAll(); } });
  }
  deleteLeaveType(id: number) { this.svc.deleteLeaveType(id).subscribe({ next: () => this.loadAll() }); }

  submitLeave() {
    if (this.leaveForm.invalid) return;
    this.svc.createLeave(this.leaveForm.value as any).subscribe({ next: () => { this.snack.open('Leave applied', 'Close', { duration: 2000 }); this.leaveForm.reset(); this.loadAll(); } });
  }
  updateLeaveStatus(id: number, status: string) {
    this.svc.updateLeaveStatus(id, { status } as any).subscribe({ next: () => this.loadAll() });
  }

  submitPayroll() {
    if (this.payrollForm.invalid) return;
    this.svc.createPayroll(this.payrollForm.value as any).subscribe({ next: () => { this.snack.open('Saved', 'Close', { duration: 2000 }); this.payrollForm.reset({ durationUnit: 'hours', grossAmount: 0 }); this.loadAll(); } });
  }
  deletePayroll(id: number) { this.svc.deletePayroll(id).subscribe({ next: () => this.loadAll() }); }

  submitDoc() {
    if (this.docForm.invalid) return;
    this.svc.createDocument(this.docForm.value as any).subscribe({ next: () => { this.snack.open('Saved', 'Close', { duration: 2000 }); this.docForm.reset(); this.loadAll(); } });
  }
  deleteDoc(id: number) { this.svc.deleteDocument(id).subscribe({ next: () => this.loadAll() }); }

  submitReminder() {
    if (this.reminderForm.invalid) return;
    this.svc.createReminder(this.reminderForm.value as any).subscribe({ next: () => { this.snack.open('Saved', 'Close', { duration: 2000 }); this.reminderForm.reset({ repeat: 'no', time: '09:00:00' }); this.loadAll(); } });
  }
  deleteReminder(id: number) { this.svc.deleteReminder(id).subscribe({ next: () => this.loadAll() }); }
}
