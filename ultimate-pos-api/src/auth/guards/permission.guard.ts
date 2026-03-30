
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'sales.view', 'sales.create', 'sales.update', 'sales.delete',
    'purchase.view', 'purchase.create', 'purchase.update',
    'reports.view',
  ],
  [UserRole.MANAGER]: [
    'sales.view', 'sales.create', 'sales.update',
    'purchase.view', 'purchase.create',
    'reports.view',
  ],
  [UserRole.CASHIER]: [
    'sales.view', 'sales.create',
  ],
  [UserRole.USER]: [],
  [UserRole.SUPERADMIN]: [], // Superadmin bypasses all
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('No user context');

    // Superadmin bypass
    if (user.userType === UserRole.SUPERADMIN) return true;

    const allowed = ROLE_PERMISSIONS[user.userType as UserRole]?.includes(requiredPermission);
    if (!allowed) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
