import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// In-memory fallback if Supabase environment variables are not yet configured on Vercel
let memoryStore = {
  orders: [],
  users: [
    { id: 'USR-1', username: 'admin', pass: 'admin123', name: 'Администратор', role: 'admin', phone: '+998 90 123 45 67', status: 'active', createdDate: '2026-08-01 10:00' }
  ],
  clients: [],
  courierLocations: {},
  tgBotConfig: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    channelId: process.env.TELEGRAM_CHAT_ID || '',
    enabledEvents: { created: true, pickup: true, ready: true, done: true },
    status: process.env.TELEGRAM_BOT_TOKEN ? 'online' : 'offline'
  }
};

export async function getStore() {
  if (supabase) {
    try {
      const [{ data: orders }, { data: users }, { data: clients }, { data: locations }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('users').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('courier_locations').select('*')
      ]);

      const courierMap = {};
      if (locations) {
        locations.forEach(loc => {
          courierMap[loc.courier_name] = {
            name: loc.courier_name,
            lat: loc.lat,
            lng: loc.lng,
            speed: loc.speed,
            status: loc.status,
            lastUpdate: loc.last_update
          };
        });
      }

      return {
        orders: orders || [],
        users: users || memoryStore.users,
        clients: clients || [],
        courierLocations: courierMap
      };
    } catch (e) {
      console.error('Error fetching Supabase store in API:', e);
    }
  }
  return memoryStore;
}

export async function updateOrders(newOrders) {
  memoryStore.orders = newOrders;
  if (supabase && Array.isArray(newOrders)) {
    try {
      const dbRows = newOrders.map(o => ({
        id: String(o.id),
        client_name: o.clientName || '',
        client_phone: o.clientPhone || '',
        address: o.address || '',
        gps_location: o.gpsLocation || '',
        service_type: o.serviceType || '',
        total_amount: Number(o.totalAmount || 0),
        paid_amount: Number(o.paidAmount || 0),
        status: o.status || 'new',
        courier: o.courier || null,
        washer: o.washer || null,
        items: Array.isArray(o.items) ? o.items : [],
        comment: o.comment || '',
        updated_at: new Date().toISOString()
      }));
      await supabase.from('orders').upsert(dbRows);
    } catch (e) {}
  }
  return memoryStore.orders;
}

export async function addOrUpdateOrder(order) {
  const idx = memoryStore.orders.findIndex(o => String(o.id) === String(order.id));
  if (idx >= 0) {
    memoryStore.orders[idx] = { ...memoryStore.orders[idx], ...order };
  } else {
    memoryStore.orders.unshift(order);
  }

  if (supabase) {
    try {
      await supabase.from('orders').upsert({
        id: String(order.id),
        client_name: order.clientName || '',
        client_phone: order.clientPhone || '',
        address: order.address || '',
        gps_location: order.gpsLocation || '',
        service_type: order.serviceType || '',
        total_amount: Number(order.totalAmount || 0),
        paid_amount: Number(order.paidAmount || 0),
        status: order.status || 'new',
        courier: order.courier || null,
        washer: order.washer || null,
        items: Array.isArray(order.items) ? order.items : [],
        comment: order.comment || '',
        updated_at: new Date().toISOString()
      });
    } catch (e) {}
  }
  return memoryStore.orders;
}

export async function updateUsers(newUsers) {
  memoryStore.users = newUsers;
  return memoryStore.users;
}

export async function addOrUpdateUser(user) {
  const idx = memoryStore.users.findIndex(u => String(u.username).toLowerCase() === String(user.username).toLowerCase());
  if (idx >= 0) {
    memoryStore.users[idx] = { ...memoryStore.users[idx], ...user };
  } else {
    memoryStore.users.unshift(user);
  }

  if (supabase) {
    try {
      await supabase.from('users').upsert({
        id: user.id || `USR-${Date.now()}`,
        username: user.username,
        pass: user.pass,
        name: user.name,
        role: user.role || 'courier',
        phone: user.phone || '',
        status: user.status || 'active'
      });
    } catch (e) {}
  }
  return memoryStore.users;
}

export async function updateCourierLocation(courierName, positionData) {
  memoryStore.courierLocations[courierName] = {
    name: courierName,
    lat: positionData.lat,
    lng: positionData.lng,
    speed: positionData.speed || 0,
    status: positionData.status || 'В сети',
    lastUpdate: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('courier_locations').upsert({
        courier_name: courierName,
        lat: positionData.lat,
        lng: positionData.lng,
        speed: positionData.speed || 0,
        status: positionData.status || 'В сети',
        last_update: new Date().toISOString()
      });
    } catch (e) {}
  }
  return memoryStore.courierLocations;
}
