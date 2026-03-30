# Week 6, Day 4: Performance Optimization & Security Hardening

## Objective
Optimize performance and apply security best practices.

## Tasks
- [ ] Performance Analysis:
  - Profile slow queries (> 1s)
  - Add indexes where needed
  - Optimize N+1 queries (eager loading)
  - Implement response caching (Redis)
    - Products: 5 min TTL
    - Exchange rates: 1 day
    - Dashboard KPIs: 1 min
- [ ] API response optimization:
  - Pagination (default 20, max 100)
  - Select only needed fields
  - Gzip compression
- [ ] Load testing:
  - Simulate 50+ concurrent users
  - Measure response times
  - Identify bottlenecks
- [ ] Security Audit:
  - Code review for OWASP Top 10
  - Dependency vulnerability scan (`npm audit`)
  - Secrets management (.env not in git)
  - HTTPS/SSL verification
  - API rate limiting configured
  - Input validation complete
- [ ] Database maintenance:
  - Optimize tables
  - Create recommended indexes
  - Test backup/restore

## Verification
- [ ] No slow queries (all < 1s)
- [ ] Caching reducing query load
- [ ] Load test results acceptable
- [ ] Security review passed
- [ ] No high-severity vulnerabilities

## Success Criteria
✅ Performance and security verified
