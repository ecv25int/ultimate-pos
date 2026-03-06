import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserManagementService } from '../../../core/services/user-management.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import {
  CreateUserDto,
  StaffUser,
  UserSummary,
} from '../../../core/models/user-management.model';

@Component({
  selector: 'app-users-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>User Management</h2>
        <button class="btn btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ Add User' }}
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid" *ngIf="summary" style="margin-bottom:16px">
        <div class="stat-card">
          <span class="label">Total Users</span>
          <span class="value">{{ summary.total }}</span>
        </div>
        <div class="stat-card success">
          <span class="label">Active</span>
          <span class="value">{{ summary.active }}</span>
        </div>
        <div class="stat-card warning">
          <span class="label">Inactive</span>
          <span class="value">{{ summary.inactive }}</span>
        </div>
      </div>

      <!-- Create Form -->
      <form class="form-card" *ngIf="showForm" (ngSubmit)="create()">
        <div class="form-row">
          <div class="form-group">
            <label>Username *</label>
            <input type="text" [(ngModel)]="createForm.username" name="username" class="form-control" placeholder="username" required />
          </div>
          <div class="form-group">
            <label>Password *</label>
            <input type="password" [(ngModel)]="createForm.password" name="password" class="form-control" placeholder="Min 8 characters" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="createForm.email" name="email" class="form-control" placeholder="email@example.com" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>First Name</label>
            <input type="text" [(ngModel)]="createForm.firstName" name="firstName" class="form-control" />
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" [(ngModel)]="createForm.lastName" name="lastName" class="form-control" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select [(ngModel)]="createForm.userType" name="userType" class="form-control">
              <option value="cashier">Cashier</option>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? 'Creating...' : 'Create User' }}
          </button>
        </div>
        <div class="error-message" *ngIf="createError">{{ createError }}</div>
      </form>

      <!-- Search & Filter -->
      <div class="filters" style="margin-top:16px">
        <input
          type="text"
          placeholder="Search users..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch()"
          class="search-input"
        />
        <select [(ngModel)]="roleFilter" (ngModelChange)="load()" class="filter-select">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
          <option value="user">User</option>
        </select>
      </div>

      <!-- Users Table -->
      <div class="table-container" style="margin-top:16px">
        <table class="data-table" *ngIf="users.length > 0; else empty">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td><strong>{{ u.username }}</strong></td>
              <td>{{ u.firstName || '' }} {{ u.lastName || '' }}</td>
              <td>{{ u.email || '—' }}</td>
              <td><span class="badge" [ngClass]="roleClass(u.userType)">{{ u.userType }}</span></td>
              <td>
                <span class="badge" [ngClass]="u.isActive ? 'success' : 'neutral'">
                  {{ u.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="action-link" (click)="toggleActive(u)">
                  {{ u.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button class="action-link danger" (click)="deleteUser(u)" style="margin-left:8px">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <div class="empty-state">No users found.</div>
        </ng-template>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="total > limit">
        <button [disabled]="page === 1" (click)="changePage(page - 1)" class="btn btn-secondary">Prev</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button [disabled]="page === totalPages" (click)="changePage(page + 1)" class="btn btn-secondary">Next</button>
      </div>
    </div>
  `,
})
export class UsersSettingsComponent implements OnInit {
  summary: UserSummary | null = null;
  users: StaffUser[] = [];
  showForm = false;
  saving = false;
  createError = '';

  searchQuery = '';
  roleFilter = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 1;

  createForm: CreateUserDto = {
    username: '',
    password: '',
    userType: 'cashier',
  };

  private searchTimer: any;

  constructor(private userService: UserManagementService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadSummary();
    this.load();
  }

  loadSummary() {
    this.userService.getSummary().subscribe((s) => (this.summary = s));
  }

  load() {
    this.userService
      .getAll({
        search: this.searchQuery || undefined,
        userType: this.roleFilter || undefined,
        page: this.page,
        limit: this.limit,
      })
      .subscribe((res) => {
        this.users = res.data;
        this.total = res.total;
        this.totalPages = res.totalPages;
      });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.load();
    }, 300);
  }

  changePage(p: number) {
    this.page = p;
    this.load();
  }

  create() {
    if (!this.createForm.username || !this.createForm.password) {
      this.createError = 'Username and password are required';
      return;
    }
    this.saving = true;
    this.createError = '';
    this.userService.create(this.createForm).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.createForm = { username: '', password: '', userType: 'cashier' };
        this.loadSummary();
        this.load();
      },
      error: (err) => {
        this.createError = err.error?.message || 'Failed to create user';
        this.saving = false;
      },
    });
  }

  toggleActive(u: StaffUser) {
    this.userService.toggleActive(u.id).subscribe(() => {
      this.loadSummary();
      this.load();
    });
  }

  deleteUser(u: StaffUser) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete User', message: `Delete user "${u.username}"? This cannot be undone.`, confirmColor: 'warn' },
      width: '420px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.userService.delete(u.id).subscribe({
        next: () => { this.loadSummary(); this.load(); },
        error: (err) => alert(err.error?.message ?? 'Failed to delete user'),
      });
    });
  }

  roleClass(role: string): string {
    const map: Record<string, string> = {
      admin: 'danger',
      manager: 'warning',
      cashier: 'info',
      user: 'neutral',
    };
    return map[role] ?? 'neutral';
  }
}
