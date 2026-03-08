import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getUserFromStorage(),
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  /** Read user object stored by Auth service after login. */
  private getUserFromStorage(): User | null {
    const json = localStorage.getItem('current_user');
    return json ? (JSON.parse(json) as User) : null;
  }

  /** Call after login/logout to refresh the cached user. */
  refreshUser(): void {
    this.currentUserSubject.next(this.getUserFromStorage());
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
