import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Shared Central JSON Database file
const DB_FILE = path.join(process.cwd(), '.cosmo_db.json');

// Load or initialize DB
function loadDb() {
  const defaultDb = {
    orders: [],
    users: [
      { id: 'USR-1', username: 'admin', pass: 'admin123', name: 'Администратор', role: 'admin', phone: '+998 90 123 45 67', status: 'active', createdDate: '2026-08-01 10:00' },
      { id: 'USR-2', username: 'courier', pass: 'courier123', name: 'Алишер Рахимов', role: 'courier', phone: '+998 90 777 88 99', status: 'active', createdDate: '2026-08-01 10:00' }
    ],
    clients: [],
    courierLocations: {},
    tgBotConfig: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      botUsername: 'CosmoGroupNotifier_bot',
      channelId: '',
      enabledEvents: { created: true, pickup: true, ready: true, done: true },
      status: process.env.TELEGRAM_BOT_TOKEN ? 'online' : 'offline'
    }
  };

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...defaultDb, ...parsed };
    }
  } catch (e) {
    console.error('[DB Load Error]:', e);
  }
  return defaultDb;
}

let db = loadDb();
const sseClients = new Set();

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB Save Error]:', e);
  }
}

function broadcastSSE(type, payload, senderId = null) {
  const dataStr = `data: ${JSON.stringify({ type, payload, senderId, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(dataStr);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Vite Plugin for Central Real-Time Cross-Device Sync Server
function crmRealtimeSyncPlugin() {
  return {
    name: 'crm-realtime-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // CORS Headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        // 1. SSE Stream: /api/events
        if (url.startsWith('/api/events')) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });
          res.write(`data: ${JSON.stringify({ type: 'connected', db })}\n\n`);
          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }

        // Helper to parse JSON body
        const readJson = (callback) => {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = body ? JSON.parse(body) : {};
              callback(data);
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        };

        // 2. Full Sync: GET /api/sync
        if (url === '/api/sync' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, db }));
          return;
        }

        // 3. Mutation Sync: POST /api/sync
        if (url === '/api/sync' && req.method === 'POST') {
          readJson((data) => {
            const { type, payload, senderId } = data;
            if (type === 'orders' && Array.isArray(payload)) {
              db.orders = payload;
            } else if ((type === 'registered_users' || type === 'users') && Array.isArray(payload)) {
              // Direct replacement - allows deleting users without resurrecting them
              db.users = payload;
            } else if (type === 'clients' && Array.isArray(payload)) {
              db.clients = payload;
            } else if (type === 'courier_locations') {
              db.courierLocations = payload;
            } else if (type === 'tg_bot_config' || type === 'tgBotConfig') {
              db.tgBotConfig = payload;
            } else if (type === 'courier_location_updated') {
              if (payload?.courierName && payload?.location) {
                db.courierLocations[payload.courierName] = payload.location;
              }
            }
            saveDb();
            broadcastSSE(type, db[type === 'registered_users' ? 'users' : type] || payload, senderId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, db }));
          });
          return;
        }

        // 4. Courier GPS Update: POST /api/locations
        if (url === '/api/locations' && req.method === 'POST') {
          readJson((data) => {
            const { courierName, location, senderId } = data;
            if (courierName && location) {
              db.courierLocations[courierName] = location;
              saveDb();
              broadcastSSE('courier_location_updated', { courierName, location }, senderId);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, courierLocations: db.courierLocations }));
          });
          return;
        }

        // 5. Orders: GET/POST /api/orders
        if (url.startsWith('/api/orders')) {
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, orders: db.orders }));
            return;
          }
          if (req.method === 'POST') {
            readJson((data) => {
              const { senderId } = data;
              if (Array.isArray(data.orders)) {
                db.orders = data.orders;
              } else if (data.id) {
                const idx = db.orders.findIndex(o => String(o.id) === String(data.id));
                if (idx >= 0) db.orders[idx] = { ...db.orders[idx], ...data };
                else db.orders.unshift(data);
              }
              saveDb();
              broadcastSSE('orders', db.orders, senderId);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, orders: db.orders }));
            });
            return;
          }
        }

        // 6. Users: GET/POST /api/users
        if (url.startsWith('/api/users')) {
          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, users: db.users }));
            return;
          }
          if (req.method === 'POST') {
            readJson((data) => {
              const { senderId } = data;
              if (Array.isArray(data.users)) {
                db.users = data.users;
              } else if (data.username) {
                const idx = db.users.findIndex(u => String(u.username).toLowerCase() === String(data.username).toLowerCase());
                if (idx >= 0) db.users[idx] = { ...db.users[idx], ...data };
                else db.users.unshift(data);
              }
              saveDb();
              broadcastSSE('registered_users', db.users, senderId);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, users: db.users }));
            });
            return;
          }
        }

        // 7. SMS Gateway Proxy: POST /api/sms
        if (url.startsWith('/api/sms') && req.method === 'POST') {
          readJson(async (data) => {
            try {
              const { mobile_phone, message, from, token } = data;
              if (!token) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Bearer token is required' }));
                return;
              }
              const cleanPhone = String(mobile_phone || '').replace(/[^0-9]/g, '');
              const response = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  mobile_phone: cleanPhone,
                  message: message,
                  from: from || '4546'
                })
              });
              const resData = await response.json();
              res.writeHead(response.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(resData));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'error', message: err.message || 'SMS proxy error' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), crmRealtimeSyncPlugin()],
});
