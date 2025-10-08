# Supabase Authentication Setup Prompt

You are implementing authentication for a leave management system using Supabase Auth. Set up a complete authentication system with role-based access control.

## Project Context
- **Application**: Leave Management System
- **User Roles**: HR, Manager, Employee
- **Requirements**: Secure login, role management, protected routes

## Authentication Requirements

### User Roles and Permissions:
1. **HR Role**: Full system access, manage employees, view all reports
2. **Manager Role**: Manage team members, approve leave requests, view team reports
3. **Employee Role**: Create leave requests, view own records, update profile

### Implementation Tasks:
1. **Auth Configuration**:
   - Set up Supabase Auth providers (email/password)
   - Configure JWT settings and session management
   - Set up email templates for confirmations

2. **User Registration**:
   - Create user signup flow with role assignment
   - Email verification process
   - Admin user creation for initial setup

3. **Role-Based Access Control**:
   - Create roles table or use user metadata
   - Implement permission checking functions
   - Set up middleware for route protection

4. **Security Features**:
   - Password policies and validation
   - Rate limiting for auth attempts
   - Account lockout mechanisms
   - Secure password reset flow

## Technical Specifications:
- Use Supabase Auth UI or custom forms
- Implement proper error handling
- Set up refresh token rotation
- Consider MFA for sensitive operations

## Integration Points:
- Frontend route protection
- API endpoint authorization
- Database RLS policies
- Real-time subscriptions for user status
