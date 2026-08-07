import { getStore, updateOrders, addOrUpdateOrder } from './store.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const store = getStore();

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, orders: store.orders });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    if (Array.isArray(body.orders)) {
      const updated = updateOrders(body.orders);
      return res.status(200).json({ success: true, orders: updated });
    } else if (body.id) {
      const updated = addOrUpdateOrder(body);
      return res.status(200).json({ success: true, orders: updated });
    }
    return res.status(400).json({ success: false, error: 'Invalid order payload' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
