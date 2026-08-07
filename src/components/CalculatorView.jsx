import React, { useState } from 'react';
import { Calculator, Sparkles, Layers, Sofa, Bed, Feather, Sun, Plus, ArrowRight, Check } from 'lucide-react';
import { serviceCatalog } from '../data/initialData';

export default function CalculatorView({ onOpenNewOrderWithPreset }) {
  const [selectedServices, setSelectedServices] = useState([
    { serviceId: 'S-1', qty: 12 }, // 12 m² synthetic carpet
    { serviceId: 'S-4', qty: 1 }   // 1 sofa
  ]);
  const [isExpress, setIsExpress] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const addServiceRow = () => {
    setSelectedServices([...selectedServices, { serviceId: serviceCatalog[0].id, qty: 1 }]);
  };

  const updateRow = (index, field, value) => {
    const next = [...selectedServices];
    next[index][field] = value;
    setSelectedServices(next);
  };

  const removeRow = (index) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems = selectedServices.map(row => {
    const service = serviceCatalog.find(s => s.id === row.serviceId) || serviceCatalog[0];
    const itemTotal = service.price * (parseFloat(row.qty) || 0);
    return {
      name: service.name,
      qty: parseFloat(row.qty) || 0,
      unit: service.unit,
      price: service.price,
      total: itemTotal
    };
  });

  const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
  const expressFee = isExpress ? subtotal * 0.2 : 0;
  const discountAmount = (subtotal + expressFee) * (discountPercent / 100);
  const grandTotal = subtotal + expressFee + deliveryFee - discountAmount;

  const handleExportToOrder = () => {
    onOpenNewOrderWithPreset({
      items: calculatedItems,
      totalAmount: grandTotal,
      urgent: isExpress
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '800' }}>🧮 Умный Калькулятор Услуг</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Быстрый расчет стоимости стирки ковров, химчистки мебели и доставки
        </p>
      </div>

      <div className="responsive-grid-7-5">
        {/* Left Form Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Позиции заказа</h3>
            <button onClick={addServiceRow} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
              <Plus size={14} /> Добавить услугу
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowX: 'auto' }}>
            {selectedServices.map((row, index) => {
              const currentService = serviceCatalog.find(s => s.id === row.serviceId);
              return (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    minWidth: '500px'
                  }}
                >
                  <select 
                    value={row.serviceId}
                    onChange={(e) => updateRow(index, 'serviceId', e.target.value)}
                    className="select-field"
                    style={{ flex: 2 }}
                  >
                    {serviceCatalog.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.price.toLocaleString()} сум / {s.unit})
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <input 
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={row.qty}
                      onChange={(e) => updateRow(index, 'qty', e.target.value)}
                      className="input-field"
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', minWidth: '25px' }}>
                      {currentService?.unit}
                    </span>
                  </div>

                  <div style={{ fontWeight: '800', fontSize: '14px', width: '110px', textAlign: 'right', color: 'var(--accent-secondary)' }}>
                    {((currentService?.price || 0) * (parseFloat(row.qty) || 0)).toLocaleString()} сум
                  </div>

                  <button 
                    onClick={() => removeRow(index)}
                    className="btn-icon" 
                    style={{ color: '#f43f5e' }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>⚡ Срочная стирка (Express)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Выполнение за 24 часа (+20% к стоимости)</div>
              </div>
              <input 
                type="checkbox"
                checked={isExpress}
                onChange={(e) => setIsExpress(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>🎁 Персональная скидка</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Скидка по карте лояльности VIP</div>
              </div>
              <select 
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="select-field"
                style={{ width: '120px' }}
              >
                <option value={0}>0%</option>
                <option value={5}>5% (Premier)</option>
                <option value={10}>10% (VIP)</option>
                <option value={15}>15% (Промо)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Summary Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid var(--border-glow)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            🧾 Итоговая Калькуляция
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Сумма услуг:</span>
              <span style={{ fontWeight: '700', color: '#fff' }}>{subtotal.toLocaleString()} сум</span>
            </div>

            {isExpress && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24' }}>
                <span>Наценка за Экспресс (+20%):</span>
                <span style={{ fontWeight: '700' }}>+{expressFee.toLocaleString()} сум</span>
              </div>
            )}

            {discountPercent > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                <span>Скидка ({discountPercent}%):</span>
                <span style={{ fontWeight: '700' }}>-{discountAmount.toLocaleString()} сум</span>
              </div>
            )}

            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '16px', fontWeight: '800' }}>ИТОГО К ОПЛАТЕ:</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                {grandTotal.toLocaleString()} сум
              </span>
            </div>
          </div>

          <button onClick={handleExportToOrder} className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: 'auto', fontSize: '15px' }}>
            <ArrowRight size={18} /> Перенести в Новый Заказ
          </button>
        </div>
      </div>
    </div>
  );
}
