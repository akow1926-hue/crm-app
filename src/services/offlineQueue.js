// offlineQueue.js - Offline Mutation Queue & Auto-Sync Engine for Cosmo CRM
import { saveSupabaseOrder, saveSupabaseUser, saveSupabaseClient } from './supabaseService';

const QUEUE_KEY = 'cosmo_crm_offline_queue';

export function getOfflineQueue() {
  try {
    const saved = localStorage.getItem(QUEUE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {}
}

export function enqueueOfflineMutation(type, payload) {
  const queue = getOfflineQueue();
  const mutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type, // 'order' | 'user' | 'client'
    payload,
    timestamp: Date.now()
  };
  queue.push(mutation);
  saveOfflineQueue(queue);
  console.log(`Enqueued offline mutation (${type}):`, payload);
  return mutation;
}

export async function flushOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { success: true, flushed: 0 };

  console.log(`Attempting to flush ${queue.length} offline mutations to Supabase...`);
  const remaining = [];
  let flushedCount = 0;

  for (const item of queue) {
    try {
      let res = null;
      if (item.type === 'order') {
        res = await saveSupabaseOrder(item.payload);
      } else if (item.type === 'user') {
        res = await saveSupabaseUser(item.payload);
      } else if (item.type === 'client') {
        res = await saveSupabaseClient(item.payload);
      }

      if (res !== null) {
        flushedCount++;
      } else {
        remaining.push(item);
      }
    } catch (err) {
      console.warn('Failed to flush mutation:', item, err);
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
  return { success: true, flushed: flushedCount, remaining: remaining.length };
}

// Auto listener when internet returns
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network status: ONLINE. Flushing offline queue...');
    flushOfflineQueue();
  });
}
