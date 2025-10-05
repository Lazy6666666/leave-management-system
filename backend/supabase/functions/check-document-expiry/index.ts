// @deno-types="https://deno.land/x/types/react/v16.14.22/react.d.ts"
// @deno-types="https://deno.land/x/types/react-dom/v16.9.0/server.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.2.3';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../_shared/rate-limiter.ts';

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // Get the user from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders } }
      );
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(
      req,
      user?.id,
      RATE_LIMITS.readOperations
    );

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        }),
        {
          headers: {
            ...corsHeaders,
            ...getRateLimitHeaders(rateLimitResult),
          },
          status: 429,
        }
      );
    }

    // Check for documents expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringDocs, error: docsError } = await supabaseClient
      .from('company_documents')
      .select('*, notifiers:document_notifiers(*)')
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gte('expiry_date', new Date().toISOString());

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch documents' }),
        { status: 500, headers: { ...corsHeaders } }
      );
    }

    const notifications: Array<{ document: string; recipients: string[]; daysUntilExpiry: number }> = [];

    for (const doc of expiringDocs || []) {
      const daysUntilExpiry = Math.ceil(
        (new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get active notifiers for this document
      const { data: notifiers } = await supabaseClient
        .from('document_notifiers')
        .select('*, user:profiles!user_id(email)')
        .eq('document_id', doc.id)
        .eq('status', 'active');

      const recipients: string[] = [];

      for (const notifier of notifiers || []) {
        let shouldNotify = false;

        // Check if notification should be sent based on frequency
        if (notifier.notification_frequency === 'weekly') {
          const daysSinceLastNotification = notifier.last_notification_sent
            ? Math.ceil(
                (new Date().getTime() - new Date(notifier.last_notification_sent).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 999;
          shouldNotify = daysSinceLastNotification >= 7;
        } else if (notifier.notification_frequency === 'monthly') {
          const daysSinceLastNotification = notifier.last_notification_sent
            ? Math.ceil(
                (new Date().getTime() - new Date(notifier.last_notification_sent).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 999;
          shouldNotify = daysSinceLastNotification >= 30;
        } else if (notifier.notification_frequency === 'custom') {
          const daysSinceLastNotification = notifier.last_notification_sent
            ? Math.ceil(
                (new Date().getTime() - new Date(notifier.last_notification_sent).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 999;
          shouldNotify = daysSinceLastNotification >= (notifier.custom_frequency_days || 7);
        }

        if (shouldNotify) {
          recipients.push(notifier.user.email);

          // Update last notification sent
          await supabaseClient
            .from('document_notifiers')
            .update({ last_notification_sent: new Date().toISOString() })
            .eq('id', notifier.id);

          // Log notification
          await supabaseClient.from('notification_logs').insert({
            notifier_id: notifier.id,
            document_id: doc.id,
            recipient_email: notifier.user.email,
            status: 'sent',
            result: { days_until_expiry: daysUntilExpiry },
          });
        }
      }

      if (recipients.length > 0) {
        notifications.push({
          document: doc.name,
          recipients,
          daysUntilExpiry,
        });
      }
    }

    // TODO: Send actual emails using SendGrid/Mailgun

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notifications.length,
        notifications,
      }),
      {
        headers: {
          ...corsHeaders,
          ...getRateLimitHeaders(rateLimitResult),
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders } }
    );
  }
});
