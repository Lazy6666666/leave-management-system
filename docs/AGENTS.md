# 🚀 LEAVE MANAGEMENT SYSTEM – DEVELOPER IMPLEMENTATION PLAN

**Version:** v1.0
**Scope:** Dynamic, human-centered HR platform with intelligent dashboards, live reporting, and seamless identity UX
**Tech Stack:**

* **Frontend:** React + TypeScript + TanStack Query + Framer Motion + ShadCN/UI + Recharts
* **Backend:** Supabase (Postgres, Edge Functions, Auth, Storage)
* **Testing:** Playwright MCP + Jest + Supabase Test Suite
* **Design System:** Existing project components and design tokens

---

## 🧩 PHASE 1 – SIDEPANEL AUTHENTICATION & IDENTITY ENHANCEMENT

### 🎯 Objective

Transform sidebar authentication into a dynamic identity center that adapts visually and contextually to user roles.

### 🔧 Implementation Breakdown

#### **Frontend Tasks**

| Task               | Description                                                    | Components                   | Dependencies            |
| ------------------ | -------------------------------------------------------------- | ---------------------------- | ----------------------- |
| Role Detection     | Replace hardcoded role with Supabase auth-based role detection | `Sidebar.tsx`                | Supabase Auth           |
| Dynamic Display    | Fetch and render `first_name + last_name` dynamically          | `UserBadge`, `SidebarHeader` | Supabase Profiles Table |
| Role Visuals       | Add conditional styling for Employee/Manager/HR                | `RoleBadge`, Framer Motion   | Role context            |
| Micro Interactions | Implement animated transitions for role changes                | `SidebarMotionWrapper`       | Framer Motion           |

#### **Backend Tasks**

| Task                   | Description                                    | Tooling           |
| ---------------------- | ---------------------------------------------- | ----------------- |
| Profile Join           | Extend `auth.users` join with `profiles` table | Supabase SQL View |
| Real-Time Role Updates | Enable real-time subscription to role changes  | Supabase Channels |
| Role Policies          | Add RLS (Row Level Security) for per-role data | Supabase Policies |

---

## 📊 PHASE 2 – ADMIN DASHBOARD LIVE INTELLIGENCE & DATA VISUALIZATION

### 🎯 Objective

Transform admin dashboard into a live organizational intelligence command center.

### 🔧 Implementation Breakdown

#### **Frontend Tasks**

| Task                    | Description                                                      | Components                                |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| Live Counters           | Replace mock data with real-time aggregates                      | `StatsCard`, `OverviewMetrics`            |
| Real-Time Graphs        | Implement reactive charts for leave activity, roles, departments | `OrgChart`, `RechartsWrapper`             |
| Predictive Loading      | Use skeleton states for prefetch anticipation                    | `DashboardSkeleton`, TanStack Query       |
| Drill-down Interactions | Enable click-to-filter detail exploration                        | `AnalyticsPanel`, `DepartmentDetailModal` |

#### **Backend Tasks**

| Task             | Description                                       | Tooling                 |
| ---------------- | ------------------------------------------------- | ----------------------- |
| Aggregation View | Create live view combining employee + leave stats | SQL Materialized View   |
| Triggers         | Auto-refresh stats when leaves or users update    | Supabase Trigger        |
| Edge Function    | Serve aggregated dashboard data                   | `functions/getOrgStats` |

---

## 🔍 PHASE 3 – STREAMLINED REPORTING & EMPLOYEE SEARCH

### 🎯 Objective

Implement a **lightweight, accurate, real-time employee search** with **Excel export** — optimized for HR/Admin workflows.

### 🔧 Implementation Breakdown

#### **Frontend Tasks**

| Task          | Description                                             | Components                       | Notes                                          |
| ------------- | ------------------------------------------------------- | -------------------------------- | ---------------------------------------------- |
| Search UI     | Add search bar with instant filtering                   | `ReportsPage.tsx`, `SearchInput` | Use TanStack Query debounce                    |
| Results Table | Display employee results with profile and leave summary | `EmployeeResultsTable`           | Columns: Name, Role, Department, Leave Balance |
| Profile Modal | View detailed employee info                             | `EmployeeDetailModal`            | Fetch join data on demand                      |
| Export Button | Add “Export to Excel” button for current results        | `ExportButton`                   | Use xlsx library or Supabase function          |
| Pagination    | Implement lazy load or infinite scroll                  | `PaginatedResults`               | Optional based on dataset size                 |

#### **Backend Tasks**

| Task           | Description                                                | Tooling                     | Notes                                |
| -------------- | ---------------------------------------------------------- | --------------------------- | ------------------------------------ |
| Search API     | Create edge function for user search (by name, dept, role) | `functions/searchEmployees` | Use ILIKE for case-insensitive match |
| Data Join      | Fetch user + role + department + leave history             | Supabase Query/SQL View     | Optimize with indexed columns        |
| Excel Export   | Generate and stream .xlsx files                            | `functions/exportEmployees` | Use `xlsx` or `exceljs`              |
| Access Control | Restrict search/export to HR/Admin                         | Supabase RLS Policies       | Enforce JWT claims                   |

---

## 👥 PHASE 4 – USER MANAGEMENT & LIFECYCLE DESIGN

### 🎯 Objective

Reimagine user management with empathy and intelligent validation.

### 🔧 Implementation Breakdown

#### **Frontend Tasks**

| Task                | Description                          | Components                 |
| ------------------- | ------------------------------------ | -------------------------- |
| Edit/Delete Buttons | Add actions in User Management table | `UsersTable`, `ActionCell` |
| Edit Modal          | Pre-filled, validated user form      | `UserEditModal`            |
| Conditional Fields  | Adapt form based on role or status   | `UserForm`                 |
| Optimistic Updates  | Reflect UI instantly on save         | TanStack Query Mutation    |

#### **Backend Tasks**

| Task          | Description                              | Tooling                        |
| ------------- | ---------------------------------------- | ------------------------------ |
| CRUD APIs     | Edge functions for add/edit/delete users | `functions/manageUsers`        |
| Validation    | Input and role-based validation          | Zod / Edge Function validation |
| Audit Logging | Track all changes in audit table         | Supabase Trigger + Table       |

---

## 🧠 PHASE 5 – SYSTEM VALIDATION & INTELLIGENT TESTING

### 🎯 Objective

Ensure system stability through end-to-end and UX-quality testing.

### 🔧 Implementation Breakdown

#### **Frontend Testing**

| Type          | Tool                | Description                |
| ------------- | ------------------- | -------------------------- |
| E2E           | Playwright MCP      | Role-based journey testing |
| Visual        | Playwright Snapshot | Catch UI regressions       |
| Accessibility | axe-core            | Validate WCAG compliance   |

#### **Backend Testing**

| Type        | Tool                        | Description                       |
| ----------- | --------------------------- | --------------------------------- |
| API         | Jest + Supertest            | Validate all edge functions       |
| Performance | k6 or Supabase Monitor      | Load test real-time subscriptions |
| Chaos       | Randomized disconnect tests | Ensure real-time stability        |

---

## ✅ SUCCESS METRICS

| Metric                               | Target                          |
| ------------------------------------ | ------------------------------- |
| Auth state role updates              | <200ms                          |
| Employee search latency              | <300ms                          |
| Excel export                         | <3 seconds                      |
| Admin dashboard refresh              | Real-time via Supabase Channels |
| Testing coverage                     | 95%+                            |
| UX satisfaction (post-launch survey) | ≥ 4.5/5                         |
| HR/Admin workflow time saved         | ≥ 60%                           |
