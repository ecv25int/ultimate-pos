import { Component, OnInit, ChangeDetectionStrategy, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { ContactService } from '../../../core/services/contact.service';
import { ContactListItem } from '../../../core/models/contact.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

// ─── CSV Import Preview Dialog ────────────────────────────────────────────────
@Component({
  selector: 'app-contact-import-preview',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, MatTableModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px">upload_file</mat-icon>
      Import Preview — {{ data.rows.length }} rows
    </h2>
    <mat-dialog-content style="max-height:400px;overflow-y:auto;padding:0 24px;">
      <p style="color:#6b7280;font-size:13px;margin-bottom:12px;">
        Review the contacts below before importing. Rows missing <strong>name</strong> or <strong>mobile</strong> will be skipped.
      </p>
      <table class="prev-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Type</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>City</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of data.rows; let i = index" [class.skip-row]="!row.name || !row.mobile">
            <td>{{ i + 1 }}</td>
            <td>{{ row.type || 'customer' }}</td>
            <td>{{ row.name || '—' }}</td>
            <td>{{ row.mobile || '—' }}</td>
            <td>{{ row.email || '—' }}</td>
            <td>{{ row.city || '—' }}</td>
            <td>
              <span *ngIf="row.name && row.mobile" class="badge ok">Import</span>
              <span *ngIf="!row.name || !row.mobile" class="badge skip">Skip</span>
            </td>
          </tr>
        </tbody>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions align="end" style="padding:16px 24px;gap:8px;">
      <button mat-stroked-button (click)="dialogRef.close(false)">Cancel</button>
      <button mat-raised-button color="primary" (click)="dialogRef.close(true)">
        <mat-icon>check</mat-icon> Confirm Import ({{ validCount }} rows)
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .prev-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .prev-table th { background: #f3f4f6; padding: 6px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; }
    .prev-table td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; }
    .skip-row { opacity: 0.45; }
    .badge { padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
    .badge.ok { background: #d1fae5; color: #065f46; }
    .badge.skip { background: #fee2e2; color: #991b1b; }
  `],
})
export class ContactImportPreviewDialog {
  get validCount() { return this.data.rows.filter((r: any) => r.name && r.mobile).length; }
  constructor(
    public dialogRef: MatDialogRef<ContactImportPreviewDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { rows: any[] },
  ) {}
}
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSelectModule,
    SkeletonLoaderComponent,
  ],
  template: `
    <div class="contacts-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>Contacts</h1>
          <p class="subtitle">Manage customers and suppliers</p>
        </div>
        <div style="display:flex;gap:8px">
          <button mat-stroked-button (click)="csvInput.click()">
            <mat-icon>upload</mat-icon>
            Import CSV
          </button>
          <input #csvInput type="file" accept=".csv" style="display:none" (change)="importCsv($event)">
          <button mat-raised-button color="primary" routerLink="/contacts/create">
            <mat-icon>add</mat-icon>
            Add Contact
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <mat-icon>people</mat-icon>
          <div>
            <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
        <div class="stat-card customer">
          <mat-icon>person</mat-icon>
          <div>
            <span class="stat-value">{{ customerCount }}</span>
            <span class="stat-label">Customers</span>
          </div>
        </div>
        <div class="stat-card supplier">
          <mat-icon>local_shipping</mat-icon>
          <div>
            <span class="stat-value">{{ supplierCount }}</span>
            <span class="stat-label">Suppliers</span>
          </div>
        </div>
        <div class="stat-card inactive">
          <mat-icon>block</mat-icon>
          <div>
            <span class="stat-value">{{ inactiveCount }}</span>
            <span class="stat-label">Inactive</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search contacts</mat-label>
          <input
            matInput
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Name, mobile, email..."
          />
          <mat-icon matSuffix>search</mat-icon>
          @if (searchQuery) {
            <button matSuffix mat-icon-button (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="type-filter">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="typeFilter" (ngModelChange)="applyFilter()">
            <mat-option value="">All Types</mat-option>
            <mat-option value="customer">Customers</mat-option>
            <mat-option value="supplier">Suppliers</mat-option>
            <mat-option value="both">Both</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="status-filter">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()">
            <mat-option value="">All Statuses</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="inactive">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Table -->
      <div class="table-card">
        @if (loading) {
          <app-skeleton-loader [rows]="8" type="table"></app-skeleton-loader>
        } @else if (pagedContacts.length === 0) {
          <div class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <h3>No contacts found</h3>
            <p>{{ searchQuery || typeFilter || statusFilter ? 'Try adjusting your filters' : 'Add your first customer or supplier' }}</p>
            @if (!searchQuery && !typeFilter && !statusFilter) {
              <button mat-raised-button color="primary" routerLink="/contacts/create">
                Add Contact
              </button>
            }
          </div>
        } @else {
          <table mat-table [dataSource]="pagedContacts" class="contacts-table">
            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let c">
                <div class="contact-name-cell">
                  <div class="contact-avatar" [class]="'avatar-' + c.type">
                    {{ getInitials(c.name) }}
                  </div>
                  <div>
                    <span class="contact-name">{{ c.name }}</span>
                    @if (c.supplierBusinessName) {
                      <span class="business-name">{{ c.supplierBusinessName }}</span>
                    }
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Type Column -->
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let c">
                <span class="type-badge" [class]="'badge-' + c.type">
                  {{ c.type | titlecase }}
                </span>
              </td>
            </ng-container>

            <!-- Mobile Column -->
            <ng-container matColumnDef="mobile">
              <th mat-header-cell *matHeaderCellDef>Mobile</th>
              <td mat-cell *matCellDef="let c">{{ c.mobile }}</td>
            </ng-container>

            <!-- Email Column -->
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let c">{{ c.email || '—' }}</td>
            </ng-container>

            <!-- Location Column -->
            <ng-container matColumnDef="location">
              <th mat-header-cell *matHeaderCellDef>Location</th>
              <td mat-cell *matCellDef="let c">
                {{ getLocation(c) }}
              </td>
            </ng-container>

            <!-- Balance Column -->
            <ng-container matColumnDef="balance">
              <th mat-header-cell *matHeaderCellDef>Balance</th>
              <td mat-cell *matCellDef="let c">
                <span [class.balance-negative]="c.balance < 0" [class.balance-positive]="c.balance > 0">
                  {{ c.balance | number:'1.2-2' }}
                </span>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let c">
                <span class="status-badge" [class.status-active]="c.contactStatus === 'active'" [class.status-inactive]="c.contactStatus === 'inactive'">
                  {{ c.contactStatus | titlecase }}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let c">
                <button mat-icon-button [matMenuTriggerFor]="actionMenu" [matMenuTriggerData]="{contact: c}">
                  <mat-icon>more_vert</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-menu #actionMenu="matMenu">
            <ng-template matMenuContent let-contact="contact">
              <button mat-menu-item [routerLink]="['/contacts/detail', contact.id]">
                <mat-icon>account_balance_wallet</mat-icon>
                <span>View Ledger</span>
              </button>
              <button mat-menu-item [routerLink]="['/contacts/edit', contact.id]">
                <mat-icon>edit</mat-icon>
                <span>Edit</span>
              </button>
              <button mat-menu-item (click)="toggleStatus(contact)">
                <mat-icon>{{ contact.contactStatus === 'active' ? 'block' : 'check_circle' }}</mat-icon>
                <span>{{ contact.contactStatus === 'active' ? 'Deactivate' : 'Activate' }}</span>
              </button>
              <button mat-menu-item class="delete-action" (click)="deleteContact(contact)">
                <mat-icon>delete</mat-icon>
                <span>Delete</span>
              </button>
            </ng-template>
          </mat-menu>

          <mat-paginator
            [length]="filteredContacts.length"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          ></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .contacts-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 0; color: #666; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .stat-card mat-icon { font-size: 32px; width: 32px; height: 32px; color: #6366f1; }
    .stat-card.customer mat-icon { color: #10b981; }
    .stat-card.supplier mat-icon { color: #f59e0b; }
    .stat-card.inactive mat-icon { color: #ef4444; }
    .stat-value { display: block; font-size: 24px; font-weight: 700; }
    .stat-label { display: block; font-size: 12px; color: #666; }

    .filters-bar { display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start; }
    .search-field { flex: 1; }
    .type-filter, .status-filter { width: 160px; }

    .table-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .contacts-table { width: 100%; }

    .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px; gap: 12px; color: #999; }
    .loading-state mat-icon, .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state h3 { margin: 0; font-size: 18px; color: #555; }
    .empty-state p { margin: 0; }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .contact-name-cell { display: flex; align-items: center; gap: 12px; }
    .contact-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; color: white; flex-shrink: 0; }
    .avatar-customer { background: #10b981; }
    .avatar-supplier { background: #f59e0b; }
    .avatar-both { background: #6366f1; }
    .contact-name { display: block; font-weight: 500; }
    .business-name { display: block; font-size: 12px; color: #888; }

    .type-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge-customer { background: #d1fae5; color: #065f46; }
    .badge-supplier { background: #fef3c7; color: #92400e; }
    .badge-both { background: #ede9fe; color: #5b21b6; }

    .balance-negative { color: #ef4444; font-weight: 600; }
    .balance-positive { color: #10b981; font-weight: 600; }

    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-inactive { background: #fee2e2; color: #991b1b; }

    .delete-action { color: #ef4444; }
    .delete-action mat-icon { color: #ef4444; }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .filters-bar { flex-wrap: wrap; }
      .type-filter, .status-filter { width: 100%; }
    }
  `],
})
export class ContactsListComponent implements OnInit {
  contacts: ContactListItem[] = [];
  filteredContacts: ContactListItem[] = [];
  pagedContacts: ContactListItem[] = [];
  loading = false;

  searchQuery = '';
  typeFilter = '';
  statusFilter = '';
  pageIndex = 0;
  pageSize = 10;

  displayedColumns = ['name', 'type', 'mobile', 'email', 'location', 'balance', 'status', 'actions'];

  private searchSubject = new Subject<string>();

  get totalCount() { return this.contacts.length; }
  get customerCount() { return this.contacts.filter(c => c.type === 'customer' || c.type === 'both').length; }
  get supplierCount() { return this.contacts.filter(c => c.type === 'supplier' || c.type === 'both').length; }
  get inactiveCount() { return this.contacts.filter(c => c.contactStatus === 'inactive').length; }

  constructor(
    private contactService: ContactService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.applyFilter();
    });
    this.loadContacts();
  }

  loadContacts() {
    this.loading = true;
    this.contactService.getAll().subscribe({
      next: (data) => {
        this.contacts = data;
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.snackBar.open('Failed to load contacts', 'Close', { duration: 3000 });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  applyFilter() {
    let filtered = [...this.contacts];

    if (this.searchQuery.length >= 2) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.email?.toLowerCase().includes(q)) ||
        (c.supplierBusinessName?.toLowerCase().includes(q))
      );
    }

    if (this.typeFilter === 'customer') {
      filtered = filtered.filter(c => c.type === 'customer' || c.type === 'both');
    } else if (this.typeFilter === 'supplier') {
      filtered = filtered.filter(c => c.type === 'supplier' || c.type === 'both');
    } else if (this.typeFilter === 'both') {
      filtered = filtered.filter(c => c.type === 'both');
    }

    if (this.statusFilter) {
      filtered = filtered.filter(c => c.contactStatus === this.statusFilter);
    }

    this.filteredContacts = filtered;
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage() {
    const start = this.pageIndex * this.pageSize;
    this.pagedContacts = this.filteredContacts.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePage();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilter();
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  getLocation(c: ContactListItem): string {
    return [c.city, c.state, c.country].filter(v => !!v).join(', ') || '—';
  }

  toggleStatus(contact: ContactListItem) {
    this.contactService.toggleStatus(contact.id).subscribe({
      next: (updated) => {
        const idx = this.contacts.findIndex(c => c.id === contact.id);
        if (idx !== -1) {
          this.contacts[idx] = { ...this.contacts[idx], contactStatus: updated.contactStatus };
          this.applyFilter();
        }
        this.cdr.markForCheck();
        this.snackBar.open(
          `Contact ${updated.contactStatus === 'active' ? 'activated' : 'deactivated'}`,
          'Close', { duration: 2000 }
        );
      },
      error: () => this.snackBar.open('Failed to update status', 'Close', { duration: 3000 }),
    });
  }

  deleteContact(contact: ContactListItem) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Contact', message: `Delete "${contact.name}"? This cannot be undone.` },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.contactService.delete(contact.id).subscribe({
        next: () => {
          this.contacts = this.contacts.filter(c => c.id !== contact.id);
          this.applyFilter();
          this.cdr.markForCheck();
          this.snackBar.open('Contact deleted', 'Close', { duration: 2000 });
        },
        error: () => this.snackBar.open('Failed to delete contact', 'Close', { duration: 3000 }),
      });
    });
  }

  importCsv(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = this.parseCsv(text);
      if (!rows.length) {
        this.snackBar.open('No rows found in CSV.', 'Close', { duration: 3000 });
        return;
      }
      // Open preview dialog — commit only if user confirms
      const dialogRef = this.dialog.open(ContactImportPreviewDialog, {
        width: '780px',
        maxWidth: '95vw',
        data: { rows },
      });
      dialogRef.afterClosed().subscribe((confirmed) => {
        if (!confirmed) return;
        this.contactService.importContacts(rows).subscribe({
          next: (res) => {
            this.snackBar.open(
              `Import complete: ${res.created} created, ${res.skipped} skipped.`,
              'OK', { duration: 5000 }
            );
            this.loadContacts();
          },
          error: (err) => this.snackBar.open(err?.error?.message ?? 'Import failed.', 'Close', { duration: 5000 }),
        });
      });
      // reset so same file can be re-selected
      (event.target as HTMLInputElement).value = '';
    };
    reader.readAsText(file);
  }

  private parseCsv(text: string): Record<string, string>[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
      return row;
    }).filter(r => Object.values(r).some(v => v !== ''));
  }
}
