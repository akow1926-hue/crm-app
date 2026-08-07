// googleSheetsService.js - Real-time Google Sheets Online Sync Service

const SETTINGS_KEY = 'cosmo_crm_gsheet_settings';

export const defaultGSheetConfig = {
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1zYbTgS1aQc-1aeP0EeAo-KeohbTAyGYumJLQQxmBZRk/edit',
  webhookUrl: '',
  autoSync: true,
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
 * Online sync single order to Google Sheets
 */
export const syncOrderToGoogleSheets = async (order, action = 'SAVE') => {
  const config = getGoogleSheetConfig();
  
  // If webhookUrl is set, post online to Google Apps Script
  if (config.webhookUrl) {
    try {
      const payload = {
        action: action, // 'SAVE' or 'DELETE'
        id: order.id,
        date: order.createdDate || order.date || new Date().toLocaleString('ru-RU'),
        clientName: order.clientName || order.client || 'Клиент',
        phone: order.phone || '',
        address: order.address || '',
        dimensions: order.dimensions || order.sizes || '',
        area: order.area || 0,
        totalPrice: order.totalPrice || order.sum || 0,
        status: order.status || 'Новый',
        courier: order.courier || 'Не назначен',
        dispatcher: order.dispatcher || 'Администратор',
        district: order.district || 'Самарканд',
        paidAmount: order.paidAmount || 0,
        paymentType: order.paymentType || '-',
        paymentStatus: order.paymentStatus || 'unpaid',
        itemsCount: order.itemsCount || 1,
        comment: order.notes || order.comment || ''
      };

      // no-cors mode to bypass Google Apps Script browser CORS limits
      await fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      const updated = { ...config, lastSyncTime: new Date().toLocaleString('ru-RU') };
      saveGoogleSheetConfig(updated);
      return { success: true, mode: 'webhook' };
    } catch (err) {
      console.error('[GSheets Sync Error]', err);
      return { success: false, error: err.message };
    }
  }

  // Fallback / standard sync response when webhook is not yet pasted
  return { 
    success: false, 
    reason: 'no_webhook',
    message: 'Не указан Webhook URL для Google Таблиц. Настройте его в разделе Управление.' 
  };
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
 * Returns Google Apps Script ready-to-use template code for Google Sheets
 */
export const getGoogleAppsScriptTemplate = () => {
  return `// ============================================================
// Google Apps Script — Онлайн-Синхронизация CRM
// ============================================================
// Инструкция по установке:
// 1. Откройте вашу Google Таблицу
// 2. В меню нажмите: Расширения -> Apps Script
// 3. Удалите стандартный код и вставьте весь этот код
// 4. Нажмите "Развернуть" -> "Новое развертывание"
// 5. Выберите тип: "Веб-приложение"
// 6. Запуск от имени: "Меня (ваш email)"
// 7. У кого есть доступ: "Все" (Anyone)
// 8. Нажмите "Развернуть" и скопируйте полученную ссылку (Webhook URL)
// 9. Вставьте ссылку в CRM в настройках Google Таблиц
// ============================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Проверка/создание заголовков таблицы
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID Заказа",
        "Дата",
        "Клиент",
        "Телефон",
        "Адрес",
        "Размеры",
        "Площадь (м²)",
        "Сумма (сум)",
        "Статус",
        "Курьер",
        "Диспетчер",
        "Район",
        "Оплачено (сум)",
        "Тип оплаты",
        "Статус оплаты",
        "Кол-во предметов",
        "Комментарий / Заметки"
      ]);
      sheet.getRange(1, 1, 1, 17).setFontWeight("bold").setBackground("#e8f0fe");
    }

    var data = JSON.parse(e.postData.contents);
    
    // Поиск существующего заказа по ID
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
      data.id || "",
      data.date || new Date().toLocaleString("ru-RU"),
      data.clientName || "",
      data.phone || "",
      data.address || "",
      data.dimensions || "",
      data.area || 0,
      data.totalPrice || 0,
      data.status || "",
      data.courier || "",
      data.dispatcher || "",
      data.district || "",
      data.paidAmount || 0,
      data.paymentType || "",
      data.paymentStatus || "",
      data.itemsCount || 1,
      data.comment || ""
    ];

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", id: data.id }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
};
