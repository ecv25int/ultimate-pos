import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import {
  InvoiceSettingsService,
  InvoiceLayout,
  InvoiceScheme,
} from '../../../core/services/invoice-settings.service';

type Tab = 'layouts' | 'schemes';

@Component({
  selector: 'app-invoice-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>Invoice Settings</h2>
      </div>

      <!-- Tab bar -->
      <div class="tab-bar">
        <button class="tab-btn" [class.active]="tab === 'layouts'" (click)="setTab('layouts')">
          Invoice Layouts
        </button>
        <button class="tab-btn" [class.active]="tab === 'schemes'" (click)="setTab('schemes')">
          Invoice Schemes
        </button>
      </div>

      <!-- ── LAYOUTS ────────────────────────────────────────────────────── -->
      <div *ngIf="tab === 'layouts'">
        <div class="sub-header">
          <button class="btn btn-primary" (click)="openLayoutForm()">+ Add Layout</button>
        </div>

        <!-- Layout form -->
        <form class="form-card" *ngIf="showLayoutForm" (ngSubmit)="saveLayout()">
          <h3>{{ layoutEditId ? 'Edit' : 'New' }} Invoice Layout</h3>
          <div class="form-row">
            <div class="form-group fg-2">
              <label>Layout Name *</label>
              <input type="text" [(ngModel)]="layoutForm.name" name="name"
                     class="form-control" placeholder="Default Layout" required />
            </div>
            <div class="form-group">
              <label>Heading</label>
              <input type="text" [(ngModel)]="layoutForm.invoiceHeading" name="invoiceHeading"
                     class="form-control" placeholder="TAX INVOICE" />
            </div>
            <div class="form-group">
              <label>Highlight Color</label>
              <input type="color" [(ngModel)]="layoutForm.highlightColor" name="highlightColor"
                     class="form-control color-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group fg-2">
              <label>Header Text</label>
              <textarea [(ngModel)]="layoutForm.headerText" name="headerText"
                        class="form-control" rows="2" placeholder="Text shown at top of invoice"></textarea>
            </div>
            <div class="form-group fg-2">
              <label>Footer Text</label>
              <textarea [(ngModel)]="layoutForm.footerText" name="footerText"
                        class="form-control" rows="2" placeholder="Text shown at bottom of invoice"></textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Sub-heading 1</label>
              <input type="text" [(ngModel)]="layoutForm.subHeading1" name="sh1" class="form-control" /></div>
            <div class="form-group"><label>Sub-heading 2</label>
              <input type="text" [(ngModel)]="layoutForm.subHeading2" name="sh2" class="form-control" /></div>
            <div class="form-group"><label>Sub-heading 3</label>
              <input type="text" [(ngModel)]="layoutForm.subHeading3" name="sh3" class="form-control" /></div>
          </div>
          <div class="toggles-row">
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showBusinessName" name="sbn" />&nbsp;Business Name</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showLocationName" name="sln" />&nbsp;Location Name</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showMobileNumber" name="smn" />&nbsp;Mobile</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showEmail" name="se" />&nbsp;Email</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showLogo" name="sl" />&nbsp;Logo</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showBarcode" name="sbc" />&nbsp;Barcode</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showTax1" name="st1" />&nbsp;Tax 1</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showTax2" name="st2" />&nbsp;Tax 2</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showTaxTotal" name="stt" />&nbsp;Tax Total</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.showPaymentMethods" name="spm" />&nbsp;Payment Methods</label>
            <label class="toggle"><input type="checkbox" [(ngModel)]="layoutForm.isDefault" name="isd" />&nbsp;Set as Default</label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              {{ saving ? 'Saving…' : (layoutEditId ? 'Update' : 'Create') }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="cancelLayoutForm()">Cancel</button>
          </div>
          <p class="error-msg" *ngIf="error">{{ error }}</p>
        </form>

        <!-- Layout list -->
        <div class="loading-overlay" *ngIf="loading">Loading…</div>
        <table class="data-table" *ngIf="!loading && layouts.length > 0">
          <thead><tr><th>#</th><th>Name</th><th>Heading</th><th>Default</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let l of layouts; let i = index">
              <td>{{ i+1 }}</td>
              <td>{{ l.name }}</td>
              <td>{{ l.invoiceHeading || '—' }}</td>
              <td><span class="badge" [class.badge-success]="l.isDefault" [class.badge-secondary]="!l.isDefault">{{ l.isDefault ? 'Yes' : 'No' }}</span></td>
              <td>
                <button class="btn btn-sm btn-outline" (click)="editLayout(l)">Edit</button>
                <button class="btn btn-sm btn-danger" (click)="removeLayout(l.id)" style="margin-left:4px">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="!loading && layouts.length === 0">
          No invoice layouts yet. Create one to customise your printed invoices.
        </div>
      </div>

      <!-- ── SCHEMES ────────────────────────────────────────────────────── -->
      <div *ngIf="tab === 'schemes'">
        <div class="sub-header">
          <button class="btn btn-primary" (click)="openSchemeForm()">+ Add Scheme</button>
        </div>

        <!-- Scheme form -->
        <form class="form-card" *ngIf="showSchemeForm" (ngSubmit)="saveScheme()">
          <h3>{{ schemeEditId ? 'Edit' : 'New' }} Invoice Scheme</h3>
          <div class="form-row">
            <div class="form-group fg-2">
              <label>Scheme Name *</label>
              <input type="text" [(ngModel)]="schemeForm.name" name="name"
                     class="form-control" placeholder="Sales Invoice" required />
            </div>
            <div class="form-group">
              <label>Type</label>
              <select [(ngModel)]="schemeForm.schemeType" name="schemeType" class="form-control">
                <option value="sale">Sale</option>
                <option value="purchase">Purchase</option>
                <option value="quotation">Quotation</option>
                <option value="delivery">Delivery Note</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Prefix</label>
              <input type="text" [(ngModel)]="schemeForm.prefix" name="prefix"
                     class="form-control" placeholder="INV-" />
            </div>
            <div class="form-group">
              <label>Start Number</label>
              <input type="number" [(ngModel)]="schemeForm.startNumber" name="startNumber"
                     class="form-control" min="1" />
            </div>
            <div class="form-group">
              <label>Total Digits</label>
              <input type="number" [(ngModel)]="schemeForm.totalDigits" name="totalDigits"
                     class="form-control" min="1" max="10" />
            </div>
            <div class="form-group">
              <label>Invoice Layout</label>
              <select [(ngModel)]="schemeForm.invoiceLayoutId" name="invoiceLayoutId" class="form-control">
                <option [ngValue]="undefined">— None —</option>
                <option *ngFor="let l of layouts" [ngValue]="l.id">{{ l.name }}</option>
              </select>
            </div>
          </div>
          <div class="toggles-row">
            <label class="toggle"><input type="checkbox" [(ngModel)]="schemeForm.isDefault" name="isd" />&nbsp;Set as Default</label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              {{ saving ? 'Saving…' : (schemeEditId ? 'Update' : 'Create') }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="cancelSchemeForm()">Cancel</button>
          </div>
          <p class="error-msg" *ngIf="error">{{ error }}</p>
        </form>

        <!-- Scheme list -->
        <div class="loading-overlay" *ngIf="loading">Loading…</div>
        <table class="data-table" *ngIf="!loading && schemes.length > 0">
          <thead>
            <tr><th>#</th><th>Name</th><th>Type</th><th>Prefix</th><th>Start</th><th>Digits</th><th>Layout</th><th>Default</th><th>Invoices</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of schemes; let i = index">
              <td>{{ i+1 }}</td>
              <td>{{ s.name }}</td>
              <td>{{ s.schemeType }}</td>
              <td>{{ s.prefix || '—' }}</td>
              <td>{{ s.startNumber }}</td>
              <td>{{ s.totalDigits }}</td>
              <td>{{ s.invoiceLayout?.name || '—' }}</td>
              <td><span class="badge" [class.badge-success]="s.isDefault" [class.badge-secondary]="!s.isDefault">{{ s.isDefault ? 'Yes' : 'No' }}</span></td>
              <td>{{ s.invoiceCount }}</td>
              <td>
                <button class="btn btn-sm btn-outline" (click)="editScheme(s)">Edit</button>
                <button class="btn btn-sm btn-danger" (click)="removeScheme(s.id)" style="margin-left:4px">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state" *ngIf="!loading && schemes.length === 0">
          No invoice schemes yet. Create one to control invoice numbering.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .tab-bar { display:flex; gap:0; border-bottom:2px solid #e0e0e0; margin-bottom:20px; }
    .tab-btn { padding:10px 24px; border:none; background:none; cursor:pointer; font-size:14px; font-weight:500; color:#666; border-bottom:2px solid transparent; margin-bottom:-2px; transition:all .2s; }
    .tab-btn.active { color:#1976d2; border-bottom-color:#1976d2; }
    .sub-header { display:flex; justify-content:flex-end; margin-bottom:12px; }
    .form-card { background:#f9f9f9; border:1px solid #ddd; border-radius:8px; padding:20px; margin-bottom:24px; }
    .form-card h3 { margin:0 0 16px; }
    .form-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
    .form-group { flex:1; min-width:160px; display:flex; flex-direction:column; gap:4px; }
    .fg-2 { flex:2; }
    .form-group label { font-size:13px; font-weight:500; }
    .form-control { padding:8px 10px; border:1px solid #ccc; border-radius:6px; font-size:14px; }
    .color-input { padding:4px; height:38px; }
    .toggles-row { display:flex; gap:16px; flex-wrap:wrap; margin:12px 0; }
    .toggle { display:flex; align-items:center; gap:4px; font-size:13px; cursor:pointer; }
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
    .empty-state, .loading-overlay { padding:40px; text-align:center; color:#999; }
  `],
})
export class InvoiceSettingsComponent implements OnInit {
  tab: Tab = 'layouts';
  loading = false;
  saving = false;
  error = '';

  layouts: InvoiceLayout[] = [];
  schemes: InvoiceScheme[] = [];

  // Layout form
  showLayoutForm = false;
  layoutEditId: number | null = null;
  layoutForm: Partial<InvoiceLayout> = {};

  // Scheme form
  showSchemeForm = false;
  schemeEditId: number | null = null;
  schemeForm: Partial<InvoiceScheme> = {};

  constructor(private svc: InvoiceSettingsService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadAll();
  }

  setTab(t: Tab) {
    this.tab = t;
    this.cancelLayoutForm();
    this.cancelSchemeForm();
  }

  private loadAll() {
    this.loading = true;
    this.svc.getLayouts().subscribe({ next: (d) => { this.layouts = d; this.loading = false; }, error: () => { this.loading = false; } });
    this.svc.getSchemes().subscribe({ next: (d) => { this.schemes = d; }, error: () => {} });
  }

  // ── Layouts ──
  openLayoutForm() {
    this.layoutEditId = null;
    this.layoutForm = { showBusinessName: true, showLocationName: true, showMobileNumber: true, showLogo: true, showBarcode: true, showTax1: true, showTaxTotal: true, showEmail: false, showTax2: false, showPaymentMethods: false };
    this.error = '';
    this.showLayoutForm = true;
  }

  editLayout(l: InvoiceLayout) {
    this.layoutEditId = l.id;
    this.layoutForm = { ...l };
    this.error = '';
    this.showLayoutForm = true;
  }

  cancelLayoutForm() { this.showLayoutForm = false; this.layoutEditId = null; this.error = ''; }

  saveLayout() {
    if (!this.layoutForm.name?.trim()) { this.error = 'Name is required.'; return; }
    this.saving = true; this.error = '';
    const obs = this.layoutEditId
      ? this.svc.updateLayout(this.layoutEditId, this.layoutForm)
      : this.svc.createLayout(this.layoutForm);
    obs.subscribe({ next: () => { this.saving = false; this.cancelLayoutForm(); this.loadAll(); }, error: (e) => { this.saving = false; this.error = e?.error?.message || 'Save failed.'; } });
  }

  removeLayout(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Layout', message: 'Delete this invoice layout?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteLayout(id).subscribe({ next: () => this.loadAll(), error: (e) => alert(e?.error?.message || 'Delete failed.') });
    });
  }

  // ── Schemes ──
  openSchemeForm() {
    this.schemeEditId = null;
    this.schemeForm = { schemeType: 'sale', startNumber: 1, totalDigits: 4 };
    this.error = '';
    this.showSchemeForm = true;
  }

  editScheme(s: InvoiceScheme) {
    this.schemeEditId = s.id;
    this.schemeForm = { ...s };
    this.error = '';
    this.showSchemeForm = true;
  }

  cancelSchemeForm() { this.showSchemeForm = false; this.schemeEditId = null; this.error = ''; }

  saveScheme() {
    if (!this.schemeForm.name?.trim()) { this.error = 'Name is required.'; return; }
    this.saving = true; this.error = '';
    const obs = this.schemeEditId
      ? this.svc.updateScheme(this.schemeEditId, this.schemeForm)
      : this.svc.createScheme(this.schemeForm);
    obs.subscribe({ next: () => { this.saving = false; this.cancelSchemeForm(); this.loadAll(); }, error: (e) => { this.saving = false; this.error = e?.error?.message || 'Save failed.'; } });
  }

  removeScheme(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Scheme', message: 'Delete this invoice scheme?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteScheme(id).subscribe({ next: () => this.loadAll(), error: (e) => alert(e?.error?.message || 'Delete failed.') });
    });
  }
}
