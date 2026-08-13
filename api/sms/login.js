export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ status: 'error', message: 'Email and password are required' });
      }

      const formData = new FormData();
      formData.append('email', String(email).trim());
      formData.append('password', String(password).trim());

      const authResponse = await fetch('https://notify.eskiz.uz/api/auth/login', {
        method: 'POST',
        body: formData
      });

      const authData = await authResponse.json().catch(() => ({}));
      return res.status(authResponse.status).json(authData);
    } catch (error) {
      console.error('Serverless Eskiz Login Proxy Error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Internal login error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
