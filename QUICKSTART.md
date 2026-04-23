# Ultimate POS Quickstart

## Local Run

### API
```bash
cd ultimate-pos-api
npm install
npm run start:dev
```

API base URL: `http://localhost:3000/api`

### Web
```bash
cd ultimate-pos-web
npm install --legacy-peer-deps
npm start
```

Web app URL: `http://localhost:4200`

## API Docs

- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/docs-json`
- Health check: `http://localhost:3000/api/health`

## Authentication Test Path

### 1. Health check
```bash
curl http://localhost:3000/api/health
```

Expected shape:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "status": "ok",
    "timestamp": "..."
  },
  "timestamp": "...",
  "statusCode": 200
}
```

### 2. Login from API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "megamanx",
    "password": "YOUR_PASSWORD",
    "rememberMe": true
  }'
```

Expected shape:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": 1,
      "username": "megamanx"
    }
  },
  "timestamp": "...",
  "statusCode": 200
}
```

### 3. Validate token
```bash
curl http://localhost:3000/api/auth/validate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Browser login flow
1. Open `http://localhost:4200`
2. Enter `megamanx`
3. Enter the user password
4. Submit login form
5. Confirm redirect to `/dashboard`
6. Open DevTools > Application > Local Storage and verify:
   - `access_token`
   - `refresh_token`
   - `current_user`

### 5. Unauthorized flow
1. Delete `access_token` from local storage
2. Refresh the app on a protected route
3. Confirm redirect to `/auth/login`

## Common Issues

- `401 Unauthorized`: verify user exists and password is correct.
- `ECONNREFUSED`: verify the API is running on port `3000`.
- Angular install conflicts: use `npm install --legacy-peer-deps` in `ultimate-pos-web`.
- Missing push warning is non-blocking: VAPID keys only affect push notifications.