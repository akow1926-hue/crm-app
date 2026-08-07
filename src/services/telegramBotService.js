// Telegram Courier Bot Management & API Service

const STORAGE_KEY = 'cosmo_crm_tg_courier_bot_config';

export function getTelegramBotConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      botToken: '',
      botUsername: 'CosmoCourier_bot',
      webAppUrl: window.location.origin,
      autoNotifyCouriers: true,
      status: 'offline'
    };
  } catch (e) {
    return {
      botToken: '',
      botUsername: 'CosmoCourier_bot',
      webAppUrl: window.location.origin,
      autoNotifyCouriers: true,
      status: 'offline'
    };
  }
}

export function saveTelegramBotConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('tg_bot_config_updated', { detail: config }));
    
    // Automatically register Telegram Webhook to Vercel Serverless Function if token is provided
    if (config.botToken) {
      registerVercelWebhook(config.botToken);
    }
    return true;
  } catch (e) {
    console.error('Error saving bot config:', e);
    return false;
  }
}

// Automatically register Telegram Webhook on Vercel
export async function registerVercelWebhook(token) {
  if (!token) return { success: false, error: 'Токен не указан' };

  try {
    const webhookUrl = `${window.location.origin}/api/telegram-bot?token=${token.trim()}`;
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const data = await res.json();
    return { success: data.ok, description: data.description || 'Webhook зарегистрирован на Vercel' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Verify Bot Token with Telegram API directly (getMe)
export async function testTelegramBotToken(token) {
  if (!token) return { success: false, error: 'Токен бота не заполнен' };

  const cleanToken = token.trim();
  try {
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const data = await res.json();

    if (data.ok) {
      // Also register webhook to Vercel
      await registerVercelWebhook(cleanToken);

      return {
        success: true,
        botInfo: {
          id: data.result.id,
          name: data.result.first_name,
          username: data.result.username,
          canJoinGroups: data.result.can_join_groups
        }
      };
    } else {
      return { success: false, error: data.description || 'Недействительный токен бота' };
    }
  } catch (err) {
    return { success: false, error: 'Ошибка подключения к Telegram API: ' + err.message };
  }
}

// Send Test Notification / Courier Broadcast via Telegram API
export async function sendTelegramMessage(token, chatId, text, parseMode = 'Markdown') {
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
      })
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('Error sending Telegram message:', err);
    return false;
  }
}
