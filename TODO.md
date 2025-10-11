# 📋 TODO - Leave Management System

**Last Updated**: 2025-10-11
**Current Status**: ⚠️ **CRITICAL ERRORS BLOCKING PRODUCTION**

---

## 🚨 CRITICAL ISSUES (Must Fix Immediately)

### 1. ❌ Edge Function CORS Errors (HIGHEST PRIORITY)
**Status**: 🔴 BLOCKING - Not Fixed
**Error**:
```
Access to fetch at 'https://ofkcmmwibufljpemmdde.supabase.co/functions/v1/get-org-stats'
from origin 'http://localhost:3002' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

**Impact**: Admin Dashboard completely broken
**Files Affected**:
- `frontend/hooks/use-org-stats.ts:84`
- Edge Function: `get-org-stats`
- Edge Function: `search-employees`
- Edge Function: `export-employees`

**Action Required**:
- [ ] Deploy updated Edge Functions to Supabase (code updated but NOT deployed)
- [ ] Run: `cd backend/supabase && supabase functions deploy`
- [ ] Verify CORS headers in deployed functions
- [ ] Test from browser after deployment

**Note**: Agents updated the code but functions MUST be deployed to Supabase cloud to take effect!

---

### 2. ❌ RPC Function Permission Denied
**Status**: 🔴 BLOCKING
**Error**:
```
POST https://ofkcmmwibufljpemmdde.supabase.co/rest/v1/rpc/get_user_profile_with_email 403 (Forbidden)
RPC call failed, attempting direct fetch: {
  code: '42501',
  details: null,
  hint: null,
  message: 'permission denied for table users'
}
```

**Impact**: User profile loading fails
**Files Affected**:
- `frontend/hooks/use-user-profile.ts:37`
- Database: `get_user_profile_with_email` RPC function

**Action Required**:
- [ ] Apply database migrations to create RPC functions
- [ ] Run: `cd backend/supabase && supabase db push`
- [ ] OR manually apply migrations via Supabase Dashboard
- [ ] Grant proper permissions to RPC functions
- [ ] Fix RPC function to query `employees` table (not `users` table)

**Migration Files to Apply**:
- `backend/supabase/migrations/20251010043352_fix_leave_documents_foreign_keys.sql`
- `backend/supabase/migrations/20251010043450_create_departments_table.sql`
- `backend/supabase/migrations/20251010043601_create_get_user_profile_with_email_function.sql`

---

## ✅ COMPLETED TASKS (Phase 1-3)

### Phase 1: Database Layer Fixes ✅
- [x] Fixed `leave_documents` table foreign keys
- [x] Created migration for departments table
- [x] Created `get_user_profile_with_email` RPC functions (3 variants)
- [x] Updated all foreign keys from `profiles` to `employees`
- [x] Added proper RLS policies

**Files Created**:
- `backend/supabase/migrations/20251010043352_fix_leave_documents_foreign_keys.sql`
- `backend/supabase/migrations/20251010043450_create_departments_table.sql`
- `backend/supabase/migrations/20251010043601_create_get_user_profile_with_email_function.sql`

### Phase 2: Frontend Fixes ✅
- [x] Updated all hooks to use `employees` foreign keys
- [x] Fixed `use-approvals.ts` foreign key references
- [x] Fixed `use-team-calendar.ts` foreign key references
- [x] Fixed `use-leave-documents.ts` foreign key references
- [x] Fixed React component crash in `AvatarUpload.tsx`
- [x] Updated API routes to use `employees` table

**Files Modified**:
- `frontend/types/index.ts`
- `frontend/hooks/use-approvals.ts`
- `frontend/hooks/use-team-calendar.ts`
- `frontend/hooks/use-leave-documents.ts`
- `frontend/pages/api/leaves/index.ts`
- `frontend/pages/api/leaves/approve/index.ts`
- `frontend/pages/api/leave-types/[id].ts`
- `frontend/pages/api/admin/reports/[type].ts`
- `frontend/components/features/AvatarUpload.tsx`

### Phase 3: TypeScript & CORS Fixes ✅
- [x] Removed ALL `any` types
- [x] Updated Edge Functions with proper TypeScript types
- [x] Fixed CORS headers in Edge Functions (CODE UPDATED)
- [x] Updated Edge Functions to use `employees` table

**Files Modified**:
- `backend/supabase/functions/search-employees/index.ts` (354 lines rewritten)
- `backend/supabase/functions/get-org-stats/index.ts` (350 lines rewritten)
- `backend/supabase/functions/export-employees/index.ts` (336 lines rewritten)

---

## 🔄 IN PROGRESS

### Phase 4: Testing & Verification ⏳
**Status**: BLOCKED by deployment issues

**Cannot test until**:
- [ ] Edge Functions deployed to Supabase
- [ ] Database migrations applied to Supabase
- [ ] CORS errors resolved
- [ ] RPC functions accessible

---

## 📦 DEPLOYMENT REQUIRED

### Step 1: Deploy Database Migrations
```bash
cd C:\Users\Twisted\Desktop\LEAVE\backend\supabase

# Option A: Push all migrations
supabase db push

# Option B: Apply specific migrations via Supabase Dashboard
# - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
# - Copy/paste migration files manually
```

**Migrations to Apply** (in order):
1. `20251010043352_fix_leave_documents_foreign_keys.sql`
2. `20251010043450_create_departments_table.sql`
3. `20251010043601_create_get_user_profile_with_email_function.sql`

### Step 2: Deploy Edge Functions
```bash
cd C:\Users\Twisted\Desktop\LEAVE\backend\supabase

# Deploy all functions
supabase functions deploy

# OR deploy individually
supabase functions deploy search-employees
supabase functions deploy get-org-stats
supabase functions deploy export-employees
```

### Step 3: Verify Deployment
```bash
# Check function status
supabase functions list

# Monitor function logs
supabase functions logs get-org-stats --tail
supabase functions logs search-employees --tail
```

---

## 🧪 TESTING CHECKLIST (After Deployment)

### Browser Testing (localhost:3002)

#### Admin Dashboard
- [ ] Navigate to `/dashboard/admin`
- [ ] Verify organization statistics load (no CORS errors)
- [ ] Check console for errors
- [ ] Verify charts and metrics render

#### Approvals Page
- [ ] Navigate to `/dashboard/approvals`
- [ ] Verify leave requests display
- [ ] Check employee names display correctly (not "undefined")
- [ ] Test approve/reject buttons

#### Profile Page
- [ ] Navigate to `/dashboard/profile`
- [ ] Verify page loads without React crash
- [ ] Test avatar upload "Choose File" button
- [ ] Test "Upload" button functionality

#### Documents Page
- [ ] Navigate to `/dashboard/documents`
- [ ] Verify page loads without 404 table error
- [ ] Check document list displays

#### User Management
- [ ] Navigate to `/dashboard/admin/users`
- [ ] Verify user list displays (7 users expected)
- [ ] Test search functionality
- [ ] Test filter dropdowns

---

## 📊 CURRENT ERROR LOG SUMMARY

### From `docs/ERROR.md`:

**Recurring Errors** (15+ instances):
1. **CORS Error - get-org-stats**: `net::ERR_FAILED` (appears 15 times)
2. **RPC Permission Denied**: `permission denied for table users` (403 error)

**Root Causes**:
1. Edge Functions updated locally but NOT deployed to Supabase cloud
2. Database migrations created but NOT applied to Supabase database
3. RPC functions trying to query wrong table (`users` instead of `employees`)

---

## 🎯 IMMEDIATE NEXT STEPS

### Priority 1: DEPLOY EVERYTHING
1. **Deploy Edge Functions** (10 minutes)
   ```bash
   cd backend/supabase
   supabase functions deploy
   ```

2. **Apply Database Migrations** (5 minutes)
   ```bash
   cd backend/supabase
   supabase db push
   ```

3. **Verify Deployment** (5 minutes)
   - Check Supabase Dashboard
   - Monitor function logs
   - Test one endpoint manually

### Priority 2: TEST EVERYTHING
4. **Browser Testing** (30 minutes)
   - Open http://localhost:3002
   - Login as admin@test.com / Test123!
   - Test all pages systematically
   - Document any remaining errors

5. **Generate Final Report** (10 minutes)
   - Update QA_TEST_REPORT.md
   - Document before/after comparison
   - List production readiness status

---

## 📝 NOTES

### Why Tests Are Blocked:
- ✅ Code fixes completed by specialized agents
- ✅ Frontend updated to use `employees` table
- ✅ Edge Functions rewritten with proper types
- ❌ **BUT** changes are LOCAL only - not deployed to Supabase cloud
- ❌ **Cannot test** until deployment happens

### What's Different from Before:
- **Before**: Code had bugs (wrong foreign keys, `any` types, CORS issues)
- **Now**: Code is fixed but sitting in local files
- **Problem**: Supabase is still running OLD code with OLD bugs
- **Solution**: Deploy the fixed code to Supabase cloud

### Key Files for Reference:
- **Frontend Fixes**: See agent report in session history
- **Backend Fixes**: See `BACKEND_FIXES_REPORT.md`
- **CORS Fixes**: See `backend/supabase/functions/CORS_FIX_DEPLOYMENT.md`
- **Original Issues**: See `QA_TEST_REPORT.md`

---

## 🚀 PRODUCTION READINESS

**Current Status**: 🔴 **NOT READY**

**Blockers**:
- [ ] Edge Functions not deployed
- [ ] Database migrations not applied
- [ ] CORS errors blocking admin features
- [ ] RPC functions not accessible

**Estimated Time to Production**:
- Deployment: 20 minutes
- Testing: 30 minutes
- **Total**: ~1 hour

**Once Deployed**:
- ✅ All P0 critical fixes applied
- ✅ TypeScript strict typing (zero `any` types)
- ✅ Proper foreign key references
- ✅ CORS headers configured
- ✅ RLS policies in place
- ✅ Production-ready code quality

---

## 📚 DOCUMENTATION REFERENCES

- **QA Report**: `QA_TEST_REPORT.md` - Original bugs found
- **Backend Fixes**: `BACKEND_FIXES_REPORT.md` - Database layer fixes
- **CORS Guide**: `backend/supabase/functions/CORS_FIX_DEPLOYMENT.md` - Deployment instructions
- **Error Log**: `docs/ERROR.md` - Complete console error log

---

**END OF TODO** - Last updated by Claude Code on 2025-10-11