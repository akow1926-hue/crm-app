import { INSTAGRAM_QR_BASE64 } from '../services/smsService';

export const generateReceiptHtml = (order) => {
  if (!order) return '';
  const totalSum = order.totalAmount || order.agreedAmount || 0;
  const paidSum = order.paidAmount !== undefined ? order.paidAmount : (order.paymentStatus === 'paid' ? totalSum : 0);
  const remainingSum = Math.max(0, totalSum - paidSum);
  const items = (order.items && order.items.length > 0)
    ? order.items
    : [{ name: 'Ковры / Изделия', qty: 1, unit: 'заказ', price: totalSum, total: totalSum }];

  return `
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>Чек-Накладная Заказа №${order.id || order.tempId || 'Б/Н'}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Helvetica Neue", sans-serif; 
            padding: 0;
            margin: 0;
            width: 100%;
            color: #0f172a !important;
            line-height: 1.45;
            background: #ffffff !important;
            font-size: 14px;
          }

          .receipt-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
          }

          /* Header */
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #0f172a;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .brand-subtitle {
            font-size: 13px;
            color: #475569;
            font-weight: 600;
            margin-top: 2px;
          }
          .brand-contacts {
            font-size: 12.5px;
            color: #334155;
            margin-top: 4px;
            font-weight: 500;
          }

          .order-badge-block {
            text-align: right;
          }
          .order-badge {
            display: inline-block;
            background: #0f172a;
            color: #ffffff !important;
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.5px;
          }
          .order-dates {
            font-size: 12.5px;
            color: #334155;
            margin-top: 6px;
            font-weight: 600;
          }

          /* 2 Column Info Cards */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 18px;
          }
          .info-card {
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px 14px;
            background: #f8fafc !important;
          }
          .card-title {
            font-size: 12.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .info-row {
            display: flex;
            margin-bottom: 5px;
            font-size: 13.5px;
          }
          .info-row:last-child {
            margin-bottom: 0;
          }
          .info-label {
            width: 140px;
            color: #64748b;
            font-weight: 600;
            flex-shrink: 0;
          }
          .info-val {
            font-weight: 700;
            color: #0f172a;
            flex: 1;
          }

          /* Table of Items */
          .table-title {
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            color: #0f172a;
            margin-bottom: 8px;
          }
          table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          table.items-table th {
            background: #0f172a !important;
            color: #ffffff !important;
            font-size: 13px;
            font-weight: 800;
            padding: 8px 10px;
            text-align: left;
            border: 1px solid #0f172a;
          }
          table.items-table td {
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            font-size: 13.5px;
            vertical-align: middle;
          }
          table.items-table tbody tr:nth-child(even) {
            background: #f8fafc !important;
          }

          /* Totals Section */
          .totals-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
          }
          .totals-box {
            width: 320px;
            border: 1.5px solid #0f172a;
            border-radius: 8px;
            overflow: hidden;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            padding: 7px 12px;
            font-size: 14px;
            border-bottom: 1px dashed #cbd5e1;
          }
          .total-line:last-child {
            border-bottom: none;
          }
          .total-line.grand-total {
            background: #0f172a !important;
            color: #ffffff !important;
            font-size: 17px;
            font-weight: 900;
            padding: 10px 12px;
          }

          /* Bottom Guarantee & Instagram Section */
          .footer-section {
            border-top: 2px solid #0f172a;
            padding-top: 14px;
            display: grid;
            grid-template-columns: 1fr 180px;
            gap: 16px;
            align-items: center;
          }
          .guarantee-text {
            font-size: 12.5px;
            color: #475569;
            line-height: 1.5;
          }
          .signatures-row {
            display: flex;
            gap: 40px;
            margin-top: 24px;
            font-size: 13px;
            font-weight: 700;
          }
          .sig-line {
            border-bottom: 1px solid #000;
            display: inline-block;
            width: 140px;
            margin-left: 6px;
          }

          .qr-box {
            text-align: center;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px;
            background: #f8fafc !important;
          }
          .qr-title {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .qr-img {
            width: 105px;
            height: 105px;
            display: block;
            margin: 0 auto;
          }
          .qr-inst {
            font-size: 12px;
            font-weight: 900;
            color: #e1306c;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- 1. Header -->
          <div class="header-row">
            <div>
              <div class="brand-title">Cosmo Cleaning Service</div>
              <div class="brand-subtitle">Профессиональная чистка и стирка ковров в Самарканде</div>
              <div class="brand-contacts">Тел: +998 95 032 33 30 &bull; Instagram: @cosmocleaning.uz</div>
            </div>
            <div class="order-badge-block">
              <div class="order-badge">ЧЕК-ЗАКАЗ №${order.id || order.tempId || 'Б/Н'}</div>
              <div class="order-dates">
                <div><strong>Оформлен:</strong> ${order.createdDate || new Date().toLocaleString('ru-RU')}</div>
                <div><strong>Выдан:</strong> ${new Date().toLocaleString('ru-RU')}</div>
              </div>
            </div>
          </div>

          <!-- 2. Client & Courier Info -->
          <div class="info-grid">
            <div class="info-card">
              <div class="card-title">Данные клиента</div>
              <div class="info-row">
                <span class="info-label">ФИО Клиента:</span>
                <span class="info-val">${order.clientName || 'Клиент'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Телефон:</span>
                <span class="info-val">${order.phone || order.clientPhone || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Адрес доставки:</span>
                <span class="info-val">${order.district ? `[${order.district}] ` : ''}${order.address || '-'}${order.landmark ? ` (${order.landmark})` : ''}</span>
              </div>
            </div>

            <div class="info-card">
              <div class="card-title">Исполнитель и доставка</div>
              <div class="info-row">
                <span class="info-label">Водитель (курьер):</span>
                <span class="info-val">${order.assignedCourier || order.courier || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Диспетчер:</span>
                <span class="info-val">${order.dispatcherName || order.createdBy || 'Мадина'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Способ оплаты:</span>
                <span class="info-val">${order.paymentType || 'Наличные'}</span>
              </div>
            </div>
          </div>

          <!-- 3. Table of Items -->
          <div class="table-title">Состав заказа и замеры изделий</div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">№</th>
                <th>Наименование услуги / изделия</th>
                <th style="width: 180px;">Размеры (Ш x Д)</th>
                <th style="width: 140px; text-align: center;">Площадь / Кол-во</th>
                <th style="width: 130px; text-align: right;">Тариф</th>
                <th style="width: 140px; text-align: right;">Сумма</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((it, idx) => `
                <tr>
                  <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
                  <td>
                    <div style="font-weight: 800; color: #0f172a;">${it.name || it.serviceName || 'Ковры / Изделия'}</div>
                  </td>
                  <td>
                    ${it.width && it.length ? `<strong>${it.width} м</strong> x <strong>${it.length} м</strong>` : '—'}
                  </td>
                  <td style="text-align: center; font-weight: 700;">
                    ${it.width && it.length ? `${it.area || (it.width * it.length)} м²` : `${it.qty || 1} ${it.unit || 'шт'}`}
                  </td>
                  <td style="text-align: right; color: #475569; font-weight: 600;">
                    ${(it.price || 0).toLocaleString()} сум${it.unit === 'м²' ? '/м²' : ''}
                  </td>
                  <td style="text-align: right; font-weight: 800; color: #0f172a; white-space: nowrap;">
                    ${it.unit === 'м²' && (!it.area || it.area === 0) ? 'Замер в цеху' : (((it.total !== undefined ? it.total : it.price) || 0).toLocaleString() + ' сум')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- 4. Grand Total Summary -->
          <div class="totals-wrapper">
            <div class="totals-box">
              <div class="total-line">
                <span style="color: #64748b; font-weight: 600;">Сумма по тарифу:</span>
                <span style="font-weight: 700;">${totalSum.toLocaleString()} сум</span>
              </div>
              <div class="total-line">
                <span style="color: #64748b; font-weight: 600;">Оплаченная сумма:</span>
                <span style="font-weight: 800; color: #10b981;">${paidSum.toLocaleString()} сум</span>
              </div>
              ${remainingSum > 0 ? `
                <div class="total-line">
                  <span style="color: #ef4444; font-weight: 700;">Остаток к оплате:</span>
                  <span style="font-weight: 900; color: #ef4444;">${remainingSum.toLocaleString()} сум</span>
                </div>
              ` : ''}
              <div class="total-line grand-total">
                <span>ИТОГО К ОПЛАТЕ:</span>
                <span>${totalSum.toLocaleString()} сум</span>
              </div>
            </div>
          </div>

          <!-- 5. Footer & Instagram QR -->
          <div class="footer-section">
            <div>
              <div class="guarantee-text">
                Благодарим за выбор <strong>Cosmo Cleaning Service</strong>! Мы гарантируем чистоту, дезинфекцию и бережный уход за каждым изделием.
                Претензии по качеству принимаются в течение 24 часов с момента получения.
              </div>

              <div class="signatures-row">
                <div>Сдал (Курьер): <span class="sig-line"></span></div>
                <div>Принял (Клиент): <span class="sig-line"></span></div>
              </div>
            </div>

            <div class="qr-box">
              <div class="qr-title">Instagram страница:</div>
              <img src="${INSTAGRAM_QR_BASE64}" alt="Instagram QR Code" class="qr-img" />
              <div class="qr-inst">@cosmocleaning.uz</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const printOrderReceipt = (order) => {
  if (!order) return;
  const html = generateReceiptHtml(order);

  // Method 1: Hidden iframe print (foolproof, prevents blank page / popups blocked)
  try {
    let iframe = document.getElementById('cosmo-print-receipt-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'cosmo-print-receipt-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 300);
  } catch (err) {
    // Method 2: Pop-up window fallback
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    }
  }
};
