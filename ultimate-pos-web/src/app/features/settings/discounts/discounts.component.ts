import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscountsService } from '../../../core/services/discounts.service';
import { Discount, CreateDiscountDto } from '../../../core/models/discount.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-discounts-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>Discounts</h2>
        <button class="btn btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ Add Discount' }}
        </button>
      </div>

      <form class="form-card" *ngIf="showForm" (ngSubmit)="save()">
        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input type="text" [(ngModel)]="form.name" name="name" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Discount Type *</label>
            <select [(ngModel)]="form.discountType" name="discountType" class="form-control" required>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div class="form-group">
            <label>Discount Amount *</label>
            <input type="number" [(ngModel)]="form.discountAmount" name="discountAmount"
              class="form-control" min="0" step="0.01" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Starts At</label>
            <input type="date" [(ngModel)]="form.startsAt" name="startsAt" class="form-control" />
          </div>
          <div class="form-group">
            <label>Ends At</label>
            <input type="date" [(ngModel)]="form.endsAt" name="endsAt" class="form-control" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
              Active
            </label>
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" [(ngModel)]="form.applicableInSpg" name="applicableInSpg" />
              Applicable in Selling Price Groups
            </label>
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" [(ngModel)]="form.applicableInCg" name="applicableInCg" />
              Applicable in Customer Groups
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? 'Saving...' : (editId ? 'Update' : 'Save') }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Cancel</button>
        </div>
        <div class="error-message" *ngIf="error">{{ error }}</div>
      </form>

      <div class="table-container" style="margin-top:16px">
        <table class="data-table" *ngIf="discounts.length > 0; else empty">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Period</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of discounts">
              <td>{{ d.name }}</td>
              <td>{{ d.discountType }}</td>
              <td>{{ d.discountType === 'percentage' ? d.discountAmount + '%' : d.discountAmount }}</td>
              <td>
                <span *ngIf="d.startsAt || d.endsAt">
                  {{ d.startsAt ? (d.startsAt | date:'mediumDate') : '∞' }}
                  — {{ d.endsAt ? (d.endsAt | date:'mediumDate') : '∞' }}
                </span>
                <span *ngIf="!d.startsAt && !d.endsAt">Always</span>
              </td>
              <td>
                <span [class]="d.isActive ? 'badge-active' : 'badge-inactive'">
                  {{ d.isActive ? 'Yes' : 'No' }}
                </span>
              </td>
              <td>
                <button class="action-link" (click)="startEdit(d)">Edit</button>
                <button class="action-link danger" (click)="remove(d.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <p class="empty-state">No discounts defined yet.</p>
        </ng-template>
      </div>
    </div>
  `,
})
export class DiscountsSettingsComponent implements OnInit {
  discounts: Discount[] = [];
  showForm = false;
  saving = false;
  error = '';
  editId: number | null = null;

  form: CreateDiscountDto = {
    name: '',
    discountType: 'percentage',
    discountAmount: 0,
    isActive: true,
    applicableInSpg: false,
    applicableInCg: false,
  };

  constructor(private service: DiscountsService, private dialog: MatDialog) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAll().subscribe({
      next: (data) => (this.discounts = data),
      error: () => (this.error = 'Failed to load discounts'),
    });
  }

  save() {
    this.saving = true;
    this.error = '';
    const req = this.editId
      ? this.service.update(this.editId, this.form)
      : this.service.create(this.form);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save discount';
      },
    });
  }

  startEdit(d: Discount) {
    this.editId = d.id;
    this.form = {
      name: d.name,
      discountType: d.discountType,
      discountAmount: d.discountAmount,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      isActive: d.isActive,
      applicableInSpg: d.applicableInSpg,
      applicableInCg: d.applicableInCg,
    };
    this.showForm = true;
  }

  cancelEdit() {
    this.editId = null;
    this.form = {
      name: '',
      discountType: 'percentage',
      discountAmount: 0,
      isActive: true,
      applicableInSpg: false,
      applicableInCg: false,
    };
  }

  remove(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Discount', message: 'Delete this discount?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.service.delete(id).subscribe({ next: () => this.load() });
    });
  }
}
