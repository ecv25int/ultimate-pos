import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Auth } from '../../core/auth/auth';
import { AuthService } from '../../core/services/auth.service';
import { RoleService } from '../../core/services/role.service';
import { HasRoleDirective } from '../../core/directives/has-role.directive';
import { UserRole } from '../../core/enums/user-role.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    HasRoleDirective,
  ],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard</h1>

      <mat-card class="user-info-card">
        <mat-card-header>
          <mat-card-title>Welcome, {{ currentUser?.firstName || currentUser?.username }}!</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (currentUser) {
            <div class="user-details">
              <p><strong>Username:</strong> {{ currentUser.username }}</p>
              <p><strong>Email:</strong> {{ currentUser.email }}</p>
              <p>
                <strong>Role:</strong>
                <mat-chip [class]="'role-chip-' + currentUser.userType">
                  {{ currentUser.userType | uppercase }}
                </mat-chip>
              </p>
            </div>
          }
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="warn" (click)="logout()">
            Logout
          </button>
        </mat-card-actions>
      </mat-card>

      <div class="role-demo-section">
        <h2>Role-Based Access Control Demo</h2>

        <!-- Admin Only Section -->
        <mat-card *appHasRole="UserRole.ADMIN" class="role-card admin-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>admin_panel_settings</mat-icon>
            <mat-card-title>Admin Only Section</mat-card-title>
            <mat-card-subtitle>Only visible to Admin users</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>This content is only visible to administrators.</p>
            <button mat-raised-button color="primary" (click)="testAdminEndpoint()">
              Test Admin-Only API
            </button>
          </mat-card-content>
        </mat-card>

        <!-- Admin or Manager Section -->
        <mat-card *appHasRole="[UserRole.ADMIN, UserRole.MANAGER]" class="role-card manager-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>manage_accounts</mat-icon>
            <mat-card-title>Admin or Manager Section</mat-card-title>
            <mat-card-subtitle>Visible to Admin and Manager users</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>This content is visible to admins and managers.</p>
            <button mat-raised-button color="accent" (click)="testManagerEndpoint()">
              Test Admin/Manager API
            </button>
          </mat-card-content>
        </mat-card>

        <!-- Everyone Section -->
        <mat-card class="role-card public-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>public</mat-icon>
            <mat-card-title>Public Section</mat-card-title>
            <mat-card-subtitle>Visible to all authenticated users</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>This content is visible to all authenticated users regardless of role.</p>
          </mat-card-content>
        </mat-card>

        <!-- Cashier Only Section -->
        <mat-card *appHasRole="UserRole.CASHIER" class="role-card cashier-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>point_of_sale</mat-icon>
            <mat-card-title>Cashier Section</mat-card-title>
            <mat-card-subtitle>Only visible to Cashier users</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>This content is only visible to cashiers.</p>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>Role Hierarchy</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <div matListItemTitle><strong>Admin</strong></div>
              <div matListItemLine>Full system access, user management, business configuration</div>
            </mat-list-item>
            <mat-list-item>
              <mat-icon matListItemIcon>manage_accounts</mat-icon>
              <div matListItemTitle><strong>Manager</strong></div>
              <div matListItemLine>Reports, inventory management, employee oversight</div>
            </mat-list-item>
            <mat-list-item>
              <mat-icon matListItemIcon>point_of_sale</mat-icon>
              <div matListItemTitle><strong>Cashier</strong></div>
              <div matListItemLine>POS operations, sales transactions, customer management</div>
            </mat-list-item>
            <mat-list-item>
              <mat-icon matListItemIcon>person</mat-icon>
              <div matListItemTitle><strong>User</strong></div>
              <div matListItemLine>Basic access, view-only permissions</div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      h1 {
        color: #333;
        margin-bottom: 2rem;
      }

      h2 {
        color: #555;
        margin: 2rem 0 1rem 0;
      }

      .user-info-card {
        margin-bottom: 2rem;
      }

      .user-details {
        p {
          margin: 0.5rem 0;
          font-size: 1rem;
        }
      }

      .role-chip-admin {
        background-color: #f44336 !important;
        color: white !important;
      }

      .role-chip-manager {
        background-color: #2196f3 !important;
        color: white !important;
      }

      .role-chip-cashier {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .role-chip-user {
        background-color: #9e9e9e !important;
        color: white !important;
      }

      .role-demo-section {
        margin: 2rem 0;
      }

      .role-card {
        margin-bottom: 1rem;
      }

      .admin-card {
        border-left: 4px solid #f44336;
      }

      .manager-card {
        border-left: 4px solid #2196f3;
      }

      .cashier-card {
        border-left: 4px solid #4caf50;
      }

      .public-card {
        border-left: 4px solid #9e9e9e;
      }

      mat-card-header mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .info-card {
        margin-top: 2rem;
      }

      mat-list-item {
        margin-bottom: 1rem;
      }

      @media (max-width: 768px) {
        .dashboard-container {
          padding: 1rem;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private authService = inject(Auth);
  private roleService = inject(RoleService);
  private apiAuth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  UserRole = UserRole;
  currentUser = this.authService.getCurrentUser();

  ngOnInit(): void {
    this.roleService.loadCurrentUser();
  }

  logout() {
    this.authService.logout();
  }

  testAdminEndpoint(): void {
    this.apiAuth.adminOnly().subscribe({
      next: (response: any) => {
        this.snackBar.open(response.message, 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Access denied',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }

  testManagerEndpoint(): void {
    this.apiAuth.adminOrManager().subscribe({
      next: (response: any) => {
        this.snackBar.open(response.message, 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Access denied',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }
}
