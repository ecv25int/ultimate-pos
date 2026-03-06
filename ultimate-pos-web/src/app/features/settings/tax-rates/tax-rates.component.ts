import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaxRatesService } from '../../../core/services/tax-rates.service';
import { TaxRate, CreateTaxRateDto } from '../../../core/models/tax-rate.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-tax-rates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>Tax Rates</h2>
        <button class="btn btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ Add Tax Rate' }}
        </button>
      </div>

      <!-- Create Form -->
      <form class="form-card" *ngIf="showForm" (ngSubmit)="save()">
        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input type="text" [(ngModel)]="form.name" name="name" class="form-control" placeholder="e.g. VAT 20%" required />
          </div>
          <div class="form-group">
            <label>Rate *</label>
            <input type="number" [(ngModel)]="form.rate" name="rate" class="form-control" placeholder="20" min="0" max="100" step="0.01" required />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select [(ngModel)]="form.type" name="type" class="form-control">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div class="form-group" style="display:flex;align-items:flex-end;gap:8px">
            <label>
              <input type="checkbox" [(ngModel)]="form.isDefault" name="isDefault" />
              Set as Default
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Save Tax Rate' }}
          </button>
        </div>
        <div class="error-message" *ngIf="error">{{ error }}</div>
      </form>

      <!-- Tax Rates Table -->
      <div class="table-container" style="margin-top:16px">
        <table class="data-table" *ngIf="taxRates.length > 0; else empty">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rate</th>
              <th>Type</th>
              <th>Default</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of taxRates">
              <td>{{ t.name }}</td>
              <td>{{ t.rate }}{{ t.type === 'percentage' ? '%' : ' (fixed)' }}</td>
              <td>{{ t.type }}</td>
              <td>
                <span class="badge success" *ngIf="t.isDefault">Default</span>
              </td>
              <td>
                <span class="badge" [ngClass]="t.isActive ? 'success' : 'neutral'">
                  {{ t.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="action-link" (click)="toggleActive(t)">
                  {{ t.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button class="action-link danger" (click)="delete(t.id)" style="margin-left:8px">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <div class="empty-state">No tax rates defined yet.</div>
        </ng-template>
      </div>
    </div>
  `,
})
export class TaxRatesSettingsComponent implements OnInit {
  taxRates: TaxRate[] = [];
  showForm = false;
  saving = false;
  error = '';

  form: CreateTaxRateDto = {
    name: '',
    rate: 0,
    type: 'percentage',
    isDefault: false,
  };

  constructor(private taxRatesService: TaxRatesService, private dialog: MatDialog) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.taxRatesService.getAll(true).subscribe((rates) => (this.taxRates = rates));
  }

  save() {
    if (!this.form.name || this.form.rate === undefined) {
      this.error = 'Name and rate are required';
      return;
    }
    this.saving = true;
    this.error = '';
    this.taxRatesService.create(this.form).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.form = { name: '', rate: 0, type: 'percentage', isDefault: false };
        this.load();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to save';
        this.saving = false;
      },
    });
  }

  toggleActive(t: TaxRate) {
    this.taxRatesService
      .update(t.id, { isActive: !t.isActive })
      .subscribe(() => this.load());
  }

  delete(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Tax Rate', message: 'Delete this tax rate?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.taxRatesService.delete(id).subscribe(() => this.load());
    });
  }
}
