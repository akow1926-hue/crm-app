import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Send,
  Smartphone
} from 'lucide-react';
import { serviceCatalog } from '../data/initialData';
import { getActiveCouriers, getActiveWashers } from '../services/staffHelper';
import { smsTemplates, sendSMSNotification } from '../services/smsService';

export default function OrderModal({ order, onClose, onSave, registeredUsers }) {
  const activeCouriers = getActiveCouriers(registeredUsers);
  const activeWashers = getActiveWashers(registeredUsers);

  const buildInitialFormData = (targetOrder) => ({
    id: targetOrder?.id || `${Math.floor(5200 + Math.random() * 500)}`,
    clientName: targetOrder?.clientName || '',
    phone: targetOrder?.phone || '+998 ',
    address: targetOrder?.address || '',
    district: targetOrder?.district || 'Сиёб',
    language: targetOrder?.language || 'Русский',
    timeSlot: targetOrder?.timeSlot || 'В любое время',
    urgent: targetOrder?.urgent || false,
    deliveryDate: targetOrder?.deliveryDate || '',
    deliveryTime: targetOrder?.deliveryTime || '',
    landmark: targetOrder?.landmark || '',
    status: targetOrder?.status || 'new',
    paymentStatus: targetOrder?.paymentStatus || 'unpaid',
    items: targetOrder?.items || [],
    totalAmount: targetOrder?.totalAmount || 0,
    paidAmount: targetOrder?.paidAmount || 0,
    assignedCourier: targetOrder?.assignedCourier || (activeCouriers[0]?.name || activeCouriers[0]?.username || 'Не назначен'),
    assignedWasher: targetOrder?.assignedWasher || (activeWashers[0]?.name || activeWashers[0]?.username || 'Не назначен'),
    notes: targetOrder?.notes || ''
  });

  const [formData, setFormData] = useState(() => buildInitialFormData(order));

  useEffect(() => {
    setFormData(buildInitialFormData(order));
  }, [order]);

  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [smsSending, setSmsSending] = useState(false);

  useEffect(() => {
    // Default SMS text template based on status
    if (formData.clientName && Array.isArray(smsTemplates) && smsTemplates[0]?.getText) {
      try {
        setSmsText(smsTemplates[0].getText(formData));
      } catch (e) {}
    }
  }, [formData.id, formData.clientName]);

  const addItemRow = () => {
    const defaultSvc = serviceCatalog[0];
    setFormData({
      ...formData,
      items: [...formData.items, { name: defaultSvc.name, qty: 1, price: defaultSvc.price, total: defaultSvc.price }]
    });
  };

  const updateItemRow = (idx, field, value) => {
    const nextItems = [...formData.items];
    nextItems[idx][field] = value;
    if (field === 'qty' || field === 'price') {
      const q = parseFloat(field === 'qty' ? value : nextItems[idx].qty) || 0;
      const p = parseFloat(field === 'price' ? value : nextItems[idx].price) || 0;
      nextItems[idx].total = q * p;
    }
    setFormData({ ...formData, items: nextItems });
  };

  const removeItemRow = (idx) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    syncOrderToGoogleSheets(formData, 'SAVE').catch(() => {});
    onSave(formData);
  };

  const handleSendSMS = async (e) => {
    e.preventDefault();
    if (!smsText.trim()) {
      alert('Введите текст СМС сообщения.');
      return;
    }

    setSmsSending(true);
    const result = await sendSMSNotification({
      phone: formData.phone,
      text: smsText
    });
    setSmsSending(false);
    setIsSMSModalOpen(false);

    alert(result.message);
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Чек Заказа #${formData.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; font-size: 12px; }
            h2 { text-align: center; margin-bottom: 5px; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 4px 0; }
          </style>
        </head>
        <body>
          <h2>COSMO CLEANING SERVICE</h2>
          <div style="text-align:center;">Чек Заказа #${formData.id}</div>
          <div class="line"></div>
          <div>Клиент: ${formData.clientName}</div>
          <div>Тел: ${formData.phone}</div>
          <div>Адрес: ${formData.address}</div>
          <div class="line"></div>
          <table>
            ${formData.items.map(it => `
              <tr>
                <td>${it.name} x${it.qty}</td>
                <td style="text-align:right;">${it.total.toLocaleString()} сум</td>
              </tr>
            `).join('')}
          </table>
          <div class="line"></div>
          <div style="font-weight:bold; font-size:14px; text-align:right;">ИТОГО: ${formData.totalAmount.toLocaleString()} сум</div>
          <div style="font-weight:bold; text-align:right;">Оплачено: ${formData.paidAmount.toLocaleString()} сум</div>
          <div class="line"></div>
          <div style="text-align:center; margin-top:20px;">Спасибо за заказ!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-modal)',
        border: '1px solid var(--border-glow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
              Заказ #{formData.id}
            </span>
            <span className={`badge badge-${formData.status}`}>
              {formData.status.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIsSMSModalOpen(true)} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
              <Smartphone size={14} /> СМС Клиенту
            </button>
            <button onClick={printReceipt} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
              <Printer size={14} /> Чек
            </button>
            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Dispatcher Header Info */}
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#38bdf8' }}>
            📋 <strong>Форма Диспетчера:</strong> Заполните контактные данные клиента, примерный адрес, договоренную сумму и назначьте курьера. Статус заказа автоматически устанавливается в <strong>«Ожидает забора»</strong>.
          </div>

          {/* Client Details Grid */}
          <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">ФИО Клиента *</label>
              <input 
                type="text" 
                required
                value={formData.clientName} 
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="input-field" 
                placeholder="Имя и фамилия"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Телефон Клиента *</label>
              <input 
                type="text" 
                required
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field" 
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>

          <div className="responsive-grid-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">Примерный адрес забора / доставки *</label>
              <input 
                type="text" 
                required
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field" 
                placeholder="Улица, дом, квартира, махалля"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Ориентиры адреса</label>
              <input 
                type="text" 
                value={formData.landmark} 
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="input-field" 
                placeholder="Рядом с Корзинкой / Ворота"
              />
            </div>
          </div>

          {/* Amount, Courier, Language Grid */}
          <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label" style={{ color: 'var(--accent-secondary)', fontWeight: '800' }}>
                💰 Договоренная сумма (сум) *
              </label>
              <input 
                type="number" 
                required
                value={formData.totalAmount} 
                onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                className="input-field" 
                placeholder="Например: 150000"
                style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}
              />
            </div>

            <div className="input-group">
              <label className="input-label">🚚 Назначить курьера *</label>
              <select 
                value={formData.assignedCourier} 
                onChange={(e) => setFormData({ ...formData, assignedCourier: e.target.value })}
                className="select-field"
              >
                {activeCouriers.length > 0 ? (
                  activeCouriers.map(c => (
                    <option key={c.id || c.username} value={c.name || c.username}>
                      {c.name} (@{c.username})
                    </option>
                  ))
                ) : (
                  <option value="Не назначен">Не назначен</option>
                )}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">🌐 Язык общения клиента *</label>
              <select 
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="select-field"
              >
                <option value="Русский">Русский язык</option>
                <option value="Узбекский">O'zbek tili</option>
                <option value="Таджикский">Тоҷикӣ</option>
              </select>
            </div>
          </div>

          {/* Status & District Grid */}
          <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">Статус заказа</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="select-field"
              >
                <option value="new">⏳ Ожидает забора</option>
                <option value="pickup">🚚 Забор курьером</option>
                <option value="cleaning">🧼 В цеху (Стирка)</option>
                <option value="ready">✨ Готов к отправке</option>
                <option value="delivery">📦 На доставке</option>
                <option value="done">✅ Выполнен</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Район города (Самарканд)</label>
              <select 
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="select-field"
              >
                <option value="Сиёб">Сиёб</option>
                <option value="Багишамальский">Багишамальский</option>
                <option value="Согдиана">Согдиана</option>
                <option value="Микрорайон">Микрорайон</option>
                <option value="Саттепо">Саттепо</option>
                <option value="Железнодорожный">Железнодорожный</option>
                <option value="Самаркандский р-н">Самаркандский р-н</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Статус оплаты</label>
              <select 
                value={formData.paymentStatus} 
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value, paidAmount: e.target.value === 'paid' ? formData.totalAmount : 0 })}
                className="select-field"
              >
                <option value="unpaid">🔴 Не оплачено (Долг)</option>
                <option value="paid">🟢 Оплачено полностью</option>
                <option value="partial">🟡 Частичная оплата</option>
              </select>
            </div>
          </div>

          {/* Urgent & Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: formData.urgent ? 'rgba(244, 63, 94, 0.08)' : 'transparent', padding: formData.urgent ? '12px' : '0', borderRadius: 'var(--radius-sm)', border: formData.urgent ? '1px solid rgba(244, 63, 94, 0.3)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="checkbox"
                id="urgentCheck"
                checked={formData.urgent}
                onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#f43f5e' }}
              />
              <label htmlFor="urgentCheck" style={{ fontSize: '13px', fontWeight: '700', color: formData.urgent ? '#f43f5e' : 'var(--text-muted)' }}>
                🔥 Отметить заказ как СРОЧНЫЙ (Спец-доставка к точному времени)
              </label>
            </div>

            {formData.urgent && (
              <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#f43f5e' }}>Обязательная дата доставки *</label>
                  <input 
                    type="date"
                    required={formData.urgent}
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#f43f5e' }}>Обязательное время доставки *</label>
                  <input 
                    type="time"
                    required={formData.urgent}
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Примечания / Заметки</label>
            <textarea 
              rows={2}
              value={formData.notes} 
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="textarea-field" 
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Сохранить Заказ
            </button>
          </div>
        </form>
      </div>

      {/* SMS MODAL */}
      {isSMSModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px', background: 'var(--bg-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Отправка СМС Клиенту</h3>
              </div>
              <button onClick={() => setIsSMSModalOpen(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '14px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>Получатель: {formData.clientName}</div>
              <div style={{ fontSize: '12px', color: 'var(--accent-secondary)', fontWeight: '600' }}>{formData.phone}</div>
            </div>

            {/* Quick Templates Selection */}
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label" style={{ marginBottom: '6px' }}>Быстрые шаблоны СМС:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {smsTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSmsText(tpl.getText(formData))}
                    className="btn btn-secondary"
                    style={{ fontSize: '11.5px', padding: '6px 10px', justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendSMS} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Текст СМС Сообщения *</label>
                <textarea 
                  rows={4}
                  required
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="textarea-field"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsSMSModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Отмена
                </button>
                <button type="submit" disabled={smsSending} className="btn btn-primary" style={{ flex: 1 }}>
                  <Send size={15} /> {smsSending ? 'Отправка...' : 'Отправить СМС'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
