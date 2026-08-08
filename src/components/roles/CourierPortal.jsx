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
  Radio, 
  MessageSquare, 
  Copy, 
  Calendar, 
  User, 
  Languages, 
  Tag, 
  ExternalLink,
  Search,
  Filter,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { serviceCatalog } from '../../data/initialData';
import { startContinuousGpsTracking, stopContinuousGpsTracking } from '../../services/gpsTrackingService';
import { getActiveCouriers } from '../../services/staffHelper';
import { sendSMSNotification } from '../../services/smsService';

export default function CourierPortal({ orders, setOrders, currentUser, onLogout, registeredUsers }) {
  const activeCouriers = getActiveCouriers(registeredUsers);

  // Tabs: 'pickups' (Забор) | 'deliveries' (Доставка) | 'newOrder' (Новый заказ с улицы)
  const [activeSubTab, setActiveSubTab] = useState('pickups');
  // Scope: 'my' (только мои заказы) | 'all' (все заказы CRM)
  const [scopeFilter, setScopeFilter] = useState('my');
  // Search and District Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [urgentOnlyFilter, setUrgentOnlyFilter] = useState(false);

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
  const [smsModalOrder, setSmsModalOrder] = useState(null);
  const [customSmsText, setCustomSmsText] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(null);

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
    language: 'Русский',
    landmark: '',
    totalAmount: 180000,
    notes: '',
    itemsCount: 1
  });

  // Filter logic
  const filteredOrdersByScope = orders.filter(o => {
    // Scope filter
    if (scopeFilter === 'my') {
      const cour = o.assignedCourier || '';
      const myName = courierName;
      const isAssigned = cour === myName || cour === 'Все курьеры' || cour === 'Не назначен' || cour === '';
      if (!isAssigned) return false;
    }

    // District filter
    if (districtFilter !== 'all' && (o.district || 'Сиёб') !== districtFilter) {
      return false;
    }

    // Urgent filter
    if (urgentOnlyFilter && !o.urgent) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const idMatch = String(o.id || '').toLowerCase().includes(q);
      const nameMatch = String(o.clientName || o.name || '').toLowerCase().includes(q);
      const phoneMatch = String(o.phone || o.clientPhone || '').toLowerCase().includes(q);
      const addrMatch = String(o.address || '').toLowerCase().includes(q);
      const landmarkMatch = String(o.landmark || '').toLowerCase().includes(q);
      const noteMatch = String(o.notes || o.comment || '').toLowerCase().includes(q);
      const distMatch = String(o.district || '').toLowerCase().includes(q);
      const langMatch = String(o.language || '').toLowerCase().includes(q);
      const sumMatch = String(o.totalAmount || o.agreedAmount || '').includes(q);

      if (!idMatch && !nameMatch && !phoneMatch && !addrMatch && !landmarkMatch && !noteMatch && !distMatch && !langMatch && !sumMatch) {
        return false;
      }
    }

    return true;
  });

  const myPickups = filteredOrdersByScope.filter(o => o.status === 'new' || o.status === 'pickup');
  const myDeliveries = filteredOrdersByScope.filter(o => o.status === 'ready' || o.status === 'delivery');
  const myDone = filteredOrdersByScope.filter(o => o.status === 'done');

  const currentList = activeSubTab === 'pickups' 
    ? myPickups 
    : activeSubTab === 'deliveries' 
    ? myDeliveries 
    : myDone;

  // Language formatting with badge
  const renderLanguageBadge = (lang) => {
    const l = String(lang || 'Русский').toLowerCase();
    if (l.includes('узб') || l.includes('uz') || l.includes("o'zbek")) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.25) 100%)',
          border: '1px solid #06b6d4',
          color: '#38bdf8',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          🇺🇿 O'zbek tili
        </span>
      );
    }
    if (l.includes('тадж') || l.includes('tj') || l.includes('тоҷик')) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.2) 0%, rgba(245, 158, 11, 0.25) 100%)',
          border: '1px solid #f97316',
          color: '#fb923c',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          🇹🇯 Тоҷикӣ
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)',
        border: '1px solid #818cf8',
        color: '#a5b4fc',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '700'
      }}>
        🇷🇺 Русский язык
      </span>
    );
  };

  // Copy Phone Number
  const handleCopyPhone = (phone, id) => {
    navigator.clipboard.writeText(phone);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

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
    setPaidAmount(order.totalAmount || order.agreedAmount || 0);
    setUnderpaidReason('');
    setPaymentType('cash');
  };

  // Confirm Delivery
  const handleConfirmDeliverySubmit = (e) => {
    e.preventDefault();
    if (!deliveryModalOrder) return;

    const expectedSum = deliveryModalOrder.totalAmount || deliveryModalOrder.agreedAmount || 0;
    if (paidAmount < expectedSum && !underpaidReason.trim()) {
      alert('Пожалуйста, укажите причину неполной оплаты!');
      return;
    }

    setOrders(orders.map(o => {
      if (o.id === deliveryModalOrder.id) {
        return {
          ...o,
          status: 'done',
          paymentStatus: paidAmount >= expectedSum ? 'paid' : 'partial',
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

  // Open Quick SMS Modal
  const handleOpenSmsModal = (order) => {
    setSmsModalOrder(order);
    const lang = String(order.language || 'Русский').toLowerCase();
    let defaultMsg = `Здравствуйте, ${order.clientName || 'уважаемый клиент'}! Курьер Cosmo Cleaning уже выехал к вам по заказу #${order.id}. Буду у вас в течение 20-30 минут. Тел: +998 90 123 45 67`;
    if (lang.includes('узб') || lang.includes('uz')) {
      defaultMsg = `Assalomu alaykum, ${order.clientName || 'hurmatli mijoz'}! Cosmo Cleaning kuryeri #${order.id}-sonli buyurtmangiz bo'yicha yo'lga chiqdi. 20-30 daqiqada yetib boramiz. Tel: +998 90 123 45 67`;
    } else if (lang.includes('тадж') || lang.includes('tj')) {
      defaultMsg = `Ассалому алейкум, ${order.clientName || 'мизоҷи муҳтарам'}! Курери Cosmo Cleaning бо фармоиши #${order.id} ба сӯи шумо равона шуд. Баъди 20-30 дақиқа мерасем. Тел: +998 90 123 45 67`;
    }
    setCustomSmsText(defaultMsg);
  };

  // Send Quick SMS
  const handleSendSmsSubmit = async (e) => {
    e.preventDefault();
    if (!smsModalOrder || !customSmsText.trim()) return;

    setSmsSending(true);
    const phone = smsModalOrder.phone || smsModalOrder.clientPhone;
    const res = await sendSMSNotification({ phone, text: customSmsText });
    setSmsSending(false);
    alert(res.message || `SMS успешно отправлено на номер ${phone}!`);
    setSmsModalOrder(null);
  };

  // Print Receipt
  const handlePrintReceipt = (order) => {
    const printWindow = window.open('', '_blank', 'width=420,height=700');
    const orderSum = order.totalAmount || order.agreedAmount || 0;
    const paidSum = order.paidAmount !== undefined ? order.paidAmount : orderSum;
    const clientPhone = order.phone || order.clientPhone || '-';
    const dispatcher = order.dispatcherName || order.createdBy || 'Мадина (Диспетчер)';
    const comment = order.notes || order.comment || 'Без дополнительных примечаний';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Чек Cosmo Cleaning #${order.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; padding: 18px; font-size: 13px; color: #111; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 14px; border-bottom: 2px dashed #333; padding-bottom: 10px; }
            .logo { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; }
            .sub { font-size: 11px; color: #555; margin-top: 2px; }
            .badge { display: inline-block; background: #eee; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .label { color: #555; font-weight: 500; }
            .val { font-weight: 700; text-align: right; }
            .box { background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin: 8px 0; }
            .total { font-weight: 900; border-top: 2px solid #111; padding-top: 8px; margin-top: 10px; font-size: 15px; }
            .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #666; border-top: 1px dashed #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">✨ COSMO CLEANING SAMARKAND ✨</div>
            <div class="sub">Профессиональная стирка ковров и химчистка</div>
            <div style="margin-top: 6px;"><span class="badge">ЧЕК ДОСТАВКИ №${order.id}</span></div>
            <div class="sub">${new Date().toLocaleString('ru-RU')}</div>
          </div>

          <div class="row"><span class="label">Клиент:</span><span class="val">${order.clientName || 'Клиент'}</span></div>
          <div class="row"><span class="label">Телефон:</span><span class="val">${clientPhone}</span></div>
          <div class="row"><span class="label">Язык клиента:</span><span class="val">${order.language || 'Русский'}</span></div>
          <div class="row"><span class="label">Район:</span><span class="val">${order.district || 'Самарканд'}</span></div>
          <div class="row"><span class="label">Адрес:</span><span class="val">${order.address || '-'}</span></div>
          ${order.landmark ? `<div class="row"><span class="label">Ориентир:</span><span class="val">${order.landmark}</span></div>` : ''}
          <div class="row"><span class="label">Диспетчер:</span><span class="val">${dispatcher}</span></div>
          <div class="row"><span class="label">Курьер:</span><span class="val">${courierName}</span></div>

          <div class="box">
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 11.5px;">💬 Комментарий диспетчера:</div>
            <div>${comment}</div>
          </div>

          <div class="box">
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 11.5px;">🧺 Позиции / Ковры:</div>
            ${order.items && order.items.length > 0 ? order.items.map(it => `
              <div class="row" style="font-size: 12px;">
                <span>${it.name} x${it.qty || 1}</span>
                <span>${(it.total || it.price || 0).toLocaleString()} сум</span>
              </div>
            `).join('') : '<div style="font-size: 12px;">Ковры / Изделия (Забор)</div>'}
            ${order.agreedPricePerM2 ? `<div style="font-size: 11.5px; color: #16a34a; font-weight: bold; margin-top: 4px;">🤝 Договорная ставка: ${order.agreedPricePerM2.toLocaleString()} сум/м²</div>` : ''}
          </div>

          <div class="row total">
            <span>ДОГОВОРНАЯ СУММА:</span>
            <span>${orderSum.toLocaleString()} сум</span>
          </div>
          <div class="row">
            <span class="label">Оплачено:</span>
            <span class="val" style="color: #16a34a;">${paidSum.toLocaleString()} сум</span>
          </div>
          <div class="row">
            <span class="label">Способ оплаты:</span>
            <span class="val">${order.paymentType || 'Наличные'}</span>
          </div>

          <div class="footer">
            <p><strong>Спасибо, что выбрали Cosmo Cleaning!</strong></p>
            <p>Служба поддержки: +998 90 123 45 67</p>
            <p>Гарантия чистоты и бережной сушки</p>
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
    alert(`Заказ #${reassignModalOrder.id} успешно передан курьеру ${targetCourier}!`);
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
      clientPhone: streetOrder.phone,
      address: streetOrder.address,
      district: streetOrder.district,
      language: streetOrder.language || 'Русский',
      landmark: streetOrder.landmark || '',
      status: 'cleaning', // Immediately picked up
      paymentStatus: 'unpaid',
      assignedCourier: courierName,
      dispatcherName: `Курьер (${courierName})`,
      urgent: false,
      items: [{ name: 'Ковры (Забор на месте)', qty: streetOrder.itemsCount, price: 18000, total: streetOrder.itemsCount * 18000 }],
      totalAmount: streetOrder.totalAmount || (streetOrder.itemsCount * 18000),
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
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid var(--accent-gradient-gold)',
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
            background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#070d1e',
            fontWeight: '900',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(250, 204, 21, 0.4)'
          }}>
            <Truck size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-pickup" style={{ fontSize: '10.5px', fontWeight: '800' }}>
                Мобильный Портал Курьера
              </span>
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>{courierName}</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              В работе: <strong style={{ color: '#facc15' }}>{myPickups.length} на забор</strong> | <strong style={{ color: '#10b981' }}>{myDeliveries.length} на доставку</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={onLogout} className="btn btn-secondary" style={{ fontSize: '12px', color: '#f43f5e', padding: '8px 14px', borderRadius: '10px' }}>
            <LogOut size={15} /> Выйти
          </button>
        </div>
      </div>

      {/* Live Continuous GPS Status Bar */}
      <div style={{
        background: isGpsActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
        border: `1.5px solid ${isGpsActive ? '#10b981' : '#f43f5e'}`,
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
              {isGpsActive ? '📡 GPS Геолокация передается диспетчеру' : '⚠️ GPS Трекинг остановлен'}
              <span className={`badge ${isGpsActive ? 'badge-done' : 'badge-cancel'}`} style={{ fontSize: '10px' }}>
                {isGpsActive ? 'В эфире' : 'Офлайн'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {liveGpsData?.lat ? (
                <>Координаты: <strong style={{ color: '#38bdf8' }}>{liveGpsData.lat.toFixed(5)}, {liveGpsData.lng.toFixed(5)}</strong> | Точность: ~{liveGpsData.accuracy || 10}м | Обновлений: #{gpsUpdateCount}</>
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
      <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.7)', padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <button
          onClick={() => setScopeFilter('my')}
          className="btn"
          style={{
            flex: 1,
            padding: '9px 12px',
            fontSize: '12.5px',
            fontWeight: '700',
            borderRadius: '10px',
            background: scopeFilter === 'my' ? 'linear-gradient(135deg, #facc15 0%, #eab308 100%)' : 'transparent',
            color: scopeFilter === 'my' ? '#070d1e' : 'var(--text-muted)',
            boxShadow: scopeFilter === 'my' ? '0 4px 12px rgba(250, 204, 21, 0.3)' : 'none'
          }}
        >
          📌 Назначенные мне ({orders.filter(o => (o.assignedCourier === courierName || o.assignedCourier === 'Все курьеры' || o.assignedCourier === 'Не назначен' || !o.assignedCourier) && o.status !== 'done').length})
        </button>
        <button
          onClick={() => setScopeFilter('all')}
          className="btn"
          style={{
            flex: 1,
            padding: '9px 12px',
            fontSize: '12.5px',
            fontWeight: '700',
            borderRadius: '10px',
            background: scopeFilter === 'all' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
            color: scopeFilter === 'all' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: scopeFilter === 'all' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          🌐 Все заказы CRM ({orders.filter(o => o.status !== 'done').length})
        </button>
      </div>

      {/* Navigation SubTabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('pickups')}
          className="btn"
          style={{
            flex: '1 1 120px',
            padding: '11px 14px',
            background: activeSubTab === 'pickups' ? 'linear-gradient(135deg, #facc15 0%, #eab308 100%)' : 'rgba(255,255,255,0.05)',
            color: activeSubTab === 'pickups' ? '#070d1e' : '#fff',
            fontSize: '13.5px',
            fontWeight: '800',
            borderRadius: '12px',
            boxShadow: activeSubTab === 'pickups' ? '0 4px 14px rgba(250, 204, 21, 0.35)' : 'none'
          }}
        >
          📥 Забор ({myPickups.length})
        </button>

        <button
          onClick={() => setActiveSubTab('deliveries')}
          className="btn"
          style={{
            flex: '1 1 120px',
            padding: '11px 14px',
            background: activeSubTab === 'deliveries' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '13.5px',
            fontWeight: '800',
            borderRadius: '12px',
            boxShadow: activeSubTab === 'deliveries' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
          }}
        >
          📦 Доставка ({myDeliveries.length})
        </button>

        <button
          onClick={() => setActiveSubTab('newOrder')}
          className="btn"
          style={{
            padding: '11px 16px',
            background: activeSubTab === 'newOrder' ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '800',
            borderRadius: '12px'
          }}
        >
          <Plus size={16} /> Новый заказ
        </button>
      </div>

      {/* Search & District Filter Bar */}
      {activeSubTab !== 'newOrder' && (
        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                placeholder="Поиск по ФИО, телефону, комментарию, адресу, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '36px', fontSize: '13px' }}
              />
            </div>

            <select 
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="select-field"
              style={{ width: '160px', fontSize: '13px' }}
            >
              <option value="all">📍 Все Районы</option>
              <option value="Сиёб">Сиёб</option>
              <option value="Багишамальский">Багишамальский</option>
              <option value="Согдиана">Согдиана</option>
              <option value="Микрорайон">Микрорайон</option>
              <option value="Саттепо">Саттепо</option>
              <option value="Железнодорожный">Железнодорожный</option>
              <option value="Самаркандский р-н">Самаркандский р-н</option>
              <option value="Центр">Центр</option>
            </select>

            <button
              onClick={() => setUrgentOnlyFilter(!urgentOnlyFilter)}
              className="btn"
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                background: urgentOnlyFilter ? '#f43f5e' : 'rgba(244, 63, 94, 0.15)',
                color: urgentOnlyFilter ? '#fff' : '#f43f5e',
                border: '1px solid #f43f5e',
                borderRadius: '10px',
                fontWeight: '700'
              }}
            >
              🔥 Срочные
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: Street Order Form */}
      {activeSubTab === 'newOrder' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1.5px solid #06b6d4' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '900', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', color: '#38bdf8' }}>
            ➕ Оформление заказа "С улицы" (Курьером на выезде)
          </h3>

          <form onSubmit={handleCreateStreetOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="input-group">
                <label className="input-label">ФИО Клиента *</label>
                <input 
                  type="text" 
                  required
                  value={streetOrder.clientName} 
                  onChange={(e) => setStreetOrder({ ...streetOrder, clientName: e.target.value })}
                  className="input-field" 
                  placeholder="Имя клиента"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Телефон Клиента *</label>
                <input 
                  type="text" 
                  required
                  value={streetOrder.phone} 
                  onChange={(e) => setStreetOrder({ ...streetOrder, phone: e.target.value })}
                  className="input-field" 
                  placeholder="+998 90 123 45 67"
                />
              </div>
            </div>

            <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="input-group">
                <label className="input-label">Район города (Самарканд)</label>
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
                  <option value="Самаркандский р-н">Самаркандский р-н</option>
                  <option value="Центр">Центр</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Язык общения клиента</label>
                <select 
                  value={streetOrder.language}
                  onChange={(e) => setStreetOrder({ ...streetOrder, language: e.target.value })}
                  className="select-field"
                >
                  <option value="Русский">Русский язык</option>
                  <option value="Узбекский">O'zbek tili</option>
                  <option value="Таджикский">Тоҷикӣ</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Точный адрес (Улица, дом, квартира)</label>
              <input 
                type="text" 
                required
                value={streetOrder.address} 
                onChange={(e) => setStreetOrder({ ...streetOrder, address: e.target.value })}
                className="input-field" 
                placeholder="Улица, дом, квартира"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Ориентир (Рядом с...)</label>
              <input 
                type="text" 
                value={streetOrder.landmark} 
                onChange={(e) => setStreetOrder({ ...streetOrder, landmark: e.target.value })}
                className="input-field" 
                placeholder="Например: Возле мечети / Корзинки"
              />
            </div>

            <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="input-group">
                <label className="input-label">Кол-во ковров / вещей (шт)</label>
                <input 
                  type="number" 
                  min="1"
                  value={streetOrder.itemsCount} 
                  onChange={(e) => setStreetOrder({ ...streetOrder, itemsCount: parseInt(e.target.value) || 1 })}
                  className="input-field" 
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: '#facc15' }}>Договорная сумма (сум) *</label>
                <input 
                  type="number" 
                  value={streetOrder.totalAmount} 
                  onChange={(e) => setStreetOrder({ ...streetOrder, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="input-field" 
                  style={{ color: '#facc15', fontWeight: '800' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Комментарий / Примечание курьера</label>
              <textarea 
                rows={2}
                value={streetOrder.notes} 
                onChange={(e) => setStreetOrder({ ...streetOrder, notes: e.target.value })}
                className="textarea-field" 
                placeholder="Особые пожелания клиента, состояние ковра, договоренности"
              />
            </div>

            <button type="button" onClick={handleCaptureGPS} className="btn btn-secondary">
              <Compass size={16} /> {gpsLocation ? `GPS Захвачен (${gpsLocation})` : 'Захватить текущие GPS координаты'}
            </button>

            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', padding: '14px' }}>
              <CheckCircle2 size={18} /> Принять заказ & Отправить в цех
            </button>
          </form>
        </div>
      )}

      {/* VIEW 2: Order Cards List */}
      {activeSubTab !== 'newOrder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentList.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Все задачи в данном разделе выполнены!</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Новые заявки от диспетчера появятся здесь в реальном времени.</div>
            </div>
          ) : (
            currentList.map((order) => {
              const clientPhone = order.phone || order.clientPhone || '-';
              const cleanPhone = String(clientPhone).replace(/[^\d+]/g, '');
              const totalSum = order.totalAmount || order.agreedAmount || 0;
              const isPaid = order.paymentStatus === 'paid';
              const isPartial = order.paymentStatus === 'partial';
              const dispatcherName = order.dispatcherName || order.createdBy || 'Диспетчерская служба';
              const commentText = order.notes || order.comment || '';
              const orderId = order.id || '-';

              return (
                <div 
                  key={order.id} 
                  className="glass-card"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 17, 40, 0.98) 100%)',
                    border: order.urgent ? '1.5px solid #f43f5e' : '1.5px solid rgba(59, 130, 246, 0.3)',
                    borderLeft: order.urgent ? '6px solid #f43f5e' : '6px solid #facc15',
                    borderRadius: '20px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: order.urgent ? '0 10px 30px rgba(244, 63, 94, 0.25)' : '0 10px 30px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                        color: '#070d1e',
                        padding: '4px 12px',
                        borderRadius: '10px',
                        fontWeight: '900',
                        fontSize: '14px',
                        boxShadow: '0 2px 8px rgba(250, 204, 21, 0.4)'
                      }}>
                        📦 Заказ #{orderId}
                      </span>

                      {order.urgent && (
                        <span className="badge badge-cancel" style={{ fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={12} /> 🔥 СРОЧНО
                        </span>
                      )}

                      <span style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#60a5fa',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        📍 {order.district || 'Самарканд'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => setReassignModalOrder(order)} 
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '11.5px', borderRadius: '8px' }}
                        title="Передать другому курьеру"
                      >
                        <ArrowLeftRight size={13} /> ⇄ Передать
                      </button>

                      <span className={`badge badge-${order.status}`} style={{ fontSize: '11px', fontWeight: '700' }}>
                        {order.status === 'new' && '⏳ Ожидает забора'}
                        {order.status === 'pickup' && '🚚 В пути на забор'}
                        {order.status === 'cleaning' && '🧼 В цеху (Стирка)'}
                        {order.status === 'ready' && '✨ Готов к доставке'}
                        {order.status === 'delivery' && '📦 На доставке'}
                        {order.status === 'done' && '✅ Выполнен'}
                      </span>
                    </div>
                  </div>

                  {/* 1. Client Details: Name, Language Badge, Phone & Fast Action Buttons */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Клиент (ФИО):
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
                          👤 {order.clientName || 'Клиент'}
                        </div>
                      </div>

                      {/* Language Badge */}
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '3px', textAlign: 'right' }}>
                          Язык общения:
                        </div>
                        {renderLanguageBadge(order.language)}
                      </div>
                    </div>

                    {/* Phone & Instant Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a 
                          href={`tel:${cleanPhone}`} 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            padding: '7px 14px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '13.5px',
                            textDecoration: 'none',
                            boxShadow: '0 3px 10px rgba(16, 185, 129, 0.35)'
                          }}
                        >
                          <Phone size={15} /> 📞 {clientPhone}
                        </a>

                        <button
                          onClick={() => handleCopyPhone(clientPhone, order.id)}
                          className="btn btn-secondary"
                          style={{ padding: '7px 10px', fontSize: '11px', borderRadius: '8px' }}
                          title="Скопировать телефон"
                        >
                          <Copy size={13} /> {copiedOrderId === order.id ? '✓ Скопировано' : 'Копировать'}
                        </button>
                      </div>

                      <button
                        onClick={() => handleOpenSmsModal(order)}
                        className="btn btn-secondary"
                        style={{
                          background: 'rgba(99, 102, 241, 0.2)',
                          borderColor: 'rgba(99, 102, 241, 0.4)',
                          color: '#818cf8',
                          padding: '7px 12px',
                          fontSize: '12px',
                          borderRadius: '8px',
                          fontWeight: '700'
                        }}
                      >
                        <MessageSquare size={14} /> Отправить SMS
                      </button>
                    </div>
                  </div>

                  {/* 2. Agreed Price & Payment Information (Договорная сумма диспетчера) */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.15) 0%, rgba(234, 179, 8, 0.08) 100%)',
                    border: '1.5px solid #facc15',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '11.5px', color: '#facc15', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        💰 Договорная сумма (введена диспетчером):
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', textShadow: '0 0 12px rgba(250, 204, 21, 0.4)', marginTop: '2px' }}>
                        {totalSum.toLocaleString()} сум
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '3px' }}>
                        Статус оплаты:
                      </div>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        background: isPaid ? 'rgba(16, 185, 129, 0.25)' : isPartial ? 'rgba(245, 158, 11, 0.25)' : 'rgba(244, 63, 94, 0.25)',
                        border: isPaid ? '1px solid #10b981' : isPartial ? '1px solid #f59e0b' : '1px solid #f43f5e',
                        color: isPaid ? '#34d399' : isPartial ? '#fbbf24' : '#f87171'
                      }}>
                        {isPaid && `✅ Оплачено полностью (${(order.paidAmount || totalSum).toLocaleString()} сум)`}
                        {isPartial && `⚠️ Частично (${(order.paidAmount || 0).toLocaleString()} сум)`}
                        {!isPaid && !isPartial && `🔴 Не оплачено (К оплате: ${totalSum.toLocaleString()} сум)`}
                      </span>
                    </div>
                  </div>

                  {/* 3. Dispatcher Comment / Notes Box (HIGHLIGHTED) */}
                  <div style={{
                    background: commentText ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(15, 23, 42, 0.9) 100%)' : 'rgba(255, 255, 255, 0.02)',
                    border: commentText ? '1.5px solid #f59e0b' : '1px dashed rgba(255, 255, 255, 0.1)',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: commentText ? '#facc15' : 'var(--text-muted)' }}>
                      <MessageSquare size={15} />
                      <span>💬 КОММЕНТАРИЙ / ПРИМЕЧАНИЕ ДИСПЕТЧЕРА:</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: commentText ? '#ffffff' : 'var(--text-dim)', lineHeight: '1.45', marginTop: '2px' }}>
                      {commentText ? commentText : 'Диспетчер не оставил дополнительных примечаний к заказу.'}
                    </div>
                  </div>

                  {/* 4. Address, Landmark, TimeSlot & Yandex Navigation */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <MapPin size={18} color="#facc15" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
                            {order.address || 'Адрес не указан'}
                          </div>
                          {order.landmark && (
                            <div style={{ fontSize: '12.5px', color: '#facc15', fontWeight: '700', marginTop: '3px' }}>
                              📍 <strong>Ориентир:</strong> {order.landmark}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '3px' }}>
                            🕒 <strong>Удобное время:</strong> {order.timeSlot || 'В любое время'}
                          </div>
                        </div>
                      </div>

                      {/* Navigation Link */}
                      <a 
                        href={order.gpsLocation ? `https://yandex.ru/maps/?text=${encodeURIComponent(order.gpsLocation)}` : `https://yandex.ru/maps/?text=${encodeURIComponent((order.district ? order.district + ', ' : '') + order.address + ' Самарканд')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn" 
                        style={{
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: '800',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}
                      >
                        <Navigation size={14} /> {order.gpsLocation ? '📍 GPS Маршрут' : 'Навигатор'}
                      </a>
                    </div>
                  </div>

                  {/* 5. Items / Carpets List & Tariff per m2 */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '12.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div>
                      <strong style={{ color: '#cbd5e1' }}>🧺 Позиции / Изделия:</strong>{' '}
                      <span style={{ color: '#fff', fontWeight: '600' }}>
                        {order.items && order.items.length > 0 
                          ? order.items.map(it => `${it.name} (${it.qty || 1} шт)`).join(', ') 
                          : 'Ковры / изделия (будут замерены в цеху)'}
                      </span>
                    </div>

                    {order.agreedPricePerM2 && (
                      <div style={{ color: '#10b981', fontWeight: '700', marginTop: '2px' }}>
                        🤝 Договорная ставка за м²: {order.agreedPricePerM2.toLocaleString()} сум/м²
                      </div>
                    )}
                  </div>

                  {/* 6. Dispatcher & Meta Info Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    fontSize: '11.5px',
                    color: 'var(--text-muted)',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} color="#94a3b8" />
                      <span>Оформил диспетчер: <strong style={{ color: '#e2e8f0' }}>{dispatcherName}</strong></span>
                    </div>
                    <div>
                      <span>Создан: <strong style={{ color: '#e2e8f0' }}>{order.createdDate || 'Не указано'}</strong></span>
                    </div>
                  </div>

                  {/* 7. Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <button 
                      onClick={() => handlePrintReceipt(order)}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '9px 14px', borderRadius: '10px' }}
                      title="Печать / Скачать чек"
                    >
                      <Printer size={15} /> Чек
                    </button>

                    {activeSubTab === 'pickups' ? (
                      <button 
                        onClick={() => { 
                          setPickupModalOrder(order); 
                          setPickupItemsCount(order.items?.length || 1); 
                          setPickupConditionNotes(''); 
                          setAgreedPricePerM2(order.agreedPricePerM2 || 12000); 
                          setStandardPricePerM2(14000); 
                          setNegotiatedNotes(''); 
                        }}
                        className="btn btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
                          color: '#070d1e',
                          fontSize: '13.5px',
                          fontWeight: '900',
                          padding: '10px 18px',
                          borderRadius: '12px',
                          boxShadow: '0 4px 14px rgba(250, 204, 21, 0.35)'
                        }}
                      >
                        <Check size={16} /> Принять & Передать в цех
                      </button>
                    ) : (
                      <button 
                        onClick={() => openDeliveryModal(order)}
                        className="btn btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          fontSize: '13.5px',
                          fontWeight: '900',
                          padding: '10px 18px',
                          borderRadius: '12px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                        }}
                      >
                        <CheckCircle2 size={16} /> Выполнить доставку & Расчет
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL 1: Confirm Pickup */}
      {pickupModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-modal)', border: '1.5px solid #facc15' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#facc15', color: '#070d1e', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '13px' }}>
                  #{pickupModalOrder.id}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>Прием заказа у клиента</h3>
              </div>
              <button onClick={() => setPickupModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }}>
              <div>👤 <strong>Клиент:</strong> {pickupModalOrder.clientName} ({pickupModalOrder.phone || pickupModalOrder.clientPhone})</div>
              <div style={{ marginTop: '2px' }}>🏠 <strong>Адрес:</strong> {pickupModalOrder.address}</div>
              {pickupModalOrder.notes && (
                <div style={{ color: '#facc15', marginTop: '4px', fontWeight: '600' }}>
                  💬 Примечание: {pickupModalOrder.notes}
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmPickupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Фактическое кол-во принятых ковров/вещей (шт) *</label>
                <input 
                  type="number" 
                  min="1" 
                  required
                  value={pickupItemsCount} 
                  onChange={(e) => setPickupItemsCount(parseInt(e.target.value) || 1)} 
                  className="input-field" 
                  style={{ fontSize: '15px', fontWeight: '800' }}
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
                  gap: '8px',
                  padding: '10px'
                }}
              >
                <Compass size={16} /> 
                {gpsLocation ? `📍 GPS Локация Захвачена (${gpsLocation})` : '📍 Захватить точную GPS локацию забора'}
              </button>

              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)', color: '#070d1e', fontWeight: '900', padding: '14px' }}>
                ✓ Подтвердить Забор & Статус "В цеху"
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Delivery & Settlement */}
      {deliveryModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-modal)', border: '1.5px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#10b981', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '13px' }}>
                  #{deliveryModalOrder.id}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: '800' }}>Расчет и Доставка заказа</h3>
              </div>
              <button onClick={() => setDeliveryModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '12px 14px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#a7f3d0', fontWeight: '600' }}>Сумма по договору с диспетчером:</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
                {(deliveryModalOrder.totalAmount || deliveryModalOrder.agreedAmount || 0).toLocaleString()} сум
              </div>
            </div>

            <form onSubmit={handleConfirmDeliverySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  style={{ fontSize: '16px', fontWeight: '800' }}
                />
              </div>

              {paidAmount < (deliveryModalOrder.totalAmount || deliveryModalOrder.agreedAmount || 0) && (
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

              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '14px', fontWeight: '900' }}>
                ✅ Выполнить Заказ & Сформировать Чек
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reassign Courier */}
      {reassignModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-modal)' }}>
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

              <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
                🚀 Передать заказ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Quick SMS Modal */}
      {smsModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#818cf8" />
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>SMS клиенту #{smsModalOrder.id}</h3>
              </div>
              <button onClick={() => setSmsModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }}>
              <div>👤 <strong>Клиент:</strong> {smsModalOrder.clientName}</div>
              <div>📞 <strong>Телефон:</strong> {smsModalOrder.phone || smsModalOrder.clientPhone}</div>
            </div>

            <form onSubmit={handleSendSmsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Текст SMS сообщения</label>
                <textarea 
                  rows={4}
                  required
                  value={customSmsText}
                  onChange={(e) => setCustomSmsText(e.target.value)}
                  className="textarea-field"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setSmsModalOrder(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Отмена
                </button>
                <button type="submit" disabled={smsSending} className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
                  {smsSending ? 'Отправка...' : 'Отправить SMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
