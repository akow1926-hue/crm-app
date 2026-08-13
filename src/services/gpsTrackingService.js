import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { broadcastDataChange } from './syncEngine';
import { updateSupabaseCourierLocation } from './supabaseService';

const STORAGE_KEY = 'cosmo_crm_courier_locations';
const HISTORY_KEY = 'cosmo_crm_courier_routes';

// Get current locations of all active couriers
export function getCourierLocations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error('Error reading courier locations:', e);
    return {};
  }
}

// Get GPS trail history for a courier
export function getCourierRouteHistory(courierName) {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    const history = saved ? JSON.parse(saved) : {};
    return history[courierName] || [];
  } catch (e) {
    console.error('Error reading courier routes:', e);
    return [];
  }
}

// Request Native or Browser Geolocation Permissions
export async function requestGpsPermission() {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await Geolocation.requestPermissions();
      return status.location === 'granted';
    }
  } catch (e) {
    console.warn('Native GPS permission request warning:', e);
  }
  return 'geolocation' in navigator;
}

// Save location update with smart throttling to prevent UI lag
let lastSupabasePushTime = 0;
let lastBroadcastTime = 0;

export function updateCourierLocation(courierName, positionData) {
  const now = Date.now();
  const timestamp = new Date().toISOString();
  
  const updatedLocation = {
    name: courierName,
    lat: positionData.lat,
    lng: positionData.lng,
    speed: positionData.speed || 0,
    heading: positionData.heading || 0,
    accuracy: positionData.accuracy || 0,
    battery: positionData.battery || 95,
    status: positionData.status || 'На маршруте (Активен)',
    lastUpdate: timestamp,
    isOnline: true
  };

  // 1. Throttled Local Storage & Broadcast (max once per 3.5 seconds)
  if (now - lastBroadcastTime > 3500) {
    lastBroadcastTime = now;
    const currentMap = getCourierLocations();
    currentMap[courierName] = updatedLocation;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentMap));
    } catch (e) {}

    // Broadcast event across tabs/windows/devices
    broadcastDataChange('courier_location_updated', { courierName, location: updatedLocation });

    // Dispatch custom window event for local reactive UI update safely
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('courier_location_updated', {
          detail: { courierName, location: updatedLocation }
        }));
      }
    } catch (e) {
      try {
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent('courier_location_updated', false, false, { courierName, location: updatedLocation });
        window.dispatchEvent(evt);
      } catch (err2) {}
    }
  }

  // 2. Throttled Supabase Remote Database push (max once per 12 seconds)
  if (now - lastSupabasePushTime > 12000) {
    lastSupabasePushTime = now;
    updateSupabaseCourierLocation(courierName, positionData).catch(() => {});
  }

  return updatedLocation;
}

// Start continuous background GPS watching
let activeWatchId = null;
let activeIntervalId = null;

export function startContinuousGpsTracking(courierName, onUpdateCallback) {
  if (!courierName) return null;

  requestGpsPermission();

  // 1. Native Capacitor Geolocation Watcher if on Android / Native Mobile
  if (Capacitor.isNativePlatform()) {
    try {
      Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 15000 }, (position, err) => {
        if (position && position.coords) {
          const positionData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0,
            heading: position.coords.heading || 0,
            accuracy: Math.round(position.coords.accuracy),
            status: 'В движении (GPS передаётся)'
          };
          const loc = updateCourierLocation(courierName, positionData);
          if (onUpdateCallback) onUpdateCallback(loc);
        }
      }).then(wId => {
        activeWatchId = wId;
      });
    } catch (e) {
      console.warn('Native GPS Watch error:', e);
    }
  } else if ('geolocation' in navigator) {
    // 2. Standard Browser Geolocation Watcher
    activeWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const positionData = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0, // m/s to km/h
          heading: pos.coords.heading || 0,
          accuracy: Math.round(pos.coords.accuracy),
          status: 'В движении (GPS передаётся)'
        };
        const loc = updateCourierLocation(courierName, positionData);
        if (onUpdateCallback) onUpdateCallback(loc);
      },
      (err) => {
        console.warn('GPS Watch error, falling back to interval:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000
      }
    );
  }

  // Fallback periodic ping every 8 seconds to guarantee continuous heartbeat
  activeIntervalId = setInterval(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        if (pos && pos.coords) {
          const positionData = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
            accuracy: Math.round(pos.coords.accuracy),
            status: 'Активен (Периодический пинг)'
          };
          const loc = updateCourierLocation(courierName, positionData);
          if (onUpdateCallback) onUpdateCallback(loc);
        }
      } else if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const positionData = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
              accuracy: Math.round(pos.coords.accuracy),
              status: 'Активен (Периодический пинг)'
            };
            const loc = updateCourierLocation(courierName, positionData);
            if (onUpdateCallback) onUpdateCallback(loc);
          },
          (err) => {},
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      }
    } catch (e) {}
  }, 8000);

  return { watchId: activeWatchId, intervalId: activeIntervalId };
}

// Stop continuous tracking safely
export function stopContinuousGpsTracking() {
  try {
    if (activeWatchId !== null) {
      if (Capacitor.isNativePlatform()) {
        try {
          Geolocation.clearWatch({ id: activeWatchId });
        } catch (e) {}
      } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(activeWatchId);
        } catch (e) {}
      }
      activeWatchId = null;
    }
    if (activeIntervalId !== null) {
      clearInterval(activeIntervalId);
      activeIntervalId = null;
    }
  } catch (e) {
    // Ignore cleanup errors on unmount
  }
}

