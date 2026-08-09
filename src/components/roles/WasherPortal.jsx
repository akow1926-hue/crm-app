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
  DollarSign,
  User,
  Phone,
  MapPin,
  Home,
  Languages,
  Headphones,
  Truck,
  Check,
  Search,
  Filter
} from 'lucide-react';
import { serviceCatalog } from '../../data/initialData';
import { notifyOrderReady, getTelegramBotConfig } from '../../services/telegramBotService';

export default function WasherPortal({ orders, setOrders, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'need_measure' | 'cleaning'
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredOrders = inFactoryOrders.filter(o => {
    if (activeTab === 'need_measure') {
      const hasMeasures = o.area && o.area > 0;
      if (hasMeasures) return false;
    }
    if (activeTab === 'cleaning') {
      if (o.status !== 'cleaning') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const idStr = String(o.id || o.tempId || '').toLowerCase();
      const nameStr = String(o.clientName || '').toLowerCase();
      const phoneStr = String(o.phone || o.clientPhone || '').toLowerCase();
      const addrStr = String(o.address || '').toLowerCase();
      return idStr.includes(q) || nameStr.includes(q) || phoneStr.includes(q) || addrStr.includes(q);
    }

    return true;
  });

  const advanceCleaningStatus = (orderId) => {
    const target = orders.find(o => (o.id && String(o.id) === String(orderId)) || (o.tempId && o.tempId === orderId));
    if (!target) return;

    if (target.status === 'pickup') {
      setOrders(orders.map(o => ((o.id && String(o.id) === String(orderId)) || (o.tempId && o.tempId === orderId)) ? { ...o, status: 'cleaning' } : o));
      return;
    }

    if (target.status === 'cleaning') {
      const needsMeasurement = !target.items || target.items.length === 0 || target.items.some(it => it.unit === 'м²' || it.unit === 'метр' || !it.unit);
      const isMeasured = Boolean(target.area && target.area > 0) || (target.items && target.items.length > 0 && !needsMeasurement);

      if (!isMeasured) {
        alert('⚠️ Внимание: Перед передачей заказа на доставку курьеру необходимо внести и сохранить замеры ковров!');
        openMeasureModal(target);
        return;
      }

      const updatedOrder = { ...target, status: 'delivery' };
      setOrders(orders.map(o => ((o.id && String(o.id) === String(orderId)) || (o.tempId && o.tempId === orderId)) ? updatedOrder : o));

      // Trigger Telegram Group Notification (Case 3: Готовность)
      notifyOrderReady(updatedOrder, {
        washer: currentUser?.name || currentUser?.username || 'Мастер цеха'
      }).catch(err => console.warn('Telegram ready notify error:', err));

      alert(`✅ Заказ #${target.id || 'Б/Н'} выстиран, замерен и передан курьеру на доставку!`);
    }
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

    let updatedTargetOrder = null;

    setOrders(orders.map(o => {
      const isTarget = (o.id && measureModalOrder.id && String(o.id) === String(measureModalOrder.id)) ||
                       (o.tempId && measureModalOrder.tempId && o.tempId === measureModalOrder.tempId) ||
                       (o === measureModalOrder);
      if (isTarget) {
        const updated = {
          ...o,
          status: 'delivery', // Automatically marks as ready for delivery!
          area: parseFloat(totalOrderArea.toFixed(2)),
          totalAmount: finalTotalAmount,
          items: itemsFormatted,
          notes: (o.notes ? o.notes + ' | ' : '') + `[Замеры в цеху: ${itemsDetailsStr}]`
        };
        updatedTargetOrder = updated;
        return updated;
      }
      return o;
    }));

    // Trigger Telegram Group Notification (Case 3: Готовность и замеры ковров)
    notifyOrderReady(updatedTargetOrder || { ...measureModalOrder, status: 'delivery', area: totalOrderArea, totalAmount: finalTotalAmount, items: itemsFormatted }, {
      washer: currentUser?.name || currentUser?.username || 'Мастер цеха',
      measuredItems: itemsFormatted,
      totalArea: parseFloat(totalOrderArea.toFixed(2)),
      totalAmount: finalTotalAmount
    }).catch(err => console.warn('Telegram ready notify error:', err));

    alert(`✅ Замеры сохранены (Общая площадь: ${totalOrderArea.toFixed(2)} кв.м, Сумма: ${finalTotalAmount.toLocaleString()} сум)!\nЗаказ #${measureModalOrder.id || 'Б/Н'} переведен в статус «Готов к доставке» и отправлен курьеру.`);
    setMeasureModalOrder(null);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid #10b981',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '900',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
          }}>
            <Shirt size={26} />
          </div>
          <div>
            <span className="badge badge-done" style={{ fontSize: '10px' }}>Цех стирки & Сушки</span>
            <h2 style={{ fontSize: '18px', fontWeight: '900' }}>{currentUser?.name || 'Оператор Стирки'}</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>В работе цеха: <strong>{inFactoryOrders.length} заказов</strong></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
          {getTelegramBotConfig().channelId && (
            <a 
              href={getTelegramBotConfig().channelId.startsWith('@') ? `https://t.me/${getTelegramBotConfig().channelId.replace('@', '')}` : (getTelegramBotConfig().botUsername ? `https://t.me/${getTelegramBotConfig().botUsername}` : '#')}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '12px', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.4)' }}
              title="Открыть общую Telegram-группу заказов"
            >
              Telegram Группа
            </a>
          )}
          <button onClick={onLogout} className="btn btn-secondary" style={{ fontSize: '12px', color: '#f43f5e' }}>
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button 
            onClick={() => setActiveTab('all')}
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '800',
              background: activeTab === 'all' ? '#10b981' : undefined
            }}
          >
            🧺 Все в цеху ({inFactoryOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('need_measure')}
            className={`btn ${activeTab === 'need_measure' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '800',
              background: activeTab === 'need_measure' ? '#f59e0b' : undefined
            }}
          >
            📏 Ожидают замера
          </button>
          <button 
            onClick={() => setActiveTab('cleaning')}
            className={`btn ${activeTab === 'cleaning' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '800',
              background: activeTab === 'cleaning' ? '#3b82f6' : undefined
            }}
          >
            🧼 Стираются / Сушатся
          </button>
        </div>

        {/* Search */}
        <div className="input-group" style={{ margin: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="input-field" 
              placeholder="Поиск по ID, клиенту, телефону, адресу..."
              style={{ paddingLeft: '36px', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* Orders Grid (Tile Cards Layout) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 320px))',
        gap: '14px',
        justifyContent: 'start',
        width: '100%'
      }}>
        {filteredOrders.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>В этой категории нет заказов!</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Все изделия выстираны или еще не поступили в цех.</div>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const clientPhone = order.phone || order.clientPhone || '-';
            const cleanPhone = String(clientPhone).replace(/[^\d+]/g, '');
            const totalSum = order.totalAmount || order.agreedAmount || 0;
            const isPaid = order.paymentStatus === 'paid';
            const dispatcherName = order.dispatcherName || order.createdBy || 'Диспетчер';
            const commentText = order.notes || order.comment || '';
            const orderId = (order.id && order.id !== 'Б/Н' && order.id !== '-') ? order.id : null;
            const needsMeasurement = !order.items || order.items.length === 0 || order.items.some(it => it.unit === 'м²' || it.unit === 'метр' || !it.unit);
            const hasMeasures = Boolean(order.area && order.area > 0) || (order.items && order.items.length > 0 && !needsMeasurement);

            return (
              <div 
                key={order.tempId || order.id || Math.random()} 
                className="glass-card"
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 17, 40, 0.98) 100%)',
                  border: order.urgent ? '1.5px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: order.urgent ? '0 4px 16px rgba(244, 63, 94, 0.3)' : '0 4px 14px rgba(0, 0, 0, 0.45)',
                  width: '100%',
                  maxWidth: '320px',
                  wordBreak: 'break-word'
                }}
              >
                {/* Row 1: Status badge left, Order ID right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {order.urgent && (
                      <span className="badge badge-cancel" style={{ fontSize: '10px', padding: '1px 5px', fontWeight: '800' }}>
                        🔥 СРОЧНО
                      </span>
                    )}
                    <span className={`badge badge-${order.status}`} style={{ fontSize: '10.5px', padding: '2px 7px' }}>
                      {order.status === 'pickup' ? '📥 В цеху' : '🧼 Стирается'}
                    </span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: orderId ? '#facc15' : '#94a3b8' }}>
                    № {orderId ? orderId : 'Б/Н'}
                  </span>
                </div>

                {/* Row 2: Courier & Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94a3b8' }}>
                  <Truck size={13} color="#facc15" />
                  <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{order.assignedCourier || 'Курьер'}</span>
                  <span style={{ color: '#64748b' }}>•</span>
                  <span>{order.createdDate || 'Сегодня'}</span>
                </div>

                {/* Row 3: Client Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
                  <User size={14} color="#60a5fa" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.clientName || 'Клиент'}
                  </span>
                </div>

                {/* Row 4: Phone & Location Pin */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a 
                    href={`tel:${cleanPhone}`} 
                    style={{
                      color: '#34d399',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Phone size={13} /> {clientPhone}
                  </a>

                  <a 
                    href={order.gpsLocation ? `https://yandex.ru/maps/?text=${encodeURIComponent(order.gpsLocation)}` : `https://yandex.ru/maps/?text=${encodeURIComponent((order.district ? order.district + ', ' : '') + order.address + ' Самарканд')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      borderRadius: '6px',
                      padding: '3px 7px',
                      fontSize: '12px',
                      textDecoration: 'none'
                    }}
                    title="Открыть на карте"
                  >
                    <MapPin size={13} color="#f87171" />
                  </a>
                </div>

                {/* Row 5: Address */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.3' }}>
                  <Home size={13} color="#facc15" style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.address || 'Адрес не указан'}{order.landmark ? ` (${order.landmark})` : ''}
                  </span>
                </div>

                {/* Row 6: Items & Area info */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  fontSize: '11.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>🧺 Изделия:</span>
                    <span style={{ color: hasMeasures ? '#34d399' : '#facc15', fontWeight: '800' }}>
                      {hasMeasures ? `📐 ${order.area} м²` : '⚠️ Без замеров'}
                    </span>
                  </div>
                  <div style={{ color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {order.items && order.items.length > 0 
                      ? order.items.map(it => `${it.name}`).join(', ') 
                      : 'Ковры (требуется замер)'}
                  </div>
                </div>

                {/* Row 7: Dispatcher / Comments */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94a3b8' }}>
                  <Headphones size={13} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dispatcherName}
                  </span>
                  {commentText && <span style={{ color: '#fde68a' }}>• 💬 {commentText}</span>}
                </div>

                {/* Row 8: Price & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '900', color: hasMeasures ? '#facc15' : '#f59e0b' }}>
                    {hasMeasures ? `${totalSum.toLocaleString()} сум` : '⚠️ Ожидает замера'}
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: isPaid ? '#34d399' : '#f87171' }}>
                    {isPaid ? '✅ Оплачено' : '🔴 Не оплачено'}
                  </span>
                </div>

                {/* Row 9: 2 Action Buttons [ 📏 Замер ] [ 🧼 / ✓ Статус ] */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  {/* 1. Measure Button */}
                  <button 
                    onClick={() => openMeasureModal(order)} 
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#ffffff',
                      height: '36px',
                      padding: '0 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
                    }}
                    title="Замер каждого ковра / изделия"
                  >
                    <Ruler size={15} /> Замер
                  </button>

                  {/* 2. Status Advance (Start Cleaning or Delivery Ready) */}
                  {order.status === 'pickup' ? (
                    <button 
                      onClick={() => advanceCleaningStatus(order.id)}
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#070d1e',
                        height: '36px',
                        padding: '0 8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                      }}
                      title="Начать стирку"
                    >
                      <Shirt size={15} /> Начать стирку
                    </button>
                  ) : hasMeasures ? (
                    <button 
                      onClick={() => advanceCleaningStatus(order.id)}
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        height: '36px',
                        padding: '0 8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                      }}
                      title="Стирка и замеры завершены — передать курьеру на доставку"
                    >
                      <CheckCircle2 size={15} /> Готов к доставке
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        alert('⚠️ Для завершения заказа и передачи на доставку необходимо сначала внести и сохранить замеры ковров!');
                        openMeasureModal(order);
                      }}
                      className="btn"
                      style={{
                        background: 'rgba(245, 158, 11, 0.18)',
                        border: '1.5px solid #f59e0b',
                        color: '#fde68a',
                        height: '36px',
                        padding: '0 6px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                      title="Сначала введите замеры ковров!"
                    >
                      <Ruler size={13} color="#f59e0b" /> Нужен замер
                    </button>
                  )}
                </div>
              </div>
            );
          })
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
                <Plus size={14} /> Добавить позицию
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
