import { supabase } from '@/lib/supabase';

export type PushNotificationState = 'unsupported' | 'missing-key' | 'default' | 'denied' | 'granted';

type StoredPushSubscription = {
  endpoint: string;
  keys: {
    p256dh?: string;
    auth?: string;
  };
};

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const SERVICE_WORKER_READY_TIMEOUT_MS = 10000;

export function getPushNotificationState(): PushNotificationState {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }

  if (!vapidPublicKey) return 'missing-key';

  return Notification.permission as PushNotificationState;
}

export async function enableTaskPushNotifications(profileId: string) {
  const state = getPushNotificationState();
  if (state === 'unsupported' || state === 'missing-key') return state;
  if (!vapidPublicKey) return 'missing-key';

  const permission = state === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return permission as PushNotificationState;

  const registration = await waitForServiceWorkerReady();
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription = existingSubscription ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const storedSubscription = subscription.toJSON() as StoredPushSubscription;
  const p256dh = storedSubscription.keys.p256dh;
  const auth = storedSubscription.keys.auth;

  if (!p256dh || !auth) {
    throw new Error('Push subscription keys are missing');
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    profile_id: profileId,
    endpoint: storedSubscription.endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent,
    active: true,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });

  if (error) throw error;
  return 'granted' satisfies PushNotificationState;
}

async function waitForServiceWorkerReady() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error('El Service Worker no quedó listo a tiempo.'));
      }, SERVICE_WORKER_READY_TIMEOUT_MS);
    }),
  ]);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}
