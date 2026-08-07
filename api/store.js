// Shared In-Memory & File Store for Vercel Serverless API
// Syncs Orders, Users, Clients, and Courier Locations between Vercel WebApp, Mobile APK, and Telegram Bot

let store = {
  orders: [],
  users: [
    { id: 'USR-1', username: 'admin', pass: 'admin123', name: 'Администратор', role: 'admin', phone: '+998 90 123 45 67', status: 'active', createdDate: '2026-08-01 10:00' }
  ],
  clients: [],
  courierLocations: {}
};

export function getStore() {
  return store;
}

export function updateOrders(newOrders) {
  store.orders = newOrders;
  return store.orders;
}

export function addOrUpdateOrder(order) {
  const idx = store.orders.findIndex(o => String(o.id) === String(order.id));
  if (idx >= 0) {
    store.orders[idx] = { ...store.orders[idx], ...order };
  } else {
    store.orders.unshift(order);
  }
  return store.orders;
}

export function updateUsers(newUsers) {
  store.users = newUsers;
  return store.users;
}

export function addOrUpdateUser(user) {
  const idx = store.users.findIndex(u => String(u.username).toLowerCase() === String(user.username).toLowerCase());
  if (idx >= 0) {
    store.users[idx] = { ...store.users[idx], ...user };
  } else {
    store.users.unshift(user);
  }
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
  return store.courierLocations;
}
