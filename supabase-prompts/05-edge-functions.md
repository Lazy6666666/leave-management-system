# Supabase Edge Functions Prompt

You are creating server-side API endpoints using Supabase Edge Functions for a leave management system. Implement secure, scalable functions for complex business logic that cannot be handled efficiently in the browser.

## Project Context
- **Application**: Leave Management System
- **Edge Functions**: Server-side processing, external API calls, complex calculations
- **Security**: Authentication, rate limiting, input validation

## Edge Function Requirements

### Core Functions Needed:

1. **Leave Request Processing** (`leave-request-processing`):
   - Automated leave balance calculations
   - Holiday and weekend detection
   - Leave type validation
   - Automatic approvals for certain thresholds

2. **Reporting API** (`generate-reports`):
   - Complex leave analytics generation
   - PDF report generation
   - Email report distribution
   - Data aggregation across departments

3. **Notification Service** (`notification-service`):
   - Email notifications for approvals/rejections
   - SMS notifications for urgent requests
   - Slack/Microsoft Teams integration
   - Batch notification processing

4. **Data Import/Export** (`data-migration`):
   - CSV import for employee data
   - Leave history migration
   - Backup and restore operations
   - Data validation and sanitization

5. **Calendar Integration** (`calendar-sync`):
   - Google Calendar/Outlook integration
   - Leave calendar event creation
   - Calendar availability checking
   - Meeting scheduling around leave dates

### Security Implementation:

1. **Authentication Middleware**:
   ```typescript
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   }

   serve(async (req) => {
     // Verify JWT token
     const authHeader = req.headers.get('Authorization')
     if (!authHeader) {
       return new Response('Unauthorized', { status: 401 })
     }

     const supabase = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_ANON_KEY') ?? ''
     )

     // Verify user session
     const { data: { user }, error } = await supabase.auth.getUser(
       authHeader.replace('Bearer ', '')
     )

     if (error || !user) {
       return new Response('Unauthorized', { status: 401 })
     }

     // Continue with function logic...
   })
   ```

2. **Rate Limiting**:
   - Implement per-user rate limiting
   - Department-level throttling
   - Burst request handling

3. **Input Validation**:
   - Schema validation with Zod
   - SQL injection prevention
   - XSS protection

### Error Handling:
- Structured error responses
- Logging and monitoring integration
- Retry mechanisms for external services
- Graceful degradation strategies

### Performance Optimization:
- Database connection pooling
- Response caching strategies
- Async processing for heavy operations
- Memory management for large datasets

### Deployment and Monitoring:
- Environment-specific configurations
- Health check endpoints
- Performance monitoring
- Log aggregation and analysis
