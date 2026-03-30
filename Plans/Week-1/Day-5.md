# Week 1, Day 5: API Base Setup & Frontend Integration

## Objective
Standardize API response format, setup error handling, and verify frontend can authenticate.

---

## Tasks

### 1. Create Standardized Response DTO
- [ ] Create `src/common/dto/api-response.dto.ts`:
  ```typescript
  export class ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: Date;
    statusCode: number;
  }
  ```
- [ ] Create response interceptor:
  ```typescript
  @Injectable()
  export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
      return next.handle().pipe(
        map(data => ({
          success: true,
          message: 'Success',
          data,
          timestamp: new Date(),
          statusCode: 200,
        }))
      );
    }
  }
  ```

### 2. Create Error Handling Middleware
- [ ] Create `src/common/filters/http-exception.filter.ts`:
  - Catch all exceptions
  - Return standard error format:
    ```json
    {
      "success": false,
      "message": "Error message",
      "error": "error_code",
      "timestamp": "2026-03-29T...",
      "statusCode": 400
    }
    ```
  - Handle specific errors:
    - ValidationError → 400
    - UnauthorizedException → 401
    - ForbiddenException → 403
    - NotFoundException → 404
- [ ] Register globally in `app.module.ts`

### 3. Create Logging Interceptor
- [ ] Create `src/common/interceptors/logging.interceptor.ts`:
  - Log incoming requests: method, path, user
  - Log outgoing responses: status, duration
  - Format:
    ```
    [18:35:42.123] POST /api/auth/login User: anonymous 200 45ms
    [18:35:43.456] GET /api/sales User: megamanx 200 120ms
    ```
  - Register globally in `app.module.ts`

### 4. Create Health Check Endpoint
- [ ] Create `src/common/controllers/health.controller.ts`:
  ```typescript
  @Controller('api')
  export class HealthController {
    @Get('health')
    health() {
      return { status: 'ok', timestamp: new Date() };
    }
  }
  ```
- [ ] Test: `GET /api/health` → `{ "status": "ok" }`

### 5. Setup Swagger Documentation
- [ ] Verify Swagger is installed (`@nestjs/swagger`)
- [ ] Configure in `main.ts`:
  ```typescript
  const config = new DocumentBuilder()
    .setTitle('Ultimate POS API')
    .setDescription('The Ultimate POS API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  ```
- [ ] Visit: `http://localhost:3000/api/docs`
- [ ] Verify all endpoints listed with proper schema

### 6. Create Global Validation Pipe
- [ ] Add validation in `main.ts`:
  ```typescript
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  ```
- [ ] Test: POST with extra fields → rejected

### 7. Frontend Authentication Integration
- [ ] Update Angular login component:
  - Call `POST /api/auth/login` with credentials
  - Store tokens in localStorage
  - Set Authorization header: `Bearer {access_token}`
- [ ] Create Angular auth service:
  ```typescript
  // src/app/services/auth.service.ts
  login(username, password) {
    return this.http.post('/api/auth/login', { username, password });
  }
  ```
- [ ] Test login flow:
  1. Visit http://localhost:4200
  2. Enter username: `megamanx`
  3. Click login
  4. Should redirect to dashboard

### 8. Create HTTP Interceptor (Angular)
- [ ] Create `src/app/interceptors/auth.interceptor.ts`:
  - Add `Authorization: Bearer {token}` to all requests
  - Handle 401: redirect to login
  - Handle token refresh if expired

### 9. Test End-to-End
- [ ] NestJS API running on localhost:3000
- [ ] Angular frontend running on localhost:4200
- [ ] Login with `megamanx` credentials
- [ ] Check network tab: auth token sent in headers
- [ ] Dashboard loads (if exists)

### 10. Documentation
- [ ] Create `QUICKSTART.md` in project root:
  - How to run locally
  - API endpoints overview
  - Common errors & fixes
  - Swagger docs link

---

## Verification Checklist
- [ ] All API responses in standardized format
- [ ] Error handling returns proper status codes
- [ ] Logging captures all requests/responses
- [ ] Health check endpoint working
- [ ] Swagger docs accessible and complete
- [ ] Frontend login integration working
- [ ] Tokens properly stored and sent in requests
- [ ] 401 redirects to login properly

---

## Success Criteria
✅ Standardized API response format in place  
✅ Error handling comprehensive  
✅ Frontend successfully authenticates  
✅ Documentation complete  
✅ **Week 1 Complete!** ✅

---

## Code Changes Summary
- New file: `src/common/dto/api-response.dto.ts`
- New file: `src/common/interceptors/response.interceptor.ts`
- New file: `src/common/filters/http-exception.filter.ts`
- New file: `src/common/interceptors/logging.interceptor.ts`
- New file: `src/common/controllers/health.controller.ts`
- New file: `QUICKSTART.md`
- Update: `main.ts` (validation, Swagger, interceptors)
- Update: `src/app.module.ts` (register filters, interceptors)
- Update: `ultimate-pos-web/src/app/services/auth.service.ts`
- Update: `ultimate-pos-web/src/app/interceptors/auth.interceptor.ts`

---

## Week 1 Summary

| Day | Completed | Status |
|-----|-----------|--------|
| 1 | Database schema verification | ✅ |
| 2 | User model & service | ✅ |
| 3 | JWT authentication | ✅ |
| 4 | Roles & permissions | ✅ |
| 5 | API base setup & frontend | ✅ |

**Ready for Week 2: Core Transactions!**
