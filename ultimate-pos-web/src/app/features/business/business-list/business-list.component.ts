import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { UserRole } from '../../../core/enums/user-role.enum';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-business-list',
  standalone: true,
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
      <div class="header">
        <h1>Business Management</h1>
        <button 
          mat-raised-button 
          color="primary" 
          routerLink="/business/create"
          *ngIf="isAdmin"
        >
          <mat-icon>add</mat-icon>
          Create Business
        </button>
      </div>

      <mat-card *ngIf="myBusiness" class="my-business-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>business</mat-icon>
          <mat-card-title>My Business</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="business-details">
            <h2>{{ myBusiness.name }}</h2>
            <p><strong>Currency:</strong> {{ myBusiness.currency }}</p>
            <p><strong>Timezone:</strong> {{ myBusiness.timezone }}</p>
            <p *ngIf="myBusiness.email"><strong>Email:</strong> {{ myBusiness.email }}</p>
            <p *ngIf="myBusiness.phone"><strong>Phone:</strong> {{ myBusiness.phone }}</p>
            <p *ngIf="myBusiness.address"><strong>Address:</strong> {{ myBusiness.address }}</p>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button 
            mat-button 
            color="primary" 
            [routerLink]="['/business/edit', myBusiness.id]"
            *ngIf="isAdmin || isManager"
          >
            <mat-icon>edit</mat-icon>
            Edit
          </button>
        </mat-card-actions>
      </mat-card>

      <mat-card *ngIf="isAdmin && businesses.length > 0" class="all-businesses-card">
        <mat-card-header>
          <mat-card-title>All Businesses</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="businesses" class="business-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let business">{{ business.name }}</td>
            </ng-container>

            <ng-container matColumnDef="currency">
              <th mat-header-cell *matHeaderCellDef>Currency</th>
              <td mat-cell *matCellDef="let business">{{ business.currency }}</td>
            </ng-container>

            <ng-container matColumnDef="timezone">
              <th mat-header-cell *matHeaderCellDef>Timezone</th>
              <td mat-cell *matCellDef="let business">{{ business.timezone }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let business">
                <mat-chip [color]="business.isActive ? 'primary' : 'warn'">
                  {{ business.isActive ? 'Active' : 'Inactive' }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let business">
                <button mat-icon-button [routerLink]="['/business/edit', business.id]">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteBusiness(business.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .business-list-container {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 600;
        color: #1a1a1a;
      }

      .my-business-card {
        margin-bottom: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        mat-card-title {
          color: white;
        }
      }

      .business-details {
        h2 {
          margin-top: 0;
          font-size: 1.5rem;
        }

        p {
          margin: 0.5rem 0;
          font-size: 1rem;
        }
      }

      .all-businesses-card {
        margin-top: 2rem;
      }

      .business-table {
        width: 100%;
        margin-top: 1rem;
      }

      @media (max-width: 768px) {
        .business-list-container {
          padding: 1rem 0.75rem;
        }

        .header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }
      }
    `,
  ],
})
export class BusinessListComponent implements OnInit, OnDestroy {
  businesses: Business[] = [];
  myBusiness: Business | null = null;
  displayedColumns = ['name', 'currency', 'timezone', 'status', 'actions'];

  isAdmin = false;
  isManager = false;

  private destroy$ = new Subject<void>();

  constructor(
    private businessService: BusinessService,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.roleService.isAdmin();
    this.isManager = this.roleService.isManager();

    this.loadMyBusiness();

    if (this.isAdmin) {
      this.loadAllBusinesses();
    }

    // React to user loading asynchronously (e.g. page refresh)
    this.roleService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isAdmin = this.roleService.isAdmin();
      this.isManager = this.roleService.isManager();
      if (this.isAdmin && this.businesses.length === 0) {
        this.loadAllBusinesses();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMyBusiness(): void {
    this.businessService.getMyBusiness().subscribe({
      next: (business) => {
        this.myBusiness = business;
      },
      error: (error) => {
        console.log('No business assigned:', error);
      },
    });
  }

  loadAllBusinesses(): void {
    this.businessService.getAllBusinesses().subscribe({
      next: (businesses) => {
        this.businesses = businesses;
      },
      error: (error) => {
        this.snackBar.open('Failed to load businesses', 'Close', {
          duration: 3000,
        });
      },
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
          this.snackBar.open('Business deleted successfully', 'Close', {
            duration: 3000,
          });
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
