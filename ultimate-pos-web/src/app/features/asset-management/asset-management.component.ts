import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AssetManagementService } from '../../core/services/asset-management.service';
import { Asset, AssetTransaction, AssetMaintenance, AssetDashboard } from '../../core/models/asset-management.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-asset-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Asset Management</h1>
      </div>

      <!-- Dashboard Cards -->
      <div class="dashboard-cards" *ngIf="dashboard()">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.totalAssets }}</div>
            <div class="stat-label">Total Assets</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.allocatedCount }}</div>
            <div class="stat-label">Allocated</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card warn">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.maintenancePending }}</div>
            <div class="stat-label">Maintenance Pending</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card warn">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.expiringWarranties }}</div>
            <div class="stat-label">Warranties Expiring (30d)</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <!-- ASSETS TAB -->
        <mat-tab label="Assets">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>
                {{ editingAssetId() ? 'Edit Asset' : 'New Asset' }}
              </mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="assetForm" (ngSubmit)="submitAsset()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Asset Code</mat-label>
                      <input matInput formControlName="assetCode" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Quantity</mat-label>
                      <input matInput type="number" formControlName="quantity" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Unit Price</mat-label>
                      <input matInput type="number" formControlName="unitPrice" />
                    </mat-form-field>
                  </div>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Model</mat-label>
                      <input matInput formControlName="model" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Serial No.</mat-label>
                      <input matInput formControlName="serialNo" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Depreciation %</mat-label>
                      <input matInput type="number" formControlName="depreciation" />
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description</mat-label>
                    <textarea matInput rows="2" formControlName="description"></textarea>
                  </mat-form-field>
                  <mat-checkbox formControlName="isAllocatable">Allocatable</mat-checkbox>
                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="assetForm.invalid || saving()">
                      {{ editingAssetId() ? 'Update Asset' : 'Create Asset' }}
                    </button>
                    <button *ngIf="editingAssetId()" mat-stroked-button type="button" (click)="cancelAssetEdit()">Cancel</button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title>Assets ({{ assets().length }})</mat-card-title></mat-card-header>
              <mat-card-content>
                <div *ngIf="loading()" class="spinner-center"><mat-spinner diameter="40"></mat-spinner></div>
                <table mat-table [dataSource]="assets()" *ngIf="!loading()" class="full-width-table">
                  <ng-container matColumnDef="assetCode">
                    <th mat-header-cell *matHeaderCellDef>Code</th>
                    <td mat-cell *matCellDef="let a">{{ a.assetCode }}</td>
                  </ng-container>
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let a">{{ a.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="quantity">
                    <th mat-header-cell *matHeaderCellDef>Qty</th>
                    <td mat-cell *matCellDef="let a">{{ a.quantity }}</td>
                  </ng-container>
                  <ng-container matColumnDef="unitPrice">
                    <th mat-header-cell *matHeaderCellDef>Unit Price</th>
                    <td mat-cell *matCellDef="let a">{{ a.unitPrice }}</td>
                  </ng-container>
                  <ng-container matColumnDef="allocatable">
                    <th mat-header-cell *matHeaderCellDef>Allocatable</th>
                    <td mat-cell *matCellDef="let a">
                      <mat-chip [color]="a.isAllocatable ? 'primary' : undefined">
                        {{ a.isAllocatable ? 'Yes' : 'No' }}
                      </mat-chip>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let a">
                      <button mat-icon-button (click)="editAsset(a)"><mat-icon>edit</mat-icon></button>
                      <button mat-icon-button color="warn" (click)="deleteAsset(a.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="assetColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: assetColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- TRANSACTIONS TAB -->
        <mat-tab label="Transactions">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>Log Transaction</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="txForm" (ngSubmit)="submitTransaction()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Asset</mat-label>
                      <mat-select formControlName="assetId">
                        <mat-option *ngFor="let a of assets()" [value]="a.id">{{ a.name }} ({{ a.assetCode }})</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Transaction Type</mat-label>
                      <mat-select formControlName="transactionType">
                        <mat-option value="allocate">Allocate</mat-option>
                        <mat-option value="return">Return</mat-option>
                        <mat-option value="transfer">Transfer</mat-option>
                        <mat-option value="dispose">Dispose</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Ref No.</mat-label>
                      <input matInput formControlName="refNo" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Quantity</mat-label>
                      <input matInput type="number" formControlName="quantity" />
                    </mat-form-field>
                  </div>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Receiver</mat-label>
                      <input matInput formControlName="receiver" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Reason</mat-label>
                      <input matInput formControlName="reason" />
                    </mat-form-field>
                  </div>
                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="txForm.invalid || saving()">Log</button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title>Transactions ({{ transactions().length }})</mat-card-title></mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="transactions()" class="full-width-table">
                  <ng-container matColumnDef="refNo">
                    <th mat-header-cell *matHeaderCellDef>Ref No.</th>
                    <td mat-cell *matCellDef="let t">{{ t.refNo }}</td>
                  </ng-container>
                  <ng-container matColumnDef="transactionType">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let t">{{ t.transactionType }}</td>
                  </ng-container>
                  <ng-container matColumnDef="quantity">
                    <th mat-header-cell *matHeaderCellDef>Qty</th>
                    <td mat-cell *matCellDef="let t">{{ t.quantity }}</td>
                  </ng-container>
                  <ng-container matColumnDef="receiver">
                    <th mat-header-cell *matHeaderCellDef>Receiver</th>
                    <td mat-cell *matCellDef="let t">{{ t.receiver ?? '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="datetime">
                    <th mat-header-cell *matHeaderCellDef>Date</th>
                    <td mat-cell *matCellDef="let t">{{ t.transactionDatetime | date:'shortDate' }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="txColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: txColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- MAINTENANCES TAB -->
        <mat-tab label="Maintenances">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>New Maintenance</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="maintForm" (ngSubmit)="submitMaintenance()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Asset</mat-label>
                      <mat-select formControlName="assetId">
                        <mat-option *ngFor="let a of assets()" [value]="a.id">{{ a.name }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Priority</mat-label>
                      <mat-select formControlName="priority">
                        <mat-option value="low">Low</mat-option>
                        <mat-option value="medium">Medium</mat-option>
                        <mat-option value="high">High</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Assigned To</mat-label>
                      <input matInput formControlName="assignedTo" />
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Details</mat-label>
                    <textarea matInput rows="2" formControlName="details"></textarea>
                  </mat-form-field>
                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="maintForm.invalid || saving()">Create</button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header><mat-card-title>Maintenances ({{ maintenances().length }})</mat-card-title></mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="maintenances()" class="full-width-table">
                  <ng-container matColumnDef="assetId">
                    <th mat-header-cell *matHeaderCellDef>Asset ID</th>
                    <td mat-cell *matCellDef="let m">{{ m.assetId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let m">{{ m.status ?? '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="priority">
                    <th mat-header-cell *matHeaderCellDef>Priority</th>
                    <td mat-cell *matCellDef="let m">{{ m.priority ?? '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="assignedTo">
                    <th mat-header-cell *matHeaderCellDef>Assigned To</th>
                    <td mat-cell *matCellDef="let m">{{ m.assignedTo ?? '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let m">
                      <button mat-icon-button color="warn" (click)="deleteMaintenance(m.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="maintColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: maintColumns;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .dashboard-cards { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card { min-width: 140px; }
    .stat-card.warn .stat-value { color: #f57c00; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 13px; color: #666; }
    .tab-content { padding: 24px 0; display: flex; flex-direction: column; gap: 24px; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .form-row mat-form-field { flex: 1; min-width: 160px; }
    .full-width { width: 100%; }
    .full-width-table { width: 100%; }
    .form-actions { display: flex; gap: 12px; margin-top: 16px; }
    .spinner-center { display: flex; justify-content: center; padding: 32px; }
  `],
})
export class AssetManagementComponent implements OnInit {
  private svc = inject(AssetManagementService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  dashboard = signal<AssetDashboard | null>(null);
  assets = signal<Asset[]>([]);
  transactions = signal<AssetTransaction[]>([]);
  maintenances = signal<AssetMaintenance[]>([]);
  loading = signal(false);
  saving = signal(false);
  editingAssetId = signal<number | null>(null);

  assetColumns = ['assetCode', 'name', 'quantity', 'unitPrice', 'allocatable', 'actions'];
  txColumns = ['refNo', 'transactionType', 'quantity', 'receiver', 'datetime'];
  maintColumns = ['assetId', 'status', 'priority', 'assignedTo', 'actions'];

  assetForm = this.fb.group({
    assetCode: ['', Validators.required],
    name: ['', Validators.required],
    quantity: [1, Validators.required],
    unitPrice: [0, Validators.required],
    model: [''],
    serialNo: [''],
    depreciation: [null as number | null],
    description: [''],
    isAllocatable: [false],
  });

  txForm = this.fb.group({
    assetId: [null as number | null],
    transactionType: ['allocate', Validators.required],
    refNo: ['', Validators.required],
    quantity: [1, Validators.required],
    receiver: [''],
    reason: [''],
  });

  maintForm = this.fb.group({
    assetId: [null as number | null, Validators.required],
    priority: ['medium'],
    assignedTo: [''],
    details: [''],
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.svc.getDashboard().subscribe({ next: v => this.dashboard.set(v) });
    this.svc.getAssets().subscribe({ next: v => { this.assets.set(v); this.loading.set(false); } });
    this.svc.getTransactions().subscribe({ next: v => this.transactions.set(v) });
    this.svc.getMaintenances().subscribe({ next: v => this.maintenances.set(v) });
  }

  submitAsset() {
    if (this.assetForm.invalid) return;
    this.saving.set(true);
    const val = this.assetForm.value as any;
    const obs = this.editingAssetId()
      ? this.svc.updateAsset(this.editingAssetId()!, val)
      : this.svc.createAsset(val);
    obs.subscribe({
      next: () => { this.snack.open('Asset saved', 'OK', { duration: 2000 }); this.cancelAssetEdit(); this.loadAll(); },
      error: () => this.snack.open('Error saving asset', 'OK', { duration: 2000 }),
      complete: () => this.saving.set(false),
    });
  }

  editAsset(a: Asset) {
    this.editingAssetId.set(a.id);
    this.assetForm.patchValue({
      assetCode: a.assetCode,
      name: a.name,
      quantity: a.quantity,
      unitPrice: a.unitPrice,
      model: a.model ?? '',
      serialNo: a.serialNo ?? '',
      depreciation: a.depreciation ?? null,
      description: a.description ?? '',
      isAllocatable: a.isAllocatable ?? false,
    });
  }

  cancelAssetEdit() { this.editingAssetId.set(null); this.assetForm.reset({ quantity: 1, unitPrice: 0, isAllocatable: false }); }

  deleteAsset(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Asset', message: 'Delete asset?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteAsset(id).subscribe({ next: () => this.loadAll() });
    });
  }

  submitTransaction() {
    if (this.txForm.invalid) return;
    this.saving.set(true);
    this.svc.createTransaction(this.txForm.value as any).subscribe({
      next: () => { this.snack.open('Transaction logged', 'OK', { duration: 2000 }); this.txForm.reset({ transactionType: 'allocate', quantity: 1 }); this.loadAll(); },
      error: () => this.snack.open('Error', 'OK', { duration: 2000 }),
      complete: () => this.saving.set(false),
    });
  }

  submitMaintenance() {
    if (this.maintForm.invalid) return;
    this.saving.set(true);
    this.svc.createMaintenance(this.maintForm.value as any).subscribe({
      next: () => { this.snack.open('Maintenance created', 'OK', { duration: 2000 }); this.maintForm.reset({ priority: 'medium' }); this.loadAll(); },
      error: () => this.snack.open('Error', 'OK', { duration: 2000 }),
      complete: () => this.saving.set(false),
    });
  }

  deleteMaintenance(id: string) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Record', message: 'Delete maintenance record?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.svc.deleteMaintenance(id).subscribe({ next: () => this.loadAll() });
    });
  }
}
