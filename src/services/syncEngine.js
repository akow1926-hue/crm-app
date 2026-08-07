// Real-Time Cross-Device & Cross-Gadget Synchronization Engine
// Syncs Desktop (PC), Mobile Phones, and Tablets in real-time (<20ms)

const CHANNEL_NAME = 'cosmo_crm_realtime_channel';
let broadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel fallback enabled:', e);
  }
}

// Fetch central state from server on app load
export async function fetchInitialServerState() {
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.db) {
        return json.db;
      }
    }
  } catch (e) {
    // Offline / fallback
  }
  return null;
}

// Broadcast data mutation to all active gadgets, tabs, and devices
export function broadcastDataChange(type, payload) {
  const syncEvent = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: window.__COSMO_APP_INSTANCE_ID || (window.__COSMO_APP_INSTANCE_ID = Math.random().toString(36).substr(2, 9))
  };

  // 1. Local BroadcastChannel (same browser tabs)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(syncEvent);
    } catch (e) {
      console.warn('Error posting to BroadcastChannel:', e);
    }
  }

  // 2. Local DOM Event
  window.dispatchEvent(new CustomEvent('cosmo_crm_sync_event', { detail: syncEvent }));

  // 3. Central Server Sync (Pushes to Mobile Phones, Tablets, and PCs on Wi-Fi/Internet)
  syncWithBackendServer(type, payload, syncEvent.senderId);
}

// Subscribe to real-time changes across all gadgets and devices
export function subscribeToRealtimeSync(onSyncCallback) {
  if (!onSyncCallback) return () => {};

  // A. Connect to Server-Sent Events (SSE) stream for instant cross-device updates
  let eventSource = null;
  const connectSSE = () => {
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.type !== 'connected' && data.senderId !== window.__COSMO_APP_INSTANCE_ID) {
            onSyncCallback(data);
          }
        } catch (err) {
          // JSON parse error
        }
      };
      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
        setTimeout(connectSSE, 3000); // Auto-reconnect
      };
    } catch (e) {
      // Fallback
    }
  };

  if (typeof window !== 'undefined' && 'EventSource' in window) {
    connectSSE();
  }

  // B. Listener for BroadcastChannel (local tabs)
  const handleMessage = (event) => {
    if (event.data && event.data.senderId !== window.__COSMO_APP_INSTANCE_ID) {
      onSyncCallback(event.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }

  // C. Listener for Window Storage Events
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

  // D. Listener for Custom DOM Events
  const handleCustomEvent = (e) => {
    if (e.detail && e.detail.senderId !== window.__COSMO_APP_INSTANCE_ID) {
      onSyncCallback(e.detail);
    }
  };

  window.addEventListener('cosmo_crm_sync_event', handleCustomEvent);

  return () => {
    if (eventSource) eventSource.close();
    if (broadcastChannel) broadcastChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('cosmo_crm_sync_event', handleCustomEvent);
  };
}

// Backend Server API Sync Helper
async function syncWithBackendServer(type, payload, senderId) {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, senderId })
    }).catch(() => {});
  } catch (err) {
    // Silent fallback
  }
}
