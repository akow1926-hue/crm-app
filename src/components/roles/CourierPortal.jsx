import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  DollarSign, 
  Navigation, 
  Clock, 
  ShieldAlert, 
  Check, 
  LogOut,
  Package,
  Plus,
  ArrowLeftRight,
  FileText,
  Printer,
  X,
  Compass,
  Radio
} from 'lucide-react';
import { serviceCatalog } from '../../data/initialData';
import { startContinuousGpsTracking, stopContinuousGpsTracking } from '../../services/gpsTrackingService';
import { getActiveCouriers } from '../../services/staffHelper';

export default function CourierPortal({ orders, setOrders, currentUser, onLogout, registeredUsers }) {
  const activeCouriers = getActiveCouriers(registeredUsers);

  // Tabs: 'pickups' | 'deliveries' | 'newOrder'
  const [activeSubTab, setActiveSubTab] = useState('pickups');
  // Scope: 'my' (only assigned) | 'all' (all CRM orders)
  const [scopeFilter, setScopeFilter] = useState('my');

  // Continuous GPS Tracking State
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [liveGpsData, setLiveGpsData] = useState(null);
  const [gpsUpdateCount, setGpsUpdateCount] = useState(0);

  const courierName = currentUser?.name || currentUser?.username || 'Курьер';

  // Auto-start continuous GPS tracking on mount when courier is logged in
  useEffect(() => {
    if (isGpsActive && courierName) {
      startContinuousGpsTracking(courierName, (location) => {
        setLiveGpsData(location);
        setGpsUpdateCount(c => c + 1);
        if (location.lat && location.lng) {
          setGpsLocation(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
        }
      });
      return () => {
        stopContinuousGpsTracking();
      };
    } else {
      stopContinuousGpsTracking();
    }
  }, [courierName, isGpsActive]);

  // Modals state
  const [pickupModalOrder, setPickupModalOrder] = useState(null);
  const [deliveryModalOrder, setDeliveryModalOrder] = useState(null);
  const [reassignModalOrder, setReassignModalOrder] = useState(null);

  // Pickup Form state
  const [pickupItemsCount, setPickupItemsCount] = useState(1);
  const [pickupConditionNotes, setPickupConditionNotes] = useState('');
  const [gpsLocation, setGpsLocation] = useState('');
  const [standardPricePerM2, setStandardPricePerM2] = useState(14000);
  const [agreedPricePerM2, setAgreedPricePerM2] = useState(12000);
  const [negotiatedNotes, setNegotiatedNotes] = useState('');

  // Delivery Form state
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' | 'click' | 'payme'
  const [paidAmount, setPaidAmount] = useState(0);
  const [underpaidReason, setUnderpaidReason] = useState('');

  // Reassign state
  const [targetCourier, setTargetCourier] = useState(activeCouriers[0]?.name || activeCouriers[0]?.username || 'Все курьеры');

  // Street New Order state
  const [streetOrder, setStreetOrder] = useState({
    clientName: '',
    phone: '+998 ',
    address: '',
    district: 'Сиёб',
    notes: '',
    itemsCount: 1
  });

  // Filter logic
  const filteredOrdersByScope = orders.filter(o => {
    if (scopeFilter === 'all') return true;
    const cour = o.assignedCourier || '';
    const myName = courierName;
    return cour === myName || cour === 'Все курьеры' || cour === 'Не назначен';
  });

  const myPickups = filteredOrdersByScope.filter(o => o.status === 'new' || o.status === 'pickup');
  const myDeliveries = filteredOrdersByScope.filter(o => o.status === 'ready' || o.status === 'delivery');

  const currentList = activeSubTab === 'pickups' ? myPickups : myDeliveries;

  // Capture GPS coordinates
  const handleCaptureGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setGpsLocation(coords);
        alert(`GPS локация успешно захвачена: ${coords}`);
      }, (err) => {
        alert('Не удалось получить GPS: ' + err.message);
      });
    } else {
      alert('Геолокация не поддерживается вашим браузером');
    }
  };

  // Confirm Pickup with Negotiated Price & GPS location
  const handleConfirmPickupSubmit = (e) => {
    e.preventDefault();
    if (!pickupModalOrder) return;

    setOrders(orders.map(o => {
      if (o.id === pickupModalOrder.id) {
        const customNote = `[Забор курьером: ${pickupItemsCount} шт. Согласованная цена: ${agreedPricePerM2} сум/м² (Стандарт: ${standardPricePerM2} сум/м²). ${pickupConditionNotes ? 'Состояние: ' + pickupConditionNotes : ''} ${negotiatedNotes ? 'Договоренность: ' + negotiatedNotes : ''}]`;
        return {
          ...o,
          status: 'cleaning',
          itemsCount: pickupItemsCount,
          agreedPricePerM2: agreedPricePerM2,
          standardPricePerM2: standardPricePerM2,
          gpsLocation: gpsLocation || o.gpsLocation || '',
          notes: (o.notes ? o.notes + ' | ' : '') + customNote
        };
      }
      return o;
    }));

    alert(`Заказ #${pickupModalOrder.id} успешно принят курьером! GPS локация забора (${gpsLocation || 'сохранена'}) привязана для построения маршрута.`);
    setPickupModalOrder(null);
  };

  // Open Delivery Modal
  const openDeliveryModal = (order) => {
    setDeliveryModalOrder(order);
    setPaidAmount(order.totalAmount || 0);
    setUnderpaidReason('');
    setPaymentType('cash');
  };

  // Confirm Delivery
  const handleConfirmDeliverySubmit = (e) => {
    e.preventDefault();
    if (!deliveryModalOrder) return;

    if (paidAmount < deliveryModalOrder.totalAmount && !underpaidReason.trim()) {
      alert('Пожалуйста, укажите причину неполной оплаты!');
      return;
    }

    setOrders(orders.map(o => {
      if (o.id === deliveryModalOrder.id) {
        return {
          ...o,
          status: 'done',
          paymentStatus: paidAmount >= deliveryModalOrder.totalAmount ? 'paid' : 'partial',
          paidAmount: paidAmount,
          paymentType: paymentType === 'cash' ? 'Наличные' : paymentType === 'click' ? 'Click' : 'Payme',
          underpaidReason: underpaidReason || '-'
        };
      }
      return o;
    }));

    alert(`Заказ #${deliveryModalOrder.id} доставлен клиенту! Электронный чек сформирован.`);
    setDeliveryModalOrder(null);
  };

  // Print Receipt
  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Чек Cosmo Cleaning #${order.id}</title>
          <style>
            body { font-family: monospace; padding: 16px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 16px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; font-size: 14px; }
            .footer { text-align: center; margin-top: 16px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>COSMO CLEANING SAMARKAND</h3>
            <p>Чек доставки №${order.id}</p>
            <p>${new Date().toLocaleString('ru-RU')}</p>
          </div>
          <div class="row"><span>Клиент:</span><span>${order.clientName}</span></div>
          <div class="row"><span>Тел:</span><span>${order.phone}</span></div>
          <div class="row"><span>Адрес:</span><span>${order.address}</span></div>
          <div class="row"><span>Курьер:</span><span>${courierName}</span></div>
          <hr/>
          <div class="row"><span>Сумма заказа:</span><span>${(order.totalAmount || 0).toLocaleString()} сум</span></div>
          <div class="row"><span>Оплачено:</span><span>${(order.paidAmount || order.totalAmount || 0).toLocaleString()} сум</span></div>
          <div class="row"><span>Тип оплаты:</span><span>${order.paymentType || 'Наличные'}</span></div>
          <div class="total row"><span>ИТОГО К ОПЛАТЕ:</span><span>${(order.totalAmount || 0).toLocaleString()} сум</span></div>
          <div class="footer">
            <p>Спасибо, что выбрали Cosmo Cleaning!</p>
            <p>Тел поддежки: +998 90 123 45 67</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Reassign Order
  const handleReassignSubmit = (e) => {
    e.preventDefault();
    if (!reassignModalOrder) return;

    setOrders(orders.map(o => o.id === reassignModalOrder.id ? { ...o, assignedCourier: targetCourier } : o));
    alert(`Заказ #${reassignModalOrder.id} успешно передан курьеру ${targetCourier}! В Telegram отправлено авто-уведомление.`);
    setReassignModalOrder(null);
  };

  // Create Street Order
  const handleCreateStreetOrder = (e) => {
    e.preventDefault();
    const newId = `${Math.floor(5200 + Math.random() * 500)}`;
    const newOrderObj = {
      id: newId,
      clientName: streetOrder.clientName || 'Клиент с улицы',
      phone: streetOrder.phone,
      address: streetOrder.address,
      district: streetOrder.district,
      status: 'cleaning', // Immediately picked up
      paymentStatus: 'unpaid',
      assignedCourier: courierName,
      urgent: false,
      items: [{ name: 'Ковры (Забор на месте)', qty: streetOrder.itemsCount, price: 18000, total: streetOrder.itemsCount * 18000 }],
      totalAmount: streetOrder.itemsCount * 18000,
      paidAmount: 0,
      notes: streetOrder.notes + (gpsLocation ? ` | GPS: ${gpsLocation}` : ''),
      createdDate: new Date().toLocaleString('ru-RU')
    };

    setOrders([newOrderObj, ...orders]);
    alert(`Новый заказ с улицы #${newId} зарегистрирован и передан в цех!`);
    setActiveSubTab('pickups');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
      {/* Top Mobile Header */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(17, 24, 39, 0.9) 100%)',
        border: '1px solid var(--accent-gradient-gold)',
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
            background: 'var(--accent-gradient-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '800',
            flexShrink: 0
          }}>
            <Truck size={24} />
          </div>
          <div>
            <span className="badge badge-pickup" style={{ fontSize: '10px' }}>Мобильный кабинет Курьера</span>
            <h2 style={{ fontSize: '18px', fontWeight: '800' }}>{courierName}</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Задач на смене: <strong>{myPickups.length + myDeliveries.length}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={onLogout} className="btn btn-secondary" style={{ fontSize: '12px', color: '#f43f5e' }}>
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </div>

      {/* Live Continuous GPS Status Bar */}
      <div style={{
        background: isGpsActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
        border: `1px solid ${isGpsActive ? '#10b981' : '#f43f5e'}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Radio size={20} color={isGpsActive ? '#10b981' : '#f43f5e'} className={isGpsActive ? 'animate-pulse' : ''} />
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isGpsActive ? '📡 GPS Геолокация передается непрерывно' : '⚠️ GPS Трекинг остановлен'}
              <span className={`badge ${isGpsActive ? 'badge-done' : 'badge-cancel'}`} style={{ fontSize: '10px' }}>
                {isGpsActive ? 'В эфире' : 'Офлайн'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {liveGpsData?.lat ? (
                <>Координаты: <strong>{liveGpsData.lat.toFixed(5)}, {liveGpsData.lng.toFixed(5)}</strong> | Точность: ~{liveGpsData.accuracy || 10}м | Обновлений: #{gpsUpdateCount}</>
              ) : (
                'Ожидание отклика GPS датчика телефона...'
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsGpsActive(!isGpsActive)}
          className={`btn ${isGpsActive ? 'btn-secondary' : 'btn-primary'}`}
          style={{ fontSize: '11px', padding: '6px 12px' }}
        >
          {isGpsActive ? 'Пауза GPS' : 'Включить GPS'}
        </button>
      </div>

      {/* Filter Scope Switcher: My vs All */}
      <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
        <button
          onClick={() => setScopeFilter('my')}
          className="btn"
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '12px',
            background: scopeFilter === 'my' ? 'var(--accent-gradient)' : 'transparent',
            color: scopeFilter === 'my' ? '#fff' : 'var(--text-muted)'
          }}
        >
          📌 Назначенные мне ({orders.filter(o => (o.assignedCourier === courierName || o.assignedCourier === 'Все курьеры') && (o.status !== 'done')).length})
        </button>
        <button
          onClick={() => setScopeFilter('all')}
          className="btn"
          style={{
            flex: 1,
            padding: '8px',
            fontSize: '12px',
            background: scopeFilter === 'all' ? 'var(--accent-gradient)' : 'transparent',
            color: scopeFilter === 'all' ? '#fff' : 'var(--text-muted)'
          }}
        >
          🌐 Все заказы CRM ({orders.filter(o => o.status !== 'done').length})
        </button>
      </div>

      {/* Navigation SubTabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveSubTab('pickups')}
          className="btn"
          style={{
            flex: 1,
            padding: '10px',
            background: activeSubTab === 'pickups' ? 'var(--accent-gradient-gold)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '700'
          }}
        >
          📥 Забор ({myPickups.length})
        </button>

        <button
          onClick={() => setActiveSubTab('deliveries')}
          className="btn"
          style={{
            flex: 1,
            padding: '10px',
            background: activeSubTab === 'deliveries' ? 'var(--accent-gradient-emerald)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '700'
          }}
        >
          📦 Доставка ({myDeliveries.length})
        </button>

        <button
          onClick={() => setActiveSubTab('newOrder')}
          className="btn"
          style={{
            padding: '10px 14px',
            background: activeSubTab === 'newOrder' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '700'
          }}
        >
          <Plus size={16} /> Новый заказ
        </button>
      </div>

      {/* VIEW 1: Street Order Form */}
      {activeSubTab === 'newOrder' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            ➕ Оформление заказа "С улицы" (Курьером на выезде)
          </h3>

          <form onSubmit={handleCreateStreetOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">ФИО Клиента</label>
              <input 
                type="text"
                required
                value={streetOrder.clientName}
                onChange={(e) => setStreetOrder({ ...streetOrder, clientName: e.target.value })}
                className="input-field"
                placeholder="Имя клиента"
              />
            </div>

            <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="input-group">
                <label className="input-label">Номер телефона</label>
                <input 
                  type="text"
                  required
                  value={streetOrder.phone}
                  onChange={(e) => setStreetOrder({ ...streetOrder, phone: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Район города</label>
                <select 
                  value={streetOrder.district}
                  onChange={(e) => setStreetOrder({ ...streetOrder, district: e.target.value })}
                  className="select-field"
                >
                  <option value="Сиёб">Сиёб</option>
                  <option value="Багишамальский">Багишамальский</option>
                  <option value="Согдиана">Согдиана</option>
                  <option value="Микрорайон">Микрорайон</option>
                  <option value="Саттепо">Саттепо</option>
                  <option value="Железнодорожный">Железнодорожный</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Точный адрес</label>
              <input 
                type="text"
                required
                value={streetOrder.address}
                onChange={(e) => setStreetOrder({ ...streetOrder, address: e.target.value })}
                className="input-field"
                placeholder="Улица, ориентир"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Количество вещей / изделий (шт)</label>
              <input 
                type="number"
                min="1"
                value={streetOrder.itemsCount}
                onChange={(e) => setStreetOrder({ ...streetOrder, itemsCount: parseInt(e.target.value) || 1 })}
                className="input-field"
              />
            </div>

            <button type="button" onClick={handleCaptureGPS} className="btn btn-secondary">
              <Compass size={16} /> {gpsLocation ? `GPS Захвачен (${gpsLocation})` : 'Захватить текущие GPS координаты'}
            </button>

            <button type="submit" className="btn btn-primary">
              <CheckCircle2 size={16} /> Принять & Передать в Цех
            </button>
          </form>
        </div>
      )}

      {/* VIEW 2 & 3: Order Cards List */}
      {activeSubTab !== 'newOrder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentList.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
              <div>Все задачи в данном разделе выполнены!</div>
            </div>
          ) : (
            currentList.map((order) => (
              <div 
                key={order.id} 
                className="glass-card"
                style={{
                  borderLeft: order.urgent ? '4px solid #f43f5e' : '4px solid var(--accent-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                      #{order.id}
                    </span>
                    {order.urgent && (
                      <span className="badge badge-cancel" style={{ fontSize: '10px' }}>
                        <ShieldAlert size={10} /> 🔥 СРОЧНО
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      [{order.district || 'Самарканд'}]
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      onClick={() => setReassignModalOrder(order)} 
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      title="Передать другому курьеру"
                    >
                      <ArrowLeftRight size={12} /> Передать
                    </button>

                    <span className={`badge badge-${order.status}`}>
                      {order.status === 'new' && 'Ожидает приезда'}
                      {order.status === 'pickup' && 'В пути на забор'}
                      {order.status === 'ready' && 'Готов в цеху'}
                      {order.status === 'delivery' && 'В пути на доставку'}
                    </span>
                  </div>
                </div>

                {/* Client Info & Direct Phone Call */}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{order.clientName}</div>
                  <a 
                    href={`tel:${order.phone}`} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--accent-primary)', fontWeight: '700', marginTop: '4px', textDecoration: 'none' }}
                  >
                    <Phone size={14} /> {order.phone} (Позвонить)
                  </a>
                </div>

                {/* Address & Yandex.Navigator */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                    <MapPin size={16} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <span>{order.address}</span>
                      {order.landmark && (
                        <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
                          Ориентир: {order.landmark}
                        </div>
                      )}
                    </div>
                  </div>
                  <a 
                    href={order.gpsLocation ? `https://yandex.ru/maps/?text=${encodeURIComponent(order.gpsLocation)}` : `https://yandex.ru/maps/?text=${encodeURIComponent(order.address + ' Самарканд')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-secondary" 
                    style={{ fontSize: '11px', padding: '4px 8px', flexShrink: 0, color: order.gpsLocation ? '#10b981' : '#38bdf8' }}
                  >
                    <Navigation size={12} /> {order.gpsLocation ? '📍 Маршрут по GPS' : 'Навигатор'}
                  </a>
                </div>

                {/* Items & Notes */}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <strong>Позиции:</strong> {order.items ? order.items.map(it => `${it.name} (${it.qty})`).join(', ') : 'Ковры / изделия'}
                  {order.agreedPricePerM2 && (
                    <div style={{ color: '#10b981', fontWeight: '700', marginTop: '2px' }}>
                      🤝 Договоренная цена: {order.agreedPricePerM2.toLocaleString()} сум/м² (Стандарт: {order.standardPricePerM2 || 14000} сум)
                    </div>
                  )}
                  {order.gpsLocation && (
                    <div style={{ color: '#38bdf8', fontSize: '11px', marginTop: '2px' }}>
                      📍 GPS локация забора зафиксирована ({order.gpsLocation})
                    </div>
                  )}
                </div>

                {/* Amount & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                      {(order.totalAmount || 0).toLocaleString()} сум
                    </div>
                    <span style={{ fontSize: '11px', color: order.paymentStatus === 'paid' ? '#10b981' : '#f43f5e', fontWeight: '700' }}>
                      {order.paymentStatus === 'paid' ? '● Оплачено' : '● Не оплачено'}
                    </span>
                  </div>

                  {activeSubTab === 'pickups' ? (
                    <button 
                      onClick={() => { setPickupModalOrder(order); setPickupItemsCount(1); setPickupConditionNotes(''); setAgreedPricePerM2(12000); setStandardPricePerM2(14000); setNegotiatedNotes(''); }}
                      className="btn btn-primary"
                      style={{ background: 'var(--accent-gradient-gold)', fontSize: '13px' }}
                    >
                      <Check size={16} /> Принять & Передать в цех
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => handlePrintReceipt(order)}
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '6px' }}
                        title="Печать чека"
                      >
                        <Printer size={14} /> Чек
                      </button>
                      <button 
                        onClick={() => openDeliveryModal(order)}
                        className="btn btn-primary"
                        style={{ background: 'var(--accent-gradient-emerald)', fontSize: '13px' }}
                      >
                        <CheckCircle2 size={16} /> Выполнить & Расчет
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: Confirm Pickup */}
      {pickupModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Прием заказа #{pickupModalOrder.id} у клиента</h3>
              <button onClick={() => setPickupModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <form onSubmit={handleConfirmPickupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Фактическое кол-во принятых вещей (шт) *</label>
                <input 
                  type="number" 
                  min="1" 
                  required
                  value={pickupItemsCount} 
                  onChange={(e) => setPickupItemsCount(parseInt(e.target.value) || 1)} 
                  className="input-field" 
                />
              </div>

              {/* Negotiated Price per m2 */}
              <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Стандартная цена (сум/м²)</label>
                  <input 
                    type="number" 
                    value={standardPricePerM2} 
                    onChange={(e) => setStandardPricePerM2(parseFloat(e.target.value) || 14000)} 
                    className="input-field" 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ color: '#10b981' }}>Согласованная цена (сум/м²) *</label>
                  <input 
                    type="number" 
                    required
                    value={agreedPricePerM2} 
                    onChange={(e) => setAgreedPricePerM2(parseFloat(e.target.value) || 12000)} 
                    className="input-field" 
                    style={{ borderColor: '#10b981', color: '#10b981', fontWeight: '800' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Договоренности по цене / скидкам с клиентом</label>
                <input 
                  type="text" 
                  value={negotiatedNotes} 
                  onChange={(e) => setNegotiatedNotes(e.target.value)} 
                  className="input-field" 
                  placeholder="Например: Скидка за объем 12000 сум вместо 14000 сум" 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Примечания к состоянию изделий (пятна/износ)</label>
                <input 
                  type="text" 
                  value={pickupConditionNotes} 
                  onChange={(e) => setPickupConditionNotes(e.target.value)} 
                  className="input-field" 
                  placeholder="Например: Пятна кофе на ковре, износ бахромы" 
                />
              </div>

              {/* GPS Capture Button */}
              <button 
                type="button" 
                onClick={handleCaptureGPS} 
                className="btn" 
                style={{ 
                  background: gpsLocation ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)', 
                  border: gpsLocation ? '1px solid #10b981' : '1px solid #38bdf8',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Compass size={16} /> 
                {gpsLocation ? `📍 GPS Локация Захвачена (${gpsLocation})` : '📍 Захватить точную GPS локацию забора (для навигации)'}
              </button>

              <button type="submit" className="btn btn-primary" style={{ background: 'var(--accent-gradient-gold)' }}>
                Подтвердить Забор & Статус "В цеху"
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Delivery & Settlement */}
      {deliveryModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Расчет и Доставка #{deliveryModalOrder.id}</h3>
              <button onClick={() => setDeliveryModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <form onSubmit={handleConfirmDeliverySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: '800', color: '#10b981' }}>
                Итого к оплате: {(deliveryModalOrder.totalAmount || 0).toLocaleString()} сум
              </div>

              <div className="input-group">
                <label className="input-label">Способ оплаты</label>
                <select 
                  value={paymentType} 
                  onChange={(e) => setPaymentType(e.target.value)} 
                  className="select-field"
                >
                  <option value="cash">💵 Наличные</option>
                  <option value="click">💳 Карта (Click)</option>
                  <option value="payme">💳 Карта (Payme)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Получено от клиента (сум) *</label>
                <input 
                  type="number" 
                  required
                  value={paidAmount} 
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} 
                  className="input-field" 
                />
              </div>

              {paidAmount < deliveryModalOrder.totalAmount && (
                <div className="input-group">
                  <label className="input-label" style={{ color: '#f43f5e' }}>Причина неполной оплаты *</label>
                  <input 
                    type="text" 
                    required
                    value={underpaidReason} 
                    onChange={(e) => setUnderpaidReason(e.target.value)} 
                    className="input-field" 
                    placeholder="Например: Оплатит завтра через Click" 
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ background: 'var(--accent-gradient-emerald)' }}>
                Выполнить Заказ & Сформировать Чек
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reassign Courier */}
      {reassignModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Передать заказ #{reassignModalOrder.id}</h3>
              <button onClick={() => setReassignModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <form onSubmit={handleReassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Выберите ответственного курьера</label>
                <select 
                  value={targetCourier} 
                  onChange={(e) => setTargetCourier(e.target.value)} 
                  className="select-field"
                >
                  {activeCouriers.map(c => (
                    <option key={c.id || c.username} value={c.name || c.username}>
                      {c.name || c.username}
                    </option>
                  ))}
                  <option value="Все курьеры">Все курьеры (Свободный забор)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                Передать & Отправить Push в Telegram
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
