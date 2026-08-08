// Real-Time Cross-Device & Cross-Gadget Synchronization Engine
// Syncs Desktop (PC), Mobile Phones, and Tablets in real-time (<20ms)

const CHANNEL_NAME = 'cosmo_crm_realtime_channel';
let broadcastChannel = null;

// Unique stable instance ID per browser tab to avoid self-echo infinite loops
const INSTANCE_ID = typeof window !== 'undefined' 
  ? (window.__COSMO_APP_INSTANCE_ID = window.__COSMO_APP_INSTANCE_ID || ('inst_' + Math.random().toString(36).substring(2, 11)))
  : 'server_inst';

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
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json && json.db) {
          return json.db;
        }
      }
    }
  } catch (e) {
    // Offline / fallback
  }
  return null;
}

// Broadcast data mutation to other tabs and devices without looping locally
export function broadcastDataChange(type, payload) {
  const syncEvent = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: INSTANCE_ID
  };

  // 1. Local BroadcastChannel (sends ONLY to OTHER browser tabs)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(syncEvent);
    } catch (e) {
      console.warn('Error posting to BroadcastChannel:', e);
    }
  }

  // 2. Central Server Sync (Pushes to Mobile Phones, Tablets, and PCs on Wi-Fi/Internet)
  syncWithBackendServer(type, payload, syncEvent.senderId);
}

// Subscribe to real-time changes across all gadgets and devices
export function subscribeToRealtimeSync(onSyncCallback) {
  if (!onSyncCallback) return () => {};

  // A. Connect to Server-Sent Events (SSE) stream for instant cross-device updates (if server endpoint exists)
  let eventSource = null;
  let sseRetryCount = 0;
  const connectSSE = () => {
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.type !== 'connected' && data.senderId !== INSTANCE_ID) {
            onSyncCallback(data);
          }
        } catch (err) {}
      };
      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
        sseRetryCount++;
        // Limit retries if backend SSE is not implemented locally
        if (sseRetryCount < 3) {
          setTimeout(connectSSE, 10000);
        }
      };
    } catch (e) {}
  };

  if (typeof window !== 'undefined' && 'EventSource' in window) {
    connectSSE();
  }

  // B. Listener for BroadcastChannel (other tabs in same browser)
  const handleMessage = (event) => {
    if (event.data && event.data.senderId && event.data.senderId !== INSTANCE_ID) {
      onSyncCallback(event.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }

  // C. Listener for Window Storage Events (fired ONLY in OTHER windows by browser standard)
  let lastStorageTime = 0;
  const handleStorageChange = (e) => {
    if (e.key && e.key.startsWith('cosmo_crm_')) {
      const now = Date.now();
      if (now - lastStorageTime < 50) return; // Debounce rapid storage writes
      lastStorageTime = now;
      try {
        const payload = e.newValue ? JSON.parse(e.newValue) : null;
        if (payload) {
          onSyncCallback({
            type: e.key.replace('cosmo_crm_', ''),
            payload,
            timestamp: now,
            senderId: 'storage_external'
          });
        }
      } catch (err) {}
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    if (eventSource) eventSource.close();
    if (broadcastChannel) broadcastChannel.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorageChange);
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

