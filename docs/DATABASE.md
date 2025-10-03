# Database Schema Documentation

This document provides an overview of the database schema for the Leave Management System.

## Tables

### 1. `profiles`
Stores user profile information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references auth.users |
| `email` | TEXT | User's email address |
| `first_name` | TEXT | User's first name |
| `last_name` | TEXT | User's last name |
| `role` | TEXT | User role (admin, manager, employee) |
| `department_id` | UUID | References departments.id |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### 2. `departments`
Department information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Department name |
| `description` | TEXT | Department description |
| `manager_id` | UUID | References profiles.id |
| `created_at` | TIMESTAMP | Record creation timestamp |

### 3. `leave_types`
Different types of leave available.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Leave type name (e.g., Annual, Sick) |
| `description` | TEXT | Description of the leave type |
| `default_days` | INTEGER | Default number of days allocated |
| `is_active` | BOOLEAN | Whether this leave type is active |

### 4. `leave_balances`
Tracks leave balances for each user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References profiles.id |
| `leave_type_id` | UUID | References leave_types.id |
| `total_days` | INTEGER | Total allocated days |
| `used_days` | INTEGER | Number of days used |
| `year` | INTEGER | The year this balance applies to |

### 5. `leave_requests`
Leave request records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References profiles.id |
| `leave_type_id` | UUID | References leave_types.id |
| `start_date` | DATE | Start date of leave |
| `end_date` | DATE | End date of leave |
| `status` | TEXT | Status (pending, approved, rejected, cancelled) |
| `reason` | TEXT | Reason for leave |
| `approver_id` | UUID | References profiles.id (manager) |
| `approved_at` | TIMESTAMP | When the request was approved/rejected |
| `created_at` | TIMESTAMP | Record creation timestamp |

## Relationships

1. **profiles** → **departments** (Many-to-One)
   - A department can have multiple users
   - Each user belongs to one department

2. **profiles** → **leave_balances** (One-to-Many)
   - A user can have multiple leave balances (one per leave type)

3. **profiles** → **leave_requests** (One-to-Many)
   - A user can have multiple leave requests

4. **leave_types** → **leave_balances** (One-to-Many)
   - Each leave type can be associated with multiple user balances

## Indexes

```sql
-- Improve query performance for common lookups
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_balances_user_leave_type ON leave_balances(user_id, leave_type_id);
```

## Row Level Security (RLS)

RLS policies are implemented to ensure data isolation:

- Users can only view their own leave requests and balances
- Managers can view their team's leave requests
- HR/Admins have full access to all data

## Backup Strategy

1. **Automated Backups**
   - Daily full backups
   - Transaction logs every 15 minutes

2. **Retention**
   - 7 days of daily backups
   - 4 weeks of weekly backups
   - 12 months of monthly backups

## Data Retention Policy

- Active user data: Retained while account is active
- Inactive user data: Archived after 1 year of inactivity
- Audit logs: Retained for 7 years for compliance
