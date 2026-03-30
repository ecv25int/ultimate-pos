# Week 1, Day 2: User Model & Service Implementation

## Objective
Build the user service foundation for CRUD operations and authentication support.

---

## Tasks

### 1. Review User Model in Prisma
- [ ] Open `ultimate-pos-api/prisma/schema.prisma`
- [ ] Verify User model has:
  - Basic fields: `id, username, email, password, firstName, lastName`
  - Status: `isActive, isEmailVerified`
  - Account: `businessId` (foreign key)
  - Audit: `createdAt, updatedAt`

### 2. Create User Service
- [ ] Navigate to `ultimate-pos-api/src/users/`
- [ ] Create or verify `users.service.ts`:
  ```typescript
  @Injectable()
  export class UsersService {
    constructor(private prisma: PrismaService) {}
    
    async findByUsername(username: string) { ... }
    async findByEmail(email: string) { ... }
    async findById(id: number) { ... }
    async create(createUserDto: CreateUserDto) { ... }
    async update(id: number, updateUserDto: UpdateUserDto) { ... }
  }
  ```

### 3. Implement Password Hashing
- [ ] Use `bcrypt` for password hashing (compatible with Laravel)
- [ ] Create password utility:
  ```typescript
  export class PasswordUtil {
    async hashPassword(password: string): Promise<string> { ... }
    async validatePassword(password: string, hash: string): Promise<boolean> { ... }
  }
  ```
- [ ] Test with existing `megamanx` user from database

### 4. Create User DTOs
- [ ] Create `create-user.dto.ts`:
  - `username, email, password, firstName, lastName, businessId`
  - Add validation decorators (`@IsString()`, `@IsEmail()`, etc.)
- [ ] Create `update-user.dto.ts` (partial fields)
- [ ] Create `user.dto.ts` (response schema, excludes password)

### 5. Create User Controller (Basic)
- [ ] Create `users.controller.ts`:
  - `GET /api/users/:id` — Get user profile
  - `PUT /api/users/:id` — Update user
  - `POST /api/users/change-password` — Change password
- [ ] Add JWT guard to protected routes

### 6. Unit Tests
- [ ] Create `users.service.spec.ts`:
  - Test `findByUsername()` exists
  - Test password hashing
  - Test user not found error

---

## Verification Checklist
- [ ] User service created with CRUD methods
- [ ] Password hashing matches Laravel's bcrypt
- [ ] Can find user by username/email from database
- [ ] DTOs validate input correctly
- [ ] Unit tests pass

---

## Success Criteria
✅ User service fully functional  
✅ Can authenticate user credentials from database  
✅ Ready for JWT authentication (Day 3)

---

## Code Changes Summary
- New file: `src/users/users.service.ts`
- New file: `src/users/dto/create-user.dto.ts`
- New file: `src/users/dto/update-user.dto.ts`
- New file: `src/users/users.service.spec.ts`
- Update: `src/users/users.controller.ts` (if exists)
