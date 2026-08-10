export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { mobile_phone, message, from, token } = req.body || {};

      if (!token) {
        return res.status(400).json({ status: 'error', message: 'Bearer token is required' });
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

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      console.error('Serverless SMS Proxy Error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Internal proxy error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
