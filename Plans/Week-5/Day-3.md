# Week 5, Day 3: Notifications, Alerts & Audit Logging

## Objective
Implement system alerts and activity audit trail.

## PHP project at: 
This is a migration project. PHP Source code at /opt/homebrew/var/www/superpos/ 
Update Plans/Plan-Checklist.md  file when finish, with all the plans implemented so far, including this one. 
For the current week, update also the progress in Plans/Week-X/Day-X.md for the days already done. 

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
