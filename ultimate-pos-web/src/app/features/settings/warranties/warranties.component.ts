import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarrantiesService } from '../../../core/services/warranties.service';
import { Warranty, CreateWarrantyDto, DurationType } from '../../../core/models/warranty.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-warranties-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>Warranties</h2>
        <button class="btn btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ Add Warranty' }}
        </button>
      </div>

      <form class="form-card" *ngIf="showForm" (ngSubmit)="save()">
        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input type="text" [(ngModel)]="form.name" name="name" class="form-control"
              placeholder="e.g. 1 Year Manufacturer Warranty" required />
          </div>
          <div class="form-group">
            <label>Duration *</label>
            <input type="number" [(ngModel)]="form.duration" name="duration" class="form-control"
              min="1" required />
          </div>
          <div class="form-group">
            <label>Duration Type *</label>
            <select [(ngModel)]="form.durationType" name="durationType" class="form-control" required>
              <option value="days">Days</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea [(ngModel)]="form.description" name="description" class="form-control" rows="2"></textarea>
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
        <table class="data-table" *ngIf="warranties.length > 0; else empty">
          <thead>
            <tr>
              <th>Name</th>
              <th>Duration</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let w of warranties">
              <td>{{ w.name }}</td>
              <td>{{ w.duration }} {{ w.durationType }}</td>
              <td>{{ w.description || '—' }}</td>
              <td>
                <button class="action-link" (click)="startEdit(w)">Edit</button>
                <button class="action-link danger" (click)="remove(w.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <p class="empty-state">No warranties defined yet.</p>
        </ng-template>
      </div>
    </div>
  `,
})
export class WarrantiesSettingsComponent implements OnInit {
  warranties: Warranty[] = [];
  showForm = false;
  saving = false;
  error = '';
  editId: number | null = null;

  form: CreateWarrantyDto = { name: '', duration: 1, durationType: 'months' };

  constructor(private service: WarrantiesService, private dialog: MatDialog) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAll().subscribe({
      next: (data) => (this.warranties = data),
      error: () => (this.error = 'Failed to load warranties'),
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
        this.error = 'Failed to save warranty';
      },
    });
  }

  startEdit(w: Warranty) {
    this.editId = w.id;
    this.form = { name: w.name, description: w.description, duration: w.duration, durationType: w.durationType };
    this.showForm = true;
  }

  cancelEdit() {
    this.editId = null;
    this.form = { name: '', duration: 1, durationType: 'months' };
  }

  remove(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Warranty', message: 'Delete this warranty?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.service.delete(id).subscribe({ next: () => this.load() });
    });
  }
}
