# Supabase Database Schema Design Prompt

You are an expert Supabase developer working on a leave management system. Design a comprehensive database schema for managing employee leave requests, balances, and approvals.

## Project Context
- **Application**: Leave Management System
- **Tech Stack**: React frontend, Supabase backend
- **Features**: Employee management, leave requests, approvals, balance tracking

## Schema Requirements

### Core Tables Needed:
1. **employees** - Employee information and profiles
2. **leave_types** - Different types of leave (Annual, Sick, Personal, etc.)
3. **leave_requests** - Individual leave requests
4. **leave_balances** - Employee leave balances by type
5. **departments** - Department/organization structure
6. **documents** - Supporting documents for leave requests

### Design Specifications:
- Use proper foreign key relationships
- Include appropriate indexes for performance
- Consider data types for dates, status enums, etc.
- Plan for audit trails and soft deletes where appropriate

## Deliverables:
1. Complete SQL schema with all tables, columns, constraints
2. Indexes for optimal query performance
3. Row Level Security (RLS) policies
4. Sample data for testing

## Questions to Consider:
- How will leave balances be calculated and updated?
- What approval workflows need to be supported?
- How will carry-over leave be handled?
- What reporting requirements exist?
