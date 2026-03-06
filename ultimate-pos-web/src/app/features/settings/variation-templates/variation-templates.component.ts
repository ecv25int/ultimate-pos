import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VariationsService } from '../../../core/services/variations.service';
import { VariationTemplate } from '../../../core/models/variation.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-variation-templates-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>Variation Templates</h2>
        <button class="btn btn-primary" (click)="toggleForm()">
          {{ showForm ? 'Cancel' : '+ Add Template' }}
        </button>
      </div>

      <form class="form-card" *ngIf="showForm" (ngSubmit)="save()">
        <div class="form-row">
          <div class="form-group">
            <label>Template Name *</label>
            <input type="text" [(ngModel)]="formName" name="name" class="form-control"
              placeholder="e.g. Color, Size" required />
          </div>
        </div>
        <div class="form-group">
          <label>Values</label>
          <div class="tag-input-row" *ngFor="let v of formValues; let i = index">
            <input type="text" [(ngModel)]="formValues[i]" [name]="'val_' + i"
              class="form-control" placeholder="e.g. Red" />
            <button type="button" class="btn btn-secondary" (click)="removeValue(i)">✕</button>
          </div>
          <button type="button" class="btn btn-secondary" style="margin-top:8px" (click)="addValue()">
            + Add Value
          </button>
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
        <table class="data-table" *ngIf="templates.length > 0; else empty">
          <thead>
            <tr>
              <th>Name</th>
              <th>Values</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of templates">
              <td>{{ t.name }}</td>
              <td>
                <span class="tag" *ngFor="let v of t.variationValues">{{ v.name }}</span>
                <span *ngIf="!t.variationValues?.length">—</span>
              </td>
              <td>
                <button class="action-link" (click)="startEdit(t)">Edit</button>
                <button class="action-link danger" (click)="remove(t.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <p class="empty-state">No variation templates defined yet.</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .tag-input-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
    .tag { display: inline-block; background: #e8eaf6; padding: 2px 8px; border-radius: 12px;
           font-size: 12px; margin-right: 4px; }
  `],
})
export class VariationTemplatesSettingsComponent implements OnInit {
  templates: VariationTemplate[] = [];
  showForm = false;
  saving = false;
  error = '';
  editId: number | null = null;

  formName = '';
  formValues: string[] = [''];

  constructor(private service: VariationsService, private dialog: MatDialog) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAllTemplates().subscribe({
      next: (data) => (this.templates = data),
      error: () => (this.error = 'Failed to load variation templates'),
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.cancelEdit();
  }

  addValue() {
    this.formValues.push('');
  }

  removeValue(i: number) {
    this.formValues.splice(i, 1);
  }

  save() {
    this.saving = true;
    this.error = '';
    const values = this.formValues.filter((v) => v.trim());
    const payload = { name: this.formName, values };

    const req = this.editId
      ? this.service.updateTemplate(this.editId, payload)
      : this.service.createTemplate(payload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save variation template';
      },
    });
  }

  startEdit(t: VariationTemplate) {
    this.editId = t.id;
    this.formName = t.name;
    this.formValues = t.variationValues?.map((v: {name: string}) => v.name) ?? [''];
    this.showForm = true;
  }

  cancelEdit() {
    this.editId = null;
    this.formName = '';
    this.formValues = [''];
  }

  remove(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Template', message: 'Delete this variation template?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.service.deleteTemplate(id).subscribe({ next: () => this.load() });
    });
  }
}
