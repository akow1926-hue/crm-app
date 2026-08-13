import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Send,
  Smartphone,
  Plus,
  Trash2,
  Package,
  User,
  Phone,
  Home,
  Truck,
  Languages,
  Clock,
  Sparkles
} from 'lucide-react';
import { serviceCatalog } from '../data/initialData';
import { getActiveCouriers, getActiveWashers } from '../services/staffHelper';
import { smsTemplates, sendSMSNotification, INSTAGRAM_QR_BASE64 } from '../services/smsService';
import { sendTelegramOrderCard, getTelegramBotConfig } from '../services/telegramBotService';
import { printOrderReceipt } from '../utils/printReceipt';

export default function OrderModal({ order, onClose, onSave, registeredUsers, allOrders = [] }) {
  const activeCouriers = getActiveCouriers(registeredUsers);
  const activeWashers = getActiveWashers(registeredUsers);

  // Load dynamic service catalog configured by Admin
  const availableServices = (() => {
    try {
      const saved = localStorage.getItem('cosmo_crm_service_catalog');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return serviceCatalog;
  })();

  const buildInitialFormData = (targetOrder) => {
    const defaultSvc = availableServices[0] || { name: 'Мойка ковров', unit: 'м²', price: 15000 };
    const initialItems = targetOrder?.items && targetOrder.items.length > 0 
      ? targetOrder.items.map(it => ({
          serviceId: it.serviceId || 'S-1',
          name: it.serviceName || it.name?.split(' (')[0] || 'Мойка ковров',
          unit: it.unit || 'м²',
          qty: it.qty || 1,
          price: it.price || 15000,
          total: it.total || (it.unit === 'шт' ? (it.qty || 1) * (it.price || 15000) : 0)
        }))
      : [
          {
            serviceId: defaultSvc.id,
            name: defaultSvc.name,
            unit: defaultSvc.unit,
            qty: 1,
            price: defaultSvc.price,
            total: defaultSvc.unit === 'шт' ? defaultSvc.price : 0
          }
        ];

    return {
      id: targetOrder?.id || null,
      tempId: targetOrder?.tempId || (targetOrder?.id ? String(targetOrder.id) : (`TMP-${Date.now()}`)),
      clientName: targetOrder?.clientName || '',
      phone: targetOrder?.phone || targetOrder?.clientPhone || '+998 ',
      clientPhone: targetOrder?.phone || targetOrder?.clientPhone || '+998 ',
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
      deliveryDays: parseInt(targetOrder?.deliveryDays, 10) || 5,
      items: initialItems,
      totalAmount: targetOrder?.totalAmount || 0,
      paidAmount: targetOrder?.paidAmount || 0,
      assignedCourier: targetOrder?.assignedCourier || (activeCouriers[0]?.name || activeCouriers[0]?.username || 'Не назначен'),
      assignedWasher: targetOrder?.assignedWasher || (activeWashers[0]?.name || activeWashers[0]?.username || 'Не назначен'),
      dispatcherName: targetOrder?.dispatcherName || targetOrder?.createdBy || 'Мадина (Диспетчер)',
      createdDate: targetOrder?.createdDate || new Date().toLocaleString('ru-RU'),
      notes: targetOrder?.notes || targetOrder?.comment || ''
    };
  };

  const [formData, setFormData] = useState(() => buildInitialFormData(order));

  useEffect(() => {
    setFormData(buildInitialFormData(order));
  }, [order]);

  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [smsSending, setSmsSending] = useState(false);

  useEffect(() => {
    if (formData.clientName && Array.isArray(smsTemplates) && smsTemplates[0]?.getText) {
      try {
        setSmsText(smsTemplates[0].getText(formData));
      } catch (e) {}
    }
  }, [formData.id, formData.clientName]);

  // Add Item to Order
  const addItemRow = () => {
    const defaultSvc = availableServices[0] || { name: 'Мойка ковров', unit: 'м²', price: 15000 };
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          serviceId: defaultSvc.id,
          name: defaultSvc.name,
          unit: defaultSvc.unit,
          qty: 1,
          price: defaultSvc.price,
          total: defaultSvc.unit === 'шт' ? defaultSvc.price : 0
        }
      ]
    });
  };

  // Update item field (service selection, qty, custom price)
  const updateItemRow = (idx, field, value) => {
    const nextItems = [...formData.items];
    if (field === 'name') {
      const selectedSvc = availableServices.find(s => s.name === value);
      nextItems[idx] = {
        ...nextItems[idx],
        serviceId: selectedSvc?.id || nextItems[idx].serviceId,
        name: value,
        unit: selectedSvc?.unit || 'шт',
        price: selectedSvc?.price !== undefined ? selectedSvc.price : nextItems[idx].price
      };
    } else {
      nextItems[idx][field] = value;
    }

    const q = parseFloat(nextItems[idx].qty) || 0;
    const p = parseFloat(nextItems[idx].price) || 0;
    if (nextItems[idx].unit === 'шт' || nextItems[idx].unit === 'комплект' || nextItems[idx].unit === 'место') {
      nextItems[idx].total = q * p;
    } else {
      nextItems[idx].total = 0; // Will be measured by washer
    }

    setFormData({ ...formData, items: nextItems });
  };

  const removeItemRow = (idx) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedItems = formData.items.map(it => {
      const q = parseFloat(it.qty) || 1;
      const p = parseFloat(it.price) || 0;
      const isFixed = it.unit === 'шт' || it.unit === 'комплект' || it.unit === 'место';
      return {
        ...it,
        qty: q,
        price: p,
        total: isFixed ? q * p : 0
      };
    });
    // Calculate total fixed items amount
    const fixedTotal = formattedItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const updatedOrder = {
      ...formData,
      items: formattedItems,
      totalAmount: fixedTotal > 0 ? fixedTotal : (parseFloat(formData.totalAmount) || 0),
      paidAmount: parseFloat(formData.paidAmount) || 0
    };
    onSave(updatedOrder);
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
    printOrderReceipt({
      ...formData,
      dispatcherName: formData.dispatcherName || currentUser?.name || 'Мадина'
    });
  };

  const handleSendTelegram = async () => {
    const config = getTelegramBotConfig();
    if (!config.botToken || !config.channelId) {
      alert('⚠️ Токен Telegram-бота или Chat ID общей группы не настроены. Настройте их в разделе "Карта Админа".');
      return;
    }

    const res = await sendTelegramOrderCard(formData);
    if (res.success) {
      alert(`✅ Заказ #${formData.id || 'Б/Н'} успешно отправлен в общую Telegram-группу!`);
    } else {
      alert(`Ошибка отправки в Telegram: ${res.error || 'Проверьте токен бота и Chat ID в Карте Админа'}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
      padding: '12px'
    }}>
      {/* Compact Vertical Rectangular Container */}
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '460px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'var(--bg-modal)',
        border: '1.5px solid var(--accent-primary)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--accent-secondary)' }}>
              {formData.id ? `Заказ #${formData.id}` : '📝 Заявка на забор (Б/Н)'}
            </span>
            <span className={`badge badge-${formData.status}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
              {formData.status.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" onClick={handleSendTelegram} className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }} title="Отправить карточку заказа в общую Telegram-группу">
              <Send size={13} />
            </button>
            <button type="button" onClick={() => setIsSMSModalOpen(true)} className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', borderColor: 'rgba(6, 182, 212, 0.3)' }} title="СМС Клиенту">
              <Smartphone size={13} />
            </button>
            <button type="button" onClick={printReceipt} className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} title="Печать чека">
              <Printer size={13} />
            </button>
            <button type="button" onClick={onClose} className="btn-icon" style={{ padding: '4px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form Body - Vertical Layout */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Client Name & Phone (2 cols) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>ФИО Клиента *</label>
              <input 
                type="text" 
                required
                value={formData.clientName} 
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="input-field" 
                placeholder="Имя клиента"
                style={{ fontSize: '13px', padding: '8px 10px' }}
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>Телефон *</label>
              <input 
                type="text" 
                required
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field" 
                placeholder="+998 90..."
                style={{ fontSize: '13px', padding: '8px 10px' }}
              />
            </div>
          </div>

          {/* Address */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ fontSize: '11px' }}>Адрес забора / доставки *</label>
            <input 
              type="text" 
              required
              value={formData.address} 
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field" 
              placeholder="Улица, дом, квартира, махалля"
              style={{ fontSize: '13px', padding: '8px 10px' }}
            />
          </div>

          {/* Landmark & District (2 cols) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>Ориентир</label>
              <input 
                type="text" 
                value={formData.landmark} 
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="input-field" 
                placeholder="Рядом с Корзинкой"
                style={{ fontSize: '13px', padding: '8px 10px' }}
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>Район</label>
              <select 
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="select-field"
                style={{ fontSize: '12.5px', padding: '8px 10px' }}
              >
                <option value="Сиёб">Сиёб</option>
                <option value="Багишамальский">Багишамальский</option>
                <option value="Согдиана">Согдиана</option>
                <option value="Микрорайон">Микрорайон</option>
                <option value="Саттепо">Саттепо</option>
                <option value="Железнодорожный">Железнодорожный</option>
                <option value="Самаркандский р-н">Самаркандский р-н</option>
                <option value="Центр">Центр</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC SERVICES & ITEMS PICKER (Replaces blind agreed amount) */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={15} />
                <span>ВЫБОР УСЛУГ & ИЗДЕЛИЙ</span>
              </div>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Цены можно менять</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formData.items.map((item, idx) => (
                <div key={idx} style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#facc15' }}>Позиция #{idx + 1}</span>
                    {formData.items.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeItemRow(idx)}
                        className="btn-icon" 
                        style={{ padding: '2px', color: '#f43f5e' }}
                        title="Удалить позицию"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Service dropdown */}
                  <select 
                    value={item.name}
                    onChange={(e) => updateItemRow(idx, 'name', e.target.value)}
                    className="select-field"
                    style={{ fontSize: '12.5px', padding: '6px 8px' }}
                  >
                    {availableServices.map(svc => (
                      <option key={svc.id} value={svc.name}>
                        {svc.name} ({svc.unit}) — {svc.price.toLocaleString()} сум/{svc.unit}
                      </option>
                    ))}
                  </select>

                  {/* Quantity & Unit Price */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label" style={{ fontSize: '10.5px' }}>Кол-во ({item.unit})</label>
                      <input 
                        type="number"
                        min="1"
                        required
                        value={item.qty ?? ''}
                        onChange={(e) => updateItemRow(idx, 'qty', e.target.value)}
                        className="input-field"
                        style={{ fontSize: '12.5px', padding: '6px 8px', fontWeight: '800' }}
                      />
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label" style={{ fontSize: '10.5px' }}>Цена за 1 {item.unit} (сум)</label>
                      <input 
                        type="number"
                        required
                        value={item.price ?? ''}
                        onChange={(e) => updateItemRow(idx, 'price', e.target.value)}
                        className="input-field"
                        style={{ fontSize: '12.5px', padding: '6px 8px', color: '#34d399', fontWeight: '800' }}
                        title="Индивидуальная цена только для этого заказа"
                      />
                    </div>
                  </div>

                  {item.unit === 'м²' || item.unit === 'метр' ? (
                    <div style={{ fontSize: '10.5px', color: '#fde68a', fontStyle: 'italic' }}>
                      📐 Точная площадь и сумма будут рассчитаны мойщиком при замере
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: '700', textAlign: 'right' }}>
                      Итого: {(item.total || 0).toLocaleString()} сум
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="btn btn-secondary"
              style={{ fontSize: '11.5px', padding: '6px 10px', borderStyle: 'dashed', justifyContent: 'center' }}
            >
              <Plus size={13} /> Добавить еще услугу
            </button>
          </div>

          {/* Courier & Language (2 cols) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>🚚 Курьер *</label>
              <select 
                value={formData.assignedCourier} 
                onChange={(e) => setFormData({ ...formData, assignedCourier: e.target.value })}
                className="select-field"
                style={{ fontSize: '12px', padding: '8px' }}
              >
                {activeCouriers.length > 0 ? (
                  activeCouriers.map(c => (
                    <option key={c.id || c.username} value={c.name || c.username}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <option value="Не назначен">Не назначен</option>
                )}
              </select>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>🌐 Язык *</label>
              <select 
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="select-field"
                style={{ fontSize: '12px', padding: '8px' }}
              >
                <option value="Русский">Русский</option>
                <option value="Узбекский">O'zbek tili</option>
                <option value="Таджикский">Тоҷикӣ</option>
              </select>
            </div>
          </div>

          {/* Status & Delivery Days (2 cols) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>Статус заказа</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="select-field"
                style={{ fontSize: '12.5px', padding: '8px 10px' }}
              >
                <option value="new">📥 1. Ожидает забора</option>
                <option value="cleaning">🧼 2. Забран / В цеху</option>
                <option value="delivery">📦 3. Готов / На доставке</option>
                <option value="done">✅ 4. Выполнен</option>
              </select>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px', color: '#facc15', fontWeight: '800' }}>⏱️ Срок доставки (дней)</label>
              <select 
                value={formData.deliveryDays}
                onChange={(e) => setFormData({ ...formData, deliveryDays: parseInt(e.target.value, 10) })}
                className="select-field"
                style={{ fontSize: '12.5px', padding: '8px 10px', fontWeight: '800', border: '1px solid #facc15' }}
              >
                <option value={1}>⚡ 1 день</option>
                <option value={2}>⚡ 2 дня</option>
                <option value={3}>⚡ 3 дня</option>
                <option value={4}>4 дня</option>
                <option value={5}>📅 5 дней (По умолчанию)</option>
                <option value={7}>📅 7 дней</option>
              </select>
            </div>
          </div>

          {/* Urgent Checkbox */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: formData.urgent ? 'rgba(244, 63, 94, 0.1)' : 'transparent', padding: formData.urgent ? '8px 10px' : '0', borderRadius: '8px', border: formData.urgent ? '1px solid #f43f5e' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox"
                id="urgentCheckOrderModal"
                checked={formData.urgent}
                onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#f43f5e' }}
              />
              <label htmlFor="urgentCheckOrderModal" style={{ fontSize: '12px', fontWeight: '800', color: formData.urgent ? '#f43f5e' : 'var(--text-muted)' }}>
                🔥 СРОЧНЫЙ ЗАКАЗ
              </label>
            </div>

            {formData.urgent && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="date"
                  required={formData.urgent}
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '12px', padding: '6px 8px' }}
                />
                <input 
                  type="time"
                  required={formData.urgent}
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '12px', padding: '6px 8px' }}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ fontSize: '11px' }}>Примечания / Заметки</label>
            <textarea 
              rows={2}
              value={formData.notes} 
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="textarea-field" 
              placeholder="Особые пожелания клиента, ориентиры..."
              style={{ fontSize: '12.5px' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '13px' }}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5, background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', padding: '10px', fontSize: '13px', fontWeight: '800' }}>
              💾 Сохранить Заказ
            </button>
          </div>
        </form>
      </div>

      {/* SMS MODAL */}
      {isSMSModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '16px', background: 'var(--bg-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: '800' }}>СМС Клиенту</h3>
              </div>
              <button onClick={() => setIsSMSModalOpen(false)} className="btn-icon" style={{ padding: '2px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '10px', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '8px', fontSize: '12px' }}>
              <div>👤 <strong>{formData.clientName}</strong> ({formData.phone})</div>
            </div>

            <form onSubmit={handleSendSMS} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '11px' }}>Текст СМС *</label>
                <textarea 
                  rows={4}
                  required
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="textarea-field"
                  style={{ fontSize: '12.5px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={() => setIsSMSModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '8px' }}>
                  Отмена
                </button>
                <button type="submit" disabled={smsSending} className="btn btn-primary" style={{ flex: 1, padding: '8px' }}>
                  <Send size={14} /> {smsSending ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
