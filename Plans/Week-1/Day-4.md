# Week 1, Day 4: Roles, Permissions & Business Context

## Objective
Implement role-based access control and multi-tenant business context injection.

---

## Tasks

### 1. Verify Role & Permission Models
- [ ] Check Prisma schema for `Role` and `Permission` tables
- [ ] Verify relationships:
  - User `has_many` Roles
  - Role `has_many` Permissions
  - User `has_one` Business

### 2. Create Role Service
- [ ] Create `ultimate-pos-api/src/roles/roles.service.ts`:
  ```typescript
  @Injectable()
  export class RolesService {
    constructor(private prisma: PrismaService) {}

    async create(name: string, permissions: string[]) { ... }
    async assignRoleToUser(userId: number, roleId: number) { ... }
    async hasPermission(userId: number, permission: string) { ... }
    async listRoles() { ... }
  }
  ```

### 3. Create Permission Decorator
- [ ] Create `src/auth/decorators/permission.decorator.ts`:
  ```typescript
  export const RequirePermission = (permission: string) => {
    return applyDecorators(
      SetMetadata('permission', permission),
      UseGuards(PermissionGuard),
    );
  };
  ```

### 4. Create Permission Guard
- [ ] Create `src/auth/guards/permission.guard.ts`:
  - Check if user has required permission
  - Enforce role-based access
  - Example: `@RequirePermission('sales.create')`

### 5. Seed Basic Roles
- [ ] Create seeder script `scripts/seed-roles.ts`:
  ```typescript
  // Create roles
  - ADMIN (all permissions)
  - MANAGER (manage staff, view reports)
  - CASHIER (ring sales only)
  - STAFF (limited access)

  // Create permissions
  - sales.view, sales.create, sales.update, sales.delete
  - purchase.view, purchase.create, purchase.update
  - reports.view
  - users.manage
  - ... etc
  ```
- [ ] Run seeder:
  ```bash
  npx ts-node scripts/seed-roles.ts
  ```

### 6. Create Business Context Middleware
- [ ] Create `src/middleware/business-context.middleware.ts`:
  - Extract `businessId` from JWT token payload
  - Attach to request context
  - All subsequent queries filtered by `businessId`
- [ ] Register middleware in `app.module.ts`

### 7. Update User JWT Payload
- [ ] Modify JWT payload to include:
  ```typescript
  {
    sub: userId,
    username: user.username,
    businessId: user.businessId,
    roles: ['CASHIER'],
    iat: now,
    exp: now + 15m
  }
  ```

### 8. Create Business Service
- [ ] Create `src/business/business.service.ts`:
  ```typescript
  @Injectable()
  export class BusinessService {
    constructor(private prisma: PrismaService) {}

    async findById(businessId: number) { ... }
    async getSettings(businessId: number) { ... }
    // currency, timezone, decimal_places, etc.
  }
  ```

### 9. Test Role-Based Access
- [ ] Create ADMIN user
- [ ] Create CASHIER user
- [ ] Test endpoint with `@RequirePermission('sales.create')`:
  - ADMIN: ✅ Access allowed
  - CASHIER: ✅ Access... (depends on permissions)
  - No auth: ❌ 401 Unauthorized

### 10. Unit Tests
- [ ] Create `src/roles/roles.service.spec.ts`:
  - Test role creation
  - Test permission checking
  - Test business context isolation

---

## Verification Checklist
- [ ] Roles (ADMIN, MANAGER, CASHIER, STAFF) created
- [ ] Permissions assigned to roles correctly
- [ ] Permission decorator works with guards
- [ ] Business context injected into requests
- [ ] Multi-tenant isolation verified (user can't access other business data)
- [ ] JWT payload includes `businessId`

---

## Success Criteria
✅ Role-based access control operational  
✅ Multi-tenant business context working  
✅ Permission enforcement on endpoints  
✅ Ready for API setup (Day 5)

---

## Code Changes Summary
- New file: `src/roles/roles.service.ts`
- New file: `src/auth/decorators/permission.decorator.ts`
- New file: `src/auth/guards/permission.guard.ts`
- New file: `src/business/business.service.ts`
- New file: `src/middleware/business-context.middleware.ts`
- New file: `scripts/seed-roles.ts`
- Update: `src/auth/auth.service.ts` (add roles to JWT)
- Update: `src/app.module.ts` (register middleware)
