/**
 * SMS Gateway Service (Eskiz.uz & Gateway Provider API)
 * Supports SMS triggers, balance check, templates and test SMS sending.
 */

const ESKIZ_CONFIG_KEY = 'cosmo_crm_eskiz_config';
const SMS_TRIGGERS_KEY = 'cosmo_crm_sms_triggers';
const SMS_TEMPLATES_KEY = 'cosmo_crm_sms_templates';
const SMS_HISTORY_KEY = 'cosmo_crm_sms_history';

export const getSMSConfig = () => {
  const saved = localStorage.getItem(ESKIZ_CONFIG_KEY);
  return saved ? JSON.parse(saved) : {
    provider: 'eskiz',
    email: 'info@cosmocleaning.uz',
    token: '',
    fromName: '4546',
    balanceAmount: 185000, // Balance in UZS
    smsCountRemaining: 9250
  };
};

export const saveSMSConfig = (config) => {
  localStorage.setItem(ESKIZ_CONFIG_KEY, JSON.stringify(config));
};

export const getSMSTriggers = () => {
  const saved = localStorage.getItem(SMS_TRIGGERS_KEY);
  return saved ? JSON.parse(saved) : {
    onOrderCreated: true,    // При создании / заборе заказа
    onCleaningDone: true,    // При завершении стирки в цеху (Готов)
    onDeliveryStart: true,   // При выезде курьера на доставку
    onPaymentReceived: true  // При получении оплаты
  };
};

export const saveSMSTriggers = (triggers) => {
  localStorage.setItem(SMS_TRIGGERS_KEY, JSON.stringify(triggers));
};

export const defaultTemplates = [
  {
    id: 'tpl_created',
    event: 'onOrderCreated',
    title: '📦 Заказ принят (Забор курьером)',
    text: 'Здравствуйте, {clientName}! Ваш заказ #{orderId} принят. Курьер {courier} выехал на забор. Тел: +998901112233. Cosmo Cleaning.'
  },
  {
    id: 'tpl_cleaning',
    event: 'onCleaningDone',
    title: '🧺 Стирка завершена (Готов в цеху)',
    text: 'Здравствуйте, {clientName}! Ваш заказ #{orderId} успешно постиран и готов к сдаче. К оплате: {totalAmount} сум. Cosmo Cleaning.'
  },
  {
    id: 'tpl_delivery',
    event: 'onDeliveryStart',
    title: '🚚 Курьер везет готовую стирку',
    text: 'Здравствуйте, {clientName}! Курьер {courier} везет ваш заказ #{orderId}. Ожидайте приезда. Cosmo Cleaning.'
  },
  {
    id: 'tpl_payment',
    event: 'onPaymentReceived',
    title: '💳 Подтверждение оплаты (Чек)',
    text: 'Благодарим за оплату! По заказу #{orderId} получено {paidAmount} сум. С уважением, Cosmo Cleaning Service.'
  }
];

export const smsTemplates = [
  {
    label: '🚚 Заказ принят (Курьер выехал)',
    getText: (o) => `Здравствуйте, ${o.clientName}! Ваш заказ #${o.id} принят. Курьер ${o.assignedCourier || ''} выехал на забор. Тел: +998901112233.`
  },
  {
    label: '🧺 Изделия постираны и готовы',
    getText: (o) => `Здравствуйте, ${o.clientName}! Ковры/изделия по заказу #${o.id} успешно постираны и готовы к доставке. К оплате: ${o.totalAmount?.toLocaleString()} сум. Cosmo Cleaning.`
  },
  {
    label: '💳 Подтверждение оплаты',
    getText: (o) => `Благодарим за оплату! По заказу #${o.id} получено ${o.paidAmount?.toLocaleString()} сум. С уважением, Cosmo Cleaning Service.`
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
  if (config.token && config.provider === 'eskiz') {
    try {
      const res = await fetch('https://notify.eskiz.uz/api/user/get-limit', {
        headers: { 'Authorization': `Bearer ${config.token}` }
      });
      const data = await res.json();
      if (data && data.data) {
        const smsCount = data.data.limit || 0;
        const balanceUzs = smsCount * 20; // ~20 UZS per SMS
        const updatedConfig = { ...config, balanceAmount: balanceUzs, smsCountRemaining: smsCount };
        saveSMSConfig(updatedConfig);
        return updatedConfig;
      }
    } catch (e) {
      console.warn("Error fetching Eskiz balance:", e);
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

// Send SMS function with trigger support, CORS proxy fallback & strict status handling
export const sendSMSNotification = async ({ phone, text, type = 'manual' }) => {
  const config = getSMSConfig();
  const cleanPhone = formatUzbekistanPhone(phone);

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

  if (!config.token) {
    const errorMsg = `⚠️ СМС не отправлено абоненту (${cleanPhone}): Не заполнен Bearer Token от Eskiz.uz в "Карте Админа" -> "Настройки СМС"`;
    logSMSHistory({
      id: `SMS-${Date.now()}`,
      phone: cleanPhone,
      text: text,
      status: 'failed',
      date: new Date().toLocaleString('ru-RU')
    });
    return { success: false, message: errorMsg };
  }

  let status = 'failed';
  let message = '';

  const payload = {
    mobile_phone: cleanPhone,
    message: text,
    from: config.fromName || '4546',
    token: config.token
  };

  // Try 1: Call CORS-safe backend proxy /api/sms
  try {
    const proxyRes = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.status !== 'error') {
        status = 'sent';
        message = `📱 СМС успешно доставлено на номер ${cleanPhone}! (Eskiz API)`;
      } else {
        message = `⚠️ Ошибка Eskiz: ${data?.message || JSON.stringify(data)}`;
      }
    } else {
      message = `⚠️ Ошибка сервера отправки СМС (HTTP ${proxyRes.status})`;
    }
  } catch (proxyError) {
    // Try 2: Fallback to direct fetch (for Native Capacitor Android App where CORS does not apply)
    try {
      const directRes = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mobile_phone: cleanPhone,
          message: text,
          from: config.fromName || '4546'
        })
      });

      const directData = await directRes.json();
      if (directRes.ok && directData.status !== 'error') {
        status = 'sent';
        message = `📱 СМС успешно доставлено на номер ${cleanPhone}!`;
      } else {
        message = `⚠️ Ошибка Eskiz: ${directData?.message || 'Неверный токен'}`;
      }
    } catch (directError) {
      message = `⚠️ Не удалось отправить СМС: Ошибка сети или CORS блокировка (${directError.message})`;
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

// Automatic SMS Dispatcher on Status/Payment Changes
export const triggerAutoSMSForOrder = async (order, prevStatus, prevPaymentStatus) => {
  if (!order) return;
  const triggers = getSMSTriggers();
  const templates = getSMSTemplates();

  const targetPhone = order.phone || order.clientPhone || order.client_phone || '';
  if (!targetPhone) return;

  const replaceVars = (text) => {
    return (text || '')
      .replace(/{clientName}/g, order.clientName || '')
      .replace(/{orderId}/g, order.id || order.tempId || '')
      .replace(/{totalAmount}/g, (order.totalAmount || 0).toLocaleString())
      .replace(/{paidAmount}/g, (order.paidAmount || 0).toLocaleString())
      .replace(/{courier}/g, order.assignedCourier || 'Курьер');
  };

  // 1. Trigger On Created / Pickup
  if (triggers.onOrderCreated && (!prevStatus || prevStatus === 'new') && (order.status === 'new' || order.status === 'pickup')) {
    const tpl = templates.find(t => t.event === 'onOrderCreated') || defaultTemplates[0];
    await sendSMSNotification({ phone: targetPhone, text: replaceVars(tpl.text), type: 'auto' });
    return;
  }

  // 2. Trigger On Cleaning Ready
  if (triggers.onCleaningDone && prevStatus !== 'ready' && order.status === 'ready') {
    const tpl = templates.find(t => t.event === 'onCleaningDone') || defaultTemplates[1];
    await sendSMSNotification({ phone: targetPhone, text: replaceVars(tpl.text), type: 'auto' });
    return;
  }

  // 3. Trigger On Delivery Start
  if (triggers.onDeliveryStart && prevStatus !== 'delivery' && order.status === 'delivery') {
    const tpl = templates.find(t => t.event === 'onDeliveryStart') || defaultTemplates[2];
    await sendSMSNotification({ phone: targetPhone, text: replaceVars(tpl.text), type: 'auto' });
    return;
  }

  // 4. Trigger On Payment Received
  if (triggers.onPaymentReceived && prevPaymentStatus !== 'paid' && order.paymentStatus === 'paid') {
    const tpl = templates.find(t => t.event === 'onPaymentReceived') || defaultTemplates[3];
    await sendSMSNotification({ phone: targetPhone, text: replaceVars(tpl.text), type: 'auto' });
    return;
  }
};
