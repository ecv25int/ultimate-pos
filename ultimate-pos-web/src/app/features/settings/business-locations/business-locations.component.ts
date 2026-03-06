import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import {
  BusinessLocation,
  CreateBusinessLocationDto,
} from '../../../core/models/business.model';

@Component({
  selector: 'app-business-locations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>Business Locations</h2>
        <button class="btn btn-primary" (click)="openForm()">+ Add Location</button>
      </div>

      <!-- Create / Edit Form -->
      <form class="form-card" *ngIf="showForm" (ngSubmit)="save()">
        <h3>{{ editId ? 'Edit' : 'New' }} Location</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input type="text" [(ngModel)]="form.name" name="name" class="form-control"
                   placeholder="Main Branch" required />
          </div>
          <div class="form-group">
            <label>City / Landmark</label>
            <input type="text" [(ngModel)]="form.landmarkCity" name="landmarkCity"
                   class="form-control" placeholder="City" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>State</label>
            <input type="text" [(ngModel)]="form.state" name="state" class="form-control" />
          </div>
          <div class="form-group">
            <label>Country</label>
            <input type="text" [(ngModel)]="form.country" name="country" class="form-control" />
          </div>
          <div class="form-group">
            <label>Zip Code</label>
            <input type="text" [(ngModel)]="form.zipCode" name="zipCode" class="form-control" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Mobile</label>
            <input type="text" [(ngModel)]="form.mobile" name="mobile" class="form-control" />
          </div>
          <div class="form-group">
            <label>Alternate Number</label>
            <input type="text" [(ngModel)]="form.alternateNumber" name="alternateNumber"
                   class="form-control" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="form.email" name="email" class="form-control" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Website</label>
            <input type="url" [(ngModel)]="form.website" name="website" class="form-control" />
          </div>
          <div class="form-group toggle-group">
            <label>
              <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
              &nbsp;Active
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? 'Saving…' : (editId ? 'Update' : 'Create') }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
        </div>
        <p class="error-msg" *ngIf="error">{{ error }}</p>
      </form>

      <!-- Locations Table -->
      <div class="loading-overlay" *ngIf="loading">Loading…</div>
      <table class="data-table" *ngIf="!loading && locations.length > 0">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>City</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let loc of locations; let i = index">
            <td>{{ i + 1 }}</td>
            <td>{{ loc.name }}</td>
            <td>{{ loc.landmarkCity || '—' }}</td>
            <td>{{ loc.mobile || '—' }}</td>
            <td>{{ loc.email || '—' }}</td>
            <td>
              <span class="badge" [class.badge-success]="loc.isActive"
                    [class.badge-secondary]="!loc.isActive">
                {{ loc.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline" (click)="editLocation(loc)">Edit</button>
              <button class="btn btn-sm btn-danger" (click)="remove(loc.id)"
                      style="margin-left:4px">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" *ngIf="!loading && locations.length === 0">
        No locations yet. Click "Add Location" to create the first one.
      </div>
    </div>
  `,
  styles: [`
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .form-card { background:#f9f9f9; border:1px solid #ddd; border-radius:8px; padding:20px; margin-bottom:24px; }
    .form-card h3 { margin:0 0 16px; }
    .form-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
    .form-group { flex:1; min-width:180px; display:flex; flex-direction:column; gap:4px; }
    .form-group label { font-size:13px; font-weight:500; }
    .form-control { padding:8px 10px; border:1px solid #ccc; border-radius:6px; font-size:14px; }
    .toggle-group { justify-content:flex-end; padding-top:22px; }
    .form-actions { display:flex; gap:8px; margin-top:8px; }
    .btn { padding:8px 18px; border-radius:6px; border:none; cursor:pointer; font-size:14px; font-weight:500; }
    .btn-primary { background:#1976d2; color:#fff; }
    .btn-secondary { background:#9e9e9e; color:#fff; }
    .btn-danger { background:#e53935; color:#fff; }
    .btn-outline { background:#fff; border:1px solid #1976d2; color:#1976d2; }
    .btn-sm { padding:5px 12px; font-size:13px; }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
    .error-msg { color:#e53935; font-size:13px; margin-top:8px; }
    .data-table { width:100%; border-collapse:collapse; font-size:14px; }
    .data-table th, .data-table td { padding:10px 12px; border-bottom:1px solid #eee; text-align:left; }
    .data-table th { background:#f5f5f5; font-weight:600; }
    .badge { padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600; }
    .badge-success { background:#e8f5e9; color:#2e7d32; }
    .badge-secondary { background:#f5f5f5; color:#757575; }
    .empty-state { padding:40px; text-align:center; color:#999; }
    .loading-overlay { padding:40px; text-align:center; color:#aaa; }
  `],
})
export class BusinessLocationsSettingsComponent implements OnInit {
  locations: BusinessLocation[] = [];
  loading = false;
  saving = false;
  error = '';
  showForm = false;
  editId: number | null = null;

  form: CreateBusinessLocationDto = { name: '' };

  constructor(private svc: BusinessService, private dialog: MatDialog) {}

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading = true;
    this.svc.getLocations().subscribe({
      next: (data) => { this.locations = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openForm() {
    this.editId = null;
    this.form = { name: '', isActive: true };
    this.error = '';
    this.showForm = true;
  }

  editLocation(loc: BusinessLocation) {
    this.editId = loc.id;
    this.form = {
      name: loc.name,
      landmarkCity: loc.landmarkCity,
      state: loc.state,
      country: loc.country,
      zipCode: loc.zipCode,
      mobile: loc.mobile,
      alternateNumber: loc.alternateNumber,
      email: loc.email,
      website: loc.website,
      isActive: loc.isActive,
    };
    this.error = '';
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelForm() {
    this.showForm = false;
    this.editId = null;
    this.error = '';
  }

  save() {
    if (!this.form.name?.trim()) { this.error = 'Name is required.'; return; }
    this.saving = true;
    this.error = '';
    const obs = this.editId
      ? this.svc.updateLocation(this.editId, this.form)
      : this.svc.createLocation(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.cancelForm(); this.load(); },
      error: (e) => { this.saving = false; this.error = e?.error?.message || 'Save failed.'; },
    });
  }

  remove(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Location', message: 'Delete this location?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteLocation(id).subscribe({
        next: () => this.load(),
        error: (e) => alert(e?.error?.message || 'Delete failed.'),
      });
    });
  }
}
