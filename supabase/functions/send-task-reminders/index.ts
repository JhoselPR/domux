import { createClient } from 'npm:@supabase/supabase-js@2.105.3';
import webpush from 'npm:web-push@3.6.7';

type ClaimedReminder = {
  id: string;
  task_id: string;
  recipient_id: string;
  scheduled_for: string;
  attempts: number;
  lock_token: string;
  task_title: string;
  task_due_date: string | null;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isAuthorized(request: Request, cronSecret: string) {
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${cronSecret}`;
}

function notificationPayload(reminder: ClaimedReminder) {
  const dueLabel = reminder.task_due_date
    ? new Date(`${reminder.task_due_date}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    : null;

  return JSON.stringify({
    title: 'Recordatorio de tarea',
    body: dueLabel
      ? `${reminder.task_title} vence el ${dueLabel}.`
      : `Tienes pendiente: ${reminder.task_title}.`,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `task-reminder-${reminder.task_id}`,
    data: {
      taskId: reminder.task_id,
      route: '/tasks',
      scheduledFor: reminder.scheduled_for,
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let supabaseUrl: string;
  let serviceRoleKey: string;
  let cronSecret: string;

  try {
    supabaseUrl = requiredEnv('SUPABASE_URL');
    serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    cronSecret = requiredEnv('REMINDER_CRON_SECRET');

    webpush.setVapidDetails(
      requiredEnv('VAPID_SUBJECT'),
      requiredEnv('VAPID_PUBLIC_KEY'),
      requiredEnv('VAPID_PRIVATE_KEY'),
    );
  } catch (error) {
    console.error('Configuration error', error);
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  if (!isAuthorized(request, cronSecret)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: reminders, error: claimError } = await supabase
    .rpc('claim_due_task_reminders', { p_limit: 50 });

  if (claimError) {
    console.error('Could not claim due reminders', claimError);
    return jsonResponse({ error: 'Could not claim due reminders' }, 500);
  }

  const claimed = (reminders ?? []) as ClaimedReminder[];
  let sent = 0;
  let failed = 0;

  for (const reminder of claimed) {
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('profile_id', reminder.recipient_id)
      .eq('active', true);

    if (subscriptionError) {
      failed += 1;
      await supabase
        .from('task_reminders')
        .update({ status: 'failed', last_error: 'Could not fetch push subscriptions', updated_at: new Date().toISOString() })
        .eq('id', reminder.id)
        .eq('lock_token', reminder.lock_token);
      continue;
    }

    const activeSubscriptions = (subscriptions ?? []) as PushSubscriptionRow[];
    if (activeSubscriptions.length === 0) {
      failed += 1;
      await supabase
        .from('task_reminders')
        .update({ status: 'failed', last_error: 'No active push subscriptions', updated_at: new Date().toISOString() })
        .eq('id', reminder.id)
        .eq('lock_token', reminder.lock_token);
      continue;
    }

    const payload = notificationPayload(reminder);
    const results = await Promise.allSettled(activeSubscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, payload);
        return { ok: true };
      } catch (error) {
        const statusCode = typeof error === 'object' && error && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 0;

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('id', subscription.id);
        }

        throw error;
      }
    }));

    const delivered = results.some((result) => result.status === 'fulfilled');
    if (delivered) {
      sent += 1;
      await supabase
        .from('task_reminders')
        .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() })
        .eq('id', reminder.id)
        .eq('lock_token', reminder.lock_token);
    } else {
      failed += 1;
      await supabase
        .from('task_reminders')
        .update({ status: 'failed', last_error: 'All push sends failed', updated_at: new Date().toISOString() })
        .eq('id', reminder.id)
        .eq('lock_token', reminder.lock_token);
    }
  }

  return jsonResponse({ claimed: claimed.length, sent, failed });
});
