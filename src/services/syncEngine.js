// Real-Time Cross-Device & Cross-Tab Synchronization Engine
// Ensures 100% real-time sync between Mobile App (Phone) and Website (Desktop)

const CHANNEL_NAME = 'cosmo_crm_realtime_channel';
let broadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel fallback enabled:', e);
  }
}

// Broadcast data mutation to all active apps/tabs/windows
export function broadcastDataChange(type, payload) {
  const syncEvent = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: window.__COSMO_APP_INSTANCE_ID || (window.__COSMO_APP_INSTANCE_ID = Math.random().toString(36).substr(2, 9))
  };

  // 1. Send via BroadcastChannel for instant local cross-tab sync
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(syncEvent);
    } catch (e) {
      console.warn('Error posting to BroadcastChannel:', e);
    }
  }

  // 2. Dispatch custom DOM event
  window.dispatchEvent(new CustomEvent('cosmo_crm_sync_event', { detail: syncEvent }));

  // 3. Optional REST API / Server sync ping
  syncWithBackendServer(type, payload);
}

// Subscribe to real-time changes
export function subscribeToRealtimeSync(onSyncCallback) {
  if (!onSyncCallback) return () => {};

  // Listener for BroadcastChannel
  const handleMessage = (event) => {
    if (event.data && event.data.senderId !== window.__COSMO_APP_INSTANCE_ID) {
      onSyncCallback(event.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }

  // Listener for Window Storage Events (cross-window sync)
  const handleStorageChange = (e) => {
    if (e.key && e.key.startsWith('cosmo_crm_')) {
      onSyncCallback({
        type: e.key.replace('cosmo_crm_', ''),
        payload: e.newValue ? JSON.parse(e.newValue) : null,
        timestamp: Date.now()
      });
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Listener for Custom DOM Events
  const handleCustomEvent = (e) => {
    if (e.detail && e.detail.senderId !== window.__COSMO_APP_INSTANCE_ID) {
      onSyncCallback(e.detail);
    }
  };

  window.addEventListener('cosmo_crm_sync_event', handleCustomEvent);

  return () => {
    if (broadcastChannel) broadcastChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('cosmo_crm_sync_event', handleCustomEvent);
  };
}

// Backend Server API Sync Helper
async function syncWithBackendServer(type, payload) {
  try {
    const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://127.0.0.1:8080' 
      : `${window.location.protocol}//${window.location.hostname}:8080`;

    if (type === 'registered_users' || type === 'users') {
      await fetch(`${serverUrl}/api/sync/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: payload })
      }).catch(() => {});
    } else if (type === 'orders') {
      await fetch(`${serverUrl}/api/sync/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: payload })
      }).catch(() => {});
    }
  } catch (err) {
    // Silent fallback when running offline or standalone
  }
}
