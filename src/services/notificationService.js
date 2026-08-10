import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const requestNotificationPermission = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    }
  } catch (e) {
    console.warn('Native local notification request error:', e);
  }

  if (!('Notification' in window)) {
    console.log('Notifications not supported in this environment');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Send a native Push Notification to the user's phone / browser
 */
export const sendRolePushNotification = async ({ title, body, role = 'all', icon = '/favicon.ico' }) => {
  // 1. Native Capacitor Local Notification for Android / Mobile App
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 100) },
            sound: null,
            attachments: null,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (e) {
      console.error('Error triggering native notification:', e);
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    // 2. Browser Web Notification API
    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200],
        tag: `cosmo-crm-${Date.now()}`,
        requireInteraction: true,
      });

      notification.onclick = function() {
        window.focus();
        this.close();
      };
    } catch (e) {
      console.error('Error triggering push notification:', e);
    }
  }

  // Play sound effect if supported
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Ignore audio failures
  }
};

/**
 * Helper triggers for specific role push notifications
 */
export const notifyCourierNewOrder = (order) => {
  // Send native push notification
  sendRolePushNotification({
    title: `📥 Новый заказ на забор #${order.id}`,
    body: `Адрес: ${order.district || ''}, ${order.address}. Клиент: ${order.clientName} (${order.phone})`,
    role: 'courier'
  });
};

export const notifyWasherNewItem = (order) => {
  sendRolePushNotification({
    title: `🧼 Поступил ковер в цех #${order.id}`,
    body: `Клиент: ${order.clientName}. Ковры доставлены в цех стирки.`,
    role: 'washer'
  });
};

export const notifyDispatcherStatusChange = (order, newStatus) => {
  sendRolePushNotification({
    title: `📲 Статус заказа #${order.id} изменен`,
    body: `Заказ #${order.id} переведен в статус "${newStatus}". Клиент: ${order.clientName}`,
    role: 'dispatcher'
  });
};

export const notifyAdminPayment = (order, amount) => {
  sendRolePushNotification({
    title: `💰 Оплата заказа #${order.id}`,
    body: `Получено ${amount.toLocaleString()} сум (${order.paymentType || 'Наличные'}). Заказ выполнен!`,
    role: 'admin'
  });
};

/**
 * Checks active orders for overdue deadlines and triggers daily alerts
 */
export const checkOverdueOrders = (orders = []) => {
  if (!Array.isArray(orders) || orders.length === 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastAlertKey = 'cosmo_crm_last_overdue_alert';
  const lastAlertDate = localStorage.getItem(lastAlertKey);

  // Avoid spamming alerts if checked already today
  if (lastAlertDate === todayStr) return;

  const activePending = orders.filter(o => o.status !== 'done' && o.status !== 'cancelled');

  activePending.forEach(o => {
    const deliveryDays = parseInt(o.deliveryDays, 10) || 5;
    const startTimestamp = o.pickupDate || o.created_at || o.createdDate;
    if (!startTimestamp) return;

    let startDate;
    if (typeof startTimestamp === 'string' && startTimestamp.includes('.')) {
      const parts = startTimestamp.split(',');
      const dateParts = parts[0].trim().split('.');
      if (dateParts.length === 3) {
        startDate = new Date(parseInt(dateParts[2], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[0], 10));
      } else {
        startDate = new Date(startTimestamp);
      }
    } else {
      startDate = new Date(startTimestamp);
    }

    if (isNaN(startDate.getTime())) return;

    const today = new Date();
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = todayMidnight.getTime() - startMidnight.getTime();
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remaining = deliveryDays - daysPassed;

    if (remaining < 0) {
      sendRolePushNotification({
        title: `🚨 ПРОСРОЧКА ЗАКАЗА #${o.id || o.tempId}`,
        body: `Заказ просрочен на ${Math.abs(remaining)} дн. (${remaining} дн.)! Клиент: ${o.clientName} (${o.phone || o.clientPhone}). Срочно требуется доставка!`,
        role: 'all'
      });
    }
  });

  localStorage.setItem(lastAlertKey, todayStr);
};

