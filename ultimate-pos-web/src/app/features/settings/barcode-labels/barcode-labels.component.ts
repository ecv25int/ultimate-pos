import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarcodeService } from '../../../core/services/barcode.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import {
  BarcodeLabel,
  CreateBarcodeLabelDto,
} from '../../../core/models/stock-adjustment.model';

@Component({
  selector: 'app-barcode-labels-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>Barcode Label Templates</h2>
        <button class="btn btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ Add Template' }}
        </button>
      </div>

      <form class="form-card" *ngIf="showForm" (ngSubmit)="save()">
        <div class="form-row">
          <div class="form-group">
            <label>Template Name *</label>
            <input type="text" [(ngModel)]="form.name" name="name"
              class="form-control" placeholder="e.g. Standard 50x25mm" required />
          </div>
          <div class="form-group">
            <label>Sticker Type</label>
            <select [(ngModel)]="form.stickerType" name="stickerType" class="form-control">
              <option value="name_price">Name + Price</option>
              <option value="name_sku_price">Name + SKU + Price</option>
              <option value="name_sku">Name + SKU</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div class="form-group">
            <label>Barcode Type</label>
            <select [(ngModel)]="form.barcodeType" name="barcodeType" class="form-control">
              <option value="C128">Code 128</option>
              <option value="C39">Code 39</option>
              <option value="EAN13">EAN-13</option>
              <option value="UPCA">UPC-A</option>
              <option value="QR">QR Code</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Label Width (mm)</label>
            <input type="number" [(ngModel)]="form.width" name="width"
              class="form-control" min="1" step="0.5" placeholder="50" />
          </div>
          <div class="form-group">
            <label>Label Height (mm)</label>
            <input type="number" [(ngModel)]="form.height" name="height"
              class="form-control" min="1" step="0.5" placeholder="25" />
          </div>
          <div class="form-group">
            <label>Paper Width (mm)</label>
            <input type="number" [(ngModel)]="form.paperWidth" name="paperWidth"
              class="form-control" min="1" step="0.5" placeholder="210" />
          </div>
          <div class="form-group">
            <label>Paper Height (mm)</label>
            <input type="number" [(ngModel)]="form.paperHeight" name="paperHeight"
              class="form-control" min="1" step="0.5" placeholder="297" />
          </div>
          <div class="form-group">
            <label>Font Size (px)</label>
            <input type="number" [(ngModel)]="form.fontSize" name="fontSize"
              class="form-control" min="6" max="72" placeholder="12" />
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea [(ngModel)]="form.description" name="description"
            class="form-control" rows="2" placeholder="Optional description..."></textarea>
        </div>
        <div class="form-group form-check">
          <input type="checkbox" [(ngModel)]="form.isDefault" name="isDefault" id="isDefault" />
          <label for="isDefault" style="margin-left:8px">Set as default template</label>
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
        <table class="data-table" *ngIf="labels.length > 0; else empty">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sticker Type</th>
              <th>Barcode Type</th>
              <th>Size (W×H mm)</th>
              <th>Font Size</th>
              <th>Default</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let label of labels">
              <td>{{ label.name }}</td>
              <td>{{ label.stickerType | titlecase }}</td>
              <td>{{ label.barcodeType }}</td>
              <td>
                <span *ngIf="label.width && label.height">
                  {{ label.width }}×{{ label.height }}
                </span>
                <span *ngIf="!label.width || !label.height">—</span>
              </td>
              <td>{{ label.fontSize || '—' }}</td>
              <td>
                <span class="badge" *ngIf="label.isDefault">Default</span>
              </td>
              <td>
                <button class="btn btn-sm btn-secondary" (click)="edit(label)">Edit</button>
                <button class="btn btn-sm btn-danger" (click)="delete(label.id)"
                  style="margin-left:8px">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <p class="empty-message">No label templates yet. Add one to start customizing barcode printing.</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-header h2 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .form-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 1.5rem; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .form-group { flex: 1; min-width: 160px; margin-bottom: 12px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #374151; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
    .form-check { display: flex; align-items: center; }
    .form-actions { display: flex; gap: 8px; margin-top: 8px; }
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .btn-primary { background: #1976d2; color: white; }
    .btn-secondary { background: #e5e7eb; color: #374151; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-sm { padding: 4px 10px; font-size: 12px; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-message { color: #dc2626; font-size: 13px; margin-top: 8px; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th, .data-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; text-align: left; }
    .data-table th { background: #f9fafb; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .badge { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .empty-message { color: #9ca3af; font-size: 14px; text-align: center; padding: 32px; }
  `],
})
export class BarcodeLabelsSettingsComponent implements OnInit {
  labels: BarcodeLabel[] = [];
  showForm = false;
  saving = false;
  error = '';
  editId: number | null = null;

  form: CreateBarcodeLabelDto = {
    name: '',
    stickerType: 'name_price',
    barcodeType: 'C128',
    isDefault: false,
  };

  constructor(private barcodeService: BarcodeService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadLabels();
  }

  loadLabels(): void {
    this.barcodeService.getAllLabels().subscribe({
      next: (data) => (this.labels = data),
      error: () => (this.error = 'Failed to load label templates.'),
    });
  }

  edit(label: BarcodeLabel): void {
    this.editId = label.id;
    this.form = {
      name: label.name,
      description: label.description,
      stickerType: label.stickerType,
      barcodeType: label.barcodeType,
      width: label.width,
      height: label.height,
      paperWidth: label.paperWidth,
      paperHeight: label.paperHeight,
      fontSize: label.fontSize,
      isDefault: label.isDefault,
    };
    this.showForm = true;
    this.error = '';
  }

  cancelEdit(): void {
    this.editId = null;
    this.showForm = false;
    this.form = { name: '', stickerType: 'name_price', barcodeType: 'C128', isDefault: false };
    this.error = '';
  }

  save(): void {
    if (!this.form.name?.trim()) return;
    this.saving = true;
    this.error = '';

    const obs$ = this.editId
      ? this.barcodeService.updateLabel(this.editId, this.form)
      : this.barcodeService.createLabel(this.form);

    obs$.subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.loadLabels();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Failed to save label template.';
      },
    });
  }

  delete(id: number): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Label', message: 'Delete this label template?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.barcodeService.deleteLabel(id).subscribe({
        next: () => this.loadLabels(),
        error: () => (this.error = 'Failed to delete label template.'),
      });
    });
  }
}
