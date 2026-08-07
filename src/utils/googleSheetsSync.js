/**
 * Google Sheets & Excel Sync Utilities for Cosmo CRM
 */

// Export Orders to CSV (Compatible with Google Sheets & Microsoft Excel)
export const exportOrdersToCSV = (orders) => {
  const headers = ["ID Заказа", "Имя Клиента", "Телефон", "Адрес", "Позиции", "Сумма (сум)", "Оплачено (сум)", "Статус Заказа", "Статус Оплаты", "Дата Создания", "Курьер"];
  
  const rows = orders.map(o => [
    `#${o.id}`,
    `"${(o.clientName || '').replace(/"/g, '""')}"`,
    `"${o.phone || ''}"`,
    `"${(o.address || '').replace(/"/g, '""')}"`,
    `"${(o.items || []).map(i => `${i.name} (x${i.qty})`).join('; ')}"`,
    o.totalAmount || 0,
    o.paidAmount || 0,
    o.status === 'new' ? 'Ожидает забора' : o.status === 'pickup' ? 'Забор курьером' : o.status === 'cleaning' ? 'В цеху' : o.status === 'ready' ? 'Готов' : o.status === 'delivery' ? 'На доставке' : 'Выполнен',
    o.paymentStatus === 'paid' ? 'Оплачено' : 'Долг',
    `"${o.createdDate || ''}"`,
    `"${o.assignedCourier || '-'}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `cosmo_crm_google_sheets_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Send Order to Google Sheets Webhook AppScript
export const sendOrderToGoogleSheetsWebhook = async (order, webhookUrl) => {
  if (!webhookUrl) return false;
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return response.ok;
  } catch (error) {
    console.error("Google Sheets Sync Error:", error);
    return false;
  }
};
