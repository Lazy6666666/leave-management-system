---
# Specify the following for Cursor rules
description: Coding rules for Supabase Realtime in Leave Management System
alwaysApply: false
---

# Supabase Realtime AI Assistant Guide - Leave Management System

You are an expert developer assistant specializing in Supabase Realtime implementations for leave management systems. This guide provides structured, actionable patterns for AI-driven development assistance specifically tailored for leave workflow automation.

## Implementation Rules for Leave Management

### Do
- Use `broadcast` for all leave-related realtime events (leave status changes, notifications, calendar updates)
- Use `presence` sparingly for tracking active users viewing leave calendars or dashboards
- Create indexes for all columns used in RLS policies (employee_id, manager_id, department_id)
- Use topic names that correlate with leave management concepts: `scope:entity` (e.g., `leave:123:updates`, `team:department_1:calendar`)
- Use snake_case for event names: `entity_action` (e.g., `leave_approved`, `calendar_updated`)
- Include proper unsubscribe/cleanup logic in all leave-related implementations
- Set `private: true` for channels using database triggers or RLS policies
- Give preference to private channels over public channels (better security and control)
- Implement proper error handling and reconnection logic for critical leave workflows

### Don't
- Use `postgres_changes` for new leave management applications (single-threaded, doesn't scale well)
- Create multiple subscriptions without proper cleanup in leave forms or dashboards
- Write complex RLS queries without proper indexing on employee/manager relationships
- Use generic event names like "update" or "change" for leave notifications
- Subscribe directly in render functions without state management for leave calendars
- Use database functions (`realtime.send`, `realtime.broadcast_changes`) in client code for leave operations

## Leave Management Function Selection

| Use Case | Recommended Function | Why |
|----------|---------------------|------|
| Leave status notifications | `broadcast` | More flexible for custom leave approval messages |
| Calendar updates when leaves change | `broadcast` via database triggers | Real-time team availability updates |
| Leave balance notifications | `broadcast` with minimal payload | Instant updates across all user sessions |
| Document expiry alerts | `broadcast` via database triggers | Automated compliance notifications |
| Manager dashboard updates | `broadcast` via database triggers | Live leave request notifications |
| Employee leave form submissions | `broadcast` without triggers | Real-time form state synchronization |

## Scalability Best Practices for Leave Management

### Dedicated Topics for Leave Workflows
**❌ Avoid Broad Topics:**
```javascript
// This broadcasts to ALL users - not scalable for leave notifications
const channel = supabase.channel('global:notifications')
```

**✅ Use Dedicated Topics:**
```javascript
// Leave-specific notifications for a particular leave request
const channel = supabase.channel(`leave:${leaveId}:updates`)

// Team calendar updates for a specific department
const channel = supabase.channel(`team:${departmentId}:calendar`)

// Manager-specific notifications for their direct reports
const channel = supabase.channel(`manager:${managerId}:requests`)

// Company-wide announcements (use sparingly)
const channel = supabase.channel(`company:announcements`)
```

### Benefits for Leave Management:
- **Reduced Network Traffic**: Leave notifications only reach relevant users
- **Better Performance**: Managers only get notifications for their team
- **Improved Security**: Employees only see their own leave information
- **Scalability**: System can handle more users as company grows
- **Compliance**: Easier to implement data access controls

### Leave Management Topic Strategy:
- **One topic per leave request**: `leave:123:updates`, `leave:123:comments`
- **One topic per team/department**: `team:department_1:calendar`, `team:department_1:requests`
- **One topic per manager**: `manager:456:dashboard`, `manager:456:approvals`
- **One topic per company**: `company:policy_changes`, `company:holidays`

## Leave Management Naming Conventions

### Topics (Channels)
- **Pattern:** `scope:entity` or `scope:entity:id`
- **Examples:**
  - `leave:123:updates` - Updates for specific leave request
  - `team:sales:calendar` - Team calendar updates
  - `manager:456:requests` - Manager's pending requests
  - `employee:789:notifications` - Employee-specific notifications
  - `company:announcements` - Company-wide announcements

### Events
- **Pattern:** `entity_action` (snake_case)
- **Examples:**
  - `leave_submitted` - When employee submits leave request
  - `leave_approved` - When manager approves leave
  - `leave_rejected` - When manager rejects leave
  - `calendar_updated` - When team calendar changes
  - `document_expired` - When company document expires
  - `balance_updated` - When leave balance changes

## Client Setup for Leave Management

```javascript
// Basic setup
const supabase = createClient('URL', 'ANON_KEY')

// Leave request specific channel
const leaveChannel = supabase.channel(`leave:${leaveId}:updates`, {
  config: {
    broadcast: { self: true, ack: true },
    presence: { key: `user-${userId}-session`, enabled: true },
    private: true  // Required for RLS authorization
  }
})

// Team calendar channel
const calendarChannel = supabase.channel(`team:${departmentId}:calendar`, {
  config: {
    broadcast: { self: false, ack: false },
    private: true
  }
})
```

## React Integration for Leave Management

### Leave Request Status Updates
```javascript
const leaveChannelRef = useRef(null)

useEffect(() => {
  // Check if already subscribed to prevent multiple subscriptions
  if (leaveChannelRef.current?.state === 'subscribed') return

  const channel = supabase.channel(`leave:${leaveId}:updates`, {
    config: { private: true }
  })
  leaveChannelRef.current = channel

  // Set auth before subscribing
  await supabase.realtime.setAuth()

  channel
    .on('broadcast', { event: 'leave_approved' }, handleLeaveApproved)
    .on('broadcast', { event: 'leave_rejected' }, handleLeaveRejected)
    .on('broadcast', { event: 'leave_commented' }, handleLeaveCommented)
    .subscribe()

  return () => {
    if (leaveChannelRef.current) {
      supabase.removeChannel(leaveChannelRef.current)
      leaveChannelRef.current = null
    }
  }
}, [leaveId])
```

### Team Calendar Live Updates
```javascript
const calendarChannelRef = useRef(null)

useEffect(() => {
  if (calendarChannelRef.current?.state === 'subscribed') return

  const channel = supabase.channel(`team:${departmentId}:calendar`, {
    config: { private: true }
  })
  calendarChannelRef.current = channel

  await supabase.realtime.setAuth()

  channel
    .on('broadcast', { event: 'calendar_updated' }, handleCalendarUpdate)
    .on('broadcast', { event: 'leave_approved' }, handleTeamLeaveUpdate)
    .on('broadcast', { event: 'leave_cancelled' }, handleTeamLeaveCancellation)
    .subscribe()

  return () => {
    if (calendarChannelRef.current) {
      supabase.removeChannel(calendarChannelRef.current)
      calendarChannelRef.current = null
    }
  }
}, [departmentId])
```

## Database Triggers for Leave Management

### Leave Request Status Changes
```sql
CREATE OR REPLACE FUNCTION notify_leave_status_change()
RETURNS TRIGGER AS $$
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notify the employee about their leave status change
  PERFORM realtime.broadcast_changes(
    'leave:' || COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  -- Notify the manager about new/updated leave requests
  PERFORM realtime.broadcast_changes(
    'manager:' || COALESCE(NEW.manager_id, OLD.manager_id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  -- Update team calendar
  PERFORM realtime.broadcast_changes(
    'team:' || COALESCE(NEW.department_id, OLD.department_id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;
```

### Document Expiry Notifications
```sql
CREATE OR REPLACE FUNCTION notify_document_expiry()
RETURNS TRIGGER AS $$
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only notify when document is approaching expiry (7 days)
  IF NEW.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN
    PERFORM realtime.broadcast_changes(
      'company:document_alerts',
      'UPDATE',
      'UPDATE',
      TG_TABLE_NAME,
      TG_TABLE_SCHEMA,
      NEW,
      OLD
    );
  END IF;

  RETURN NEW;
END;
$$;
```

### Leave Balance Updates
```sql
CREATE OR REPLACE FUNCTION notify_leave_balance_change()
RETURNS TRIGGER AS $$
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notify employee when their leave balance changes
  PERFORM realtime.broadcast_changes(
    'employee:' || COALESCE(NEW.employee_id, OLD.employee_id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;
```

## Authorization Setup for Leave Management

### RLS Policies for Leave Channels
```sql
-- Allow employees to read notifications about their own leaves
CREATE POLICY "employees_can_read_own_leave_notifications" ON realtime.messages
FOR SELECT TO authenticated
USING (
  topic LIKE 'leave:%' AND
  SPLIT_PART(topic, ':', 2)::uuid IN (
    SELECT id FROM leaves WHERE employee_id = auth.uid()
  )
);

-- Allow managers to read notifications about their team's leaves
CREATE POLICY "managers_can_read_team_leave_notifications" ON realtime.messages
FOR SELECT TO authenticated
USING (
  topic LIKE 'manager:%' AND
  SPLIT_PART(topic, ':', 2)::uuid = (
    SELECT manager_id FROM employees WHERE id = auth.uid()
  )
);

-- Allow team members to read team calendar updates
CREATE POLICY "team_members_can_read_calendar" ON realtime.messages
FOR SELECT TO authenticated
USING (
  topic LIKE 'team:%' AND
  SPLIT_PART(topic, ':', 2) = (
    SELECT department_id FROM employees WHERE id = auth.uid()
  )
);

-- Required indexes for performance
CREATE INDEX idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
```

## Leave Management Specific Patterns

### Manager Dashboard Live Updates
```javascript
const managerChannelRef = useRef(null)

useEffect(() => {
  if (managerChannelRef.current?.state === 'subscribed') return

  const channel = supabase.channel(`manager:${userId}:requests`, {
    config: { private: true }
  })
  managerChannelRef.current = channel

  await supabase.realtime.setAuth()

  channel
    .on('broadcast', { event: 'leave_submitted' }, handleNewLeaveRequest)
    .on('broadcast', { event: 'leave_cancelled' }, handleLeaveCancellation)
    .subscribe()

  return () => {
    if (managerChannelRef.current) {
      supabase.removeChannel(managerChannelRef.current)
      managerChannelRef.current = null
    }
  }
}, [userId])
```

### Employee Leave Balance Notifications
```javascript
const balanceChannelRef = useRef(null)

useEffect(() => {
  if (balanceChannelRef.current?.state === 'subscribed') return

  const channel = supabase.channel(`employee:${userId}:balance`, {
    config: { private: true }
  })
  balanceChannelRef.current = channel

  await supabase.realtime.setAuth()

  channel
    .on('broadcast', { event: 'balance_updated' }, handleBalanceUpdate)
    .subscribe()

  return () => {
    if (balanceChannelRef.current) {
      supabase.removeChannel(balanceChannelRef.current)
      balanceChannelRef.current = null
    }
  }
}, [userId])
```

## LLM Implementation Guidelines for Leave Management

### When Generating Leave Management Code
1. **Always use `broadcast` for leave workflows** - Never suggest `postgres_changes`
2. **Include state checking** - Check channel state before subscribing to prevent duplicate subscriptions
3. **Add cleanup logic** - Include unsubscribe in all leave-related examples
4. **Use proper naming** - Follow leave management topic/event conventions
5. **Include error handling** - Add reconnection patterns for critical leave operations
6. **Recommend indexing** - When RLS policies involve employee/manager relationships
7. **Framework integration** - Adapt patterns to Next.js/React context
8. **Emphasize private channels** - Explain security benefits for leave data

### Leave Management Code Generation Checklist
- ✅ Uses `broadcast` for all leave-related realtime features
- ✅ Checks `channel.state` before subscribing to prevent duplicates
- ✅ Includes proper cleanup/unsubscribe logic in useEffect returns
- ✅ Uses consistent leave management naming conventions
- ✅ Includes error handling and reconnection for production reliability
- ✅ Suggests indexes for employee/manager/department relationship queries
- ✅ Sets `private: true` for all leave-related channels
- ✅ Implements proper authentication before channel subscription

### Safe Defaults for Leave Management AI Assistant
- **Channel pattern:** `scope:entity:id` (e.g., `leave:123:updates`, `manager:456:requests`)
- **Event pattern:** `entity_action` (e.g., `leave_approved`, `calendar_updated`)
- **Always check channel state** before subscribing to prevent memory leaks
- **Always include cleanup** in React useEffect return statements
- **Default to `private: true`** for all leave-related channels
- **Suggest RLS policies** with proper indexing for employee data access
- **Include reconnection logic** for critical leave approval workflows
- **Use `broadcast` with triggers** for database change notifications
- **Use `broadcast` without triggers** for custom leave workflow events

**Remember:** In leave management systems, prioritize data privacy, ensure proper authorization, and implement reliable realtime updates for critical workflow steps like leave approvals and calendar changes.
