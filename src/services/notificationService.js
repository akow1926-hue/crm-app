// notificationService.js - Real-time Push Notifications for Roles in Mobile App

export const requestNotificationPermission = async () => {
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
export const sendRolePushNotification = ({ title, body, role = 'all', icon = '/favicon.ico' }) => {
  // Check if browser/phone notifications are enabled
  if ('Notification' in window && Notification.permission === 'granted') {
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
