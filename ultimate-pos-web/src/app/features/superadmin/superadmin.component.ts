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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SuperadminService } from '../../core/services/superadmin.service';
import { Package, Subscription, SuperadminDashboard } from '../../core/models/superadmin.model';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule,
    MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header"><h1>Superadmin</h1></div>

      <div class="dashboard-cards" *ngIf="dashboard()">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.totalPackages }}</div>
            <div class="stat-label">Total Packages</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.activeSubscriptions }}</div>
            <div class="stat-label">Active Subscriptions</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.pendingSubscriptions }}</div>
            <div class="stat-label">Pending</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.expiringIn30Days }}</div>
            <div class="stat-label">Expiring (30 days)</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <!-- PACKAGES TAB -->
        <mat-tab label="Packages">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>{{ editingPackageId() ? 'Edit Package' : 'New Package' }}</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="packageForm" (ngSubmit)="submitPackage()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Price</mat-label>
                      <input matInput type="number" formControlName="price" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Interval</mat-label>
                      <mat-select formControlName="interval">
                        <mat-option value="days">Days</mat-option>
                        <mat-option value="months">Months</mat-option>
                        <mat-option value="years">Years</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Interval Count</mat-label>
                      <input matInput type="number" formControlName="intervalCount" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Trial Days</mat-label>
                      <input matInput type="number" formControlName="trialDays" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Locations</mat-label>
                      <input matInput type="number" formControlName="locationCount" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Users</mat-label>
                      <input matInput type="number" formControlName="userCount" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Products</mat-label>
                      <input matInput type="number" formControlName="productCount" />
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="packageForm.invalid">
                    {{ editingPackageId() ? 'Update' : 'Create' }}
                  </button>
                  <button mat-button type="button" (click)="cancelPackageEdit()" *ngIf="editingPackageId()">Cancel</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <div *ngIf="loading()" class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
                <table mat-table [dataSource]="packages()" *ngIf="!loading()">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let r">{{ r.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="price">
                    <th mat-header-cell *matHeaderCellDef>Price</th>
                    <td mat-cell *matCellDef="let r">{{ r.price }}</td>
                  </ng-container>
                  <ng-container matColumnDef="interval">
                    <th mat-header-cell *matHeaderCellDef>Interval</th>
                    <td mat-cell *matCellDef="let r">{{ r.intervalCount }} {{ r.interval }}</td>
                  </ng-container>
                  <ng-container matColumnDef="isActive">
                    <th mat-header-cell *matHeaderCellDef>Active</th>
                    <td mat-cell *matCellDef="let r"><mat-chip [color]="r.isActive ? 'primary' : 'warn'" highlighted>{{ r.isActive ? 'Active' : 'Inactive' }}</mat-chip></td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="primary" (click)="editPackage(r)"><mat-icon>edit</mat-icon></button>
                      <button mat-icon-button color="warn" (click)="deletePackage(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="packageCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: packageCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- SUBSCRIPTIONS TAB -->
        <mat-tab label="Subscriptions">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>New Subscription</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="subscriptionForm" (ngSubmit)="submitSubscription()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Business ID</mat-label>
                      <input matInput type="number" formControlName="businessId" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Package</mat-label>
                      <mat-select formControlName="packageId">
                        <mat-option *ngFor="let p of packages()" [value]="p.id">{{ p.name }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Package Price</mat-label>
                      <input matInput type="number" formControlName="packagePrice" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Start Date</mat-label>
                      <input matInput type="date" formControlName="startDate" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>End Date</mat-label>
                      <input matInput type="date" formControlName="endDate" />
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="subscriptionForm.invalid">Create</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="subscriptions()">
                  <ng-container matColumnDef="businessId">
                    <th mat-header-cell *matHeaderCellDef>Business ID</th>
                    <td mat-cell *matCellDef="let r">{{ r.businessId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="packageId">
                    <th mat-header-cell *matHeaderCellDef>Package ID</th>
                    <td mat-cell *matCellDef="let r">{{ r.packageId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let r"><mat-chip>{{ r.status }}</mat-chip></td>
                  </ng-container>
                  <ng-container matColumnDef="endDate">
                    <th mat-header-cell *matHeaderCellDef>End Date</th>
                    <td mat-cell *matCellDef="let r">{{ r.endDate | date:'mediumDate' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-button color="primary" (click)="updateSubStatus(r.id, 'active')">Approve</button>
                      <button mat-button color="warn" (click)="updateSubStatus(r.id, 'cancelled')">Cancel</button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="subscriptionCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: subscriptionCols;"></tr>
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
    .stat-value { font-size: 1.8rem; font-weight: 700; }
    .stat-label { font-size: 0.85rem; color: #666; }
    .tab-content { padding: 16px 0; display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
    .loading-container { display: flex; justify-content: center; padding: 24px; }
    mat-form-field { min-width: 180px; }
    table { width: 100%; }
  `],
})
export class SuperadminComponent implements OnInit {
  private svc = inject(SuperadminService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  dashboard = signal<SuperadminDashboard | null>(null);
  packages = signal<Package[]>([]);
  subscriptions = signal<Subscription[]>([]);
  editingPackageId = signal<number | null>(null);

  packageCols = ['name', 'price', 'interval', 'isActive', 'actions'];
  subscriptionCols = ['businessId', 'packageId', 'status', 'endDate', 'actions'];

  packageForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, Validators.required],
    interval: ['months', Validators.required],
    intervalCount: [1, Validators.required],
    trialDays: [0],
    locationCount: [1],
    userCount: [5],
    productCount: [1000],
    invoiceCount: [1000],
  });

  subscriptionForm = this.fb.group({
    businessId: [null as number | null, Validators.required],
    packageId: [null as number | null, Validators.required],
    packagePrice: [0, Validators.required],
    startDate: [null as string | null],
    endDate: [null as string | null],
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.svc.getDashboard().subscribe(d => this.dashboard.set(d));
    this.svc.getPackages().subscribe(d => { this.packages.set(d); this.loading.set(false); });
    this.svc.getSubscriptions().subscribe(d => this.subscriptions.set(d));
  }

  submitPackage() {
    if (this.packageForm.invalid) return;
    const id = this.editingPackageId();
    const obs = id ? this.svc.updatePackage(id, this.packageForm.value as any) : this.svc.createPackage(this.packageForm.value as any);
    obs.subscribe({ next: () => { this.snack.open('Saved', 'Close', { duration: 2000 }); this.cancelPackageEdit(); this.loadAll(); } });
  }

  editPackage(p: Package) {
    this.editingPackageId.set(p.id);
    this.packageForm.patchValue({ name: p.name, price: p.price, interval: p.interval, intervalCount: p.intervalCount, trialDays: p.trialDays, locationCount: p.locationCount, userCount: p.userCount, productCount: p.productCount });
  }

  cancelPackageEdit() { this.editingPackageId.set(null); this.packageForm.reset({ interval: 'months', intervalCount: 1, trialDays: 0, locationCount: 1, userCount: 5, productCount: 1000, invoiceCount: 1000 }); }
  deletePackage(id: number) { this.svc.deletePackage(id).subscribe({ next: () => this.loadAll() }); }

  submitSubscription() {
    if (this.subscriptionForm.invalid) return;
    this.svc.createSubscription(this.subscriptionForm.value as any).subscribe({ next: () => { this.snack.open('Created', 'Close', { duration: 2000 }); this.subscriptionForm.reset(); this.loadAll(); } });
  }

  updateSubStatus(id: number, status: string) { this.svc.updateSubscriptionStatus(id, status).subscribe({ next: () => this.loadAll() }); }
}
