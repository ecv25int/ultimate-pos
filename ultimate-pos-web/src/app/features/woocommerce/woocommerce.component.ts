import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WoocommerceService } from '../../core/services/woocommerce.service';
import { WoocommerceSyncLog, WoocommerceStats } from '../../core/models/woocommerce.model';

@Component({
  selector: 'app-woocommerce',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule,
    MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>WooCommerce Sync</h1>
        <button mat-raised-button color="warn" (click)="clearLogs()">
          <mat-icon>delete_sweep</mat-icon> Clear All Logs
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar" *ngIf="stats()">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ stats()!.totalLogs }}</div>
            <div class="stat-label">Total Logs</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ stats()!.created }}</div>
            <div class="stat-label">Created</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ stats()!.updated }}</div>
            <div class="stat-label">Updated</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Filter -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Filter by Sync Type</mat-label>
              <mat-select [(value)]="selectedSyncType" (selectionChange)="onSyncTypeChange()">
                <mat-option value="">All</mat-option>
                <mat-option value="products">Products</mat-option>
                <mat-option value="orders">Orders</mat-option>
                <mat-option value="customers">Customers</mat-option>
                <mat-option value="categories">Categories</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Logs Table -->
      <mat-card>
        <mat-card-content>
          <div *ngIf="loading()" class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
          <table mat-table [dataSource]="logs()" *ngIf="!loading()">
            <ng-container matColumnDef="syncType">
              <th mat-header-cell *matHeaderCellDef>Sync Type</th>
              <td mat-cell *matCellDef="let r">{{ r.syncType }}</td>
            </ng-container>
            <ng-container matColumnDef="operationType">
              <th mat-header-cell *matHeaderCellDef>Operation</th>
              <td mat-cell *matCellDef="let r"><mat-chip>{{ r.operationType }}</mat-chip></td>
            </ng-container>
            <ng-container matColumnDef="createdBy">
              <th mat-header-cell *matHeaderCellDef>Created By</th>
              <td mat-cell *matCellDef="let r">{{ r.createdBy }}</td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'medium' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="logCols"></tr>
            <tr mat-row *matRowDef="let row; columns: logCols;"></tr>
          </table>
          <p *ngIf="!loading() && logs().length === 0" class="empty-state">No sync logs found.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .stats-bar { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card { min-width: 140px; }
    .stat-value { font-size: 1.8rem; font-weight: 700; }
    .stat-label { font-size: 0.85rem; color: #666; }
    .filter-card { margin-bottom: 16px; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .loading-container { display: flex; justify-content: center; padding: 24px; }
    .empty-state { text-align: center; color: #999; padding: 24px; }
    mat-form-field { min-width: 200px; }
    table { width: 100%; }
  `],
})
export class WoocommerceComponent implements OnInit {
  private svc = inject(WoocommerceService);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  stats = signal<WoocommerceStats | null>(null);
  logs = signal<WoocommerceSyncLog[]>([]);
  selectedSyncType = '';

  logCols = ['syncType', 'operationType', 'createdBy', 'createdAt'];

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.svc.getStats().subscribe(s => this.stats.set(s));
    this.svc.getSyncLogs(this.selectedSyncType || undefined).subscribe(d => { this.logs.set(d); this.loading.set(false); });
  }

  onSyncTypeChange() { this.loadAll(); }

  clearLogs() {
    this.svc.clearSyncLogs().subscribe({
      next: () => { this.snack.open('Logs cleared', 'Close', { duration: 2000 }); this.loadAll(); },
      error: () => this.snack.open('Error', 'Close', { duration: 3000 }),
    });
  }
}
