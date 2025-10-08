# Supabase Real-time Subscriptions Prompt

You are implementing real-time features for a leave management system using Supabase's real-time capabilities. Create subscription patterns for live updates on leave requests, approvals, and notifications.

## Project Context
- **Application**: Leave Management System
- **Real-time Features**: Live notifications, request status updates, dashboard updates
- **Users**: HR, Managers, Employees

## Real-time Requirements

### Subscription Categories:

1. **Leave Request Updates**:
   - Real-time status changes (pending → approved/rejected)
   - New leave request notifications for managers
   - Comment updates on requests

2. **Dashboard Live Updates**:
   - Live employee count changes
   - Real-time leave balance updates
   - Live pending request counters

3. **Notification System**:
   - Real-time notifications for approvals/rejections
   - System announcements
   - Reminder notifications

4. **User Status Updates**:
   - Online/offline status for collaboration
   - Typing indicators for comments
   - Real-time presence in approval workflows

### Technical Implementation:

1. **Subscription Setup**:
   ```typescript
   // Pattern for leave request subscriptions
   const leaveSubscription = supabase
     .channel('leave-requests')
     .on('postgres_changes',
       { event: '*', schema: 'public', table: 'leave_requests' },
       handleLeaveUpdate
     )
     .subscribe()
   ```

2. **Filter Strategies**:
   - Department-based filtering for managers
   - User-specific subscriptions for employees
   - Role-based subscription permissions

3. **Performance Optimization**:
   - Connection pooling strategies
   - Subscription cleanup on logout
   - Reconnection handling
   - Message batching for high-frequency updates

4. **Error Handling**:
   - Connection failure recovery
   - Subscription state management
   - Graceful degradation for offline scenarios

### Use Cases:
- **Manager Dashboard**: Live updates when team members submit requests
- **Employee Portal**: Real-time approval notifications
- **HR Dashboard**: Live organization-wide statistics
- **Mobile App**: Push notifications for important updates

### Integration Points:
- React components with useEffect cleanup
- Service worker for background updates
- Push notification integration
- Offline queue management
