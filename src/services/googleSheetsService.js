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
 * 5. Sheet 5: Staff & Employee Sync
 */
export const syncUserToGoogleSheets = async (user) => {
  const payload = {
    targetSheet: 'Сотрудники',
    id: user.id || `USR-${Date.now()}`,
    username: user.username || '',
    name: user.name || '',
    pass: user.pass || '',
    role: user.role || 'courier',
    phone: user.phone || '',
    status: user.status || 'active',
    createdDate: user.createdDate || new Date().toLocaleString('ru-RU')
  };
  return postToGSheetWebhook(payload);
};

/**
 * 6. Sheet 6: Clients Sync
 */
export const syncClientToGoogleSheets = async (client) => {
  const payload = {
    targetSheet: 'Клиенты',
    id: client.id || `CLI-${Date.now()}`,
    name: client.name || '',
    phone: client.phone || '',
    address: client.address || '',
    totalOrders: client.totalOrders || 0,
    totalSpent: client.totalSpent || 0,
    discount: client.discount || 0,
    district: client.district || 'Самарканд',
    lastOrder: client.lastOrder || new Date().toLocaleDateString('ru-RU'),
    notes: client.notes || ''
  };
  return postToGSheetWebhook(payload);
};

/**
 * Delete order from Google Sheets
 */
export const deleteOrderFromGoogleSheets = async (orderId) => {
  const payload = {
    targetSheet: 'Заказы',
    action: 'DELETE',
    id: orderId
  };
  return postToGSheetWebhook(payload);
};

/**
 * Fetch full database directly from Google Sheets online (Orders, Users, Clients, Finances, Logs)
 */
export const fetchFromGoogleSheets = async () => {
  const config = getGoogleSheetConfig();
  if (!config.webhookUrl) return null;

  try {
    const res = await fetch(`${config.webhookUrl}?action=getAll`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[GSheets Direct Fetch Error]:', err);
  }
  return null;
};

/**
 * Google Apps Script Multi-Sheet Master Template Code (Full Read/Write Backend)
 */
export const getGoogleAppsScriptTemplate = () => {
  return `// ============================================================
// Google Apps Script — Онлайн База Данных Cosmo CRM (Sheets Backend)
// Листы: 1. Заказы | 2. Журнал Действий | 3. Касса и Финансы | 4. GPS Логистика | 5. Сотрудники
// ============================================================
// Инструкция по установке (1 минута):
// 1. Откройте вашу Google Таблицу
// 2. В меню: Расширения -> Apps Script
// 3. Удалите стандартный код и вставьте весь этот код
// 4. Нажмите "Развернуть" -> "Новое развертывание" -> "Веб-приложение"
// 5. Запуск от имени: "Меня", Доступ: "Все" (Anyone)
// 6. Скопируйте ссылку Webhook URL и вставьте в CRM
// ============================================================

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {
      orders: getSheetObjects(ss, 'Заказы'),
      logs: getSheetObjects(ss, 'Журнал Действий'),
      finance: getSheetObjects(ss, 'Касса и Финансы'),
      users: getSheetObjects(ss, 'Сотрудники'),
      gps: getSheetObjects(ss, 'GPS Логистика')
    };
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

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

    // 2. Лист "Сотрудники"
    if (target === 'Сотрудники') {
      var userSheet = getOrCreateSheet(ss, 'Сотрудники', [
        "ID", "Логин", "ФИО", "Пароль", "Роль", "Телефон", "Статус", "Дата создания"
      ], "#fce7f3");

      var uLastRow = userSheet.getLastRow();
      var uTargetRow = -1;
      if (uLastRow > 1) {
        var uLogins = userSheet.getRange(2, 2, uLastRow - 1, 1).getValues();
        for (var u = 0; u < uLogins.length; u++) {
          if (String(uLogins[u][0]).trim().toLowerCase() === String(data.username).trim().toLowerCase()) {
            uTargetRow = u + 2;
            break;
          }
        }
      }

      var uRow = [
        data.id || "", data.username || "", data.name || "",
        data.pass || "", data.role || "courier", data.phone || "",
        data.status || "active", data.createdDate || new Date().toLocaleString("ru-RU")
      ];

      if (uTargetRow > 0) {
        userSheet.getRange(uTargetRow, 1, 1, uRow.length).setValues([uRow]);
      } else {
        userSheet.appendRow(uRow);
      }
      return jsonResponse({ status: "success", target: target, username: data.username });
    }

    // 3. Лист "Журнал Действий"
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

    // 4. Лист "Касса и Финансы"
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

    // 5. Лист "GPS Логистика"
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

function getSheetObjects(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return rows.map(function(row) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    return obj;
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;
};
