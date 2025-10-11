# Quick Start Guide - Org Statistics Backend

## 🚀 Deploy in 5 Minutes

### Prerequisites
- Supabase CLI installed
- Project initialized (`supabase init`)
- Admin/HR user account for testing

### Step 1: Deploy Database Components (2 minutes)

```bash
cd backend/supabase

# Deploy all migrations in order
supabase db push --file migrations/20251009_create_org_statistics_view.sql
supabase db push --file migrations/20251009_create_org_statistics_triggers.sql
supabase db push --file migrations/20251009_add_org_statistics_indexes.sql
```

### Step 2: Deploy Edge Function (1 minute)

```bash
# Deploy the function
supabase functions deploy get-org-stats

# Verify it's deployed
supabase functions list | grep get-org-stats
```

### Step 3: Run Tests (1 minute)

```bash
# Run comprehensive test suite
supabase db execute --file migrations/20251009_test_org_statistics.sql
```

### Step 4: Test the API (1 minute)

```bash
# Get your project URL
PROJECT_URL="https://<your-project-ref>.supabase.co"

# Login as admin/hr user and get token
ACCESS_TOKEN="<your_access_token>"

# Test the endpoint
curl -X GET \
  "$PROJECT_URL/functions/v1/get-org-stats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## ✅ Verify Everything Works

### Check 1: View Exists and Has Data
```sql
SELECT last_refreshed,
       employee_stats->>'total_employees' as total_employees,
       current_year_leave_stats->>'pending_leaves' as pending_leaves
FROM org_statistics;
```

Expected: 1 row with current timestamp and statistics

### Check 2: Triggers Are Active
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%refresh_org_stats%';
```

Expected: 3 triggers, all enabled ('O')

### Check 3: Edge Function Works
```javascript
// In your frontend or browser console
const { data, error } = await supabase.functions.invoke('get-org-stats')
console.log('Response time:', data.meta.response_time_ms, 'ms')
console.log('Total employees:', data.employee_stats.total_employees)
```

Expected: Response in <200ms with full statistics

## 🔧 Common Issues

### Issue: "relation org_statistics does not exist"
**Solution**: Run the view creation migration
```bash
supabase db push --file migrations/20251009_create_org_statistics_view.sql
```

### Issue: "permission denied for function"
**Solution**: Grant permissions
```sql
GRANT EXECUTE ON FUNCTION refresh_org_statistics_manual() TO authenticated;
```

### Issue: Edge Function returns 403
**Solution**: Ensure you're logged in as admin or hr user
```sql
-- Check your role
SELECT role FROM profiles WHERE id = auth.uid();
```

### Issue: Slow response times
**Solution**: Check if indexes are created
```sql
SELECT indexname FROM pg_indexes
WHERE tablename IN ('leaves', 'profiles', 'leave_types');
```

## 📊 View the Statistics

### Option 1: Direct SQL Query
```sql
SELECT
  last_refreshed,
  jsonb_pretty(employee_stats) as employees,
  jsonb_pretty(current_year_leave_stats) as leave_stats,
  jsonb_pretty(approval_metrics) as approvals
FROM org_statistics;
```

### Option 2: Via Edge Function (Recommended)
```bash
curl -X GET \
  "https://<project-ref>.supabase.co/functions/v1/get-org-stats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

### Option 3: Frontend Integration
```typescript
import { supabase } from '@/lib/supabase-client'

const { data, error } = await supabase.functions.invoke('get-org-stats')
console.log(data)
```

## 🧪 Test Trigger Functionality

### Test Auto-Refresh on Leave Creation
```sql
-- Get current refresh time
SELECT last_refreshed FROM org_statistics;

-- Create a test leave
INSERT INTO leaves (requester_id, start_date, end_date, leave_type_id, days_count)
VALUES (
  (SELECT id FROM profiles WHERE role = 'employee' LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '5 days',
  (SELECT id FROM leave_types LIMIT 1),
  5
);

-- Check if refresh time updated
SELECT last_refreshed FROM org_statistics;
```

Expected: `last_refreshed` timestamp should be newer

## 📈 Performance Monitoring

### Check Query Performance
```sql
EXPLAIN ANALYZE SELECT * FROM org_statistics;
```

Expected: <50ms execution time

### Monitor Index Usage
```sql
SELECT
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE tablename IN ('leaves', 'profiles', 'leave_types')
ORDER BY idx_scan DESC;
```

### Check View Refresh Performance
```sql
-- Time the refresh
\timing on
SELECT refresh_org_statistics_manual();
\timing off
```

Expected: 100-300ms

## 🔄 Manual Refresh (if needed)

```sql
-- Manual refresh via SQL
SELECT refresh_org_statistics_manual();

-- Or via direct command
REFRESH MATERIALIZED VIEW CONCURRENTLY org_statistics;
```

## 📱 Frontend Integration Example

### React Hook
```typescript
// hooks/use-org-stats.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'

export function useOrgStats() {
  return useQuery({
    queryKey: ['org-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-org-stats')
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 5 * 60 * 1000 // Auto-refresh every 5 minutes
  })
}
```

### Dashboard Component
```typescript
// components/admin/Dashboard.tsx
import { useOrgStats } from '@/hooks/use-org-stats'

export function AdminDashboard() {
  const { data, isLoading, error } = useOrgStats()

  if (isLoading) return <div>Loading statistics...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>Organization Statistics</h1>
      <p>Last updated: {new Date(data.last_refreshed).toLocaleString()}</p>
      <p>Response time: {data.meta.response_time_ms}ms</p>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={data.employee_stats.total_employees}
        />
        <StatCard
          title="Pending Leaves"
          value={data.current_year_leave_stats.pending_leaves}
        />
        <StatCard
          title="Approval Rate"
          value={`${data.approval_metrics.approval_rate}%`}
        />
        <StatCard
          title="Avg Approval Time"
          value={`${data.approval_metrics.avg_approval_time_hours}h`}
        />
      </div>
    </div>
  )
}
```

## 🎯 What You Get

After following this guide, you'll have:

✅ Materialized view aggregating all org statistics
✅ Automatic refresh on data changes via triggers
✅ Edge Function API endpoint (<200ms response)
✅ 13 performance indexes for optimal queries
✅ Comprehensive test suite
✅ Frontend integration ready

## 📚 Additional Resources

- **Full Documentation**: `ORG_STATISTICS_IMPLEMENTATION.md`
- **Implementation Summary**: `PHASE_2_BACKEND_COMPLETE.md`
- **Test Suite**: `migrations/20251009_test_org_statistics.sql`
- **API Source**: `functions/get-org-stats/index.ts`

## 🆘 Need Help?

1. Run the test suite first: `supabase db execute --file migrations/20251009_test_org_statistics.sql`
2. Check Edge Function logs: `supabase functions logs get-org-stats`
3. Review full documentation in `ORG_STATISTICS_IMPLEMENTATION.md`
4. Verify your user role: `SELECT role FROM profiles WHERE id = auth.uid();`

---

**Ready to use in production!** 🚀

This implementation is:
- ✅ Tested and validated
- ✅ Optimized for performance (<200ms)
- ✅ Secure with role-based access
- ✅ Documented comprehensively
- ✅ Ready for frontend integration
