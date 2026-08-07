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
    courierLocations: {}
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
            if (type === 'orders') {
              db.orders = payload;
            } else if (type === 'registered_users' || type === 'users') {
              db.users = payload;
            } else if (type === 'clients') {
              db.clients = payload;
            } else if (type === 'courier_locations') {
              db.courierLocations = payload;
            } else if (type === 'courier_location_updated') {
              if (payload?.courierName && payload?.location) {
                db.courierLocations[payload.courierName] = payload.location;
              }
            }
            saveDb();
            broadcastSSE(type, payload, senderId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        // 4. Courier GPS Update: POST /api/locations
        if (url === '/api/locations' && req.method === 'POST') {
          readJson((data) => {
            const { courierName, location } = data;
            if (courierName && location) {
              db.courierLocations[courierName] = location;
              saveDb();
              broadcastSSE('courier_location_updated', { courierName, location });
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
              if (Array.isArray(data.orders)) {
                db.orders = data.orders;
              } else if (data.id) {
                const idx = db.orders.findIndex(o => String(o.id) === String(data.id));
                if (idx >= 0) db.orders[idx] = { ...db.orders[idx], ...data };
                else db.orders.unshift(data);
              }
              saveDb();
              broadcastSSE('orders', db.orders);
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
              if (Array.isArray(data.users)) {
                db.users = data.users;
              } else if (data.username) {
                const idx = db.users.findIndex(u => String(u.username).toLowerCase() === String(data.username).toLowerCase());
                if (idx >= 0) db.users[idx] = { ...db.users[idx], ...data };
                else db.users.unshift(data);
              }
              saveDb();
              broadcastSSE('registered_users', db.users);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, users: db.users }));
            });
            return;
          }
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
