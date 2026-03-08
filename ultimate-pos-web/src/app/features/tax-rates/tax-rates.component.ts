import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaxRatesService } from '../../core/services/tax-rates.service';
import { TaxRate, CreateTaxRateDto } from '../../core/models/tax-rate.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-tax-rates',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatDialogModule,
    SkeletonLoaderComponent,
  ],
  template: `
    <div class="page-container">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="header-icon">percent</mat-icon>
          <div>
            <h1 class="page-title">Tax Rates</h1>
            <p class="page-subtitle">Manage tax rates applied to products and invoices</p>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      @if (isLoading) {
        <div class="stats-row">
          @for (_ of [1,2,3,4]; track $index) {
            <mat-card class="stat-card">
              <mat-card-content>
                <app-skeleton-loader [rows]="2" />
              </mat-card-content>
            </mat-card>
          }
        </div>
      } @else {
        <div class="stats-row">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon-wrap blue">
                <mat-icon>format_list_numbered</mat-icon>
              </div>
              <div class="stat-body">
                <span class="stat-value">{{ taxRates.length }}</span>
                <span class="stat-label">Total Rates</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon-wrap green">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="stat-body">
                <span class="stat-value">{{ activeCount }}</span>
                <span class="stat-label">Active Rates</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon-wrap orange">
                <mat-icon>star</mat-icon>
              </div>
              <div class="stat-body">
                <span class="stat-value">{{ defaultRate?.name ?? 'None' }}</span>
                <span class="stat-label">Default Rate</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon-wrap purple">
                <mat-icon>pie_chart</mat-icon>
              </div>
              <div class="stat-body">
                <span class="stat-value">{{ percentageCount }} / {{ fixedCount }}</span>
                <span class="stat-label">% Types / Fixed Types</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <div class="two-column-layout">

        <!-- Add / Edit Form -->
        <mat-card class="form-card" [class.editing]="!!editingRate">
          <mat-card-header>
            <div class="form-card-icon" [class.edit-mode]="!!editingRate">
              <mat-icon>{{ editingRate ? 'edit' : 'add_circle' }}</mat-icon>
            </div>
            <mat-card-title>{{ editingRate ? 'Edit Tax Rate' : 'Add Tax Rate' }}</mat-card-title>
            @if (editingRate) {
              <mat-card-subtitle>Editing: <strong>{{ editingRate.name }}</strong></mat-card-subtitle>
            }
          </mat-card-header>

          <mat-divider></mat-divider>

          <mat-card-content>
            <form [formGroup]="taxForm" (ngSubmit)="save()" class="tax-form">

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Name</mat-label>
                <mat-icon matPrefix>label</mat-icon>
                <input matInput formControlName="name" placeholder="e.g. VAT 20%" />
                @if (taxForm.get('name')?.invalid && taxForm.get('name')?.touched) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>

              <div class="rate-row">
                <mat-form-field appearance="outline" class="rate-field">
                  <mat-label>Rate</mat-label>
                  <mat-icon matPrefix>calculate</mat-icon>
                  <input
                    matInput
                    type="number"
                    formControlName="rate"
                    placeholder="e.g. 20 (0–100)"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  @if (taxForm.get('rate')?.errors?.['required'] && taxForm.get('rate')?.touched) {
                    <mat-error>Rate is required</mat-error>
                  }
                  @if (taxForm.get('rate')?.errors?.['min'] && taxForm.get('rate')?.touched) {
                    <mat-error>Rate must be ≥ 0</mat-error>
                  }
                  @if (taxForm.get('rate')?.errors?.['max'] && taxForm.get('rate')?.touched) {
                    <mat-error>Rate must be ≤ 100</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="type-field">
                  <mat-label>Type</mat-label>
                  <mat-select formControlName="type">
                    <mat-option value="percentage">
                      <mat-icon>percent</mat-icon> Percentage (%)
                    </mat-option>
                    <mat-option value="fixed">
                      <mat-icon>attach_money</mat-icon> Fixed Amount
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="toggles-card">
                <div class="toggle-item">
                  <div class="toggle-label">
                    <mat-icon>star</mat-icon>
                    <span>Default Rate</span>
                  </div>
                  <mat-slide-toggle formControlName="isDefault" color="accent"></mat-slide-toggle>
                </div>
                <mat-divider></mat-divider>
                <div class="toggle-item">
                  <div class="toggle-label">
                    <mat-icon>toggle_on</mat-icon>
                    <span>Active</span>
                  </div>
                  <mat-slide-toggle formControlName="isActive" color="primary"></mat-slide-toggle>
                </div>
              </div>

              <div class="form-actions">
                @if (editingRate) {
                  <button type="button" mat-stroked-button (click)="cancelEdit()">
                    <mat-icon>close</mat-icon> Cancel
                  </button>
                }
                <button
                  type="submit"
                  mat-raised-button
                  color="primary"
                  [disabled]="isSubmitting || taxForm.invalid"
                  class="submit-btn"
                >
                  @if (isSubmitting) {
                    <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                  } @else {
                    <mat-icon>{{ editingRate ? 'save' : 'add' }}</mat-icon>
                  }
                  {{ editingRate ? 'Update Rate' : 'Add Tax Rate' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Tax Rates List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="list-header-icon">list</mat-icon>
            <mat-card-title>Tax Rates
              <span class="count-badge">{{ filteredRates.length }}</span>
            </mat-card-title>
          </mat-card-header>

          <mat-divider></mat-divider>

          <!-- Filter Bar -->
          <div class="filter-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search rates</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [(ngModel)]="searchTerm" placeholder="Filter by name…" />
              @if (searchTerm) {
                <button matSuffix mat-icon-button (click)="searchTerm = ''" matTooltip="Clear">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <mat-slide-toggle
              [(ngModel)]="includeInactive"
              (change)="loadTaxRates()"
              color="accent"
              class="inactive-toggle"
            >
              Show inactive
            </mat-slide-toggle>
          </div>

          <mat-card-content>
            @if (isLoading) {
              <div class="skeleton-wrap">
                @for (_ of [1,2,3,4]; track $index) {
                  <app-skeleton-loader [rows]="2" />
                  <mat-divider></mat-divider>
                }
              </div>
            } @else if (taxRates.length === 0) {
              <div class="empty-state">
                <mat-icon>percent</mat-icon>
                <p>No tax rates found</p>
                <span>Add your first tax rate using the form</span>
              </div>
            } @else if (filteredRates.length === 0) {
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <p>No rates match "{{ searchTerm }}"</p>
                <button mat-stroked-button (click)="searchTerm = ''">Clear Search</button>
              </div>
            } @else {
              <table mat-table [dataSource]="filteredRates" class="rates-table">

                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let row">
                    <div class="name-cell">
                      <span class="rate-name">{{ row.name }}</span>
                      @if (row.isDefault) {
                        <span class="chip chip-default">
                          <mat-icon>star</mat-icon> Default
                        </span>
                      }
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="rate">
                  <th mat-header-cell *matHeaderCellDef>Rate</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="rate-value">
                      {{ row.rate }}{{ row.type === 'percentage' ? '%' : ' fixed' }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let row">
                    <span [class]="'chip ' + (row.type === 'percentage' ? 'chip-pct' : 'chip-fixed')">
                      <mat-icon>{{ row.type === 'percentage' ? 'percent' : 'attach_money' }}</mat-icon>
                      {{ row.type === 'percentage' ? 'Percentage' : 'Fixed' }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row">
                    <span [class]="'chip ' + (row.isActive ? 'chip-active' : 'chip-inactive')">
                      <mat-icon>{{ row.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
                      {{ row.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="actions-col">Actions</th>
                  <td mat-cell *matCellDef="let row" class="actions-col">
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
                      matTooltip="{{ row.isDefault ? 'Cannot delete the default rate' : 'Delete' }}"
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
                  [class.row-editing]="editingRate?.id === row.id"
                ></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ── Header ─────────────────────────── */
    .page-header {
      display: flex;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #1976d2;
    }
    .page-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a1a2e;
    }
    .page-subtitle {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    /* ── Stats row ───────────────────────── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1rem !important;
    }
    .stat-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }
    .blue   { background: #e3f2fd; }
    .blue mat-icon   { color: #1976d2; }
    .green  { background: #e8f5e9; }
    .green mat-icon  { color: #388e3c; }
    .orange { background: #fff3e0; }
    .orange mat-icon { color: #f57c00; }
    .purple { background: #f3e5f5; }
    .purple mat-icon { color: #7b1fa2; }

    .stat-body { display: flex; flex-direction: column; overflow: hidden; }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a1a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    /* ── Two-column layout ───────────────── */
    .two-column-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 960px) {
      .two-column-layout { grid-template-columns: 1fr; }
    }

    /* ── Form card ───────────────────────── */
    .form-card {
      position: sticky;
      top: 1rem;
      transition: box-shadow 0.2s;
    }
    .form-card.editing {
      box-shadow: 0 0 0 2px #1976d2 !important;
    }
    .form-card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #e3f2fd;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
    }
    .form-card-icon.edit-mode {
      background: #fff3e0;
    }
    .form-card-icon mat-icon { color: #1976d2; font-size: 22px; width: 22px; height: 22px; }
    .form-card-icon.edit-mode mat-icon { color: #f57c00; }

    .tax-form { padding-top: 1rem; }
    .full-width { width: 100%; }

    .rate-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .rate-field, .type-field { width: 100%; }

    .toggles-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      margin: 0.75rem 0 1rem;
    }
    .toggle-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
    }
    .toggle-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #444;
    }
    .toggle-label mat-icon { font-size: 18px; width: 18px; height: 18px; color: #888; }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    .submit-btn { min-width: 140px; }
    .btn-spinner { display: inline-block; margin-right: 4px; }

    /* ── List card ───────────────────────── */
    .list-card mat-card-header {
      display: flex;
      align-items: center;
      padding-bottom: 0;
    }
    .list-header-icon { color: #1976d2 !important; }
    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #e8eaf6;
      color: #3f51b5;
      border-radius: 12px;
      padding: 1px 8px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-left: 8px;
    }

    /* ── Filter bar ──────────────────────── */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem 0;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 180px; }
    .inactive-toggle { white-space: nowrap; }

    /* ── Skeleton ────────────────────────── */
    .skeleton-wrap {
      padding: 0 0.5rem;
    }

    /* ── Empty state ─────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 3rem 1rem;
      color: #aaa;
      text-align: center;
    }
    .empty-state mat-icon { font-size: 3rem; width: 3rem; height: 3rem; margin-bottom: 0.25rem; }
    .empty-state p { margin: 0; font-size: 1rem; color: #666; font-weight: 500; }
    .empty-state span { font-size: 0.875rem; }

    /* ── Table ───────────────────────────── */
    .rates-table { width: 100%; }
    .actions-col { text-align: right !important; width: 100px; }
    th.mat-header-cell { font-weight: 600; color: #333; font-size: 0.8rem; text-transform: uppercase; }

    .name-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .rate-name { font-weight: 600; color: #1a1a2e; }
    .rate-value { font-weight: 700; font-size: 1rem; color: #1976d2; }

    /* ── Chips ───────────────────────────── */
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.72rem;
      font-weight: 600;
      line-height: 1.6;
    }
    .chip mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .chip-default { background: #e8eaf6; color: #3f51b5; }
    .chip-pct     { background: #e3f2fd; color: #1565c0; }
    .chip-fixed   { background: #fff3e0; color: #e65100; }
    .chip-active  { background: #e8f5e9; color: #2e7d32; }
    .chip-inactive{ background: #ffebee; color: #c62828; }

    /* ── Row states ──────────────────────── */
    .row-inactive { opacity: 0.55; }
    .row-editing { background: #e8eaf6 !important; }

    @media (max-width: 600px) {
      .page-container { padding: 1rem; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .rate-row { grid-template-columns: 1fr; }
    }
  `],
})
export class TaxRatesComponent implements OnInit {
  private taxRatesService = inject(TaxRatesService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  taxRates: TaxRate[] = [];
  editingRate: TaxRate | null = null;
  isLoading = false;
  isSubmitting = false;
  includeInactive = false;
  searchTerm = '';

  displayedColumns = ['name', 'rate', 'type', 'status', 'actions'];

  taxForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    rate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    type: ['percentage'],
    isDefault: [false],
    isActive: [true],
  });

  get filteredRates(): TaxRate[] {
    if (!this.searchTerm.trim()) return this.taxRates;
    const q = this.searchTerm.toLowerCase();
    return this.taxRates.filter(r => r.name.toLowerCase().includes(q));
  }

  get activeCount(): number {
    return this.taxRates.filter(r => r.isActive).length;
  }

  get defaultRate(): TaxRate | undefined {
    return this.taxRates.find(r => r.isDefault);
  }

  get percentageCount(): number {
    return this.taxRates.filter(r => r.type === 'percentage').length;
  }

  get fixedCount(): number {
    return this.taxRates.filter(r => r.type === 'fixed').length;
  }

  ngOnInit(): void {
    this.loadTaxRates();
  }

  loadTaxRates(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.taxRatesService.getAll(this.includeInactive).subscribe({
      next: (rates) => {
        this.taxRates = rates;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.snack('Failed to load tax rates', true);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  save(): void {
    if (this.taxForm.invalid) return;
    this.isSubmitting = true;
    this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.snack('Failed to save tax rate', true);
        this.isSubmitting = false;
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
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
      data: {
        title: 'Delete Tax Rate',
        message: `Delete tax rate "${rate.name}"? This action cannot be undone.`,
      },
      width: '450px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.taxRatesService.delete(rate.id).subscribe({
        next: () => {
          this.snack('Tax rate deleted');
          this.loadTaxRates();
        },
        error: () => {
          this.snack('Failed to delete tax rate', true);
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
    this.cdr.markForCheck();
  }

  private snack(msg: string, isError = false): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      panelClass: isError ? ['snack-error'] : ['snack-success'],
    });
  }
}
