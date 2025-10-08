# Supabase Testing Strategy Prompt

You are implementing comprehensive testing for a leave management system using Supabase. Create test suites for database operations, API endpoints, and real-time features.

## Project Context
- **Application**: Leave Management System
- **Testing Levels**: Unit, Integration, E2E
- **Tech Stack**: React, Supabase, TypeScript

## Testing Requirements

### Test Categories:

1. **Database Tests**:
   - Schema validation tests
   - RLS policy testing
   - Data integrity constraints
   - Migration rollback testing

2. **API Tests**:
   - Authentication endpoints
   - Leave request CRUD operations
   - Edge function testing
   - Error handling scenarios

3. **Real-time Tests**:
   - WebSocket connection testing
   - Subscription event handling
   - Reconnection scenarios
   - Message ordering validation

4. **Frontend Integration Tests**:
   - Component rendering with mock data
   - User interaction flows
   - Form validation
   - Error boundary testing

### Testing Tools and Frameworks:

```typescript
// Database testing setup
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { supabase } from '../lib/supabase'

// Test database setup
describe('Leave Requests API', () => {
  beforeAll(async () => {
    // Set up test data
    await supabase.from('employees').insert(testEmployee)
    await supabase.from('leave_types').insert(testLeaveTypes)
  })

  afterAll(async () => {
    // Clean up test data
    await supabase.from('leave_requests').delete().eq('test_id', 'test')
  })

  it('should create leave request with valid data', async () => {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: testEmployee.id,
        leave_type_id: annualLeaveType.id,
        start_date: '2024-01-15',
        end_date: '2024-01-20',
        reason: 'Family vacation'
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toMatchObject({
      employee_id: testEmployee.id,
      status: 'pending'
    })
  })
})
```

### RLS Policy Testing:

```typescript
describe('Row Level Security', () => {
  it('should prevent employees from viewing other employees requests', async () => {
    // Login as employee
    await supabase.auth.signIn(employeeCredentials)

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .neq('employee_id', employeeCredentials.user.id)

    expect(data).toHaveLength(0)
    expect(error).toBeNull()
  })

  it('should allow managers to view team requests', async () => {
    // Login as manager
    await supabase.auth.signIn(managerCredentials)

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')

    expect(error).toBeNull()
    expect(data.length).toBeGreaterThan(0)
  })
})
```

### Real-time Testing:

```typescript
describe('Real-time Subscriptions', () => {
  it('should receive real-time updates for leave request changes', (done) => {
    const subscription = supabase
      .channel('leave-requests')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leave_requests' },
        (payload) => {
          expect(payload.new.status).toBe('approved')
          subscription.unsubscribe()
          done()
        }
      )
      .subscribe()

    // Trigger status change
    supabase
      .from('leave_requests')
      .update({ status: 'approved' })
      .eq('id', testRequestId)
  })
})
```

### Edge Function Testing:

```typescript
describe('Leave Processing Edge Function', () => {
  it('should calculate leave days correctly', async () => {
    const { data, error } = await supabase.functions.invoke('leave-request-processing', {
      body: {
        start_date: '2024-01-15',
        end_date: '2024-01-20',
        employee_id: testEmployee.id
      }
    })

    expect(error).toBeNull()
    expect(data.days_requested).toBe(6) // 6 working days
    expect(data.weekends_included).toBe(0)
  })
})
```

### Test Data Management:

1. **Factory Functions**:
   ```typescript
   export const createTestEmployee = (overrides = {}) => ({
     name: 'Test Employee',
     email: 'test@example.com',
     department_id: testDepartment.id,
     ...overrides
   })

   export const createTestLeaveRequest = (overrides = {}) => ({
     employee_id: testEmployee.id,
     leave_type_id: annualLeaveType.id,
     start_date: '2024-01-15',
     end_date: '2024-01-20',
     ...overrides
   })
   ```

2. **Database Seeding**:
   - Automated test data creation
   - Consistent test scenarios
   - Cleanup after test completion

### Performance Testing:
- Database query performance
- Real-time subscription load testing
- Edge function response times
- Frontend rendering performance

### Continuous Integration:
- Automated test execution
- Test coverage reporting
- Performance regression detection
- Multi-environment testing
