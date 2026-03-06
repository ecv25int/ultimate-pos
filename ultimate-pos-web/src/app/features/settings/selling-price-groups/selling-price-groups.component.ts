import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellingPriceGroupsService } from '../../../core/services/selling-price-groups.service';
import { SellingPriceGroup, CreateSellingPriceGroupDto } from '../../../core/models/selling-price-group.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-selling-price-groups-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>Selling Price Groups</h2>
        <button class="btn btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ Add Price Group' }}
        </button>
      </div>

      <form class="form-card" *ngIf="showForm" (ngSubmit)="save()">
        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input type="text" [(ngModel)]="form.name" name="name" class="form-control"
              placeholder="e.g. Wholesale Price" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input type="text" [(ngModel)]="form.description" name="description" class="form-control" />
          </div>
          <div class="form-group" style="display:flex;align-items:flex-end">
            <label>
              <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
              Active
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
        <table class="data-table" *ngIf="groups.length > 0; else empty">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let g of groups">
              <td>{{ g.name }}</td>
              <td>{{ g.description || '—' }}</td>
              <td>
                <span class="badge" [ngClass]="g.isActive ? 'success' : 'neutral'">
                  {{ g.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="action-link" (click)="startEdit(g)">Edit</button>
                <button class="action-link danger" (click)="remove(g.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <p class="empty-state">No selling price groups defined yet.</p>
        </ng-template>
      </div>
    </div>
  `,
})
export class SellingPriceGroupsSettingsComponent implements OnInit {
  groups: SellingPriceGroup[] = [];
  showForm = false;
  saving = false;
  error = '';
  editId: number | null = null;

  form: CreateSellingPriceGroupDto = { name: '', description: '', isActive: true };

  constructor(private service: SellingPriceGroupsService, private dialog: MatDialog) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAll().subscribe({
      next: (data) => (this.groups = data),
      error: () => (this.error = 'Failed to load price groups'),
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
        this.error = 'Failed to save price group';
      },
    });
  }

  startEdit(g: SellingPriceGroup) {
    this.editId = g.id;
    this.form = { name: g.name, description: g.description, isActive: g.isActive };
    this.showForm = true;
  }

  cancelEdit() {
    this.editId = null;
    this.form = { name: '', description: '', isActive: true };
  }

  remove(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Price Group', message: 'Delete this price group?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.service.delete(id).subscribe({ next: () => this.load() });
    });
  }
}
