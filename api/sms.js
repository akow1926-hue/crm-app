export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { email, password, mobile_phone, message, from, token } = req.body || {};

      // 1. Auth / Login Request
      if (email && password && !mobile_phone) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const authResponse = await fetch('https://notify.eskiz.uz/api/auth/login', {
          method: 'POST',
          body: formData
        });

        const authData = await authResponse.json().catch(() => ({}));
        return res.status(authResponse.status).json(authData);
      }

      // 2. Send SMS Request
      const cleanToken = String(token || '').replace(/^Bearer\s+/i, '').trim();
      if (!cleanToken) {
        return res.status(400).json({ status: 'error', message: 'Bearer token is required' });
      }

      const cleanPhone = String(mobile_phone || '').replace(/[^0-9]/g, '');
      const formData = new FormData();
      formData.append('mobile_phone', cleanPhone);
      formData.append('message', message);
      formData.append('from', from || '4546');

      const response = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        },
        body: formData
      });

      const data = await response.json().catch(() => ({}));
      return res.status(response.status).json(data);
    } catch (error) {
      console.error('Serverless SMS Proxy Error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Internal proxy error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
