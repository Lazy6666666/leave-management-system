You are a visionary full-stack developer blending cutting-edge UX innovation with enterprise-grade technical precision, specializing in next-generation HR systems that empower both users and administrators through intelligent, real-time experiences. Transform the leave management system into a dynamic, human-centered platform that anticipates user needs while maintaining rock-solid reliability.

## PHASE 1: SIDEPANEL AUTHENTICATION & IDENTITY ENHANCEMENT

**INNOVATIVE IDENTITY EXPERIENCE:**
Explore breakthrough approaches to make authentication not just functional, but emotionally engaging - what if the sidebar became a living identity center that adapts its visual language based on user role, displaying role-based badge animations, contextual tips, or even subtle celebratory effects when users reach milestones? Imagine a sidebar that serves as a personal dashboard snippet, showing real-time status indicators for leave balances or pending approvals with micro-interactions that make checking status feel rewarding rather than routine.

**TECHNICAL IMPLEMENTATION:**
- Replace hardcoded 'Employee' display with dynamic role detection from Supabase authentication
- Fetch and display user full name (first_name + last_name) from authenticated user profile  
- Implement role-based visual treatments using conditional styling and animations
- Add contextual tooltips and status indicators for different user personas

**FRONTEND:** 
Implement real-time identity detection using TanStack Query hooks that subscribe to auth state changes. Create adaptive UI components that morph based on user role - employees see streamlined personal stats, managers get team approval counters, HR views organization metrics. Use motion libraries like Framer Motion for subtle role-transition animations that create visual hierarchy and engagement.

**BACKEND:** 
Implement role-based real-time subscriptions for authentication state changes (reference: `supabase-prompts/02-authentication-setup.md`, `supabase-prompts/04-real-time-subscriptions.md`). Create edge functions for dynamic user profile enrichment that considers role permissions and department context, ensuring secure data access while providing personalized identity information.

## PHASE 2: ADMIN DASHBOARD LIVE INTELLIGENCE & DATA VISUALIZATION

**REVOLUTIONARY DASHBOARD INNOVATION:**
Reimagine the admin dashboard as an intelligent command center that doesn't just display data, but tells organizational stories through adaptive visualizations. What if it used AI-driven layout adjustments based on current business priorities, morphing from overview mode during peak workload hours to detailed analytical mode during planning cycles? Consider implementing predictive employee insights, sentiment indicators derived from leave patterns, or even gamified elements that celebrate team collaboration milestones.

**TECHNICAL IMPLEMENTATION:**  
- Remove all mock/hardcoded data (3 employees, 1 HR, 1 Manager display)
- Implement real-time employee statistics aggregation by role and department
- Create live counters that update instantly when users are added/modified
- Add filtering and drill-down capabilities for organization insights

**FRONTEND:**
Develop reactive chart components using libraries like Recharts or D3 that automatically adjust visualization strategies based on data patterns. Implement predictive loading states that show skeleton versions of expected data distributions, creating anticipation rather than empty waiting. Add micro-interactions like animated counters and progress bars that celebrate data milestones.

**BACKEND:**
Build real-time dashboard APIs using database views and triggers (reference: `supabase-prompts/01-database-schema-design.md`, `supabase-prompts/04-real-time-subscriptions.md`). Create edge functions for complex aggregations that support live data partitioning and intelligent caching strategies, ensuring the dashboard becomes smarter with each user interaction.

## PHASE 3: INTELLIGENT REPORTING ECOSYSTEM & SEARCH INNOVATION

**NEXT-GENERATION REPORTING PARADIGM:**
Transform reporting from static exports to interactive discovery environments. Imagine reports as collaborative workspaces where managers can annotate insights, share findings with contextual commentary, or even receive AI-suggested optimization recommendations based on leave pattern analysis. What about implementing natural language search that understands "team vacation conflicts" or predictive reporting that flags potential burnout patterns before they impact productivity?

**TECHNICAL IMPLEMENTATION:**
- Add searchable user interface with real-time query results
- Implement user selection modal displaying profile details and leave history  
- Create report extraction popup with employee data, accumulated leave totals, and attached documents
- Integrate Excel export functionality with customizable report templates
- Fix existing data fetching to use proper Supabase queries with joins

**FRONTEND:**
Build an AI-assisted search interface using fuzzy matching and predictive suggestions that anticipates user intent. Create interactive report generation modals with drag-drop report builders, allowing managers to compose custom analytical views. Implement progressive disclosure patterns where basic reports unfold into detailed analysis based on user engagement signals.

**BACKEND:**
Develop advanced reporting edge functions with complex data aggregation capabilities (reference: `supabase-prompts/05-edge-functions.md`, `supabase-prompts/06-storage-configuration.md`). Implement intelligent query optimization strategies that learn from usage patterns, creating database indexes and materialized views dynamically as reporting needs evolve.

## PHASE 4: SOPHISTICATED USER MANAGEMENT & LIFECYCLE DESIGN

**HUMAN-CENTERED USER LIFECYCLE:**
Elevate user management from administrative chore to meaningful relationship nurturing. Consider designing the edit experience as a guided journey that anticipates administrator needs - pre-filled templates for common role changes, intelligent suggestions for department transfers, or even automated compliance reminders for employee lifecycle events. What if the interface adapted its language and workflow based on whether you're onboarding a new hire or managing a veteran employee's career transition?

**TECHNICAL IMPLEMENTATION:**
- Add action columns with Edit/Delete buttons using existing UI components
- Implement comprehensive edit modal with all user fields (role, active status, department, email, name)
- Include proper validation and optimistic updates
- Pre-populate forms with current data and handle submission errors gracefully

**FRONTEND:**
Create empathetic form experiences with conditional fields that appear based on role changes, providing contextual validation messages and progressive disclosure. Implement optimistic UI updates with automatic rollback capabilities, ensuring administrators feel confident in their management actions through seamless interactions.

**BACKEND:**
Build secure CRUD operations with advanced validation rules and audit trails (reference: `supabase-prompts/03-row-level-security.md`, `supabase-prompts/07-database-migrations.md`). Create policy-based access controls that adapt to organizational hierarchy changes, ensuring user management operations are both secure and contextually appropriate.

## PHASE 5: COMPREHENSIVE SYSTEM VALIDATION & INTELLIGENT TESTING

**HOLISTIC SYSTEM ASSURANCE:**
Develop testing strategies that validate not just functionality, but the entire user experience ecosystem. Implement AI-driven test generation that learns from user behavior patterns, creating test scenarios for edge cases that emerge from real usage. Consider implementing continuous validation where the system self-tests during low-traffic periods, maintaining quality through proactive monitoring rather than reactive bug fixing.

**TECHNICAL IMPLEMENTATION:** 
- Utilize Playwright MCP for complete end-to-end system testing coverage
- Test all implemented features across different user roles and scenarios
- Validate real-time features, data consistency, and UI responsiveness
- Ensure accessibility compliance and error handling robustness

**FRONTEND:**
Create comprehensive test suites that validate user journey flows, accessibility compliance, and performance benchmarks (reference: `supabase-prompts/08-testing-strategy.md`). Implement visual regression testing that catches not just bugs, but UX inconsistencies that could impact user satisfaction.

**BACKEND:**
Develop robust API testing infrastructure with performance monitoring and chaos engineering practices (reference: `supabase-prompts/08-testing-strategy.md`, `supabase-prompts/09-performance-optimization.md`). Implement continuous testing pipelines that validate data integrity, real-time subscriptions, and edge function reliability across different load scenarios.

**SUCCESS METRICS & INNOVATION MEASUREMENT:**
- All role identifications update dynamically without page refresh
- Admin dashboard displays 100% accurate live organizational statistics  
- Reports interface enables efficient user discovery and rich data extraction
- User management operations persist securely with comprehensive validation
- Playwright MCP tests achieve 95%+ coverage with sub-200ms response times
- User engagement metrics show improved task completion rates and reduced administrative friction

Leverage existing codebase patterns including TanStack Query for state management, existing UI components from the design system, TypeScript interfaces from `database.types.ts`, and established error handling utilities. Ensure all implementations follow the project's accessibility standards and maintain backward compatibility with existing authentication and permission systems.