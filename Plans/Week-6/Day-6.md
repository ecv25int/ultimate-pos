# Week 6, Day 6: Single Session Enforcement

## Objective
Ensure that each user can only have one active session at a time. Logging in from a new browser/device should invalidate any previous session.

---

## PHP project at: 
This is a migration project. PHP Source code at /opt/homebrew/var/www/superpos/ 
Update Plans/Plan-Checklist.md  file when finish, with all the plans implemented so far, including this one. 
For the current week, update also the progress in Plans/Week-X/Day-X.md for the days already done. 

## Tasks

### 1. Analyze Current Session Handling
- [ ] Review current JWT/refresh token implementation
- [ ] Identify where tokens are generated, stored, and validated
- [ ] Document how multiple sessions are currently possible

### 2. Design Single Session Strategy
- [ ] Decide on session tracking method (e.g., store session ID or token in DB)
- [ ] Update user model or create a new `UserSession` model/table if needed
- [ ] Define logic for invalidating previous sessions on new login

### 3. Implement Session Tracking
- [ ] On login, generate a unique session ID (e.g., UUID)
- [ ] Store session ID in DB (user/session table)
- [ ] Include session ID in JWT payload
- [ ] On each authenticated request, verify session ID matches DB

### 4. Invalidate Previous Sessions
- [ ] On new login, update session ID in DB (invalidate old tokens)
- [ ] Optionally, provide a logout endpoint to clear session

### 5. Update Auth Middleware/Guard
- [ ] Modify JWT strategy/guard to check session ID validity
- [ ] Reject requests with invalid/old session IDs

### 6. Test Scenarios
- [ ] User logs in from browser A, then browser B (A should be logged out)
- [ ] User logs in, logs out, then logs in again (old session invalid)
- [ ] User refreshes token (session remains valid)
- [ ] User tries to use old token after new login (should fail)

---

## Success Criteria
- Only one active session per user
- Old tokens are invalidated on new login
- All endpoints enforce single-session logic
- No race conditions or security gaps

---

## Notes
- Consider using Redis or DB for session storage for scalability
- Ensure refresh tokens are also tied to session ID
- Communicate session invalidation to frontend for user experience
