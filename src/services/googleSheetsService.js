// googleSheetsService.js - Real-time Multi-Sheet Google Sheets Online Sync Service
// Syncs Orders, Activity Logs, Finance & Cash Receipts, and Courier GPS History into dedicated sheets

const SETTINGS_KEY = 'cosmo_crm_gsheet_settings';

export const defaultGSheetConfig = {
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1zYbTgS1aQc-1aeP0EeAo-KeohbTAyGYumJLQQxmBZRk/edit',
  webhookUrl: '',
  autoSyncOrders: true,
  autoSyncLogs: true,
  autoSyncFinance: true,
  autoSyncGps: true,
  lastSyncTime: null,
};

export const getGoogleSheetConfig = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...defaultGSheetConfig, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading Google Sheets config:', e);
  }
  return defaultGSheetConfig;
};

export const saveGoogleSheetConfig = (newConfig) => {
  try {
    const current = getGoogleSheetConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving Google Sheets config:', e);
    return null;
  }
};

/**
 * Generic dispatcher to Google Apps Script Webhook
 */
async function postToGSheetWebhook(payload) {
  const config = getGoogleSheetConfig();
  if (!config.webhookUrl) return { success: false, reason: 'no_webhook' };

  try {
    await fetch(config.webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const updated = { ...config, lastSyncTime: new Date().toLocaleString('ru-RU') };
    saveGoogleSheetConfig(updated);
    return { success: true, mode: 'webhook' };
  } catch (err) {
    console.error('[GSheets Multi-Sheet Sync Error]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Sheet 1: Orders Sync
 */
export const syncOrderToGoogleSheets = async (order, action = 'SAVE') => {
  const payload = {
    targetSheet: 'Заказы',
    action: action,
    id: order.id,
    date: order.createdDate || order.date || new Date().toLocaleString('ru-RU'),
    clientName: order.clientName || order.client || 'Клиент',
    phone: order.phone || '',
    address: order.address || '',
    dimensions: order.dimensions || order.sizes || '',
    area: order.area || 0,
    totalPrice: order.totalAmount || order.totalPrice || order.sum || 0,
    status: order.status || 'Новый',
    courier: order.assignedCourier || order.courier || 'Не назначен',
    dispatcher: order.dispatcher || 'Администратор',
    district: order.district || 'Самарканд',
    paidAmount: order.paidAmount || 0,
    paymentType: order.paymentType || '-',
    paymentStatus: order.paymentStatus || 'unpaid',
    itemsCount: order.items ? order.items.length : (order.itemsCount || 1),
    comment: order.notes || order.comment || ''
  };
  return postToGSheetWebhook(payload);
};

/**
 * 2. Sheet 2: Activity & Audit Logs Sync
 */
export const syncLogToGoogleSheets = async (logEntry) => {
  const config = getGoogleSheetConfig();
  if (!config.autoSyncLogs) return { success: false };

  const payload = {
    targetSheet: 'Журнал Действий',
    time: logEntry.time || new Date().toLocaleString('ru-RU'),
    user: logEntry.user || 'Система',
    role: logEntry.role || 'Пользователь',
    action: logEntry.text || logEntry.action || 'Событие CRM',
    orderId: logEntry.orderId || logEntry.id || '-',
    client: logEntry.client || '-',
    details: logEntry.details || logEntry.type || 'Операция'
  };
  return postToGSheetWebhook(payload);
};

/**
 * 3. Sheet 3: Finance, Cash & Salary Sync
 */
export const syncFinanceToGoogleSheets = async (financeEntry) => {
  const config = getGoogleSheetConfig();
  if (!config.autoSyncFinance) return { success: false };

  const payload = {
    targetSheet: 'Касса и Финансы',
    date: financeEntry.date || new Date().toLocaleString('ru-RU'),
    type: financeEntry.type === 'in' ? 'Приход (Оплата заказа)' : 'Расход (ЗП / Выплата)',
    title: financeEntry.title || `Оплата заказа #${financeEntry.orderId || ''}`,
    amount: financeEntry.amount || financeEntry.paidAmount || 0,
    method: financeEntry.method || financeEntry.paymentType || 'Наличные',
    orderId: financeEntry.orderId || '-',
    client: financeEntry.client || '-',
    courier: financeEntry.courier || financeEntry.assignedCourier || 'Касса'
  };
  return postToGSheetWebhook(payload);
};

/**
 * 4. Sheet 4: Courier GPS Movement Log Sync
 */
export const syncGpsToGoogleSheets = async (courierName, positionData) => {
  const config = getGoogleSheetConfig();
  if (!config.autoSyncGps) return { success: false };

  const payload = {
    targetSheet: 'GPS Логистика',
    time: new Date().toLocaleString('ru-RU'),
    courier: courierName,
    status: positionData.status || 'В сети',
    speed: positionData.speed || 0,
    battery: positionData.battery || 100,
    coordinates: `${positionData.lat?.toFixed(6) || 0}, ${positionData.lng?.toFixed(6) || 0}`,
    accuracy: positionData.accuracy || 10
  };
  return postToGSheetWebhook(payload);
};

/**
 * Sync all orders in bulk to Google Sheets
 */
export const syncAllOrdersToGoogleSheets = async (orders) => {
  const config = getGoogleSheetConfig();
  if (!config.webhookUrl) {
    return { success: false, reason: 'no_webhook' };
  }

  let count = 0;
  for (const order of orders) {
    await syncOrderToGoogleSheets(order, 'SAVE');
    count++;
  }

  saveGoogleSheetConfig({ lastSyncTime: new Date().toLocaleString('ru-RU') });
  return { success: true, count };
};

/**
 * Google Apps Script Multi-Sheet Master Template Code
 */
export const getGoogleAppsScriptTemplate = () => {
  return `// ============================================================
// Google Apps Script — Многостраничная Синхронизация Cosmo CRM
// Листы: 1. Заказы | 2. Журнал Действий | 3. Касса и Финансы | 4. GPS Логистика
// ============================================================
// Инструкция по установке (1 минута):
// 1. Откройте вашу Google Таблицу
// 2. В меню: Расширения -> Apps Script
// 3. Удалите стандартный код и вставьте весь этот код
// 4. Нажмите "Развернуть" -> "Новое развертывание" -> "Веб-приложение"
// 5. Запуск от имени: "Меня", Доступ: "Все" (Anyone)
// 6. Скопируйте ссылку Webhook URL и вставьте в CRM
// ============================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var target = data.targetSheet || 'Заказы';

    // 1. Лист "Заказы"
    if (target === 'Заказы') {
      var sheet = getOrCreateSheet(ss, 'Заказы', [
        "ID Заказа", "Дата", "Клиент", "Телефон", "Адрес", "Размеры", "Площадь (м²)", 
        "Сумма (сум)", "Статус", "Курьер", "Диспетчер", "Район", "Оплачено (сум)", 
        "Тип оплаты", "Статус оплаты", "Кол-во предметов", "Комментарий / Заметки"
      ], "#e8f0fe");

      var lastRow = sheet.getLastRow();
      var targetRow = -1;
      if (lastRow > 1) {
        var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) {
          if (String(ids[i][0]).trim() === String(data.id).trim()) {
            targetRow = i + 2;
            break;
          }
        }
      }

      var rowValues = [
        data.id || "", data.date || new Date().toLocaleString("ru-RU"),
        data.clientName || "", data.phone || "", data.address || "",
        data.dimensions || "", data.area || 0, data.totalPrice || 0,
        data.status || "", data.courier || "", data.dispatcher || "",
        data.district || "", data.paidAmount || 0, data.paymentType || "",
        data.paymentStatus || "", data.itemsCount || 1, data.comment || ""
      ];

      if (targetRow > 0) {
        sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
      return jsonResponse({ status: "success", target: target, id: data.id });
    }

    // 2. Лист "Журнал Действий"
    if (target === 'Журнал Действий') {
      var logSheet = getOrCreateSheet(ss, 'Журнал Действий', [
        "Время", "Пользователь", "Роль", "Событие / Действие", "ID Заказа", "Клиент", "Детали"
      ], "#fef3c7");
      logSheet.appendRow([
        data.time || new Date().toLocaleString("ru-RU"),
        data.user || "Система", data.role || "Пользователь",
        data.action || "", data.orderId || "-", data.client || "-", data.details || ""
      ]);
      return jsonResponse({ status: "success", target: target });
    }

    // 3. Лист "Касса и Финансы"
    if (target === 'Касса и Финансы') {
      var finSheet = getOrCreateSheet(ss, 'Касса и Финансы', [
        "Дата / Время", "Тип транзакции", "Описание / Назначение", "Сумма (сум)", "Способ оплаты", "ID Заказа", "Клиент", "Ответственный"
      ], "#d1fae5");
      finSheet.appendRow([
        data.date || new Date().toLocaleString("ru-RU"),
        data.type || "Приход", data.title || "",
        data.amount || 0, data.method || "Наличные",
        data.orderId || "-", data.client || "-", data.courier || "-"
      ]);
      return jsonResponse({ status: "success", target: target });
    }

    // 4. Лист "GPS Логистика"
    if (target === 'GPS Логистика') {
      var gpsSheet = getOrCreateSheet(ss, 'GPS Логистика', [
        "Время фиксации", "Имя Курьера", "Статус", "Скорость (км/ч)", "Батарея (%)", "Координаты (GPS)", "Точность (м)"
      ], "#e0e7ff");
      gpsSheet.appendRow([
        data.time || new Date().toLocaleString("ru-RU"),
        data.courier || "Курьер", data.status || "В сети",
        data.speed || 0, data.battery || 100,
        data.coordinates || "", data.accuracy || 10
      ]);
      return jsonResponse({ status: "success", target: target });
    }

    return jsonResponse({ status: "ok" });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function getOrCreateSheet(ss, name, headers, headerColor) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground(headerColor);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;
};
