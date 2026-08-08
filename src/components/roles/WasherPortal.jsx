import React, { useState } from 'react';
import { Shirt, CheckCircle2, Clock, Sparkles, LogOut, Layers, ShieldAlert, Ruler, X } from 'lucide-react';

export default function WasherPortal({ orders, setOrders, currentUser, onLogout }) {
  const [measureModalOrder, setMeasureModalOrder] = useState(null);
  const [width, setWidth] = useState(2.5);
  const [length, setLength] = useState(3.5);
  const [pricePerM2, setPricePerM2] = useState(14000);

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

  const handleSaveMeasurement = (e) => {
    e.preventDefault();
    if (!measureModalOrder) return;

    const area = parseFloat((width * length).toFixed(2));
    const price = measureModalOrder.agreedPricePerM2 || pricePerM2 || 14000;
    const total = Math.round(area * price);

    setOrders(orders.map(o => {
      if (o.id === measureModalOrder.id) {
        return {
          ...o,
          area,
          totalAmount: total,
          items: [{ name: `Ковер (${width}м x ${length}м = ${area} кв.м)`, qty: 1, price, total }],
          notes: (o.notes ? o.notes + ' | ' : '') + `[Замер в цеху: ${width}x${length}м (${area} кв.м) * ${price} сум = ${total} сум]`
        };
      }
      return o;
    }));

    alert(`Замеры заказа #${measureModalOrder.id} сохранены! Площадь: ${area} кв.м. Сумма к оплате: ${total.toLocaleString()} сум.`);
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
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                    Заказ #{order.id}
                  </span>
                  {order.urgent && (
                    <span className="badge badge-cancel" style={{ fontSize: '10px' }}>
                      <ShieldAlert size={10} /> 🔥 СРОЧНО
                    </span>
                  )}
                  <span className={`badge badge-${order.status}`}>
                    {order.status === 'pickup' ? 'Привезли на смену' : 'В стирке / сушке'}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                  Клиент: {order.clientName} ({order.district || 'Самарканд'})
                </div>

                {order.agreedPricePerM2 && (
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>
                    🤝 Договоренная курьером цена: {order.agreedPricePerM2.toLocaleString()} сум/м²
                  </div>
                )}

                {/* Items */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {order.items ? order.items.map((it, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: 'var(--text-muted)'
                    }}>
                      🧺 {it.name} — <strong>{it.qty}</strong>
                    </span>
                  )) : <span>Ковры / изделия</span>}
                </div>

                {order.notes && (
                  <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#fbbf24', marginTop: '2px' }}>
                    ⚠️ {order.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setMeasureModalOrder(order); setPricePerM2(order.agreedPricePerM2 || 14000); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px', padding: '10px 14px' }}
                >
                  <Ruler size={16} /> Внести размеры (м²)
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

      {/* MODAL: Washer Carpet Measurement */}
      {measureModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Ввод размеров ковра #{measureModalOrder.id}</h3>
              <button onClick={() => setMeasureModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <form onSubmit={handleSaveMeasurement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Ширина (метры)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    value={width} 
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)} 
                    className="input-field" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Длина (метры)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    value={length} 
                    onChange={(e) => setLength(parseFloat(e.target.value) || 0)} 
                    className="input-field" 
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Цена за 1 кв.м (сум)</label>
                <input 
                  type="number" 
                  required 
                  value={pricePerM2} 
                  onChange={(e) => setPricePerM2(parseFloat(e.target.value) || 14000)} 
                  className="input-field" 
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                <div>Площадь: <strong>{(width * length).toFixed(2)} кв.м</strong></div>
                <div style={{ color: '#10b981', fontWeight: '800', fontSize: '15px', marginTop: '4px' }}>
                  Итоговая сумма: {Math.round(width * length * pricePerM2).toLocaleString()} сум
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                Сохранить Замеры и Расчитать Сумму
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
