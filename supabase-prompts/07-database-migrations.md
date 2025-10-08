# Supabase Database Migrations Prompt

You are managing database schema changes for a leave management system using Supabase migrations. Implement proper migration strategies for schema evolution and data integrity.

## Project Context
- **Application**: Leave Management System
- **Environment**: Development, Staging, Production
- **Migration Strategy**: Version-controlled, rollback-capable schema changes

## Migration Requirements

### Migration Categories:

1. **Schema Changes**:
   - New table creation
   - Column additions/modifications
   - Index creation and optimization
   - Constraint additions

2. **Data Migrations**:
   - Data transformation scripts
   - Lookup table population
   - Historical data cleanup
   - Data type conversions

3. **Seed Data**:
   - Initial leave types configuration
   - Default department structure
   - System administrator account
   - Sample data for testing

### Migration Structure:

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_leave_types.sql
├── 003_create_indexes.sql
├── 004_add_audit_fields.sql
├── 005_populate_leave_types.sql
└── 006_add_department_hierarchy.sql
```

### Migration Best Practices:

1. **Atomic Operations**:
   ```sql
   -- Migration: Add approval workflow fields
   BEGIN;

   ALTER TABLE leave_requests
   ADD COLUMN approved_by UUID REFERENCES employees(id),
   ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
   ADD COLUMN manager_comments TEXT;

   -- Create index for performance
   CREATE INDEX idx_leave_requests_approved_at
   ON leave_requests(approved_at);

   COMMIT;
   ```

2. **Rollback Support**:
   ```sql
   -- Migration with rollback
   -- Add new field
   ALTER TABLE employees ADD COLUMN emergency_contact TEXT;

   -- Rollback:
   -- ALTER TABLE employees DROP COLUMN emergency_contact;
   ```

3. **Environment Management**:
   - Separate migration tracking per environment
   - Staging environment for testing migrations
   - Production deployment procedures

4. **Data Safety**:
   - Backup verification before migrations
   - Transaction wrapping for consistency
   - Foreign key constraint validation
   - Data validation scripts

### Migration Tools and Commands:

```bash
# Generate new migration
supabase migration new add_employee_fields

# Apply migrations locally
supabase db reset

# Apply to remote project
supabase db push

# Check migration status
supabase db diff

# Generate TypeScript types
supabase gen types typescript --project-id [project-id] > types/supabase.ts
```

### Common Migration Patterns:

1. **Adding New Leave Types**:
   - Insert new leave type records
   - Update existing leave balances
   - Create new balance records for all employees

2. **Department Restructure**:
   - Update employee department assignments
   - Migrate leave request associations
   - Update manager hierarchies

3. **Policy Updates**:
   - New fields for compliance requirements
   - Updated validation rules
   - Audit trail enhancements

### Testing Strategy:
- Local migration testing
- Staging environment validation
- Rollback testing procedures
- Data integrity verification scripts

### Production Deployment:
- Maintenance window scheduling
- Backup verification
- Rollback plan documentation
- Post-deployment validation
