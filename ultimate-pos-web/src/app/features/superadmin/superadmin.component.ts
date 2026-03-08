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
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">admin_panel_settings</mat-icon>
          <div>
            <h1>Superadmin</h1>
            <p class="subtitle">Packages &amp; subscription management</p>
          </div>
        </div>
      </div>

      <div class="stats-row" *ngIf="dashboard()">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon blue">inventory_2</mat-icon>
              <div>
                <div class="stat-number">{{ dashboard()!.totalPackages }}</div>
                <div class="stat-label">Total Packages</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon green">verified</mat-icon>
              <div>
                <div class="stat-number">{{ dashboard()!.activeSubscriptions }}</div>
                <div class="stat-label">Active Subscriptions</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon orange">pending</mat-icon>
              <div>
                <div class="stat-number">{{ dashboard()!.pendingSubscriptions }}</div>
                <div class="stat-label">Pending</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon purple">schedule</mat-icon>
              <div>
                <div class="stat-number">{{ dashboard()!.expiringIn30Days }}</div>
                <div class="stat-label">Expiring (30 days)</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <!-- PACKAGES TAB -->
        <mat-tab label="Packages">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>{{ editingPackageId() ? 'edit' : 'add_box' }}</mat-icon></div>
                <mat-card-title>{{ editingPackageId() ? 'Edit Package' : 'New Package' }}</mat-card-title>
              </mat-card-header>
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

            <mat-card class="list-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon orange"><mat-icon>inventory_2</mat-icon></div>
                <mat-card-title>Packages</mat-card-title>
              </mat-card-header>
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
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>add_circle</mat-icon></div>
                <mat-card-title>New Subscription</mat-card-title>
              </mat-card-header>
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

            <mat-card class="list-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon green"><mat-icon>subscriptions</mat-icon></div>
                <mat-card-title>Subscriptions</mat-card-title>
              </mat-card-header>
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-title { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { border-radius: 12px; overflow: hidden; }
    .stat-content { display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0; }
    .stat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; border-radius: 10px; padding: 0.5rem; }
    .stat-icon.blue   { color: #1976d2; background: #e3f2fd; }
    .stat-icon.green  { color: #388e3c; background: #e8f5e9; }
    .stat-icon.orange { color: #f57c00; background: #fff3e0; }
    .stat-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .stat-number { font-size: 1.75rem; font-weight: 700; line-height: 1; color: #1a1a1a; }
    .stat-label { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
    .tab-content { padding: 1.5rem 0; display: flex; flex-direction: column; gap: 1.5rem; }
    .form-card, .list-card { border-radius: 12px; overflow: hidden; }
    .card-avatar-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; }
    .card-avatar-icon.blue   { color: #1976d2; background: #e3f2fd; }
    .card-avatar-icon.green  { color: #388e3c; background: #e8f5e9; }
    .card-avatar-icon.orange { color: #f57c00; background: #fff3e0; }
    .card-avatar-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .card-avatar-icon mat-icon { font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start; }
    .loading-container { display: flex; justify-content: center; padding: 24px; }
    mat-form-field { min-width: 180px; }
    table { width: 100%; }
    @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
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
