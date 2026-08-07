// One-Click Telegram Bot Webhook Registration Endpoint for Vercel

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = req.query.token || req.body?.token;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Параметр token обязателен (например: ?token=BOT_TOKEN)' });
  }

  const host = req.headers.host || 'your-app.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const webhookUrl = `${protocol}://${host}/api/telegram-bot?token=${token}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const data = await tgRes.json();

    if (data.ok) {
      return res.status(200).json({
        success: true,
        message: '🟢 Telegram Bot Webhook успешно установлен на Vercel!',
        webhookUrl: webhookUrl,
        telegramResponse: data
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.description || 'Не удалось установить Webhook в Telegram API',
        telegramResponse: data
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
