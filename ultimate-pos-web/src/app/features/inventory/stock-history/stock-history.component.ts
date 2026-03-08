import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductStockHistory, StockEntry } from '../../../core/models/inventory.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-stock-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDialogModule,
  ],
  template: `
    <div class="history-container">
      <div class="page-header">
        <button mat-icon-button routerLink="/inventory">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>Stock History</h1>
          @if (history) {
            <p class="subtitle">{{ history.product.name }} · SKU: {{ history.product.sku }}</p>
          }
        </div>
        @if (history) {
          <div class="current-stock" [class.stock-ok]="history.currentStock > 0" [class.stock-zero]="history.currentStock <= 0">
            <span class="label">Current Stock</span>
            <span class="value">{{ history.currentStock | number:'1.0-4' }}</span>
          </div>
        }
      </div>

      @if (loading) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      @if (!loading && history) {
        <div class="table-card">
          @if (history.entries.length === 0) {
            <div class="empty-state">
              <mat-icon>history</mat-icon>
              <h3>No stock entries yet</h3>
              <p>Record the first stock entry for this product.</p>
              <button mat-raised-button color="primary" [routerLink]="['/inventory/adjust']" [queryParams]="{productId: history.product.id}">
                Add Stock Entry
              </button>
            </div>
          } @else {
            <div class="table-header">
              <span>{{ history.entries.length }} entries (latest first)</span>
              <button mat-stroked-button [routerLink]="['/inventory/adjust']" [queryParams]="{productId: history.product.id}">
                <mat-icon>add</mat-icon> Add Entry
              </button>
            </div>
            <table mat-table [dataSource]="history.entries">

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let e">{{ e.createdAt | date:'dd MMM yyyy, HH:mm' }}</td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let e">
                  <span class="type-chip" [class]="'chip-' + e.entryType">
                    {{ formatType(e.entryType) }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Quantity</th>
                <td mat-cell *matCellDef="let e">
                  <span [class.qty-in]="e.quantity > 0" [class.qty-out]="e.quantity < 0">
                    {{ e.quantity > 0 ? '+' : '' }}{{ e.quantity | number:'1.0-4' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="cost">
                <th mat-header-cell *matHeaderCellDef>Unit Cost</th>
                <td mat-cell *matCellDef="let e">{{ e.unitCost != null ? ('$' + (e.unitCost | number:'1.2-2')) : '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="reference">
                <th mat-header-cell *matHeaderCellDef>Reference</th>
                <td mat-cell *matCellDef="let e">{{ e.referenceNo || '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="note">
                <th mat-header-cell *matHeaderCellDef>Note</th>
                <td mat-cell *matCellDef="let e">{{ e.note || '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let e">
                  <button mat-icon-button color="warn" (click)="deleteEntry(e)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .history-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .page-header > div:nth-child(2) { flex: 1; }
    .subtitle { margin: 0; color: #666; font-size: 0.9rem; }

    .current-stock { padding: 12px 20px; border-radius: 10px; text-align: center; min-width: 100px; }
    .current-stock .label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
    .current-stock .value { display: block; font-size: 28px; font-weight: 700; }
    .stock-ok { background: #d1fae5; color: #065f46; }
    .stock-zero { background: #fee2e2; color: #991b1b; }

    .table-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .table-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0f0f0; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px; gap: 12px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state h3 { margin: 0; color: #555; }
    .empty-state p { margin: 0; }

    .type-chip { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
    .chip-opening_stock { background: #e0e7ff; color: #3730a3; }
    .chip-purchase_in { background: #d1fae5; color: #065f46; }
    .chip-adjustment_in { background: #cffafe; color: #0e7490; }
    .chip-adjustment_out { background: #fef3c7; color: #92400e; }
    .chip-sale_out { background: #fee2e2; color: #991b1b; }
    .chip-sale_return { background: #f3e8ff; color: #6b21a8; }

    .qty-in { color: #10b981; font-weight: 600; }
    .qty-out { color: #ef4444; font-weight: 600; }

    table { width: 100%; }
  `],
})
export class StockHistoryComponent implements OnInit {
  history: ProductStockHistory | null = null;
  loading = false;
  productId!: number;
  columns = ['date', 'type', 'quantity', 'cost', 'reference', 'note', 'actions'];

  constructor(
    private route: ActivatedRoute,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.productId = +this.route.snapshot.paramMap.get('id')!;
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    this.inventoryService.getProductHistory(this.productId).subscribe({
      next: (h) => { this.history = h; this.loading = false; },
      error: () => {
        this.snackBar.open('Failed to load history', 'Close', { duration: 3000 });
        this.loading = false;
      },
    });
  }

  formatType(t: string): string {
    return t.replace(/_/g, ' ');
  }

  deleteEntry(entry: StockEntry) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Entry', message: `Delete this stock entry (${entry.quantity > 0 ? '+' : ''}${entry.quantity})?` },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.inventoryService.deleteEntry(entry.id).subscribe({
        next: () => {
          this.snackBar.open('Entry deleted', 'Close', { duration: 2000 });
          this.loadHistory();
        },
        error: () => this.snackBar.open('Failed to delete entry', 'Close', { duration: 3000 }),
      });
    });
  }
}
