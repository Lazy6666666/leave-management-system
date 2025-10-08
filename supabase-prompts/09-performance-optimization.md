# Supabase Performance Optimization Prompt

You are optimizing the performance of a leave management system using Supabase. Identify bottlenecks and implement optimizations for database queries, real-time subscriptions, and overall application responsiveness.

## Project Context
- **Application**: Leave Management System
- **Scale**: 1000+ employees, high query volume
- **Performance Goals**: <100ms response times, real-time updates

## Performance Analysis Areas:

### Database Query Optimization:

1. **Slow Query Identification**:
   ```sql
   -- Enable query timing
   SET log_min_duration_statement = 100; -- Log queries > 100ms
   SET log_statement = 'all';

   -- Analyze specific queries
   EXPLAIN ANALYZE
   SELECT * FROM leave_requests
   WHERE employee_id = $1
   AND status = $2
   ORDER BY created_at DESC;
   ```

2. **Index Optimization**:
   - Composite indexes for common query patterns
   - Partial indexes for filtered queries
   - Covering indexes to avoid table lookups

3. **Query Refactoring**:
   - Replace multiple queries with single JOIN operations
   - Use CTEs for complex calculations
   - Implement pagination for large result sets

### Real-time Performance:

1. **Subscription Optimization**:
   ```typescript
   // Use targeted subscriptions instead of broad ones
   const subscription = supabase
     .channel(`leave-requests-${userId}`)
     .on('postgres_changes',
       {
         event: '*',
         schema: 'public',
         table: 'leave_requests',
         filter: `employee_id=eq.${userId}`
       },
       handleUpdate
     )
     .subscribe()
   ```

2. **Connection Management**:
   - Connection pooling configuration
   - Subscription cleanup on component unmount
   - Reconnection strategies with exponential backoff

### Caching Strategies:

1. **Application-Level Caching**:
   - Leave balance calculations
   - Employee information
   - Department hierarchies
   - Leave type configurations

2. **Database-Level Caching**:
   - Materialized views for complex reports
   - Redis caching for frequently accessed data
   - Query result caching

### Frontend Performance:

1. **Data Loading Optimization**:
   - Implement proper loading states
   - Use skeleton screens for better UX
   - Lazy loading for non-critical components

2. **Bundle Optimization**:
   - Code splitting for route-based chunks
   - Tree shaking for unused dependencies
   - Dynamic imports for heavy components

### Monitoring and Alerting:

1. **Performance Metrics**:
   - Database query performance
   - API response times
   - Real-time subscription latency
   - Frontend rendering performance

2. **Alerting Setup**:
   - Slow query alerts
   - Error rate monitoring
   - Resource usage tracking
   - User experience metrics

### Specific Optimization Scenarios:

1. **Leave Request Dashboard**:
   - Optimize complex queries with multiple JOINs
   - Implement virtual scrolling for large lists
   - Use React.memo for expensive components

2. **Reporting Queries**:
   - Pre-computed aggregates for common reports
   - Background processing for heavy reports
   - Incremental data updates

3. **Bulk Operations**:
   - Batch processing for leave approvals
   - Efficient bulk data imports
   - Optimized mass updates

### Load Testing Strategy:
- Simulate concurrent user access
- Test database performance under load
- Monitor resource usage patterns
- Identify scaling bottlenecks

### Continuous Optimization:
- Regular performance audits
- Query performance reviews
- Index usage analysis
- Capacity planning exercises
