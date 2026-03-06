import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { TaxRatesService } from '../../core/services/tax-rates.service';
import { TaxRate, CreateTaxRateDto } from '../../core/models/tax-rate.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-tax-rates',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
    MatSlideToggleModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="header-icon">percent</mat-icon>
          <div>
            <h1>Tax Rates</h1>
            <p class="subtitle">Manage tax rates applied to products and invoices</p>
          </div>
        </div>
      </div>

      <div class="two-column-layout">
        <!-- Add / Edit Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>{{ editingRate ? 'edit' : 'add_circle' }}</mat-icon>
            <mat-card-title>{{ editingRate ? 'Edit Tax Rate' : 'Add Tax Rate' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="taxForm" (ngSubmit)="save()">

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Name *</mat-label>
                <input matInput formControlName="name" placeholder="e.g. VAT 20%" />
                <mat-error *ngIf="taxForm.get('name')?.invalid && taxForm.get('name')?.touched">
                  Name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Rate *</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="rate"
                  placeholder="e.g. 20"
                  min="0"
                  max="100"
                  step="0.01"
                />
                <mat-hint>Enter percentage value (e.g. 20 for 20%)</mat-hint>
                <mat-error *ngIf="taxForm.get('rate')?.errors?.['required'] && taxForm.get('rate')?.touched">
                  Rate is required
                </mat-error>
                <mat-error *ngIf="taxForm.get('rate')?.errors?.['min'] && taxForm.get('rate')?.touched">
                  Rate must be ≥ 0
                </mat-error>
                <mat-error *ngIf="taxForm.get('rate')?.errors?.['max'] && taxForm.get('rate')?.touched">
                  Rate must be ≤ 100
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Type</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="percentage">Percentage (%)</mat-option>
                  <mat-option value="fixed">Fixed Amount</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="toggle-row">
                <mat-slide-toggle formControlName="isDefault" color="accent">
                  Set as Default Tax Rate
                </mat-slide-toggle>
                <mat-slide-toggle formControlName="isActive" color="primary">
                  Active
                </mat-slide-toggle>
              </div>

              <div class="form-actions">
                @if (editingRate) {
                  <button type="button" mat-button (click)="cancelEdit()">
                    <mat-icon>close</mat-icon> Cancel
                  </button>
                }
                <button
                  type="submit"
                  mat-raised-button
                  color="primary"
                  [disabled]="isSubmitting || taxForm.invalid"
                >
                  @if (isSubmitting) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    <mat-icon>{{ editingRate ? 'save' : 'add' }}</mat-icon>
                  }
                  {{ editingRate ? 'Update' : 'Add Tax Rate' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Tax Rates List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title>Tax Rates ({{ taxRates.length }})</mat-card-title>
            <div class="card-header-actions">
              <mat-slide-toggle
                [(ngModel)]="includeInactive"
                (change)="loadTaxRates()"
                color="accent"
              >
                Show inactive
              </mat-slide-toggle>
            </div>
          </mat-card-header>
          <mat-card-content>

            @if (isLoading) {
              <div class="center-spinner">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (taxRates.length === 0) {
              <div class="empty-state">
                <mat-icon>percent</mat-icon>
                <p>No tax rates found. Add your first one!</p>
              </div>
            } @else {
              <table mat-table [dataSource]="taxRates" class="full-width-table">

                <!-- Name Column -->
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let row">
                    <strong>{{ row.name }}</strong>
                    @if (row.isDefault) {
                      <mat-chip color="primary" highlighted class="default-chip">Default</mat-chip>
                    }
                  </td>
                </ng-container>

                <!-- Rate Column -->
                <ng-container matColumnDef="rate">
                  <th mat-header-cell *matHeaderCellDef>Rate</th>
                  <td mat-cell *matCellDef="let row">
                    <strong>{{ row.rate }}{{ row.type === 'percentage' ? '%' : ' (fixed)' }}</strong>
                  </td>
                </ng-container>

                <!-- Type Column -->
                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip [color]="row.type === 'percentage' ? 'accent' : 'warn'" highlighted>
                      {{ row.type === 'percentage' ? 'Percentage' : 'Fixed' }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row">
                    <span [class]="row.isActive ? 'status-active' : 'status-inactive'">
                      <mat-icon>{{ row.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
                      {{ row.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let row">
                    <button
                      mat-icon-button
                      color="primary"
                      matTooltip="Edit"
                      (click)="startEdit(row)"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      color="warn"
                      matTooltip="Delete"
                      (click)="confirmDelete(row)"
                      [disabled]="row.isDefault"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns;"
                  [class.row-inactive]="!row.isActive"
                ></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1280px; margin: 0 auto; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-icon { font-size: 32px; width: 32px; height: 32px; color: #1976d2; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .subtitle { margin: 0; color: #666; font-size: 14px; }

    .two-column-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .two-column-layout { grid-template-columns: 1fr; }
    }

    .full-width { width: 100%; margin-bottom: 8px; }
    .full-width-table { width: 100%; }

    .toggle-row {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 12px 0 16px;
    }

    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .card-header-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
    }

    mat-card-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .center-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px;
      color: #999;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .default-chip { margin-left: 8px; font-size: 11px; }

    .status-active, .status-inactive {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }
    .status-active { color: #2e7d32; }
    .status-inactive { color: #c62828; }
    .status-active mat-icon, .status-inactive mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .row-inactive { opacity: 0.55; }

    th.mat-header-cell { font-weight: 600; color: #333; }
  `],
})
export class TaxRatesComponent implements OnInit {
  private taxRatesService = inject(TaxRatesService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  taxRates: TaxRate[] = [];
  editingRate: TaxRate | null = null;
  isLoading = false;
  isSubmitting = false;
  includeInactive = false;

  displayedColumns = ['name', 'rate', 'type', 'status', 'actions'];

  taxForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    rate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    type: ['percentage'],
    isDefault: [false],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadTaxRates();
  }

  loadTaxRates(): void {
    this.isLoading = true;
    this.taxRatesService.getAll(this.includeInactive).subscribe({
      next: (rates) => {
        this.taxRates = rates;
        this.isLoading = false;
      },
      error: (err) => {
        this.snack('Failed to load tax rates', true);
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  save(): void {
    if (this.taxForm.invalid) return;
    this.isSubmitting = true;
    const dto: CreateTaxRateDto = this.taxForm.value;

    const obs = this.editingRate
      ? this.taxRatesService.update(this.editingRate.id, dto)
      : this.taxRatesService.create(dto);

    obs.subscribe({
      next: () => {
        this.snack(this.editingRate ? 'Tax rate updated' : 'Tax rate created');
        this.resetForm();
        this.loadTaxRates();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.snack('Failed to save tax rate', true);
        console.error(err);
        this.isSubmitting = false;
      },
    });
  }

  startEdit(rate: TaxRate): void {
    this.editingRate = rate;
    this.taxForm.patchValue({
      name: rate.name,
      rate: rate.rate,
      type: rate.type,
      isDefault: rate.isDefault,
      isActive: rate.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  confirmDelete(rate: TaxRate): void {
    if (rate.isDefault) {
      this.snack('Cannot delete the default tax rate', true);
      return;
    }
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Tax Rate', message: `Delete tax rate "${rate.name}"? This action cannot be undone.` },
      width: '450px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.taxRatesService.delete(rate.id).subscribe({
        next: () => {
          this.snack('Tax rate deleted');
          this.loadTaxRates();
        },
        error: (err) => {
          this.snack('Failed to delete tax rate', true);
          console.error(err);
        },
      });
    });
  }

  private resetForm(): void {
    this.editingRate = null;
    this.taxForm.reset({
      name: '',
      rate: 0,
      type: 'percentage',
      isDefault: false,
      isActive: true,
    });
  }

  private snack(msg: string, isError = false): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      panelClass: isError ? ['snack-error'] : ['snack-success'],
    });
  }
}
