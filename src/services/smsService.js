/**
 * SMS Gateway Service (Eskiz.uz & Gateway Provider API)
 * Supports SMS triggers, balance check, templates and test SMS sending.
 */

const ESKIZ_CONFIG_KEY = 'cosmo_crm_eskiz_config';
const SMS_TRIGGERS_KEY = 'cosmo_crm_sms_triggers';
const SMS_TEMPLATES_KEY = 'cosmo_crm_sms_templates';
const SMS_HISTORY_KEY = 'cosmo_crm_sms_history';

export const INSTAGRAM_URL = 'https://www.instagram.com/cosmocleaning.uz/';
export const INSTAGRAM_QR_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAACMCAYAAACuwEE+AAAAAklEQVR4AewaftIAAAV/SURBVO3BQa4cOnDAQFKY+1+Z+cuGF3KEeXYcoKvsP6z1v3RY68FhrQeHtR58+IXK31QxqXyjYlK5qbhRuamYVF5UvFD5myqmw1oPDms9OKz14MNvVPwklW9UTCo/SWWqmFQmlanib6r4SSo3h7UeHNZ6cFjrwYdHKi8qvlExqUwVf1PFpDKp3FTcqEwVL1ReVLw4rPXgsNaDw1oPPvxjKiaVqWJSuamYVL6h8qJiUvn/7LDWg8NaDw5rPfjwj1G5UZkqJpVJZaqYVF5U/EkV/7LDWg8Oaz04rPXgw6OKP6liUvlGxaTyk1SmikllqrhRmSpeVPxJh7UeHNZ6cFjrwYffUPmbVKaKSeUnVUwqNypTxaQyVUwqU8U3VP6mw1oPDms9OKz1wP7DP0xlqnihMlVMKjcVk8pU8Q2VqeJfdljrwWGtB4e1Hnz4hcpUcaPyJ1XcqNxUTCpTxY3KVPEnqdxU3KhMFZPKi4rpsNaDw1oPDms9sP8wqNxUTCovKiaVFxU3Kt+omFReVEwqU8WkMlV8Q+VFxYvDWg8Oaz04rPXA/sMDlaliUvlGxY3KVDGp3FRMKjcVP0nlJ1VMKj+pYjqs9eCw1oPDWg8+/EJlqpgqJpWpYlKZKl6o/E0VNypTxY3KTcWNyo3KVHGjMlW8OKz14LDWg8NaDz78hspUMVW8UJkqJpUXKlPFpHJTcaMyVUwqU8VNxY3Kn1TxjcNaDw5rPTis9eDDb1S8ULmp+EbFpDKp3KhMFTcVk8qNylTxkyomlRuVm4oXh7UeHNZ6cFjrwYffUJkqJpWp4kblRcWkMlV8Q2WqmFR+kspUMVXcqPxfOqz14LDWg8NaDz78RsWkMlW8qLhRmVS+oTJVTBWTylTxQuWmYlKZKiaVqWJS+UkqU8V0WOvBYa0Hh7UefPhFxTdUvlHxQmWqmComlZuKP0llqphUblRuVG4qbipuDms9OKz14LDWgw+PKiaVFxWTyo3KTcWNyjdUflLFT6qYVKaKSWWqmFSmiumw1oPDWg8Oaz348AuVqWJS+YbKjcpUMancqPxLVF5UvFCZKiaVn3RY68FhrQeHtR58+A2VqeJGZar4k1SmikllqphUbipeqEwVk8oLlaliqphUvlFxc1jrwWGtB4e1Hth/+ILKTcWkMlX8JJWpYlJ5UTGp3FRMKjcVk8pUcaMyVUwqU8WkMlXcHNZ6cFjrwWGtBx9+oXJTMVVMKjcVk8pNxaQyVXyj4kZlqnhRcaNyozJV3KhMFZPKVPHisNaDw1oPDms9+PAbFZPKVPFC5YXKVHFT8ZMqblT+JpWp4hsqNxXTYa0Hh7UeHNZ68OFRxU3FpDJVTCo3Fd9QuVGZKiaVqeJFxaQyVUwq/7LDWg8Oaz04rPXA/sOgclNxo/KNihuVm4pJZaq4UZkq/iaVP6liUpkqbg5rPTis9eCw1oMPv6j4RsU3VP4mlRuVm4oblaliUrmpeKEyVUwq3zis9eCw1oPDWg8+/ELlb6q4qbhRmVS+UTGpTBWTyk3FT1KZKr5R8eKw1oPDWg8Oaz348BsVP0nlT6r4k1RuKiaVn1TxQuVGZaq4Oaz14LDWg8NaDz48UnlR8Q2VqeKFyk3FpHJT8TepfKPiRuXFYa0Hh7UeHNZ68OEfV/FC5SdVTCpTxU3FpDJV3KhMFZPKVPGiYlKZKqbDWg8Oaz04rPXgwz+m4kZlqviGylQxqUwVk8pUMam8UJkqXqjcVEwqLw5rPTis9eCw1oMPjyr+ZSpTxaQyVdxUvFCZKiaVSWWquFH5hso3Dms9OKz14LDWgw+/ofI3qUwVP6liUvlJFTcVk8qkMlVMFZPKTcVPOqz14LDWg8NaD+w/rPW/dFjrwWGtB4e1HvwPhgHYUp/w3zAAAAAASUVORK5CYII=';

export const getSMSConfig = () => {
  const saved = localStorage.getItem(ESKIZ_CONFIG_KEY);
  return saved ? JSON.parse(saved) : {
    provider: 'eskiz',
    email: 'akow1926@gmail.com',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODkyNDM5NTgsImlhdCI6MTc4NjY1MTk1OCwicm9sZSI6InVzZXIiLCJzaWduIjoiZDNlNGY3YmY4ZDY0MGMwN2U4Yjk4ZTgzZGQ5OTJiNjdjYTdkMzY5ZWYyYzE1YThlMDM5ZDc3YmI0MTlmMzg4NiIsInN1YiI6IjE2ODE1In0.lxNmB9DIkYGUxl4Pg-ZtbiERJcpfUvLleeNk4f50AZI',
    fromName: '4546',
    balanceAmount: 303120,
    smsCountRemaining: 6062
  };
};

export const saveSMSConfig = (config) => {
  localStorage.setItem(ESKIZ_CONFIG_KEY, JSON.stringify(config));
};

export const getSMSTriggers = () => {
  const saved = localStorage.getItem(SMS_TRIGGERS_KEY);
  return saved ? JSON.parse(saved) : {
    onMeasured: true,        // После размерки и расчета в цеху (Основное СМС клиенту)
    onOrderCreated: false,   // При создании / заборе заказа
    onCleaningDone: false,   // При завершении стирки в цеху
    onDeliveryStart: false,  // При выезде курьера на доставку
    onPaymentReceived: false // При получении оплаты
  };
};

export const saveSMSTriggers = (triggers) => {
  localStorage.setItem(SMS_TRIGGERS_KEY, JSON.stringify(triggers));
};

export const defaultTemplates = [
  {
    id: 'tpl_measured',
    event: 'onMeasured',
    title: '📏 После размерки (Замеры изделий, сумма, водитель)',
    text: `Assalomu alaykum {clientName}\n\nBuyurtmangiz - {orderId}\n\nBuyurtma tarkibi:\n\n{itemsList}\n\nStatusi: Yuvildi!\n\nJami: {totalAmount} so'm\n\nHaydovchi: {courier}\n\nBuyurtmangiz tayyor bo'lishi bilan xodimlarimiz siz bilan bog'lanishadi.\n\nBiz bilan bog'lanish: {courierPhone}`
  },
  {
    id: 'tpl_created',
    event: 'onOrderCreated',
    title: '📦 Заказ принят (Забор курьером)',
    text: 'Assalomu alaykum! Sizning #{orderId} buyurtmangiz qabul qilindi. Haydovchi: {courier}. Cosmo Cleaning.'
  },
  {
    id: 'tpl_cleaning',
    event: 'onCleaningDone',
    title: '🧺 Стирка завершена (Готов в цеху)',
    text: 'Assalomu alaykum, {clientName}! Buyurtmangiz #{orderId} muvaffaqiyatli yuvildi. Jami: {totalAmount} so\'m. Cosmo Cleaning.'
  },
  {
    id: 'tpl_delivery',
    event: 'onDeliveryStart',
    title: '🚚 Курьер везет готовую стирку',
    text: 'Assalomu alaykum, {clientName}! Haydovchi {courier} buyurtmangizni #{orderId} yetkazib bermoqda. Cosmo Cleaning.'
  },
  {
    id: 'tpl_payment',
    event: 'onPaymentReceived',
    title: '💳 Подтверждение оплаты (Чек)',
    text: 'To\'lov uchun rahmat! Buyurtma #{orderId} bo\'yicha {paidAmount} so\'m qabul qilindi. Cosmo Cleaning.'
  }
];

// Helper to format list of items with dimensions
export const formatItemsListForSMS = (items = [], totalArea = 0, itemsCount = 1) => {
  if (Array.isArray(items) && items.length > 0) {
    return items.map((it, idx) => {
      let name = (it.serviceName || it.name || 'Gilam').replace(/\s*\([^)]*\)/g, '').trim() || 'Gilam';
      if (it.width && it.length) {
        const area = it.area || parseFloat(((parseFloat(it.width) || 0) * (parseFloat(it.length) || 0)).toFixed(2));
        return `${idx + 1}. ${name} - ${it.width}x${it.length}=${area} kv/m`;
      } else if (it.area) {
        return `${idx + 1}. ${name} - ${it.area} kv/m`;
      } else {
        return `${idx + 1}. ${name} - ${it.qty || 1} ${it.unit || 'dona'}`;
      }
    }).join('\n\n');
  } else if (totalArea && totalArea > 0) {
    return `1. Gilam - ${totalArea} kv/m`;
  }
  return `1. Gilam - ${itemsCount || 1} dona`;
};

// Format exact SMS text after measurement (размерка) as requested
export const formatMeasuredOrderSMS = (order, registeredUsers = []) => {
  if (!order) return '';
  const orderId = order.id || order.tempId || 'Б/Н';
  const clientName = (order.clientName || order.client_name || order.name || 'Mijoz').trim();
  const itemsList = formatItemsListForSMS(order.items, order.area, order.itemsCount);
  const courierName = order.assignedCourier || order.courier || 'Cosmo Haydovchi';

  let courierPhone = '';
  let usersList = registeredUsers;
  if (!usersList || !Array.isArray(usersList) || usersList.length === 0) {
    try {
      const saved = localStorage.getItem('cosmo_crm_registered_users');
      usersList = saved ? JSON.parse(saved) : [];
    } catch (e) {
      usersList = [];
    }
  }

  const foundUser = (usersList || []).find(u => {
    const uName = (u.name || u.username || '').toLowerCase();
    const cName = courierName.toLowerCase();
    return uName === cName || (cName && uName && (uName.includes(cName) || cName.includes(uName)));
  });

  if (foundUser && foundUser.phone) {
    courierPhone = foundUser.phone;
  } else if (order.courierPhone) {
    courierPhone = order.courierPhone;
  } else {
    courierPhone = '+998 90 123 45 67';
  }

  const rawSum = order.totalAmount !== undefined ? order.totalAmount : (order.agreedAmount || 0);
  const totalSum = Number(rawSum || 0).toLocaleString('ru-RU').replace(/,/g, ' ');

  return `Assalomu alaykum ${clientName}\n\nBuyurtmangiz - ${orderId}\n\nBuyurtma tarkibi:\n\n${itemsList}\n\nStatusi: Yuvildi!\n\nJami: ${totalSum} so'm\n\nHaydovchi: ${courierName}\n\nBuyurtmangiz tayyor bo'lishi bilan xodimlarimiz siz bilan bog'lanishadi.\n\nBiz bilan bog'lanish: ${courierPhone}`;
};

export const smsTemplates = [
  {
    label: '📏 После размерки (Замеры, сумма, водитель)',
    getText: (o) => formatMeasuredOrderSMS(o)
  },
  {
    label: '🚚 Заказ принят (Курьер выехал)',
    getText: (o) => `Assalomu alaykum, ${o.clientName || ''}! Sizning #${o.id || o.tempId || ''} buyurtmangiz qabul qilindi. Haydovchi ${o.assignedCourier || ''} yo'lga chiqdi.`
  },
  {
    label: '🧺 Изделия постираны и готовы',
    getText: (o) => `Assalomu alaykum, ${o.clientName || ''}! Buyurtmangiz #${o.id || o.tempId || ''} tayyor. Jami: ${(o.totalAmount || 0).toLocaleString()} so'm. Cosmo Cleaning.`
  },
  {
    label: '💳 Подтверждение оплаты',
    getText: (o) => `To'lov uchun rahmat! Buyurtma #${o.id || o.tempId || ''} bo'yicha ${(o.paidAmount || 0).toLocaleString()} so'm qabul qilindi. Cosmo Cleaning.`
  }
];

export const getSMSTemplates = () => {
  const saved = localStorage.getItem(SMS_TEMPLATES_KEY);
  return saved ? JSON.parse(saved) : defaultTemplates;
};

export const saveSMSTemplates = (templates) => {
  localStorage.setItem(SMS_TEMPLATES_KEY, JSON.stringify(templates));
};

export const getSMSHistory = () => {
  const saved = localStorage.getItem(SMS_HISTORY_KEY);
  return saved ? JSON.parse(saved) : [
    { id: 'SMS-101', phone: '+998 90 123 45 67', text: 'Заказ #1095 принят. Курьер Алишер выехал на забор.', status: 'sent', date: '2026-08-06 14:35' },
    { id: 'SMS-102', phone: '+998 97 765 43 21', text: 'По заказу #1094 получено 180 000 сум. Спасибо!', status: 'sent', date: '2026-08-06 12:16' }
  ];
};

export const logSMSHistory = (entry) => {
  const history = getSMSHistory();
  const updated = [entry, ...history];
  localStorage.setItem(SMS_HISTORY_KEY, JSON.stringify(updated.slice(0, 50)));
};

// Check Live Balance via API or return calculated balance
export const fetchSMSBalance = async () => {
  const config = getSMSConfig();
  const cleanToken = String(config.token || '').replace(/^Bearer\s+/i, '').trim();

  if (cleanToken && config.provider === 'eskiz') {
    // 1. Try local proxy /api/sms/balance
    try {
      const res = await fetch('/api/sms/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken })
      });
      const data = await res.json().catch(() => null);
      if (data && data.data && data.data.balance !== undefined) {
        const balanceUzs = Number(data.data.balance || 0);
        const smsCount = Math.floor(balanceUzs / 50); // In Eskiz standard rate is ~50 UZS per SMS
        const updatedConfig = {
          ...config,
          balanceAmount: balanceUzs,
          smsCountRemaining: smsCount,
          accountName: data.data.name || config.accountName
        };
        saveSMSConfig(updatedConfig);
        return updatedConfig;
      }
    } catch (e) {
      console.warn("Proxy balance check failed, trying direct Eskiz API:", e);
    }

    // 2. Direct fallback to Eskiz API (auth/user or user/get-limit)
    try {
      const res = await fetch('https://notify.eskiz.uz/api/auth/user', {
        headers: { 'Authorization': `Bearer ${cleanToken}` }
      });
      const data = await res.json().catch(() => null);
      if (data && data.data && data.data.balance !== undefined) {
        const balanceUzs = Number(data.data.balance || 0);
        const smsCount = Math.floor(balanceUzs / 50);
        const updatedConfig = {
          ...config,
          balanceAmount: balanceUzs,
          smsCountRemaining: smsCount,
          accountName: data.data.name || config.accountName
        };
        saveSMSConfig(updatedConfig);
        return updatedConfig;
      }
    } catch (e) {
      console.warn("Error fetching direct Eskiz balance:", e);
    }
  }
  return config;
};

// Normalize Uzbekistan phone number to 12 digits (998XXXXXXXXX)
export const formatUzbekistanPhone = (phoneStr) => {
  if (!phoneStr) return '';
  let digits = String(phoneStr).replace(/[^0-9]/g, '');

  // If 9 digits (e.g. 901234567), prepend 998 -> 998901234567
  if (digits.length === 9) {
    digits = '998' + digits;
  }

  return digits;
};

// Fetch list of templates registered in Eskiz account
export const fetchEskizTemplates = async () => {
  const config = getSMSConfig();
  const cleanToken = String(config.token || '').replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) return [];

  try {
    const res = await fetch('https://notify.eskiz.uz/api/user/templates', {
      headers: { 'Authorization': `Bearer ${cleanToken}` }
    });
    const data = await res.json().catch(() => null);
    if (data && data.result) {
      return data.result;
    }
  } catch (e) {
    console.warn("Error fetching Eskiz templates:", e);
  }
  return [];
};

// Submit new template to Eskiz for moderation
export const submitEskizTemplate = async (templateText) => {
  const config = getSMSConfig();
  const cleanToken = String(config.token || '').replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) return { success: false, message: 'Не указан токен Eskiz.uz' };

  try {
    const formData = new FormData();
    formData.append('template', templateText);

    const res = await fetch('https://notify.eskiz.uz/api/user/template', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cleanToken}` },
      body: formData
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.status === 'success') {
      return { success: true, data, message: '✅ Шаблон успешно отправлен на модерацию в Eskiz.uz (ID: ' + (data?.data?.id || '') + ')' };
    }
    return { success: false, message: data?.data?.alert || data?.message || 'Ошибка отправки шаблона' };
  } catch (e) {
    return { success: false, message: 'Ошибка сети: ' + e.message };
  }
};

// Auto-login to Eskiz.uz via email and password to fetch & save token
export const loginEskiz = async ({ email, password }) => {
  if (!email || !password) {
    return { success: false, message: 'Введите Email и Пароль от Eskiz.uz' };
  }
  try {
    const res = await fetch('/api/sms/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => null);
    if (res.ok && (data?.data?.token || data?.token)) {
      const newToken = data.data?.token || data.token;
      const config = getSMSConfig();
      const updated = { ...config, email, token: newToken };
      saveSMSConfig(updated);
      return { success: true, token: newToken, message: '✅ Успешная авторизация в Eskiz.uz! Токен сохранен.' };
    }
    return { success: false, message: data?.message || 'Ошибка авторизации Eskiz.uz. Проверьте Email и пароль.' };
  } catch (err) {
    return { success: false, message: `Ошибка сети при авторизации: ${err.message}` };
  }
};

// Deduplication map to avoid spamming the same SMS multiple times
const recentSMSMap = new Map();
export const isDuplicateSMS = (key, cooldownMs = 12000) => {
  const now = Date.now();
  const lastTime = recentSMSMap.get(key) || 0;
  if (now - lastTime < cooldownMs) {
    return true;
  }
  recentSMSMap.set(key, now);
  return false;
};

// Send SMS function with trigger support, CORS proxy fallback & strict status handling
export const sendSMSNotification = async ({ phone, text, type = 'manual' }) => {
  const config = getSMSConfig();
  const cleanPhone = formatUzbekistanPhone(phone);
  const cleanToken = String(config.token || '').replace(/^Bearer\s+/i, '').trim();
  const cleanFrom = (config.fromName && String(config.fromName).trim()) || '4546';

  if (!cleanPhone || cleanPhone.length !== 12 || !cleanPhone.startsWith('998')) {
    const errorMsg = `⚠️ Неверный номер телефона (${phone}). Номер должен содержать 12 цифр с кодом страны (+998...)`;
    logSMSHistory({
      id: `SMS-${Date.now()}`,
      phone: phone || '-',
      text: text,
      status: 'failed',
      date: new Date().toLocaleString('ru-RU')
    });
    return { success: false, message: errorMsg };
  }

  if (!cleanToken) {
    const errorMsg = `⚠️ СМС не отправлено абоненту (${cleanPhone}): Не заполнен Bearer Token от Eskiz.uz в разделе "Управление СМС" или "Карта Админа"`;
    logSMSHistory({
      id: `SMS-${Date.now()}`,
      phone: cleanPhone,
      text: text,
      status: 'failed',
      date: new Date().toLocaleString('ru-RU')
    });
    return { success: false, message: errorMsg };
  }

  // Check duplicate prevention
  const dedupeKey = `${cleanPhone}_${text.slice(0, 40)}`;
  if (type === 'auto' && isDuplicateSMS(dedupeKey)) {
    return { success: true, message: 'СМС уже отправлено недавно (дедупликация).' };
  }

  let status = 'failed';
  let message = '';

  const payload = {
    mobile_phone: cleanPhone,
    message: text,
    from: cleanFrom,
    token: cleanToken
  };

  // Try 1: Call CORS-safe backend proxy /api/sms
  try {
    const proxyRes = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await proxyRes.json().catch(() => ({}));

    if (proxyRes.ok) {
      if (data && data.status === 'error') {
        status = 'failed';
        message = `⚠️ Ошибка Eskiz: ${data.message || JSON.stringify(data)}`;
      } else {
        status = 'sent';
        message = `📱 СМС успешно отправлено на номер ${cleanPhone}! (Eskiz API)`;
      }
    } else {
      status = 'failed';
      if (proxyRes.status === 401) {
        message = `⚠️ Ошибка авторизации Eskiz (401): Токен устарел или неверен. Нажмите "Получить Токен" в "Управление СМС".`;
      } else if (data && data.message) {
        const errorText = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        message = `⚠️ Ошибка Eskiz (${proxyRes.status}): ${errorText}`;
      } else {
        message = `⚠️ Ошибка шлюза отправки СМС (HTTP ${proxyRes.status})`;
      }
    }
  } catch (proxyError) {
    // Try 2: Fallback to direct fetch (for Native Capacitor Android App where CORS does not apply)
    try {
      const formData = new FormData();
      formData.append('mobile_phone', cleanPhone);
      formData.append('message', text);
      formData.append('from', cleanFrom);

      const directRes = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        },
        body: formData
      });

      const directData = await directRes.json().catch(() => ({}));
      if (directRes.ok && directData.status !== 'error') {
        status = 'sent';
        message = `📱 СМС успешно отправлено на номер ${cleanPhone}!`;
      } else {
        status = 'failed';
        message = `⚠️ Ошибка Eskiz: ${directData?.message || 'Неверный токен или нехватка средств'}`;
      }
    } catch (directError) {
      status = 'failed';
      message = `⚠️ Не удалось отправить СМС: Ошибка сети (${directError.message})`;
    }
  }

  // Deduct simulated balance if sent
  if (status === 'sent') {
    const newCount = Math.max(0, config.smsCountRemaining - 1);
    const newBalance = newCount * 20;
    saveSMSConfig({ ...config, smsCountRemaining: newCount, balanceAmount: newBalance });
  }

  // Log in SMS history
  logSMSHistory({
    id: `SMS-${Date.now()}`,
    phone: cleanPhone,
    text: text,
    status: status,
    date: new Date().toLocaleString('ru-RU')
  });

  return { success: status === 'sent', message };
};

// Send Post-Measurement SMS to Client (Explicit helper)
export const sendMeasuredOrderSMS = async (order, registeredUsers = []) => {
  if (!order) return { success: false, message: 'Заказ не указан' };
  const targetPhone = order.phone || order.clientPhone || order.client_phone || '';
  if (!targetPhone) return { success: false, message: 'Телефон клиента не указан' };

  const text = formatMeasuredOrderSMS(order, registeredUsers);
  return await sendSMSNotification({ phone: targetPhone, text, type: 'auto' });
};

// Automatic SMS Dispatcher on Status/Payment Changes
export const triggerAutoSMSForOrder = async (order, prevStatus, prevPaymentStatus, registeredUsers = []) => {
  if (!order) return;
  const triggers = getSMSTriggers();
  const templates = getSMSTemplates();

  const targetPhone = order.phone || order.clientPhone || order.client_phone || '';
  if (!targetPhone) return;

  const replaceVars = (text) => {
    return (text || '')
      .replace(/{clientName}/g, order.clientName || '')
      .replace(/{orderId}/g, order.id || order.tempId || '')
      .replace(/{totalAmount}/g, Number(order.totalAmount || order.agreedAmount || 0).toLocaleString('ru-RU').replace(/,/g, ' '))
      .replace(/{paidAmount}/g, Number(order.paidAmount || 0).toLocaleString('ru-RU').replace(/,/g, ' '))
      .replace(/{courier}/g, order.assignedCourier || 'Курьер')
      .replace(/{itemsList}/g, formatItemsListForSMS(order.items, order.area, order.itemsCount));
  };

  // 1. PRIMARY TRIGGER: On Order Measured (После размерки в цеху)
  const isMeasuredStatus = order.status === 'delivery' || order.status === 'ready';
  const wasNotMeasured = !prevStatus || prevStatus === 'new' || prevStatus === 'pickup' || prevStatus === 'cleaning';
  const hasMeasurements = Boolean(order.area && order.area > 0) || (Array.isArray(order.items) && order.items.some(i => i.width && i.length));

  if (triggers.onMeasured !== false && isMeasuredStatus && wasNotMeasured && hasMeasurements) {
    await sendMeasuredOrderSMS(order, registeredUsers);
    return;
  }

  // 2. Trigger On Created / Pickup (if explicitly enabled)
  if (triggers.onOrderCreated && (!prevStatus || prevStatus === 'new') && (order.status === 'new' || order.status === 'pickup')) {
    const tpl = templates.find(t => t.event === 'onOrderCreated') || defaultTemplates[1];
    await sendSMSNotification({ phone: targetPhone, text: replaceVars(tpl.text), type: 'auto' });
    return;
  }

  // 3. Trigger On Cleaning Ready (if explicitly enabled and not already handled by onMeasured)
  if (triggers.onCleaningDone && prevStatus !== 'ready' && order.status === 'ready') {
    const tpl = templates.find(t => t.event === 'onCleaningDone') || defaultTemplates[2];
    await sendSMSNotification({ phone: targetPhone, text: replaceVars(tpl.text), type: 'auto' });
    return;
  }

  // 4. Trigger On Delivery Start (if explicitly enabled)
  if (triggers.onDeliveryStart && prevStatus !== 'delivery' && order.status === 'delivery') {
    const tpl = templates.find(t => t.event === 'onDeliveryStart') || defaultTemplates[3];
    await sendSMSNotification({ phone: targetPhone, text: replaceVars(tpl.text), type: 'auto' });
    return;
  }

  // 5. Trigger On Payment Received (if explicitly enabled)
  if (triggers.onPaymentReceived && prevPaymentStatus !== 'paid' && order.paymentStatus === 'paid') {
    const tpl = templates.find(t => t.event === 'onPaymentReceived') || defaultTemplates[4];
    await sendSMSNotification({ phone: targetPhone, text: replaceVars(tpl.text), type: 'auto' });
    return;
  }
};
