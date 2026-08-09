// Telegram Common Group Notification Bot Service for Cosmo Cleaning CRM
// Sends automated notifications for 4 primary events to the unified Telegram Group:
// 1. New Order Created (Диспетчер оформляет новый заказ)
// 2. Order Picked Up (Курьер забрал изделия у клиента и указал количество)
// 3. Order Measured & Washed (Мойщик замерил ковры и завершил работу в цеху)
// 4. Order Delivered & Closed (Курьер доставил заказ, принята оплата, заказ закрыт)

const STORAGE_KEY = 'cosmo_crm_tg_group_bot_config';
const LEGACY_STORAGE_KEY = 'cosmo_crm_tg_courier_bot_config';
const CHAT_ID_KEY = 'cosmo_crm_tg_chat_id';
const BOT_TOKEN_KEY = 'cosmo_crm_tg_bot_token';

// In-memory Deduplication History to prevent any duplicate messages
const sentMessageHistory = new Map();

function isDuplicateNotification(eventKey, orderId, windowMs = 8000) {
  const cleanId = String(orderId || '').trim();
  if (!cleanId || cleanId === 'Б/Н' || cleanId === '-') return false;
  
  const key = `${eventKey}_${cleanId}`;
  const now = Date.now();
  const lastSent = sentMessageHistory.get(key);
  
  if (lastSent && (now - lastSent) < windowMs) {
    console.warn(`[Telegram Bot] Ignored duplicate notification for ${key} (sent ${(now - lastSent)}ms ago)`);
    return true;
  }
  
  sentMessageHistory.set(key, now);
  // Periodically clean old cache entries
  if (sentMessageHistory.size > 200) {
    for (const [k, time] of sentMessageHistory.entries()) {
      if (now - time > 60000) sentMessageHistory.delete(k);
    }
  }
  return false;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Normalizes Telegram Chat ID (handles negative group IDs, typographic dashes, @usernames, t.me links)
 */
export function normalizeChatId(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  // Remove surrounding quotes and trailing/leading slashes
  str = str.replace(/^["']|["']$/g, '').trim();
  // Replace typographic minus/dash signs (—, –, −) with standard ASCII '-'
  str = str.replace(/[—–−]/g, '-');
  
  // If user pasted a Telegram t.me link:
  if (str.includes('t.me/c/')) {
    const match = str.match(/t\.me\/c\/(\d+)/);
    if (match) return `-100${match[1]}`;
  } else if (str.includes('t.me/')) {
    const match = str.match(/t\.me\/([a-zA-Z0-9_]+)/);
    if (match && !['joinchat', 'c', 'share'].includes(match[1])) {
      return `@${match[1]}`;
    }
  }
  
  return str;
}

export function getTelegramBotConfig() {
  try {
    if (typeof window !== 'undefined' && window.__COSMO_TG_CONFIG) {
      return window.__COSMO_TG_CONFIG;
    }

    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    const directChatId = localStorage.getItem(CHAT_ID_KEY);
    const directToken = localStorage.getItem(BOT_TOKEN_KEY);

    let parsed = {};
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {}
    }

    const channelId = normalizeChatId(parsed.channelId || directChatId || '');
    const botToken = (parsed.botToken || directToken || '').trim();

    const finalConfig = {
      botToken: botToken,
      botUsername: parsed.botUsername || 'CosmoGroupNotifier_bot',
      channelId: channelId,
      enabledEvents: {
        created: parsed.enabledEvents?.created ?? true,
        pickup: parsed.enabledEvents?.pickup ?? true,
        ready: parsed.enabledEvents?.ready ?? true,
        done: parsed.enabledEvents?.done ?? true
      },
      status: botToken && channelId ? 'online' : 'offline'
    };

    if (typeof window !== 'undefined') {
      window.__COSMO_TG_CONFIG = finalConfig;
    }

    return finalConfig;
  } catch (e) {
    console.error('Error reading telegram bot config:', e);
  }

  return {
    botToken: '',
    botUsername: 'CosmoGroupNotifier_bot',
    channelId: '',
    enabledEvents: {
      created: true,
      pickup: true,
      ready: true,
      done: true
    },
    status: 'offline'
  };
}

export function saveTelegramBotConfig(config) {
  try {
    const normalizedChatId = normalizeChatId(config.channelId);
    const cleanToken = (config.botToken || '').trim();
    const cleanUsername = (config.botUsername || '').trim().replace(/^@/, '');

    const payload = {
      botToken: cleanToken,
      botUsername: cleanUsername,
      channelId: normalizedChatId,
      enabledEvents: {
        created: config.enabledEvents?.created !== false,
        pickup: config.enabledEvents?.pickup !== false,
        ready: config.enabledEvents?.ready !== false,
        done: config.enabledEvents?.done !== false
      },
      status: cleanToken && normalizedChatId ? 'online' : 'offline',
      updatedAt: Date.now()
    };

    // Save across all keys for persistent reliability
    const serialized = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY, serialized);
    localStorage.setItem(CHAT_ID_KEY, normalizedChatId);
    localStorage.setItem(BOT_TOKEN_KEY, cleanToken);

    if (typeof window !== 'undefined') {
      window.__COSMO_TG_CONFIG = payload;
      window.dispatchEvent(new CustomEvent('tg_bot_config_updated', { detail: payload }));
    }

    return true;
  } catch (e) {
    console.error('Error saving telegram bot config:', e);
    return false;
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

// Send Raw Telegram Message with optional Inline Keyboard and HTML parse mode
export async function sendTelegramMessage(token, chatId, htmlText, replyMarkup = null, parseMode = 'HTML') {
  const cleanChatId = normalizeChatId(chatId);
  const cleanToken = (token || '').trim();

  if (!cleanToken || !cleanChatId) {
    return { success: false, error: 'Не указан токен бота или Chat ID общей группы' };
  }

  try {
    const payload = {
      chat_id: cleanChatId,
      text: htmlText,
      parse_mode: parseMode,
      disable_web_page_preview: true
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return { success: data.ok, data: data.result, error: data.description };
  } catch (err) {
    console.error('Error sending Telegram group message:', err);
    return { success: false, error: err.message };
  }
}

// Send Test Message to Group
export async function testSendGroupMessage(token, chatId) {
  const cleanToken = (token || '').trim();
  const cleanChatId = normalizeChatId(chatId);

  if (!cleanToken) return { success: false, error: 'Введите токен бота' };
  if (!cleanChatId) return { success: false, error: 'Введите Chat ID общей группы (например: -1001234567890)' };

  const testText = 
    `🤖 <b>COSMO CLEANING — ТЕСТОВОЕ СООБЩЕНИЕ</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `✅ Бот-уведомитель успешно подключен к общей Telegram-группе!\n` +
    `🆔 Chat ID: <code>${cleanChatId}</code>\n\n` +
    `📢 <b>Автоматические статусы, которые будут приходить сюда:</b>\n` +
    `1️⃣ <b>Создание:</b> Новый заказ оформлен диспетчером\n` +
    `2️⃣ <b>Забор у клиента:</b> Курьер забрал изделия (кол-во и состав)\n` +
    `3️⃣ <b>Готовность:</b> Мойщик замерил, постирал ковры и передал на доставку\n` +
    `4️⃣ <b>Закрытие:</b> Заказ доставлен клиенту и оплачен\n\n` +
    `🕒 <i>Время проверки: ${new Date().toLocaleString('ru-RU')}</i>`;

  return await sendTelegramMessage(cleanToken, cleanChatId, testText);
}

// Helper to build navigation & call buttons
function buildOrderActionButtons(order) {
  const inlineKeyboard = [];
  const orderId = order.id || order.tempId || '';

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
  } else if (order.address) {
    const encodedAddr = encodeURIComponent(`Самарканд ${order.district ? order.district + ' ' : ''}${order.address}`);
    navButtons.push({
      text: '🧭 Я.Навигатор по адресу',
      url: `https://yandex.ru/navi/?text=${encodedAddr}`
    });
  }
  if (navButtons.length > 0) {
    inlineKeyboard.push(navButtons);
  }

  // Row 2: Phone call link
  const phoneClean = String(order.phone || order.clientPhone || '').replace(/[^0-9]/g, '');
  if (phoneClean) {
    inlineKeyboard.push([{
      text: `📞 Позвонить (${order.phone || order.clientPhone})`,
      url: `https://t.me/share/url?url=${encodeURIComponent(`Заказ #${orderId}`)}&text=${encodeURIComponent(`tel:+${phoneClean}`)}`
    }]);
  }

  return inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : null;
}

// Helper to format items summary string
function formatItemsList(items, fallbackCount, fallbackArea) {
  if (Array.isArray(items) && items.length > 0) {
    return items.map((it, idx) => {
      const name = it.serviceName || it.name || 'Изделие';
      const qty = it.qty || 1;
      const unit = it.unit || 'шт';
      const dims = it.width && it.length ? ` (${it.width}м × ${it.length}м = ${it.area || (it.width * it.length).toFixed(2)} м²)` : '';
      const price = it.price ? ` — ${it.price.toLocaleString()} сум` : '';
      return `• <b>${idx + 1}. ${escapeHtml(name)}</b>: ${qty} ${unit}${dims}${price}`;
    }).join('\n');
  }
  return `• <b>Количество:</b> ${fallbackCount || 1} шт ${fallbackArea ? `(${fallbackArea} м²)` : ''}`;
}

// ============================================================================
// EVENT 1: Создание нового заказа (Диспетчер оформляет новый заказ)
// ============================================================================
export async function notifyOrderCreated(order) {
  const config = getTelegramBotConfig();
  if (!config.botToken || !config.channelId || config.enabledEvents.created === false) {
    return { success: false, skipped: true };
  }

  const orderId = order.id || order.tempId || 'Б/Н';

  // Deduplication check: Do not send creation notification for the same order within 8 seconds
  if (isDuplicateNotification('created', orderId)) {
    return { success: true, deduplicated: true };
  }

  const clientName = escapeHtml(order.clientName || 'Новый клиент');
  const phone = escapeHtml(order.phone || order.clientPhone || '-');
  const addressFull = escapeHtml(`${order.district ? `р-н ${order.district}, ` : ''}${order.address || 'Самарканд'}`);
  const landmark = order.landmark ? escapeHtml(order.landmark) : '';
  const language = order.language ? escapeHtml(order.language) : '';
  const itemsText = formatItemsList(order.items, order.itemsCount, order.area);
  const courier = order.assignedCourier ? escapeHtml(order.assignedCourier) : 'Не назначен';
  const dispatcher = order.dispatcherName ? escapeHtml(order.dispatcherName) : 'Диспетчер CRM';
  const notes = order.notes ? escapeHtml(order.notes) : '';
  const isUrgent = order.urgent ? '🔥 <b>СРОЧНЫЙ ЗАКАЗ</b>\n' : '';
  const sumFormatted = (order.totalAmount || order.agreedAmount || 0).toLocaleString();

  const text = 
    `🆕 <b>НОВЫЙ ЗАКАЗ #${orderId}</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    isUrgent +
    `👤 <b>Клиент:</b> ${clientName}\n` +
    `📞 <b>Телефон:</b> <code>${phone}</code>\n` +
    `📍 <b>Адрес:</b> ${addressFull}\n` +
    (landmark ? `🗺️ <b>Ориентир:</b> ${landmark}\n` : '') +
    (language ? `🗣️ <b>Язык общения:</b> ${language}\n` : '') +
    `📦 <b>Изделия на забор:</b>\n${itemsText}\n` +
    `🚚 <b>Назначенный курьер:</b> ${courier}\n` +
    `🎙️ <b>Оформил(а):</b> ${dispatcher}\n` +
    (order.totalAmount ? `💰 <b>Ориентировочная сумма:</b> ${sumFormatted} сум\n` : '') +
    (notes ? `💬 <b>Примечание:</b> <i>${notes}</i>\n` : '') +
    `🕒 <b>Время создания:</b> ${order.createdDate || new Date().toLocaleString('ru-RU')}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📥 <i>Заказ ожидает выезда курьера на забор изделий.</i>`;

  const replyMarkup = buildOrderActionButtons(order);
  return await sendTelegramMessage(config.botToken, config.channelId, text, replyMarkup);
}

// ============================================================================
// EVENT 2: Забор у клиента (Курьер приезжает на адрес, отмечает в CRM, что конкретно забрал)
// ============================================================================
export async function notifyOrderPickup(order, pickupDetails = {}) {
  const config = getTelegramBotConfig();
  if (!config.botToken || !config.channelId || config.enabledEvents.pickup === false) {
    return { success: false, skipped: true };
  }

  const orderId = order.id || order.tempId || 'Б/Н';

  // Deduplication check
  if (isDuplicateNotification('pickup', orderId)) {
    return { success: true, deduplicated: true };
  }

  const clientName = escapeHtml(order.clientName || 'Клиент');
  const phone = escapeHtml(order.phone || order.clientPhone || '-');
  const addressFull = escapeHtml(`${order.district ? `р-н ${order.district}, ` : ''}${order.address || 'Самарканд'}`);
  const courier = escapeHtml(pickupDetails.courier || order.assignedCourier || 'Курьер');
  const itemsText = formatItemsList(pickupDetails.items || order.items, order.itemsCount, order.area);
  const conditionNotes = pickupDetails.notes ? escapeHtml(pickupDetails.notes) : '';
  const negotiatedNotes = pickupDetails.negotiated ? escapeHtml(pickupDetails.negotiated) : '';
  const timeStr = new Date().toLocaleString('ru-RU');

  const text = 
    `🚗 <b>ЗАКАЗ #${orderId} — ЗАБРАН У КЛИЕНТА</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Клиент:</b> ${clientName}\n` +
    `📞 <b>Телефон:</b> <code>${phone}</code>\n` +
    `📍 <b>Адрес:</b> ${addressFull}\n` +
    `🚚 <b>Курьер:</b> <b>${courier}</b>\n\n` +
    `📦 <b>Принятые изделия:</b>\n${itemsText}\n\n` +
    (conditionNotes ? `📝 <b>Состояние / Дефекты:</b> <i>${conditionNotes}</i>\n` : '') +
    (negotiatedNotes ? `💬 <b>Договоренность с клиентом:</b> <i>${negotiatedNotes}</i>\n` : '') +
    `🕒 <b>Время забора:</b> ${timeStr}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🏭 <i>Изделия приняты курьером и направляются в цех стирки.</i>`;

  const replyMarkup = buildOrderActionButtons(order);
  return await sendTelegramMessage(config.botToken, config.channelId, text, replyMarkup);
}

// ============================================================================
// EVENT 3: Готовность (Мойщик измеряет ковры и заканчивает работу — нужно доставить)
// ============================================================================
export async function notifyOrderReady(order, washDetails = {}) {
  const config = getTelegramBotConfig();
  if (!config.botToken || !config.channelId || config.enabledEvents.ready === false) {
    return { success: false, skipped: true };
  }

  const orderId = order.id || order.tempId || 'Б/Н';

  // Deduplication check
  if (isDuplicateNotification('ready', orderId)) {
    return { success: true, deduplicated: true };
  }

  const clientName = escapeHtml(order.clientName || 'Клиент');
  const phone = escapeHtml(order.phone || order.clientPhone || '-');
  const addressFull = escapeHtml(`${order.district ? `р-н ${order.district}, ` : ''}${order.address || 'Самарканд'}`);
  const washer = escapeHtml(washDetails.washer || 'Мастер цеха');
  const totalArea = washDetails.totalArea || order.area || 0;
  const totalAmount = (washDetails.totalAmount || order.totalAmount || order.agreedAmount || 0).toLocaleString();
  const itemsText = formatItemsList(washDetails.measuredItems || order.items, order.itemsCount, totalArea);
  const timeStr = new Date().toLocaleString('ru-RU');

  const text = 
    `🧼📦 <b>ЗАКАЗ #${orderId} — ИЗМЕРЕН И ПОМЫТ</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Клиент:</b> ${clientName}\n` +
    `📞 <b>Телефон:</b> <code>${phone}</code>\n` +
    `📍 <b>Адрес:</b> ${addressFull}\n` +
    `🧼 <b>Мастер цеха:</b> <b>${washer}</b>\n\n` +
    `📐 <b>Результаты замеров в цеху:</b>\n${itemsText}\n\n` +
    (totalArea > 0 ? `📏 <b>Общая площадь:</b> <b>${totalArea} м²</b>\n` : '') +
    `💰 <b>Итоговая сумма к оплате:</b> <b>${totalAmount} сум</b>\n` +
    `🕒 <b>Время готовности:</b> ${timeStr}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🚚 <b>ВНИМАНИЕ КУРЬЕРАМ:</b> <i>Заказ готов к выгрузке и ожидает доставки клиенту!</i>`;

  const replyMarkup = buildOrderActionButtons(order);
  return await sendTelegramMessage(config.botToken, config.channelId, text, replyMarkup);
}

// ============================================================================
// EVENT 4: Закрытие (Курьер доставил вещи, и заказ закрывается на сайте)
// ============================================================================
export async function notifyOrderCompleted(order, completionDetails = {}) {
  const config = getTelegramBotConfig();
  if (!config.botToken || !config.channelId || config.enabledEvents.done === false) {
    return { success: false, skipped: true };
  }

  const orderId = order.id || order.tempId || 'Б/Н';

  // Deduplication check
  if (isDuplicateNotification('completed', orderId)) {
    return { success: true, deduplicated: true };
  }

  const clientName = escapeHtml(order.clientName || 'Клиент');
  const phone = escapeHtml(order.phone || order.clientPhone || '-');
  const addressFull = escapeHtml(`${order.district ? `р-н ${order.district}, ` : ''}${order.address || 'Самарканд'}`);
  const courier = escapeHtml(completionDetails.courier || order.assignedCourier || 'Курьер');
  const totalAmount = (order.totalAmount || order.agreedAmount || 0).toLocaleString();
  const paidAmount = (completionDetails.paidAmount || order.paidAmount || order.totalAmount || 0).toLocaleString();
  const paymentType = escapeHtml(completionDetails.paymentType || order.paymentType || 'Наличные');
  const timeStr = new Date().toLocaleString('ru-RU');

  const text = 
    `✅ <b>ЗАКАЗ #${orderId} — УСПЕШНО ДОСТАВЛЕН И ЗАКРЫТ</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Клиент:</b> ${clientName}\n` +
    `📞 <b>Телефон:</b> <code>${phone}</code>\n` +
    `📍 <b>Адрес:</b> ${addressFull}\n` +
    `🚚 <b>Курьер доставки:</b> <b>${courier}</b>\n\n` +
    `💰 <b>Сумма заказа:</b> <b>${totalAmount} сум</b>\n` +
    `💵 <b>Полученная оплата:</b> <b>${paidAmount} сум</b>\n` +
    `💳 <b>Способ оплаты:</b> <b>${paymentType}</b>\n` +
    (completionDetails.underpaidReason && completionDetails.underpaidReason !== '-' ? `⚠️ <b>Примечание по оплате:</b> <i>${escapeHtml(completionDetails.underpaidReason)}</i>\n` : '') +
    `🕒 <b>Время закрытия:</b> ${timeStr}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🎉 <i>Заказ полностью выполнен, оплата принята, электронный чек закрыт в CRM!</i>`;

  return await sendTelegramMessage(config.botToken, config.channelId, text);
}

// Manual send order card helper
export async function sendTelegramOrderCard(order, targetChatId = null) {
  const config = getTelegramBotConfig();
  if (!config.botToken) {
    return { success: false, error: 'Токен Telegram-бота не настроен в CRM (раздел "Карта Админа")' };
  }

  const chatId = targetChatId || config.channelId;
  if (!chatId) {
    return { success: false, error: 'Chat ID общей Telegram-группы не указан' };
  }

  if (order.status === 'done') {
    return await notifyOrderCompleted(order);
  } else if (order.status === 'delivery' || order.status === 'ready') {
    return await notifyOrderReady(order);
  } else if (order.status === 'cleaning' || order.status === 'pickup') {
    return await notifyOrderPickup(order);
  } else {
    return await notifyOrderCreated(order);
  }
}

// Backwards compatibility helper
export async function autoNotifyOrderToTelegram(order) {
  return await notifyOrderCreated(order);
}
