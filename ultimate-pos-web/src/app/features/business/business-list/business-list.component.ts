import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { BusinessService } from '../../../core/services/business.service';
import { Business } from '../../../core/models/business.model';
import { RoleService } from '../../../core/services/role.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-business-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDialogModule,
  ],
  template: `
    <div class="business-list-container">

      <div class="page-header">
        <h1>Business Management</h1>
        @if (isAdmin()) {
          <button mat-raised-button color="primary" routerLink="/business/create">
            <mat-icon>add</mat-icon>
            Create Business
          </button>
        }
      </div>

      @if (isLoading()) {
        <div class="empty-state"><p>Loading…</p></div>
      } @else if (!myBusiness() && !isAdmin()) {
        <div class="empty-state">
          <mat-icon>business_center</mat-icon>
          <p>You are not assigned to any business.</p>
        </div>
      }

      @if (myBusiness(); as biz) {
        <div class="biz-hero-card">
          <div class="biz-hero-header">
            <mat-icon class="biz-hero-icon">business</mat-icon>
            <span class="biz-hero-title">My Business</span>
          </div>
          <div class="biz-hero-body">
            <h2>{{ biz.name }}</h2>
            <p><strong>Currency:</strong> {{ biz.currency }}</p>
            <p><strong>Timezone:</strong> {{ biz.timezone }}</p>
            @if (biz.email) { <p><strong>Email:</strong> {{ biz.email }}</p> }
            @if (biz.phone) { <p><strong>Phone:</strong> {{ biz.phone }}</p> }
            @if (biz.address) { <p><strong>Address:</strong> {{ biz.address }}</p> }
          </div>
          @if (isAdmin() || isManager()) {
            <div class="biz-hero-actions">
              <button mat-stroked-button [routerLink]="['/business/edit', biz.id]">
                <mat-icon>edit</mat-icon> Edit
              </button>
            </div>
          }
        </div>
      }

      @if (isAdmin() && businesses().length > 0) {
        <mat-card class="all-businesses-card">
          <mat-card-header>
            <mat-card-title>All Businesses</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="businesses()" class="business-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let b">{{ b.name }}</td>
              </ng-container>
              <ng-container matColumnDef="currency">
                <th mat-header-cell *matHeaderCellDef>Currency</th>
                <td mat-cell *matCellDef="let b">{{ b.currency }}</td>
              </ng-container>
              <ng-container matColumnDef="timezone">
                <th mat-header-cell *matHeaderCellDef>Timezone</th>
                <td mat-cell *matCellDef="let b">{{ b.timezone }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let b">
                  <mat-chip [color]="b.isActive ? 'primary' : 'warn'">
                    {{ b.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let b">
                  <button mat-icon-button [routerLink]="['/business/edit', b.id]">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteBusiness(b.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }

    </div>
  `,
  styles: [`
    .business-list-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .page-header h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a1a1a;
    }
    .biz-hero-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      margin-bottom: 2rem;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(102,126,234,0.4);
      color: #fff;
    }
    .biz-hero-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px 0;
    }
    .biz-hero-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #fff; }
    .biz-hero-title { font-size: 1.1rem; font-weight: 600; color: #fff; opacity: 0.9; }
    .biz-hero-body { padding: 12px 20px 4px; }
    .biz-hero-body h2 { margin: 0 0 8px; font-size: 1.5rem; font-weight: 700; color: #fff; }
    .biz-hero-body p { margin: 4px 0; font-size: 0.95rem; color: rgba(255,255,255,0.9); }
    .biz-hero-body strong { color: rgba(255,255,255,0.7); font-weight: 600; }
    .biz-hero-actions { padding: 8px 12px 12px; }
    .biz-hero-actions button { color: #fff; border-color: rgba(255,255,255,0.55); }
    .empty-state { padding: 3rem 1rem; text-align: center; color: #9ca3af; }
    .empty-state mat-icon { font-size: 3rem; width: 3rem; height: 3rem; display: block; margin: 0 auto 0.75rem; }
    .empty-state p { margin: 0; font-size: 1rem; }
    .all-businesses-card { margin-top: 2rem; }
    .business-table { width: 100%; margin-top: 1rem; }
    @media (max-width: 768px) {
      .business-list-container { padding: 1rem 0.75rem; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
  `],
})
export class BusinessListComponent implements OnInit, OnDestroy {
  readonly businesses = signal<Business[]>([]);
  readonly myBusiness = signal<Business | null>(null);
  readonly displayedColumns = ['name', 'currency', 'timezone', 'status', 'actions'];
  readonly isAdmin = signal(false);
  readonly isManager = signal(false);
  readonly isLoading = signal(true);

  private destroy$ = new Subject<void>();

  constructor(
    private businessService: BusinessService,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.isAdmin.set(this.roleService.isAdmin());
    this.isManager.set(this.roleService.isManager());
    this.loadMyBusiness();
    if (this.isAdmin()) {
      this.loadAllBusinesses();
    }
    this.roleService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.ngZone.run(() => {
        this.isAdmin.set(this.roleService.isAdmin());
        this.isManager.set(this.roleService.isManager());
        if (this.isAdmin() && this.businesses().length === 0) {
          this.loadAllBusinesses();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMyBusiness(): void {
    this.businessService.getMyBusiness().subscribe({
      next: (business) => this.ngZone.run(() => {
        this.myBusiness.set(business);
        this.isLoading.set(false);
      }),
      error: (err) => this.ngZone.run(() => {
        console.log('No business assigned:', err);
        this.isLoading.set(false);
      }),
    });
  }

  loadAllBusinesses(): void {
    this.businessService.getAllBusinesses().subscribe({
      next: (businesses) => this.ngZone.run(() => this.businesses.set(businesses)),
      error: () => this.ngZone.run(() =>
        this.snackBar.open('Failed to load businesses', 'Close', { duration: 3000 })
      ),
    });
  }

  deleteBusiness(id: number): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Business', message: 'Are you sure you want to delete this business?', confirmColor: 'warn' },
      width: '450px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.businessService.deleteBusiness(id).subscribe({
        next: () => {
          this.snackBar.open('Business deleted successfully', 'Close', { duration: 3000 });
          this.loadAllBusinesses();
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message || 'Failed to delete business',
            'Close',
            { duration: 3000 }
          );
        },
      });
    });
  }
}
