# Week 5, Day 3: Notifications, Alerts & Audit Logging

## Objective
Implement system alerts and activity audit trail.

## Tasks
- [ ] Verify Notification, NotificationTemplate, ActivityLog models
- [ ] Create `notification.service.ts`:
  - sendNotification(userId, type, message)
  - Alert types: expiry_alert, stock_low, payment_due, order_ready
  - markAsRead(notificationId)
  - getUnreadCount(userId)
- [ ] Implement alert triggers:
  - Stock below minimum
  - Payment overdue
  - Expiry approaching (7 days)
  - High discount rate
- [ ] Delivery channels: In-app + Email + SMS (optional)
- [ ] Create `audit.service.ts`:
  - logActivity(subject, action, changes)
  - getActivityLog(filters)
  - Track: user, action, entity, timestamp, changes
- [ ] Unit and integration tests

## Verification
- [ ] All alerts triggering correctly
- [ ] Notifications delivered via channels
- [ ] Audit trail capturing all changes
- [ ] Data retention policy enforced

## Success Criteria
✅ Alert system and audit logging complete
