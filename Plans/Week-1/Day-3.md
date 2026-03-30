# Week 1, Day 3: JWT Authentication Setup

## Objective
Implement JWT-based authentication with login and token refresh endpoints.

---

## Tasks

### 1. Verify JWT Configuration
- [ ] Check `.env` has:
  ```
  JWT_SECRET=<strong-64-byte-hex>
  JWT_EXPIRATION=15m
  JWT_REFRESH_SECRET=<different-strong-64-byte-hex>
  JWT_REFRESH_EXPIRATION=7d
  ```
- [ ] Generate secrets if needed:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### 2. Create Auth Service
- [ ] Create `ultimate-pos-api/src/auth/auth.service.ts`:
  ```typescript
  @Injectable()
  export class AuthService {
    constructor(
      private usersService: UsersService,
      private jwtService: JwtService,
      private configService: ConfigService,
    ) {}

    async login(username: string, password: string) { ... }
    async validateUser(username: string, password: string) { ... }
    async generateTokens(user: User) { ... }
    async refreshAccessToken(refreshToken: string) { ... }
  }
  ```

### 3. Create JWT Strategy & Guard
- [ ] Create `src/auth/strategies/jwt.strategy.ts`:
  - Validate JWT token
  - Extract user from payload
- [ ] Create `src/auth/guards/jwt.guard.ts`:
  - Check for valid JWT in request header
  - Attach user to request context

### 4. Create Auth Controller
- [ ] Create `src/auth/auth.controller.ts`:
  ```typescript
  @Controller('api/auth')
  export class AuthController {
    @Post('login')
    async login(@Body() { username, password }: LoginDto) { ... }

    @Post('refresh')
    async refresh(@Body() { refreshToken }: RefreshDto) { ... }

    @UseGuards(JwtGuard)
    @Get('me')
    async getCurrentUser(@Request() req) { ... }
  }
  ```

### 5. Create Login DTO
- [ ] Create `src/auth/dto/login.dto.ts`:
  ```typescript
  export class LoginDto {
    @IsString() @IsNotEmpty() username: string;
    @IsString() @IsNotEmpty() password: string;
  }
  ```

### 6. Test Authentication
- [ ] Start API: `npm run start:dev`
- [ ] POST to `/api/auth/login` with credentials:
  ```json
  {
    "username": "megamanx",
    "password": "<password>"
  }
  ```
- [ ] Verify response contains:
  ```json
  {
    "access_token": "<jwt>",
    "refresh_token": "<jwt>",
    "expires_in": "15m"
  }
  ```
- [ ] Test `/api/auth/refresh` with refresh token

### 7. Unit Tests
- [ ] Create `src/auth/auth.service.spec.ts`:
  - Test login with valid credentials
  - Test login with invalid password
  - Test token generation
  - Test JWT expiry handling

---

## Verification Checklist
- [ ] Login endpoint working with database users
- [ ] JWT access token issued (15m expiry)
- [ ] Refresh token issued (7d expiry)
- [ ] Token refresh returns new access token
- [ ] protected routes reject requests without token
- [ ] Unit tests passing

---

## Success Criteria
✅ Complete JWT authentication operational  
✅ Login/logout flows working  
✅ Token expiry and refresh working  
✅ Ready for roles/permissions (Day 4)

---

## Code Changes Summary
- New file: `src/auth/auth.service.ts`
- New file: `src/auth/strategies/jwt.strategy.ts`
- New file: `src/auth/guards/jwt.guard.ts`
- New file: `src/auth/auth.controller.ts`
- New file: `src/auth/dto/login.dto.ts`
- New file: `src/auth/auth.service.spec.ts`
- Update: `src/app.module.ts` (import AuthModule)
