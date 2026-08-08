import { getStore, addOrUpdateOrder, updateCourierLocation } from './store.js';

// Vercel Serverless Function - Telegram Courier Bot Webhook Engine
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
      message: 'Cosmo Cleaning Telegram Courier Bot Webhook Engine is running on Vercel!'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const update = req.body || {};
  const token = req.query.token || process.env.TELEGRAM_BOT_TOKEN;

  try {
    if (update.message) {
      await handleMessage(update.message, token);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query, token);
    }
  } catch (err) {
    console.error('Error handling Telegram webhook:', err);
  }

  return res.status(200).json({ ok: true });
}

// Send Telegram Message helper
async function sendTgMessage(token, chatId, text, replyMarkup = null) {
  if (!token) return;
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

// Answer Telegram Callback Query helper
async function answerCallbackQuery(token, callbackQueryId, text = '') {
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text })
  }).catch(() => {});
}

// Main Telegram Reply Keyboard
function getCourierReplyKeyboard() {
  return {
    keyboard: [
      [{ text: "📥 Забор ковров" }, { text: "📦 Готовые заказы" }],
      [{ text: "🚚 На доставку" }, { text: "📋 Мои заказы" }],
      [{ text: "📍 Отправить моё GPS местоположение", request_location: true }],
      [{ text: "🔍 Поиск заказа" }, { text: "🚪 Выйти (/logout)" }]
    ],
    resize_keyboard: true
  };
}

// Order Inline Keyboard
function getOrderInlineActions(order) {
  const buttons = [];
  const status = (order.status || '').toLowerCase();
  const id = String(order.id);

  if (order.gpsLocation) {
    const parts = order.gpsLocation.split(',');
    if (parts.length === 2) {
      const lat = parts[0].trim();
      const lng = parts[1].trim();
      buttons.push([
        { text: "🧭 Я.Навигатор", url: `https://yandex.ru/navi/?rtext=~${lat},${lng}` },
        { text: "🗺️ Я.Карты", url: `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=auto` }
      ]);
    }
  }

  if (status === 'new' || status === 'pickup') {
    buttons.push([{ text: "🚗 Взять на забор", callback_data: `cour_claim_${id}` }]);
    buttons.push([{ text: "📍 Привязать GPS", callback_data: `cour_loc_${id}` }]);
  } else if (status === 'cleaning' || status === 'ready') {
    buttons.push([{ text: "📦 Готов к доставке", callback_data: `cour_ready_${id}` }]);
  } else if (status === 'delivery') {
    buttons.push([
      { text: "💵 Оплата Наличными", callback_data: `cour_pay_cash_${id}` },
      { text: "💳 Оплата Click/Payme", callback_data: `cour_pay_online_${id}` }
    ]);
  }

  return { inline_keyboard: buttons };
}

// Handle Incoming Telegram Message
async function handleMessage(msg, token) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  // 1. Handle Native Location Message
  if (msg.location) {
    const lat = msg.location.latitude;
    const lng = msg.location.longitude;
    const courName = msg.from.first_name || 'Курьер Telegram';
    await updateCourierLocation(courName, { lat, lng, speed: 0, status: 'Передана GPS геолокация' });
    await sendTgMessage(token, chatId, `✅ **GPS Геолокация успешно передана в CRM!**\nКоординаты: \`${lat.toFixed(5)}, ${lng.toFixed(5)}\`\nВаше местоположение обновилось на карте администратора.`);
    return;
  }

  // 2. Start / Auth Command
  if (text.startsWith('/start')) {
    await sendTgMessage(
      token,
      chatId,
      `👋 **Добро пожаловать в Службу Курьеров Cosmo CRM!**\n\nБот полностью синхронизирован с Vercel и показывает только реальные заказы CRM.\nВыберите действие из меню:`,
      getCourierReplyKeyboard()
    );
    return;
  }

  const store = await getStore();
  const orders = store.orders || [];

  // 3. Pickup Orders (📥 Забор ковров)
  if (text === '📥 Забор ковров') {
    const pickups = orders.filter(o => o.status === 'new' || o.status === 'pickup');
    if (pickups.length === 0) {
      await sendTgMessage(token, chatId, "📥 **Нет заказов, ожидающих забора.**\nВсе поступившие заборы моментально отображаются здесь.");
      return;
    }

    for (const o of pickups.slice(0, 10)) {
      const txt = `📥 **Забор №${o.id}**\n👤 **Клиент:** ${o.clientName || 'Клиент'}\n📞 **Тел:** \`${o.phone || '-'}\`\n🏠 **Адрес:** ${o.address || 'Самарканд'}\n💬 **Детали:** ${o.notes || 'Забор изделий'}`;
      await sendTgMessage(token, chatId, txt, getOrderInlineActions(o));
    }
    return;
  }

  // 4. Delivery Orders (📦 Готовые заказы / 🚚 На доставку)
  if (text === '📦 Готовые заказы' || text === '🚚 На доставку') {
    const deliveries = orders.filter(o => o.status === 'ready' || o.status === 'delivery');
    if (deliveries.length === 0) {
      await sendTgMessage(token, chatId, "🚚 **Нет заказов на доставку.**\nГотовые к выгрузке ковры появятся здесь.");
      return;
    }

    for (const o of deliveries.slice(0, 10)) {
      const txt = `🚚 **Доставка №${o.id}**\n👤 **Клиент:** ${o.clientName || 'Клиент'}\n📞 **Тел:** \`${o.phone || '-'}\`\n🏠 **Адрес:** ${o.address || 'Самарканд'}\n💰 **К оплате:** **${(o.totalAmount || 0).toLocaleString()} сум**`;
      await sendTgMessage(token, chatId, txt, getOrderInlineActions(o));
    }
    return;
  }

  // 5. My Orders (📋 Мои заказы)
  if (text === '📋 Мои заказы') {
    const courName = msg.from.first_name || 'Курьер';
    const myOrders = orders.filter(o => o.assignedCourier === courName || o.status !== 'done');
    if (myOrders.length === 0) {
      await sendTgMessage(token, chatId, "📋 У вас пока нет активных заказов.");
      return;
    }

    let report = `📋 **Активные заказы CRM (${myOrders.length}):**\n\n`;
    for (const o of myOrders.slice(0, 12)) {
      report += `• **№${o.id}** | ${o.clientName} (${o.address}) — \`${o.status}\`\n`;
    }
    await sendTgMessage(token, chatId, report);
    return;
  }

  // 6. Order Search Prompt & Execution
  if (text.startsWith('🔍') || text.startsWith('/search')) {
    const query = text.replace('/search', '').replace('🔍', '').trim();
    if (!query) {
      await sendTgMessage(token, chatId, "🔍 Введите номер заказа (например: `5200` или имя клиента):");
      return;
    }
    await searchAndSendOrders(query, orders, token, chatId);
    return;
  }

  // Fallback search if user typed search query directly (e.g. "5200" or client name)
  if (text.length >= 2) {
    await searchAndSendOrders(text, orders, token, chatId);
  }
}

async function searchAndSendOrders(query, orders, token, chatId) {
  const q = query.toLowerCase();
  const matched = orders.filter(o => 
    String(o.id).toLowerCase().includes(q) || 
    (o.clientName || '').toLowerCase().includes(q) || 
    (o.phone || '').includes(q) || 
    (o.address || '').toLowerCase().includes(q)
  );

  if (matched.length === 0) {
    await sendTgMessage(token, chatId, `🔍 По запросу **"${query}"** заказов не найдено.`);
    return;
  }

  await sendTgMessage(token, chatId, `🔍 Найдено заказов: **${matched.length}**`);
  for (const o of matched.slice(0, 5)) {
    const txt = `📦 **Заказ №${o.id}**\n👤 **Клиент:** ${o.clientName || 'Клиент'}\n📞 **Тел:** \`${o.phone || '-'}\`\n🏠 **Адрес:** ${o.address || '-'}\n📊 **Статус:** \`${o.status}\` | **Оплата:** \`${o.paymentStatus}\`\n💰 **Сумма:** **${(o.totalAmount || 0).toLocaleString()} сум**`;
    await sendTgMessage(token, chatId, txt, getOrderInlineActions(o));
  }
}

// Handle Incoming Telegram Callback Queries (Inline Buttons)
async function handleCallbackQuery(cb, token) {
  const data = cb.data || '';
  const chatId = cb.message.chat.id;
  const store = await getStore();

  if (data.startsWith('cour_claim_')) {
    const orderId = data.replace('cour_claim_', '');
    const courName = cb.from.first_name || 'Курьер Telegram';
    await addOrUpdateOrder({ id: orderId, status: 'pickup', assignedCourier: courName });
    await answerCallbackQuery(token, cb.id, `🚗 Вы взяли заказ #${orderId} на забор!`);
    await sendTgMessage(token, chatId, `✅ **Вы взяли заказ №${orderId} на забор!**\nСтатус заказа обновлен в CRM на "Забор курьером".`);
    return;
  }

  if (data.startsWith('cour_ready_')) {
    const orderId = data.replace('cour_ready_', '');
    await addOrUpdateOrder({ id: orderId, status: 'delivery' });
    await answerCallbackQuery(token, cb.id, `📦 Заказ #${orderId} переведен на доставку!`);
    await sendTgMessage(token, chatId, `📦 **Заказ №${orderId} готов к выгрузке клиенту!**`);
    return;
  }

  if (data.startsWith('cour_pay_cash_') || data.startsWith('cour_pay_online_')) {
    const isCash = data.startsWith('cour_pay_cash_');
    const orderId = data.replace(isCash ? 'cour_pay_cash_' : 'cour_pay_online_', '');
    const payType = isCash ? 'Наличные' : 'Click/Payme';

    const existing = (store.orders || []).find(o => String(o.id) === String(orderId));
    const amount = existing?.totalAmount || 0;

    await addOrUpdateOrder({
      id: orderId,
      status: 'done',
      paymentStatus: 'paid',
      paidAmount: amount,
      paymentType: payType
    });

    await answerCallbackQuery(token, cb.id, `🎉 Заказ #${orderId} выгружен и оплачен!`);
    await sendTgMessage(
      token,
      chatId,
      `🎉 **Заказ №${orderId} успешно доставлен и оплачен!**\n💰 Способ оплаты: **${payType}**\n💵 Получено: **${amount.toLocaleString()} сум**\n\nЭлектронный чек сформирован в CRM.`
    );
    return;
  }
}
