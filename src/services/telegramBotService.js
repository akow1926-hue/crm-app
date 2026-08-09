// Telegram Courier Bot Management & Interactive Notification Service

const STORAGE_KEY = 'cosmo_crm_tg_courier_bot_config';

export function getTelegramBotConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      botToken: '',
      botUsername: 'CosmoCourier_bot',
      channelId: '', // Telegram Group / Channel Chat ID (e.g. -100123456789 or @channel)
      webAppUrl: typeof window !== 'undefined' ? window.location.origin : '',
      autoNotifyCouriers: true,
      status: 'offline'
    };
  } catch (e) {
    return {
      botToken: '',
      botUsername: 'CosmoCourier_bot',
      channelId: '',
      webAppUrl: typeof window !== 'undefined' ? window.location.origin : '',
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
    if (config.botToken && typeof window !== 'undefined') {
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
      if (typeof window !== 'undefined') {
        await registerVercelWebhook(cleanToken);
      }

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

// Send Raw Telegram Message with optional Inline Keyboard
export async function sendTelegramMessage(token, chatId, text, replyMarkup = null, parseMode = 'Markdown') {
  if (!token || !chatId) return { success: false, error: 'Нет токена или Chat ID' };

  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: parseMode
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return { success: data.ok, data: data.result, error: data.description };
  } catch (err) {
    console.error('Error sending Telegram message:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate formatted Telegram order text and inline buttons with navigation & actions
 */
export function buildTelegramOrderMessage(order, options = {}) {
  const orderId = order.id || order.tempId || 'Б/Н';
  const statusLabel = 
    order.status === 'new' ? '📥 Новый (Ожидает забора)' :
    order.status === 'pickup' ? '🚗 Забор курьером' :
    order.status === 'cleaning' ? '🧼 В цеху (Стирка/Сушка)' :
    order.status === 'ready' ? '📦 Готов к выдаче' :
    order.status === 'delivery' ? '🚚 На доставке' :
    order.status === 'done' ? '✅ Выполнен' : order.status || 'В обработке';

  const paymentLabel = 
    order.paymentStatus === 'paid' ? '✅ Оплачено' :
    order.paymentStatus === 'partial' ? '⚠️ Частичная оплата' : '⏳ Не оплачено';

  const sumFormatted = (order.totalAmount || order.agreedAmount || 0).toLocaleString();
  const addressFull = `${order.district ? `р-н ${order.district}, ` : ''}${order.address || 'Самарканд'}`;
  
  // Format items list if available
  let itemsSummary = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsSummary = order.items.map((it, idx) => `${idx + 1}. ${it.name || it.serviceName || 'Ковер'}: ${it.qty || 1} ${it.unit || 'м²'}`).join('\n');
  } else {
    itemsSummary = `Количество: ${order.itemsCount || 1} шт / ${order.area ? `${order.area} м²` : ''}`;
  }

  const text = `✨ *COSMO CLEANING — ЗАКАЗ #${orderId}*\n\n` +
    `👤 *Клиент:* ${order.clientName || 'Новый клиент'}\n` +
    `📞 *Телефон:* \`${order.phone || order.clientPhone || '-'}\`\n` +
    `📍 *Адрес:* ${addressFull}\n` +
    (order.landmark ? `🗺️ *Ориентир:* ${order.landmark}\n` : '') +
    (order.language ? `🗣️ *Язык клиента:* ${order.language}\n` : '') +
    `📦 *Изделия:*\n${itemsSummary}\n` +
    `💰 *Сумма:* *${sumFormatted} сум* (${paymentLabel})\n` +
    `📊 *Статус:* ${statusLabel}\n` +
    (order.assignedCourier ? `🚚 *Курьер:* ${order.assignedCourier}\n` : '') +
    (order.notes ? `💬 *Примечание:* _${order.notes}_\n` : '') +
    `\n🕒 *Дата:* ${order.createdDate || new Date().toLocaleString('ru-RU')}`;

  // Build Interactive Inline Buttons
  const inlineKeyboard = [];

  // Row 1: Navigation Buttons
  const navButtons = [];
  if (order.gpsLocation && order.gpsLocation.includes(',')) {
    const [lat, lng] = order.gpsLocation.split(',').map(s => s.trim());
    navButtons.push({
      text: '🧭 Я.Навигатор',
      url: `https://yandex.ru/navi/?rtext=~${lat},${lng}`
    });
    navButtons.push({
      text: '🗺️ Яндекс.Карта',
      url: `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=auto`
    });
  } else {
    const encodedAddr = encodeURIComponent(`Самарканд ${order.district || ''} ${order.address || ''}`);
    navButtons.push({
      text: '🧭 Навигатор по адресу',
      url: `https://yandex.ru/navi/?text=${encodedAddr}`
    });
  }
  if (navButtons.length > 0) {
    inlineKeyboard.push(navButtons);
  }

  // Row 2: Direct Phone Call & Chat
  const phoneClean = String(order.phone || order.clientPhone || '').replace(/[^0-9]/g, '');
  const commButtons = [];
  if (phoneClean) {
    commButtons.push({
      text: '📞 Позвонить',
      url: `https://t.me/share/url?url=${encodeURIComponent(`Заказ #${orderId}`)}&text=${encodeURIComponent(`tel:+${phoneClean}`)}`
    });
  }

  // Row 3: Status Quick Update Actions
  const actionButtons = [];
  if (order.status === 'new' || order.status === 'pickup') {
    actionButtons.push({
      text: '🚗 Забрать у клиента',
      callback_data: `cour_claim_${orderId}`
    });
  } else if (order.status === 'cleaning' || order.status === 'ready') {
    actionButtons.push({
      text: '🚚 Взять на доставку',
      callback_data: `cour_ready_${orderId}`
    });
  } else if (order.status === 'delivery') {
    actionButtons.push({
      text: '✅ Доставлен (Оплачен)',
      callback_data: `cour_pay_cash_${orderId}`
    });
  }
  if (actionButtons.length > 0) {
    inlineKeyboard.push(actionButtons);
  }

  return {
    text,
    replyMarkup: { inline_keyboard: inlineKeyboard }
  };
}

/**
 * Send an interactive Order Card to Telegram
 */
export async function sendTelegramOrderCard(order, targetChatId = null) {
  const config = getTelegramBotConfig();
  if (!config.botToken) {
    return { success: false, error: 'Токен Telegram Бота не настроен в CRM (раздел "Карта Админа")' };
  }

  const chatId = targetChatId || config.channelId;
  if (!chatId) {
    return { success: false, error: 'Chat ID или канал курьеров не указан' };
  }

  const { text, replyMarkup } = buildTelegramOrderMessage(order);
  return await sendTelegramMessage(config.botToken, chatId, text, replyMarkup);
}

/**
 * Auto notify couriers on new order creation
 */
export async function autoNotifyOrderToTelegram(order) {
  const config = getTelegramBotConfig();
  if (!config.botToken || !config.autoNotifyCouriers || !config.channelId) {
    return false;
  }
  return await sendTelegramOrderCard(order, config.channelId);
}
