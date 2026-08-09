import React, { useState } from 'react';
import { 
  Shirt, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  LogOut, 
  Layers, 
  ShieldAlert, 
  Ruler, 
  X, 
  Plus, 
  Trash2, 
  Package, 
  DollarSign 
} from 'lucide-react';
import { serviceCatalog } from '../../data/initialData';

export default function WasherPortal({ orders, setOrders, currentUser, onLogout }) {
  const [measureModalOrder, setMeasureModalOrder] = useState(null);
  const [measuredItems, setMeasuredItems] = useState([]);

  // Load dynamic services catalog
  const availableServices = (() => {
    try {
      const saved = localStorage.getItem('cosmo_crm_service_catalog');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return serviceCatalog;
  })();

  const inFactoryOrders = orders.filter(o => o.status === 'cleaning' || o.status === 'pickup');

  const advanceCleaningStatus = (orderId) => {
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        if (o.status === 'pickup') return { ...o, status: 'cleaning' };
        if (o.status === 'cleaning') return { ...o, status: 'delivery' };
      }
      return o;
    }));
  };

  // Open modal and expand order items into individual rows for separate measurements
  const openMeasureModal = (order) => {
    setMeasureModalOrder(order);

    if (order.items && order.items.length > 0) {
      const expanded = [];
      order.items.forEach((it, idx) => {
        const qty = parseInt(it.qty) || 1;
        const baseName = it.serviceName || it.name?.split(' (')[0] || 'Ковер';
        const unit = it.unit || 'м²';
        const price = parseFloat(it.price) || 15000;

        // If unit is м² or метр and quantity > 1, expand into separate rows (Ковер 1, Ковер 2...)
        if ((unit === 'м²' || unit === 'метр') && qty > 1) {
          for (let i = 1; i <= qty; i++) {
            expanded.push({
              id: `${idx}-${i}`,
              name: `${baseName} #${i}`,
              unit: unit,
              width: it.width || 2.5,
              length: it.length || 3.0,
              price: price,
              qty: 1
            });
          }
        } else {
          expanded.push({
            id: `${idx}-1`,
            name: baseName,
            unit: unit,
            width: it.width || 2.5,
            length: it.length || 3.0,
            price: price,
            qty: qty
          });
        }
      });
      setMeasuredItems(expanded);
    } else {
      setMeasuredItems([
        { id: '1', name: 'Мойка ковров #1', unit: 'м²', width: 2.5, length: 3.5, price: 15000, qty: 1 }
      ]);
    }
  };

  const calculateItemTotal = (item) => {
    if (item.unit === 'м²' || item.unit === 'метр') {
      const area = (parseFloat(item.width) || 0) * (parseFloat(item.length) || 0);
      return Math.round(area * (parseFloat(item.price) || 0));
    } else {
      return Math.round((parseInt(item.qty) || 1) * (parseFloat(item.price) || 0));
    }
  };

  const totalOrderAmount = measuredItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalOrderArea = measuredItems.reduce((sum, item) => {
    if (item.unit === 'м²' || item.unit === 'метр') {
      return sum + ((parseFloat(item.width) || 0) * (parseFloat(item.length) || 0));
    }
    return sum;
  }, 0);

  const handleSaveAllMeasurements = (e) => {
    e.preventDefault();
    if (!measureModalOrder) return;

    const itemsFormatted = measuredItems.map(item => {
      if (item.unit === 'м²' || item.unit === 'метр') {
        const area = parseFloat(((parseFloat(item.width) || 0) * (parseFloat(item.length) || 0)).toFixed(2));
        const itemTotal = Math.round(area * (parseFloat(item.price) || 0));
        return {
          name: `${item.name} (${item.width}м x ${item.length}м = ${area} ${item.unit})`,
          serviceName: item.name,
          unit: item.unit,
          width: parseFloat(item.width) || 0,
          length: parseFloat(item.length) || 0,
          area: area,
          qty: 1,
          price: parseFloat(item.price) || 0,
          total: itemTotal
        };
      } else {
        const itemTotal = Math.round((parseInt(item.qty) || 1) * (parseFloat(item.price) || 0));
        return {
          name: `${item.name} (${item.qty} ${item.unit})`,
          serviceName: item.name,
          unit: item.unit,
          qty: parseInt(item.qty) || 1,
          price: parseFloat(item.price) || 0,
          total: itemTotal
        };
      }
    });

    const finalTotalAmount = itemsFormatted.reduce((sum, it) => sum + (it.total || 0), 0);
    const itemsDetailsStr = itemsFormatted.map(i => i.name).join(' | ');

    setOrders(orders.map(o => {
      if (o.id === measureModalOrder.id) {
        return {
          ...o,
          area: parseFloat(totalOrderArea.toFixed(2)),
          totalAmount: finalTotalAmount,
          items: itemsFormatted,
          notes: (o.notes ? o.notes + ' | ' : '') + `[Замеры в цеху: ${itemsDetailsStr}]`
        };
      }
      return o;
    }));

    alert(`✅ Замеры по всем ${measuredItems.length} изделиям заказа #${measureModalOrder.id} сохранены!\nОбщая площадь: ${totalOrderArea.toFixed(2)} кв.м.\nИтоговая сумма к оплате: ${finalTotalAmount.toLocaleString()} сум.`);
    setMeasureModalOrder(null);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '950px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(17, 24, 39, 0.9) 100%)',
        border: '1px solid var(--accent-gradient-emerald)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--accent-gradient-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '800',
            flexShrink: 0
          }}>
            <Shirt size={24} />
          </div>
          <div>
            <span className="badge badge-done" style={{ fontSize: '10px' }}>Кабинет Оператора Стирки</span>
            <h2 style={{ fontSize: '18px', fontWeight: '800' }}>{currentUser?.name || 'Баходмир Муминов'}</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>В работе цеха: <strong>{inFactoryOrders.length} заказов</strong></div>
          </div>
        </div>

        <button onClick={onLogout} className="btn btn-secondary" style={{ fontSize: '12px', color: '#f43f5e', marginLeft: 'auto' }}>
          <LogOut size={16} /> Выйти
        </button>
      </div>

      {/* Orders in Factory */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {inFactoryOrders.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
            <div>Очередь стирки пуста. Все ковры высушены и готовы!</div>
          </div>
        ) : (
          inFactoryOrders.map((order) => (
            <div 
              key={order.id} 
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                borderLeft: order.urgent ? '4px solid #f43f5e' : '4px solid #f59e0b'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                    {order.id ? `Заказ #${order.id}` : 'Заказ (Б/Н)'}
                  </span>
                  {order.urgent && (
                    <span className="badge badge-cancel" style={{ fontSize: '10px' }}>
                      <ShieldAlert size={10} /> 🔥 СРОЧНО
                    </span>
                  )}
                  <span className={`badge badge-${order.status}`}>
                    {order.status === 'pickup' ? '📥 Забран курьером' : '🧼 В процессе стирки'}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                  Клиент: {order.clientName} ({order.district || 'Самарканд'})
                </div>

                {/* Items List */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {order.items && order.items.length > 0 ? order.items.map((it, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      color: '#ffffff',
                      fontWeight: '700'
                    }}>
                      🧺 {it.name} — <strong>{it.qty} {it.unit || 'шт'}</strong>
                    </span>
                  )) : <span>Ковры / изделия (ожидают замера)</span>}
                </div>

                {order.notes && (
                  <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#fbbf24', marginTop: '2px' }}>
                    ⚠️ {order.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => openMeasureModal(order)}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', fontSize: '13px', padding: '10px 16px', fontWeight: '800' }}
                >
                  <Ruler size={16} /> 📏 Замер каждого ковра / изделия
                </button>

                {order.status === 'pickup' ? (
                  <button 
                    onClick={() => advanceCleaningStatus(order.id)}
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-gradient-gold)', padding: '10px 16px', fontSize: '13px' }}
                  >
                    <Shirt size={16} /> Начать стирку
                  </button>
                ) : (
                  <button 
                    onClick={() => advanceCleaningStatus(order.id)}
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-gradient-emerald)', padding: '10px 16px', fontSize: '13px' }}
                  >
                    <CheckCircle2 size={16} /> Стирка & Сушка Завершена (Готов)
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Washer Separate Measurements per Product */}
      {measureModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-modal)', border: '1.5px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ruler size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>
                  Ввод замеров для каждого ковра/изделия (Заказ #{measureModalOrder.id})
                </h3>
              </div>
              <button onClick={() => setMeasureModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid #3b82f6', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', color: '#60a5fa' }}>
              👤 <strong>Клиент:</strong> {measureModalOrder.clientName} | Внесите ширину и длину отдельно для каждого ковра, курпачи и подушки!
            </div>

            <form onSubmit={handleSaveAllMeasurements} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {measuredItems.map((item, idx) => {
                  const area = (parseFloat(item.width) || 0) * (parseFloat(item.length) || 0);
                  const itemTotal = calculateItemTotal(item);

                  return (
                    <div 
                      key={item.id || idx} 
                      style={{ 
                        background: 'rgba(0, 0, 0, 0.4)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '12px', 
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}>
                            Позиция #{idx + 1}:
                          </span>
                          <input 
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const next = [...measuredItems];
                              next[idx].name = e.target.value;
                              setMeasuredItems(next);
                            }}
                            className="input-field"
                            style={{ fontSize: '13px', fontWeight: '800', width: '180px', padding: '4px 8px' }}
                          />
                        </div>

                        {measuredItems.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => setMeasuredItems(measuredItems.filter((_, i) => i !== idx))} 
                            className="btn-icon" 
                            style={{ padding: '2px' }}
                          >
                            <Trash2 size={15} color="#f43f5e" />
                          </button>
                        )}
                      </div>

                      {/* Dimension Fields for м² / метр */}
                      {(item.unit === 'м²' || item.unit === 'метр') ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'flex-end' }}>
                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '11px' }}>Ширина (м)</label>
                            <input 
                              type="number" 
                              step="0.1"
                              required
                              value={item.width}
                              onChange={(e) => {
                                const next = [...measuredItems];
                                next[idx].width = parseFloat(e.target.value) || 0;
                                setMeasuredItems(next);
                              }}
                              className="input-field"
                              style={{ fontSize: '13px', fontWeight: '800' }}
                            />
                          </div>

                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '11px' }}>Длина (м)</label>
                            <input 
                              type="number" 
                              step="0.1"
                              required
                              value={item.length}
                              onChange={(e) => {
                                const next = [...measuredItems];
                                next[idx].length = parseFloat(e.target.value) || 0;
                                setMeasuredItems(next);
                              }}
                              className="input-field"
                              style={{ fontSize: '13px', fontWeight: '800' }}
                            />
                          </div>

                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '11px' }}>Ставка (сум/{item.unit})</label>
                            <input 
                              type="number"
                              required
                              value={item.price}
                              onChange={(e) => {
                                const next = [...measuredItems];
                                next[idx].price = parseFloat(e.target.value) || 0;
                                setMeasuredItems(next);
                              }}
                              className="input-field"
                              style={{ fontSize: '12.5px', color: '#10b981', fontWeight: '800' }}
                            />
                          </div>

                          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '6px 8px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#a7f3d0' }}>{area.toFixed(2)} кв.м</div>
                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}>{itemTotal.toLocaleString()} сум</div>
                          </div>
                        </div>
                      ) : (
                        /* Fixed Quantity Fields for шт / комплект */
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', alignItems: 'flex-end' }}>
                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '11px' }}>Кол-во ({item.unit})</label>
                            <input 
                              type="number" 
                              min="1"
                              required
                              value={item.qty}
                              onChange={(e) => {
                                const next = [...measuredItems];
                                next[idx].qty = parseInt(e.target.value) || 1;
                                setMeasuredItems(next);
                              }}
                              className="input-field"
                              style={{ fontSize: '13px', fontWeight: '800' }}
                            />
                          </div>

                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '11px' }}>Цена за 1 {item.unit}</label>
                            <input 
                              type="number"
                              required
                              value={item.price}
                              onChange={(e) => {
                                const next = [...measuredItems];
                                next[idx].price = parseFloat(e.target.value) || 0;
                                setMeasuredItems(next);
                              }}
                              className="input-field"
                              style={{ fontSize: '12.5px', color: '#10b981', fontWeight: '800' }}
                            />
                          </div>

                          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '6px 8px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#a7f3d0' }}>Итого</div>
                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}>{itemTotal.toLocaleString()} сум</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextNum = measuredItems.length + 1;
                  setMeasuredItems([
                    ...measuredItems,
                    { id: `${Date.now()}`, name: `Мойка ковров #${nextNum}`, unit: 'м²', width: 2.5, length: 3.5, price: 15000, qty: 1 }
                  ]);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '8px', borderStyle: 'dashed' }}
              >
                <Plus size={14} /> Добавить ещё изделие в замер (+ ковёр / + курпача)
              </button>

              {/* Total Order Summary */}
              <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1.5px solid #10b981', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: '700', textTransform: 'uppercase' }}>Общая площадь:</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>{totalOrderArea.toFixed(2)} кв.м</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: '700', textTransform: 'uppercase' }}>Итоговая сумма заказа:</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', textShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}>
                    {totalOrderAmount.toLocaleString()} сум
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '14px', fontSize: '15px', fontWeight: '900' }}>
                ✅ Сохранить Все Замеры & Расчитать Заказ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
