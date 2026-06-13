import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/enums/user-role.enum';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, permissions: string[]) {
    // Not implemented: roles are handled by userType enum
    return { name, permissions };
  }

  async assignRoleToUser(userId: number, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { userType: role },
    });
  }

  async hasPermission(userId: number, permission: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    // Use PermissionGuard logic
    const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
      [UserRole.ADMIN]: [
        'sales.view',
        'sales.create',
        'sales.update',
        'sales.delete',
        'purchase.view',
        'purchase.create',
        'purchase.update',
        'reports.view',
      ],
      [UserRole.MANAGER]: [
        'sales.view',
        'sales.create',
        'sales.update',
        'purchase.view',
        'purchase.create',
        'reports.view',
      ],
      [UserRole.CASHIER]: ['sales.view', 'sales.create'],
      [UserRole.USER]: [],
      [UserRole.SUPERADMIN]: [], // Superadmin bypasses all
    };
    return ROLE_PERMISSIONS[user.userType as UserRole]?.includes(permission) ?? false;
  }

  async listRoles() {
    return [
      {
        name: 'admin',
        permissions: [
          'sales.view',
          'sales.create',
          'sales.update',
          'sales.delete',
          'purchase.view',
          'purchase.create',
          'purchase.update',
          'reports.view',
        ],
      },
      {
        name: 'manager',
        permissions: [
          'sales.view',
          'sales.create',
          'sales.update',
          'purchase.view',
          'purchase.create',
          'reports.view',
        ],
      },
      { name: 'cashier', permissions: ['sales.view', 'sales.create'] },
      { name: 'user', permissions: [] },
    ];
  }
}
