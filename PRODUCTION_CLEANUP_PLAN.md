# Production Cleanup Plan

## Files to Remove Completely
1. **Test/Debug Scripts**
   - `frontend/test-api.js`
   - `frontend/check-profile.js`
   - `frontend/list-all-users.js`
   - `frontend/apply-migration.js`
   - `frontend/scripts/verify-error-handling.ts`
   - `frontend/scripts/test-responsive.js`

2. **Test Data Migration**
   - `backend/supabase/migrations/004_seed_test_users.sql`
   - `backend/supabase/seed-test-users.sql`

3. **Documentation/Summary Files**
   - All `*_SUMMARY.md`, `*_GUIDE.md`, `*_VERIFICATION.md` files
   - All task completion documentation
   - All implementation guides

4. **Test Directories**
   - `frontend/__tests__/`
   - `frontend/e2e/`
   - `frontend/test-results/`
   - `frontend/tests/`
   - All component `__tests__/` directories

5. **Build Artifacts**
   - `frontend/.next/`
   - `frontend/.ts-out/`
   - `frontend/node_modules/`
   - `backend/supabase/.temp/`

## Files to Clean (Remove Mock Data)
1. **Dashboard Pages**
   - `frontend/pages/dashboard/index.tsx` - Remove mock user, stats, requests, notifications
   - `frontend/pages/dashboard/team/index.tsx` - Remove mock team members, leaves
   - `frontend/pages/dashboard/profile/index.tsx` - Remove mock user data
   - `frontend/pages/dashboard/leaves/index.tsx` - Remove mock leave requests, balance

2. **Components with Mock Data**
   - `frontend/components/features/team-calendar.tsx`
   - Any other components with hardcoded data

## Code to Clean
1. **Console.log statements** - Remove all debug logging
2. **TODO/FIXME comments** - Remove or implement
3. **Mock data variables** - Replace with empty states
4. **Hardcoded credentials** - Remove test credentials

## Environment Files to Clean
1. Remove any hardcoded secrets from example files
2. Ensure no production credentials in code

## Final State
- Clean, empty application ready for production
- Proper empty states for all data
- No test artifacts or debug code
- No mock data or hardcoded values
- Graceful handling of empty data states