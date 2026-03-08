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
import { RepairService } from '../../core/services/repair.service';
import { RepairStatus, RepairDeviceModel, RepairJobSheet, RepairDashboard } from '../../core/models/repair.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-repair',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Repair</h1>
      </div>

      <!-- Dashboard Cards -->
      <div class="dashboard-cards" *ngIf="dashboard()">
        <mat-card class="stat-card" *ngFor="let item of dashboard()!.statusBreakdown">
          <mat-card-content>
            <div class="stat-value">{{ item.count }}</div>
            <div class="stat-label">{{ item.name }}</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <!-- JOB SHEETS TAB -->
        <mat-tab label="Job Sheets">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>
                {{ editingSheetId() ? 'Edit Job Sheet' : 'New Job Sheet' }}
              </mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="sheetForm" (ngSubmit)="submitSheet()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Contact ID</mat-label>
                      <input matInput type="number" formControlName="contactId" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Job Sheet No.</mat-label>
                      <input matInput formControlName="jobSheetNo" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Service Type</mat-label>
                      <mat-select formControlName="serviceType">
                        <mat-option value="carry_in">Carry In</mat-option>
                        <mat-option value="pick_up">Pick Up</mat-option>
                        <mat-option value="on_site">On Site</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Status</mat-label>
                      <mat-select formControlName="statusId">
                        <mat-option *ngFor="let s of statuses()" [value]="s.id">{{ s.name }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Serial No.</mat-label>
                      <input matInput formControlName="serialNo" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Estimated Cost</mat-label>
                      <input matInput type="number" formControlName="estimatedCost" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Device Model ID</mat-label>
                      <mat-select formControlName="deviceModelId">
                        <mat-option [value]="null">None</mat-option>
                        <mat-option *ngFor="let m of deviceModels()" [value]="m.id">{{ m.name }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Defects</mat-label>
                    <textarea matInput rows="2" formControlName="defects"></textarea>
                  </mat-form-field>
                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="sheetForm.invalid || saving()">
                      {{ editingSheetId() ? 'Update' : 'Create' }}
                    </button>
                    <button *ngIf="editingSheetId()" mat-stroked-button type="button" (click)="cancelSheetEdit()">Cancel</button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>Filter by Status</mat-label>
                <mat-select [(value)]="filterStatusId" (selectionChange)="loadJobSheets()">
                  <mat-option [value]="undefined">All</mat-option>
                  <mat-option *ngFor="let s of statuses()" [value]="s.id">{{ s.name }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-card>
              <mat-card-header><mat-card-title>Job Sheets ({{ jobSheets().length }})</mat-card-title></mat-card-header>
              <mat-card-content>
                <div *ngIf="loading()" class="spinner-center"><mat-spinner diameter="40"></mat-spinner></div>
                <table mat-table [dataSource]="jobSheets()" *ngIf="!loading()" class="full-width-table">
                  <ng-container matColumnDef="jobSheetNo">
                    <th mat-header-cell *matHeaderCellDef>Job Sheet No.</th>
                    <td mat-cell *matCellDef="let j">{{ j.jobSheetNo }}</td>
                  </ng-container>
                  <ng-container matColumnDef="serialNo">
                    <th mat-header-cell *matHeaderCellDef>Serial No.</th>
                    <td mat-cell *matCellDef="let j">{{ j.serialNo }}</td>
                  </ng-container>
                  <ng-container matColumnDef="serviceType">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let j">{{ j.serviceType }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let j">
                      <mat-chip [style.background-color]="j.status?.color ?? '#ddd'">
                        {{ j.status?.name ?? '—' }}
                      </mat-chip>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="estimatedCost">
                    <th mat-header-cell *matHeaderCellDef>Est. Cost</th>
                    <td mat-cell *matCellDef="let j">{{ j.estimatedCost ?? '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let j">
                      <button mat-icon-button (click)="editSheet(j)"><mat-icon>edit</mat-icon></button>
                      <button mat-icon-button color="warn" (click)="deleteSheet(j.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="sheetColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: sheetColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- SETTINGS TAB -->
        <mat-tab label="Settings">
          <div class="tab-content">
            <div class="settings-grid">
              <!-- Statuses -->
              <mat-card>
                <mat-card-header><mat-card-title>Repair Statuses</mat-card-title></mat-card-header>
                <mat-card-content>
                  <form [formGroup]="statusForm" (ngSubmit)="submitStatus()" class="inline-form">
                    <mat-form-field appearance="outline">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Color (hex)</mat-label>
                      <input matInput formControlName="color" placeholder="#28a745" />
                    </mat-form-field>
                    <button mat-raised-button color="primary" type="submit" [disabled]="statusForm.invalid">Add</button>
                  </form>
                  <table mat-table [dataSource]="statuses()" class="full-width-table">
                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let s">{{ s.name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="color">
                      <th mat-header-cell *matHeaderCellDef>Color</th>
                      <td mat-cell *matCellDef="let s">
                        <span class="color-dot" [style.background]="s.color ?? '#ccc'"></span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="del">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let s">
                        <button mat-icon-button color="warn" (click)="deleteStatus(s.id)"><mat-icon>delete</mat-icon></button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="['name','color','del']"></tr>
                    <tr mat-row *matRowDef="let r; columns: ['name','color','del'];"></tr>
                  </table>
                </mat-card-content>
              </mat-card>

              <!-- Device Models -->
              <mat-card>
                <mat-card-header><mat-card-title>Device Models</mat-card-title></mat-card-header>
                <mat-card-content>
                  <form [formGroup]="modelForm" (ngSubmit)="submitModel()" class="inline-form">
                    <mat-form-field appearance="outline">
                      <mat-label>Model Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <button mat-raised-button color="primary" type="submit" [disabled]="modelForm.invalid">Add</button>
                  </form>
                  <table mat-table [dataSource]="deviceModels()" class="full-width-table">
                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let m">{{ m.name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="del">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let m">
                        <button mat-icon-button color="warn" (click)="deleteModel(m.id)"><mat-icon>delete</mat-icon></button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="['name','del']"></tr>
                    <tr mat-row *matRowDef="let r; columns: ['name','del'];"></tr>
                  </table>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .dashboard-cards { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card { min-width: 140px; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 13px; color: #666; }
    .tab-content { padding: 24px 0; display: flex; flex-direction: column; gap: 24px; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .form-row mat-form-field { flex: 1; min-width: 160px; }
    .full-width { width: 100%; }
    .full-width-table { width: 100%; }
    .form-actions { display: flex; gap: 12px; margin-top: 16px; }
    .filter-row { display: flex; gap: 16px; }
    .filter-row mat-form-field { min-width: 200px; }
    .spinner-center { display: flex; justify-content: center; padding: 32px; }
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .inline-form { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .color-dot { display: inline-block; width: 20px; height: 20px; border-radius: 50%; vertical-align: middle; }
    @media (max-width: 768px) { .settings-grid { grid-template-columns: 1fr; } }
  `],
})
export class RepairComponent implements OnInit {
  private svc = inject(RepairService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  dashboard = signal<RepairDashboard | null>(null);
  jobSheets = signal<RepairJobSheet[]>([]);
  statuses = signal<RepairStatus[]>([]);
  deviceModels = signal<RepairDeviceModel[]>([]);
  loading = signal(false);
  saving = signal(false);
  editingSheetId = signal<number | null>(null);
  filterStatusId: number | undefined = undefined;

  sheetColumns = ['jobSheetNo', 'serialNo', 'serviceType', 'status', 'estimatedCost', 'actions'];

  sheetForm = this.fb.group({
    contactId: [null as number | null, Validators.required],
    jobSheetNo: ['', Validators.required],
    serviceType: ['carry_in', Validators.required],
    statusId: [null as number | null, Validators.required],
    serialNo: [''],
    estimatedCost: [null as number | null],
    deviceModelId: [null as number | null],
    defects: [''],
  });

  statusForm = this.fb.group({ name: ['', Validators.required], color: [''] });
  modelForm = this.fb.group({ name: ['', Validators.required] });

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.svc.getDashboard().subscribe({ next: v => this.dashboard.set(v) });
    this.svc.getStatuses().subscribe({ next: v => this.statuses.set(v) });
    this.svc.getDeviceModels().subscribe({ next: v => this.deviceModels.set(v) });
    this.loadJobSheets();
  }

  loadJobSheets() {
    this.loading.set(true);
    this.svc.getJobSheets({ statusId: this.filterStatusId }).subscribe({
      next: v => this.jobSheets.set(v),
      complete: () => this.loading.set(false),
    });
  }

  submitSheet() {
    if (this.sheetForm.invalid) return;
    this.saving.set(true);
    const val = this.sheetForm.value as any;
    const obs = this.editingSheetId()
      ? this.svc.updateJobSheet(this.editingSheetId()!, val)
      : this.svc.createJobSheet(val);
    obs.subscribe({
      next: () => { this.snack.open('Saved', 'OK', { duration: 2000 }); this.cancelSheetEdit(); this.loadAll(); },
      error: () => this.snack.open('Error', 'OK', { duration: 2000 }),
      complete: () => this.saving.set(false),
    });
  }

  editSheet(j: RepairJobSheet) {
    this.editingSheetId.set(j.id);
    this.sheetForm.patchValue({
      contactId: j.contactId,
      jobSheetNo: j.jobSheetNo,
      serviceType: j.serviceType,
      statusId: j.statusId,
      serialNo: j.serialNo ?? '',
      estimatedCost: j.estimatedCost ?? null,
      deviceModelId: j.deviceModelId ?? null,
      defects: j.defects ?? '',
    });
  }

  cancelSheetEdit() { this.editingSheetId.set(null); this.sheetForm.reset({ serviceType: 'carry_in' }); }

  deleteSheet(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Job Sheet', message: 'Delete job sheet?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteJobSheet(id).subscribe({ next: () => this.loadJobSheets() });
    });
  }

  submitStatus() {
    if (this.statusForm.invalid) return;
    this.svc.createStatus(this.statusForm.value as any).subscribe({
      next: () => { this.snack.open('Status added', 'OK', { duration: 2000 }); this.statusForm.reset(); this.loadAll(); },
      error: () => this.snack.open('Error', 'OK', { duration: 2000 }),
    });
  }

  deleteStatus(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Status', message: 'Delete status?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteStatus(id).subscribe({ next: () => this.loadAll() });
    });
  }

  submitModel() {
    if (this.modelForm.invalid) return;
    this.svc.createDeviceModel(this.modelForm.value as any).subscribe({
      next: () => { this.snack.open('Model added', 'OK', { duration: 2000 }); this.modelForm.reset(); this.loadAll(); },
      error: () => this.snack.open('Error', 'OK', { duration: 2000 }),
    });
  }

  deleteModel(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Device Model', message: 'Delete device model?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteDeviceModel(id).subscribe({ next: () => this.loadAll() });
    });
  }
}
