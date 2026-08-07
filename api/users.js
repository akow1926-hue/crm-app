import { getStore, updateUsers, addOrUpdateUser } from './store.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const store = getStore();

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, users: store.users });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    if (Array.isArray(body.users)) {
      const updated = updateUsers(body.users);
      return res.status(200).json({ success: true, users: updated });
    } else if (body.username) {
      const updated = addOrUpdateUser(body);
      return res.status(200).json({ success: true, users: updated });
    }
    return res.status(400).json({ success: false, error: 'Invalid user payload' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
