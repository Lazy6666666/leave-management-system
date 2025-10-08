# Supabase Row Level Security (RLS) Policies Prompt

You are implementing comprehensive Row Level Security policies for a leave management system. Create security policies that ensure users can only access data appropriate to their role and permissions.

## Project Context
- **Application**: Leave Management System
- **Security Model**: Role-based access with department isolation
- **Data Sensitivity**: Employee data, leave records, personal information

## RLS Requirements

### Security Matrix:
| Table | HR Access | Manager Access | Employee Access |
|-------|-----------|----------------|-----------------|
| employees | All records | Department only | Own record only |
| leave_requests | All records | Department only | Own requests only |
| leave_balances | All records | Department only | Own balances only |
| leave_types | All records | All records | Read only |
| departments | All records | Own department | Read only |
| documents | All records | Department only | Own documents only |

### Policy Categories:

1. **Employee Data Protection**:
   - Users can only view/edit their own profile
   - Managers can access their team members
   - HR can access all employee records

2. **Leave Request Management**:
   - Employees can only see their own requests
   - Managers can see requests from their department
   - HR can see all requests across organization

3. **Document Security**:
   - Strict access control for uploaded documents
   - Audit trail for document access
   - Secure file URLs with time-limited access

4. **Reporting Access**:
   - Different report visibility based on role
   - Department-level vs organization-level reports
   - Sensitive data filtering

## Implementation Approach:
1. **Enable RLS** on all relevant tables
2. **Create Policy Functions** for reusable logic
3. **Department Hierarchy** consideration
4. **Audit Logging** for access tracking
5. **Performance Optimization** with proper indexing

## Testing Scenarios:
- Cross-department data isolation
- Role escalation prevention
- Edge cases with employee transfers
- Manager reassignments
