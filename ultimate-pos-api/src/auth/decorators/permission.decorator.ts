import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../guards/permission.guard';

export const RequirePermission = (permission: string) => {
  return applyDecorators(SetMetadata('permission', permission), UseGuards(PermissionGuard));
};
