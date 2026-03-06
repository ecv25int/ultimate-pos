import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserRole } from '../enums/user-role.enum';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: UserRole;
  businessId?: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.http
        .get<User>('http://localhost:3000/api/auth/profile')
        .pipe(
          tap((user) => {
            this.currentUserSubject.next(user);
          })
        )
        .subscribe({
          error: () => {
            this.currentUserSubject.next(null);
          },
        });
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.userType === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return roles.some((role) => user?.userType === role);
  }

  isAdmin(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.SUPERADMIN]);
  }

  isSuperAdmin(): boolean {
    return this.hasRole(UserRole.SUPERADMIN);
  }

  isManager(): boolean {
    return this.hasRole(UserRole.MANAGER);
  }

  isCashier(): boolean {
    return this.hasRole(UserRole.CASHIER);
  }

  canAccess(allowedRoles: UserRole[]): boolean {
    return this.hasAnyRole(allowedRoles);
  }
}
