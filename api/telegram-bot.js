// Vercel Serverless Function - Telegram Unified Group Notifier Bot Endpoint
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      message: 'Cosmo Cleaning Telegram Unified Group Notifier Bot Engine is running on Vercel!'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const update = req.body || {};
  const token = req.query.token || process.env.TELEGRAM_BOT_TOKEN;

  try {
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const text = (msg.text || '').trim();

      if (token && chatId && (text.startsWith('/start') || text.startsWith('/help'))) {
        const replyText = 
          `🤖 <b>Cosmo Cleaning Notifier Bot</b>\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `Этот бот является единым уведомителем для CRM Cosmo Cleaning.\n\n` +
          `📢 <b>Он автоматически присылает все статусы заказов в общую группу:</b>\n` +
          `1️⃣ <b>Создание:</b> Оформление нового заказа диспетчером\n` +
          `2️⃣ <b>Забор:</b> Курьер забрал изделия у клиента\n` +
          `3️⃣ <b>Готовность:</b> Изделия замерены, постираны и готовы к доставке\n` +
          `4️⃣ <b>Закрытие:</b> Заказ доставлен и оплачен\n\n` +
          `💡 <b>Инструкция:</b> Добавьте этого бота в вашу общую группу сотрудников, сделайте администратором и укажите Chat ID группы в CRM (раздел «Карта Админа»).`;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: 'HTML'
          })
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error handling Telegram webhook:', err);
  }

  return res.status(200).json({ ok: true });
}
