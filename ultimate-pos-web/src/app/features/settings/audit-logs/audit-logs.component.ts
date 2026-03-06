import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogsService, AuditLogEntry } from '../../../core/services/audit-logs.service';

@Component({
  selector: 'app-audit-logs-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Audit Log</h2>
          <p>Track all create, update, and delete actions in your system</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <select [(ngModel)]="entityFilter" (ngModelChange)="page = 1; load()" class="filter-select">
          <option value="">All Entities</option>
          <option value="Sale">Sale</option>
          <option value="Purchase">Purchase</option>
          <option value="Product">Product</option>
          <option value="Contact">Contact</option>
        </select>
        <select [(ngModel)]="actionFilter" (ngModelChange)="page = 1; load()" class="filter-select">
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="VIEW">View</option>
        </select>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <div *ngIf="loading" class="loading">Loading…</div>
        <table class="log-table" *ngIf="!loading">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Entity</th>
              <th>ID</th>
              <th>User ID</th>
              <th>Meta</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of entries">
              <td>{{ e.createdAt | date:'short' }}</td>
              <td><span class="badge" [ngClass]="actionClass(e.action)">{{ e.action }}</span></td>
              <td>{{ e.entity }}</td>
              <td>{{ e.entityId ?? '—' }}</td>
              <td>{{ e.userId ?? '—' }}</td>
              <td class="meta-cell">{{ e.meta ? (e.meta | json) : '—' }}</td>
              <td>{{ e.ip ?? '—' }}</td>
            </tr>
            <tr *ngIf="entries.length === 0">
              <td colspan="7" class="empty">No audit log entries found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button (click)="prevPage()" [disabled]="page <= 1" class="btn btn-sm">Prev</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button (click)="nextPage()" [disabled]="page >= totalPages" class="btn btn-sm">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 16px; }
    .page-header h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; }
    .page-header p { margin: 0 0 16px; color: #6b7280; font-size: 14px; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; }
    .filter-select { padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
    .table-wrap { overflow-x: auto; }
    .log-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .log-table th, .log-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f3f4f6; }
    .log-table th { background: #f9fafb; font-weight: 600; color: #374151; }
    .meta-cell { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; font-size: 12px; color: #6b7280; }
    .badge { padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; }
    .badge.create { background: #d1fae5; color: #065f46; }
    .badge.update { background: #dbeafe; color: #1e40af; }
    .badge.delete { background: #fee2e2; color: #991b1b; }
    .badge.view { background: #f3f4f6; color: #374151; }
    .empty { text-align: center; color: #9ca3af; padding: 32px; }
    .loading { padding: 32px; text-align: center; color: #6b7280; }
    .pagination { display: flex; align-items: center; gap: 10px; margin-top: 12px; justify-content: center; }
    .btn { padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; border: 1px solid #d1d5db; background: #f9fafb; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class AuditLogsSettingsComponent implements OnInit {
  entries: AuditLogEntry[] = [];
  loading = false;
  page = 1;
  limit = 30;
  total = 0;
  totalPages = 1;
  entityFilter = '';
  actionFilter = '';

  constructor(
    private auditLogsService: AuditLogsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.auditLogsService.getLogs({
      entity: this.entityFilter || undefined,
      action: this.actionFilter || undefined,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: res => {
        this.entries = res.data;
        this.total = res.total;
        this.totalPages = res.totalPages;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  prevPage() { if (this.page > 1) { this.page--; this.load(); } }
  nextPage() { if (this.page < this.totalPages) { this.page++; this.load(); } }

  actionClass(a: string) {
    return { [a.toLowerCase()]: true };
  }
}
