import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.2.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // This function is expected to be triggered by a scheduled job, 
    // so it might not always have an authenticated user context.
    // For security, ensure this function is only callable by trusted sources (e.g., Supabase internal scheduler)
    // or implement a specific API key check if exposed publicly.

    const { data: documents, error: docError } = await supabaseClient
      .from('company_documents')
      .select('id, name, expiry_date')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()); // Documents expiring in next 30 days

    if (docError) {
      console.error('Error fetching expiring documents:', docError);
      throw docError;
    }

    if (!documents || documents.length === 0) {
      return new Response(JSON.stringify({ message: 'No documents expiring soon.' }), { headers: corsHeaders, status: 200 });
    }

    // Fetch HR users' email addresses
    const { data: hrProfiles, error: hrError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, email') // Assuming email is stored in profiles or can be joined from auth.users
      .eq('role', 'hr');

    if (hrError) {
      console.error('Error fetching HR profiles:', hrError);
      throw hrError;
    }

    const hrEmails = hrProfiles?.map(p => p.email).filter(Boolean) as string[];

    if (hrEmails.length === 0) {
      return new Response(JSON.stringify({ message: 'No HR personnel found to notify.' }), { headers: corsHeaders, status: 200 });
    }

    // --- Send Email Notifications (Placeholder) ---
    const notificationPromises = hrEmails.map(async (email) => {
      const expiringDocNames = documents.map(doc => `- ${doc.name} (Expires: ${new Date(doc.expiry_date!).toLocaleDateString()})`).join('\n');
      const emailSubject = 'Action Required: Expiring Company Documents';
      const emailBody = `Dear HR Team,\n\nThe following company documents are approaching their expiration dates:\n\n${expiringDocNames}\n\nPlease take the necessary action.\n\nRegards,\nLeave Management System`;

      console.log(`Sending email to ${email} with subject: ${emailSubject}`);
      console.log(`Email Body:\n${emailBody}`);

      // TODO: Integrate with an actual email sending service (e.g., SendGrid, Resend)
      // Example with a hypothetical email service client:
      // await emailServiceClient.send({
      //   to: email,
      //   subject: emailSubject,
      //   body: emailBody,
      // });

      // For now, just log that an email would be sent
      return { recipient: email, status: 'simulated_sent' };
    });

    const notificationResults = await Promise.allSettled(notificationPromises);

    console.log('Notification results:', notificationResults);

    return new Response(JSON.stringify({ message: 'Expiry notifications processed.', results: notificationResults }), {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
