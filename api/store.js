import fs from 'fs';
import path from 'path';

const STORE_PATH = process.env.VERCEL ? '/tmp/cosmo_store.json' : path.join(process.cwd(), '.cosmo_store.json');

let store = {
  orders: [],
  users: [
    { id: 'USR-1', username: 'admin', pass: 'admin123', name: 'Администратор', role: 'admin', phone: '+998 90 123 45 67', status: 'active', createdDate: '2026-08-01 10:00' }
  ],
  clients: [],
  courierLocations: {}
};

// Try loading persisted state from disk
try {
  if (fs.existsSync(STORE_PATH)) {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      store = { ...store, ...parsed };
    }
  }
} catch (e) {
  // Silent fallback
}

function persistStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store), 'utf8');
  } catch (e) {
    // Silent fallback
  }
}

export function getStore() {
  return store;
}

export function updateOrders(newOrders) {
  store.orders = newOrders;
  persistStore();
  return store.orders;
}

export function addOrUpdateOrder(order) {
  const idx = store.orders.findIndex(o => String(o.id) === String(order.id));
  if (idx >= 0) {
    store.orders[idx] = { ...store.orders[idx], ...order };
  } else {
    store.orders.unshift(order);
  }
  persistStore();
  return store.orders;
}

export function updateUsers(newUsers) {
  store.users = newUsers;
  persistStore();
  return store.users;
}

export function addOrUpdateUser(user) {
  const idx = store.users.findIndex(u => String(u.username).toLowerCase() === String(user.username).toLowerCase());
  if (idx >= 0) {
    store.users[idx] = { ...store.users[idx], ...user };
  } else {
    store.users.unshift(user);
  }
  persistStore();
  return store.users;
}

export function updateCourierLocation(courierName, positionData) {
  store.courierLocations[courierName] = {
    name: courierName,
    lat: positionData.lat,
    lng: positionData.lng,
    speed: positionData.speed || 0,
    status: positionData.status || 'В сети (Telegram / App)',
    lastUpdate: new Date().toISOString()
  };
  persistStore();
  return store.courierLocations;
}
