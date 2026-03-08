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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ProductService } from '../../../core/services/product.service';
import { Unit, CreateUnitDto } from '../../../core/models/product.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button routerLink="/products">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Units of Measurement</h1>
            <p class="subtitle">Manage units used for products</p>
          </div>
        </div>
      </div>

      <div class="two-column-layout">
        <!-- Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>straighten</mat-icon>
            <mat-card-title>{{ editingUnit ? 'Edit Unit' : 'Add Unit' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="unitForm" (ngSubmit)="saveUnit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Unit Name *</mat-label>
                <input matInput formControlName="actualName" placeholder="e.g. Kilogram" />
                <mat-error *ngIf="unitForm.get('actualName')?.invalid && unitForm.get('actualName')?.touched">
                  Unit name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Short Name *</mat-label>
                <input matInput formControlName="shortName" placeholder="e.g. kg" />
                <mat-hint>Abbreviation shown in tables</mat-hint>
                <mat-error *ngIf="unitForm.get('shortName')?.invalid && unitForm.get('shortName')?.touched">
                  Short name is required
                </mat-error>
              </mat-form-field>

              <div class="checkbox-field">
                <mat-checkbox formControlName="allowDecimal" color="primary">
                  Allow decimal quantities
                </mat-checkbox>
                <p class="field-hint">e.g. 1.5 kg vs 2 pieces</p>
              </div>

              <div class="form-actions">
                @if (editingUnit) {
                  <button type="button" mat-button (click)="cancelEdit()">Cancel</button>
                }
                <button
                  type="submit"
                  mat-raised-button
                  color="primary"
                  [disabled]="isSubmitting || unitForm.invalid"
                >
                  @if (isSubmitting) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    <mat-icon>{{ editingUnit ? 'save' : 'add' }}</mat-icon>
                  }
                  {{ editingUnit ? 'Save' : 'Add Unit' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title>All Units ({{ units.length }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (isLoading) {
              <div class="loading">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (units.length === 0) {
              <div class="empty-state">
                <mat-icon>straighten</mat-icon>
                <p>No units yet. Add your first unit of measurement.</p>
                <p class="hint">Common units: kg, g, liter, piece, box, dozen</p>
              </div>
            } @else {
              <table mat-table [dataSource]="units" class="units-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Unit Name</th>
                  <td mat-cell *matCellDef="let unit">
                    <div class="unit-name-cell">
                      <span class="unit-short">{{ unit.shortName }}</span>
                      <span class="unit-full">{{ unit.actualName }}</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="decimal">
                  <th mat-header-cell *matHeaderCellDef>Decimal</th>
                  <td mat-cell *matCellDef="let unit">
                    @if (unit.allowDecimal) {
                      <mat-chip class="yes-chip">Yes</mat-chip>
                    } @else {
                      <mat-chip class="no-chip">No</mat-chip>
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let unit">
                    <button mat-icon-button (click)="editUnit(unit)" matTooltip="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteUnit(unit)" matTooltip="Delete">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['name', 'decimal', 'actions']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name', 'decimal', 'actions'];"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .two-column-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 1.5rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .form-card, .list-card {
      border-radius: 12px;
      height: fit-content;
    }

    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    .checkbox-field {
      padding: 0.5rem 0 1rem;
    }

    .field-hint {
      margin: 0.25rem 0 0 1.9rem;
      font-size: 0.8rem;
      color: #666;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .loading, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2.5rem;
      color: #9e9e9e;
      gap: 0.5rem;
      text-align: center;

      mat-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
      }

      .hint {
        font-size: 0.8rem;
      }
    }

    .units-table {
      width: 100%;
    }

    .unit-name-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .unit-short {
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.85rem;
      min-width: 36px;
      text-align: center;
    }

    .unit-full {
      color: #333;
    }

    .yes-chip {
      background: #e8f5e9;
      color: #388e3c;
      font-size: 0.75rem;
    }

    .no-chip {
      background: #f5f5f5;
      color: #9e9e9e;
      font-size: 0.75rem;
    }
  `],
})
export class UnitsComponent implements OnInit {
  private productService = inject(ProductService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  units: Unit[] = [];
  isLoading = true;
  isSubmitting = false;
  editingUnit: Unit | null = null;

  unitForm: FormGroup;

  constructor() {
    this.unitForm = this.fb.group({
      actualName: ['', Validators.required],
      shortName: ['', Validators.required],
      allowDecimal: [false],
    });
  }

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    this.isLoading = true;
    this.productService.getAllUnits().subscribe({
      next: (units) => {
        this.units = units;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load units', 'Close', { duration: 3000 });
      },
    });
  }

  editUnit(unit: Unit): void {
    this.editingUnit = unit;
    this.unitForm.patchValue({
      actualName: unit.actualName,
      shortName: unit.shortName,
      allowDecimal: unit.allowDecimal,
    });
  }

  cancelEdit(): void {
    this.editingUnit = null;
    this.unitForm.reset({ actualName: '', shortName: '', allowDecimal: false });
  }

  saveUnit(): void {
    if (this.unitForm.invalid) {
      this.unitForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.unitForm.value;
    const data: CreateUnitDto = {
      actualName: value.actualName,
      shortName: value.shortName,
      allowDecimal: value.allowDecimal ?? false,
    };

    const request = this.editingUnit
      ? this.productService.updateUnit(this.editingUnit.id, data)
      : this.productService.createUnit(data);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        const msg = this.editingUnit ? 'Unit updated' : 'Unit created';
        this.snackBar.open(msg, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.cancelEdit();
        this.loadUnits();
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || 'Failed to save unit';
        this.snackBar.open(msg, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  deleteUnit(unit: Unit): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Unit', message: `Delete unit "${unit.actualName}"?` },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.productService.deleteUnit(unit.id).subscribe({
        next: () => {
          this.snackBar.open('Unit deleted', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.loadUnits();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to delete unit';
          this.snackBar.open(msg, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    });
  }
}
