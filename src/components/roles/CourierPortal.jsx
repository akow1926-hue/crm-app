import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Check, 
  LogOut, 
  Package, 
  Plus, 
  ArrowLeftRight, 
  Printer, 
  X, 
  Compass, 
  Radio, 
  MessageSquare, 
  User, 
  Languages, 
  Search,
  Edit3,
  Headphones,
  Home,
  Send,
  Trash2
} from 'lucide-react';
import { serviceCatalog } from '../../data/initialData';
import { startContinuousGpsTracking, stopContinuousGpsTracking } from '../../services/gpsTrackingService';
import { getActiveCouriers } from '../../services/staffHelper';
import { sendSMSNotification, INSTAGRAM_QR_BASE64 } from '../../services/smsService';
import { getTelegramBotConfig, notifyOrderPickup, notifyOrderCompleted, notifyOrderCreated } from '../../services/telegramBotService';
import { deleteSupabaseOrder } from '../../services/supabaseService';
import { DeliveryDeadlineBadge } from '../../utils/deliveryDeadline';
import { printOrderReceipt } from '../../utils/printReceipt';

export default function CourierPortal({ orders, setOrders, currentUser, onLogout, registeredUsers }) {
  const activeCouriers = getActiveCouriers(registeredUsers);

  // Delete Order Handler for Courier Panel
  const handleDeleteOrder = (order) => {
    if (!order) return;
    const orderLabel = order.id ? `#${order.id}` : `клиента ${order.clientName || 'Без имени'}`;
    if (window.confirm(`Вы действительно хотите безвозвратно удалить заказ ${orderLabel}?`)) {
      setOrders(prevOrders => prevOrders.filter(o => {
        if (order.id && o.id && String(o.id) === String(order.id)) return false;
        if (order.tempId && o.tempId && String(o.tempId) === String(order.tempId)) return false;
        if (o === order) return false;
        return true;
      }));

      if (order.id) deleteSupabaseOrder(order.id);
      if (order.tempId && order.tempId !== order.id) deleteSupabaseOrder(order.tempId);

      alert(`Заказ ${orderLabel} успешно удален из системы!`);
    }
  };

  const getNextSequentialId = () => {
    if (!orders || orders.length === 0) return '5254';
    const nums = orders.map(o => parseInt(o.id, 10)).filter(n => !isNaN(n) && n > 1000);
    if (nums.length === 0) return '5254';
    const maxId = Math.max(...nums);
    return String(Math.max(maxId + 1, 5254));
  };

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
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [editModalOrder, setEditModalOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    clientName: '',
    phone: '',
    address: '',
    district: 'Сиёб',
    landmark: '',
    language: 'Русский',
    gpsLocation: '',
    notes: '',
    totalAmount: 0
  });

  // Load dynamic service catalog (configured by Admin)
  const availableServices = (() => {
    try {
      const saved = localStorage.getItem('cosmo_crm_service_catalog');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return serviceCatalog;
  })();

  // Pickup Form state & dynamic items list
  const [pickupItemsCount, setPickupItemsCount] = useState(1);
  const [pickupItemsList, setPickupItemsList] = useState([
    { serviceId: 'S-1', name: 'Мойка ковров', unit: 'м²', qty: 1, price: 15000 }
  ]);
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
    notes: '',
    items: [
      { serviceId: 'S-1', name: 'Мойка ковров', unit: 'м²', qty: 1, price: 15000 }
    ]
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
          gap: '3px',
          background: 'rgba(6, 182, 212, 0.15)',
          border: '1px solid #06b6d4',
          color: '#38bdf8',
          padding: '2px 6px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '700'
        }}>
          🇺🇿 UZ
        </span>
      );
    }
    if (l.includes('тадж') || l.includes('tj') || l.includes('тоҷик')) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          background: 'rgba(234, 88, 12, 0.15)',
          border: '1px solid #f97316',
          color: '#fb923c',
          padding: '2px 6px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '700'
        }}>
          🇹🇯 TJ
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        background: 'rgba(99, 102, 241, 0.15)',
        border: '1px solid #818cf8',
        color: '#a5b4fc',
        padding: '2px 6px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700'
      }}>
        🇷🇺 RU
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

  // Open Edit Modal
  const openEditModal = (order) => {
    setEditModalOrder(order);
    setEditFormData({
      id: order.id || '',
      tempId: order.tempId || '',
      clientName: order.clientName || '',
      phone: order.phone || order.clientPhone || '',
      address: order.address || '',
      district: order.district || 'Сиёб',
      landmark: order.landmark || '',
      language: order.language || 'Русский',
      gpsLocation: order.gpsLocation || '',
      notes: order.notes || order.comment || '',
      totalAmount: order.totalAmount || order.agreedAmount || 0
    });
  };

  // Save Edit Order
  const handleSaveEditOrder = (e) => {
    e.preventDefault();
    if (!editModalOrder) return;

    setOrders(orders.map(o => {
      const isTarget = (o.id && editModalOrder.id && o.id === editModalOrder.id) ||
                       (o.tempId && editModalOrder.tempId && o.tempId === editModalOrder.tempId) ||
                       (o === editModalOrder);
      if (isTarget) {
        return {
          ...o,
          id: editFormData.id.trim() || null,
          clientName: editFormData.clientName,
          phone: editFormData.phone,
          clientPhone: editFormData.phone,
          address: editFormData.address,
          district: editFormData.district,
          landmark: editFormData.landmark,
          language: editFormData.language,
          gpsLocation: editFormData.gpsLocation,
          notes: editFormData.notes,
          totalAmount: parseFloat(editFormData.totalAmount) || 0
        };
      }
      return o;
    }));

    alert('Заказ успешно обновлен!');
    setEditModalOrder(null);
  };

  // Pickup Delivery Days state (default 5 days)
  const [pickupDeliveryDays, setPickupDeliveryDays] = useState(5);

  // Open Pickup Modal with initial items
  const openPickupModal = (order) => {
    setPickupModalOrder(order);
    setPickupDeliveryDays(parseInt(order.deliveryDays, 10) || 5);
    setGpsLocation(order.gpsLocation || '');
    setPickupConditionNotes('');
    setNegotiatedNotes('');

    if (order.items && order.items.length > 0) {
      setPickupItemsList(order.items.map(it => ({
        serviceId: it.serviceId || 'S-1',
        name: it.serviceName || it.name?.split(' (')[0] || 'Мойка ковров',
        unit: it.unit || 'м²',
        qty: it.qty || 1,
        price: it.price || 15000
      })));
    } else {
      const defaultSvc = availableServices[0] || { name: 'Мойка ковров', unit: 'м²', price: 15000 };
      setPickupItemsList([
        { serviceId: defaultSvc.id, name: defaultSvc.name, unit: defaultSvc.unit, qty: 1, price: defaultSvc.price }
      ]);
    }
  };

  // Confirm Pickup with dynamic items (ковры, курпачи, подушки, занавески, мебель...)
  const handleConfirmPickupSubmit = (e) => {
    e.preventDefault();
    if (!pickupModalOrder) return;

    const totalItemsQty = pickupItemsList.reduce((sum, item) => sum + (parseInt(item.qty) || 1), 0);
    const itemsFormatted = pickupItemsList.map(it => {
      const unitPrice = parseFloat(it.price) || 0;
      const qty = parseInt(it.qty) || 1;
      const total = (it.unit === 'шт' || it.unit === 'комплект' || it.unit === 'место') ? qty * unitPrice : 0;
      return {
        name: `${it.name} (${it.unit})`,
        serviceName: it.name,
        unit: it.unit,
        qty: qty,
        price: unitPrice,
        total: total
      };
    });

    const fixedTotalAmount = itemsFormatted.reduce((sum, it) => sum + (it.total || 0), 0);

    const itemsSummaryStr = pickupItemsList.map(i => `${i.name}: ${i.qty} ${i.unit}`).join(', ');
    const customNote = `[Забор курьером: ${itemsSummaryStr}. Срок доставки: ${pickupDeliveryDays} дн. ${pickupConditionNotes ? 'Состояние: ' + pickupConditionNotes : ''} ${negotiatedNotes ? 'Договоренность: ' + negotiatedNotes : ''}]`;

    let assignedId = pickupModalOrder.id;
    if (!assignedId || assignedId === 'Б/Н' || assignedId === '-') {
      assignedId = getNextSequentialId();
    }

    let updatedTargetOrder = null;

    setOrders(orders.map(o => {
      const isTarget = (o.id && pickupModalOrder.id && o.id === pickupModalOrder.id) ||
                       (o.tempId && pickupModalOrder.tempId && o.tempId === pickupModalOrder.tempId) ||
                       (o === pickupModalOrder) ||
                       (!o.id && o.clientName === pickupModalOrder.clientName && o.createdDate === pickupModalOrder.createdDate);
      if (isTarget) {
        const updated = {
          ...o,
          id: assignedId,
          status: 'cleaning',
          deliveryDays: pickupDeliveryDays,
          pickupDate: new Date().toISOString(),
          itemsCount: totalItemsQty,
          items: itemsFormatted,
          totalAmount: fixedTotalAmount > 0 ? fixedTotalAmount : (o.totalAmount || 0),
          gpsLocation: gpsLocation || o.gpsLocation || '',
          notes: (o.notes ? o.notes + ' | ' : '') + customNote
        };
        updatedTargetOrder = updated;
        return updated;
      }
      return o;
    }));

    // Trigger Telegram Group Notification (Case 2: Забор у клиента)
    notifyOrderPickup(updatedTargetOrder || { ...pickupModalOrder, id: assignedId, items: itemsFormatted }, {
      courier: courierName,
      items: itemsFormatted,
      notes: pickupConditionNotes,
      negotiated: negotiatedNotes
    }).catch(err => console.warn('Telegram pickup notify error:', err));

    alert(`Заказ принято у клиента! Выдан официальный номер заказа: #${assignedId}. Состав: ${itemsSummaryStr}. Передан в цех.`);
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

    const payTypeLabel = paymentType === 'cash' ? 'Наличные' : paymentType === 'click' ? 'Click' : 'Payme';
    let updatedCompletedOrder = null;

    setOrders(orders.map(o => {
      if (o.id === deliveryModalOrder.id) {
        const updated = {
          ...o,
          status: 'done',
          paymentStatus: paidAmount >= expectedSum ? 'paid' : 'partial',
          paidAmount: paidAmount,
          paymentType: payTypeLabel,
          underpaidReason: underpaidReason || '-'
        };
        updatedCompletedOrder = updated;
        return updated;
      }
      return o;
    }));

    // Trigger Telegram Group Notification (Case 4: Закрытие заказа)
    notifyOrderCompleted(updatedCompletedOrder || { ...deliveryModalOrder, status: 'done', paidAmount, paymentType: payTypeLabel }, {
      courier: courierName,
      paidAmount: paidAmount,
      paymentType: payTypeLabel,
      underpaidReason: underpaidReason
    }).catch(err => console.warn('Telegram completed notify error:', err));

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

  // Open Printable Electronic Receipt Modal
  const handlePrintReceipt = (order) => {
    setReceiptModalOrder(order);
  };

  // Open Separate Print Window with thermal receipt layout
  const handlePrintReceiptWindow = (order) => {
    if (!order) return;
    printOrderReceipt({
      ...order,
      assignedCourier: courierName || order.assignedCourier,
      dispatcherName: order.dispatcherName || order.createdBy || 'Мадина'
    });
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
    const newId = getNextSequentialId();
    const formattedItems = (streetOrder.items || []).map(it => {
      const q = parseInt(it.qty) || 1;
      const p = parseFloat(it.price) || 0;
      const isFixed = it.unit === 'шт' || it.unit === 'комплект' || it.unit === 'место';
      return {
        name: `${it.name} (${it.unit})`,
        serviceName: it.name,
        unit: it.unit,
        qty: q,
        price: p,
        total: isFixed ? q * p : 0
      };
    });

    const fixedTotalAmount = formattedItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const totalItemsCount = formattedItems.reduce((sum, it) => sum + it.qty, 0);

    const newOrderObj = {
      id: newId,
      clientName: streetOrder.clientName || 'Клиент с улицы',
      phone: streetOrder.phone,
      clientPhone: streetOrder.phone,
      address: streetOrder.address,
      district: streetOrder.district,
      language: streetOrder.language || 'Русский',
      landmark: streetOrder.landmark || '',
      status: 'cleaning', // Immediately picked up & in washer workshop
      paymentStatus: 'unpaid',
      assignedCourier: courierName,
      dispatcherName: `Курьер (${courierName})`,
      urgent: false,
      itemsCount: totalItemsCount,
      items: formattedItems,
      totalAmount: fixedTotalAmount,
      paidAmount: 0,
      notes: (streetOrder.notes || '') + (gpsLocation ? ` | GPS: ${gpsLocation}` : ''),
      createdDate: new Date().toLocaleString('ru-RU')
    };

    setOrders([newOrderObj, ...orders]);

    // Trigger Telegram Group Notifications: Case 1 (Creation) and Case 2 (Pickup)
    notifyOrderCreated(newOrderObj).catch(err => console.warn('Telegram create notify error:', err));
    notifyOrderPickup(newOrderObj, {
      courier: courierName,
      items: formattedItems,
      notes: streetOrder.notes || 'Заказ принят курьером с улицы'
    }).catch(err => console.warn('Telegram pickup notify error:', err));

    alert(`Новый заказ с улицы #${newId} зарегистрирован и передан в цех!`);
    setActiveSubTab('pickups');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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
          {getTelegramBotConfig().channelId && (
            <a 
              href={getTelegramBotConfig().channelId.startsWith('@') ? `https://t.me/${getTelegramBotConfig().channelId.replace('@', '')}` : (getTelegramBotConfig().botUsername ? `https://t.me/${getTelegramBotConfig().botUsername}` : '#')}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '12px', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.4)', padding: '8px 12px', borderRadius: '10px' }}
              title="Открыть общую Telegram-группу заказов"
            >
              <Send size={14} /> Telegram Группа
            </a>
          )}
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
        <div className="glass-card animate-fade-in" style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          border: '1.5px solid #06b6d4',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(6, 182, 212, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <Package size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#38bdf8', margin: 0 }}>
              ➕ Заказ "С улицы" (Курьером)
            </h3>
          </div>

          <form onSubmit={handleCreateStreetOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '11px' }}>ФИО Клиента *</label>
                <input 
                  type="text" 
                  required
                  value={streetOrder.clientName} 
                  onChange={(e) => setStreetOrder({ ...streetOrder, clientName: e.target.value })}
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
                  value={streetOrder.phone} 
                  onChange={(e) => setStreetOrder({ ...streetOrder, phone: e.target.value })}
                  className="input-field" 
                  placeholder="+998 90..."
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>Адрес (Улица, дом, кв.) *</label>
              <input 
                type="text" 
                required
                value={streetOrder.address} 
                onChange={(e) => setStreetOrder({ ...streetOrder, address: e.target.value })}
                className="input-field" 
                placeholder="Улица, дом, квартира"
                style={{ fontSize: '13px', padding: '8px 10px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '11px' }}>Ориентир</label>
                <input 
                  type="text" 
                  value={streetOrder.landmark} 
                  onChange={(e) => setStreetOrder({ ...streetOrder, landmark: e.target.value })}
                  className="input-field" 
                  placeholder="Рядом с..."
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '11px' }}>Район</label>
                <select 
                  value={streetOrder.district}
                  onChange={(e) => setStreetOrder({ ...streetOrder, district: e.target.value })}
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

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>Язык общения</label>
              <select 
                value={streetOrder.language}
                onChange={(e) => setStreetOrder({ ...streetOrder, language: e.target.value })}
                className="select-field"
                style={{ fontSize: '12.5px', padding: '8px 10px' }}
              >
                <option value="Русский">Русский язык</option>
                <option value="Узбекский">O'zbek tili</option>
                <option value="Таджикский">Тоҷикӣ</option>
              </select>
            </div>

            {/* DYNAMIC SERVICES & ITEMS PICKER */}
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1.5px solid rgba(6, 182, 212, 0.35)',
              padding: '12px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8' }}>📦 Позиции & Услуги заказа:</span>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Цену можно менять</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(streetOrder.items || []).map((item, idx) => (
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
                      {(streetOrder.items || []).length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setStreetOrder({
                              ...streetOrder,
                              items: streetOrder.items.filter((_, i) => i !== idx)
                            });
                          }}
                          className="btn-icon" 
                          style={{ padding: '2px', color: '#f43f5e' }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <select 
                      value={item.name}
                      onChange={(e) => {
                        const selectedSvc = availableServices.find(s => s.name === e.target.value);
                        const nextItems = [...streetOrder.items];
                        nextItems[idx] = {
                          ...nextItems[idx],
                          serviceId: selectedSvc?.id || nextItems[idx].serviceId,
                          name: e.target.value,
                          unit: selectedSvc?.unit || 'шт',
                          price: selectedSvc?.price || nextItems[idx].price
                        };
                        setStreetOrder({ ...streetOrder, items: nextItems });
                      }}
                      className="select-field"
                      style={{ fontSize: '12.5px', padding: '6px 8px' }}
                    >
                      {availableServices.map(svc => (
                        <option key={svc.id} value={svc.name}>
                          {svc.name} ({svc.unit}) — {svc.price.toLocaleString()} сум
                        </option>
                      ))}
                    </select>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="input-group" style={{ margin: 0 }}>
                        <label className="input-label" style={{ fontSize: '10.5px' }}>Кол-во ({item.unit})</label>
                        <input 
                          type="number"
                          min="1"
                          required
                          value={item.qty}
                          onChange={(e) => {
                            const nextItems = [...streetOrder.items];
                            nextItems[idx].qty = parseInt(e.target.value) || 1;
                            setStreetOrder({ ...streetOrder, items: nextItems });
                          }}
                          className="input-field"
                          style={{ fontSize: '12.5px', padding: '6px 8px', fontWeight: '800' }}
                        />
                      </div>

                      <div className="input-group" style={{ margin: 0 }}>
                        <label className="input-label" style={{ fontSize: '10.5px' }}>Цена за 1 {item.unit} (сум)</label>
                        <input 
                          type="number"
                          required
                          value={item.price}
                          onChange={(e) => {
                            const nextItems = [...streetOrder.items];
                            nextItems[idx].price = parseFloat(e.target.value) || 0;
                            setStreetOrder({ ...streetOrder, items: nextItems });
                          }}
                          className="input-field"
                          style={{ fontSize: '12.5px', padding: '6px 8px', color: '#34d399', fontWeight: '800' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const defaultSvc = availableServices[0] || { name: 'Мойка ковров', unit: 'м²', price: 15000 };
                  setStreetOrder({
                    ...streetOrder,
                    items: [
                      ...(streetOrder.items || []),
                      { serviceId: defaultSvc.id, name: defaultSvc.name, unit: defaultSvc.unit, qty: 1, price: defaultSvc.price }
                    ]
                  });
                }}
                className="btn btn-secondary"
                style={{ fontSize: '11.5px', padding: '6px 10px', borderStyle: 'dashed', justifyContent: 'center' }}
              >
                <Plus size={13} /> Добавить позицию
              </button>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>Примечание курьера</label>
              <textarea 
                rows={2}
                value={streetOrder.notes} 
                onChange={(e) => setStreetOrder({ ...streetOrder, notes: e.target.value })}
                className="textarea-field" 
                placeholder="Состояние ковра, дефекты, ориентиры..."
                style={{ fontSize: '12.5px' }}
              />
            </div>

            <button type="button" onClick={handleCaptureGPS} className="btn btn-secondary" style={{ padding: '8px', fontSize: '12px' }}>
              <Compass size={14} /> {gpsLocation ? `📍 GPS: ${gpsLocation}` : '📍 Захватить координаты'}
            </button>

            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', padding: '12px', fontSize: '14px', fontWeight: '800' }}>
              <CheckCircle2 size={16} /> Принять заказ & Отправить в цех
            </button>
          </form>
        </div>
      )}

      {/* VIEW 2: Order Cards List (Grid layout with 4 square action buttons) */}
      {activeSubTab !== 'newOrder' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 320px))',
          gap: '14px',
          justifyContent: 'start',
          width: '100%'
        }}>
          {currentList.length === 0 ? (
            <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
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
              const dispatcherName = order.dispatcherName || order.createdBy || 'Диспетчер';
              const commentText = order.notes || order.comment || '';
              const orderId = (order.id && order.id !== 'Б/Н' && order.id !== '-') ? order.id : null;

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
                  {/* Row 1: Left Urgency & District, Right Order ID & Deadline Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {order.urgent && (
                        <span className="badge badge-cancel" style={{ fontSize: '10px', padding: '1px 5px', fontWeight: '800' }}>
                          🔥 СРОЧНО
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                        📍 {order.district || 'Самарканд'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <DeliveryDeadlineBadge order={order} />
                      <span style={{ fontSize: '15px', fontWeight: '900', color: orderId ? '#facc15' : '#94a3b8' }}>
                        № {orderId ? orderId : 'Б/Н'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Courier & Date/Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94a3b8' }}>
                    <Truck size={13} color="#facc15" />
                    <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{order.assignedCourier || courierName}</span>
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

                  {/* Row 4: Phone + SMS + Map Pin */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      <button
                        onClick={() => handleOpenSmsModal(order)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          color: '#818cf8',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        SMS
                      </button>
                    </div>

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
                        cursor: 'pointer',
                        textDecoration: 'none'
                      }}
                      title="Открыть на карте (Яндекс Навигатор)"
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

                  {/* Row 6: Language */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94a3b8' }}>
                    <Languages size={13} color="#c084fc" style={{ flexShrink: 0 }} />
                    <span>{order.language || 'Русский'}</span>
                  </div>

                  {/* Row 7: Dispatcher */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#94a3b8' }}>
                    <Headphones size={13} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dispatcherName}
                    </span>
                    {commentText && <span style={{ color: '#fde68a' }}>• 💬 {commentText}</span>}
                  </div>

                  {/* Row 8: Price & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#facc15' }}>
                      {totalSum.toLocaleString()} сум
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: isPaid ? '#34d399' : isPartial ? '#fbbf24' : '#f87171' }}>
                      {isPaid ? '✅ Оплачено' : isPartial ? '⚠️ Частично' : '🔴 Не оплачено'}
                    </span>
                  </div>

                  {/* Row 9: 5 Square Action Buttons [ ⇄ ] [ ✓ ] [ ✏️ ] [ 🧾 ] [ 🗑️ ] */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginTop: '4px' }}>
                    {/* 1. Reassign Driver */}
                    <button 
                      onClick={() => setReassignModalOrder(order)} 
                      className="btn"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        height: '36px',
                        padding: '0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Смена водителя (Передать заказ)"
                    >
                      <ArrowLeftRight size={15} />
                    </button>

                    {/* 2. Accept / Done */}
                    {activeSubTab === 'pickups' ? (
                      <button 
                        onClick={() => openPickupModal(order)}
                        className="btn"
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          height: '36px',
                          padding: '0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                        }}
                        title="Принял заказ (Забрал в цех)"
                      >
                        <Check size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => openDeliveryModal(order)}
                        className="btn"
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          height: '36px',
                          padding: '0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                        }}
                        title="Выполнить доставку & Расчет"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}

                    {/* 3. Edit Order */}
                    <button 
                      onClick={() => openEditModal(order)}
                      className="btn"
                      style={{
                        background: '#f59e0b',
                        color: '#070d1e',
                        height: '36px',
                        padding: '0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                      }}
                      title="Редактировать заказ (адрес, ID, GPS, комментарий)"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* 4. Receipt */}
                    <button 
                      onClick={() => handlePrintReceipt(order)}
                      className="btn"
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        height: '36px',
                        padding: '0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Чек заказа"
                    >
                      <Printer size={15} />
                    </button>

                    {/* 5. Delete Order */}
                    <button 
                      onClick={() => handleDeleteOrder(order)}
                      className="btn"
                      style={{
                        background: 'rgba(244, 63, 94, 0.15)',
                        border: '1px solid rgba(244, 63, 94, 0.4)',
                        color: '#f87171',
                        height: '36px',
                        padding: '0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Удалить заказ из системы"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL 1: Confirm Pickup */}
      {pickupModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '12px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-modal)', border: '1.5px solid #facc15', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: '#facc15', color: '#070d1e', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '13px' }}>
                  {pickupModalOrder.id ? `#${pickupModalOrder.id}` : 'Б/Н'}
                </span>
                <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: '#fff', wordBreak: 'break-word' }}>
                  {pickupModalOrder.id ? `Заказ #${pickupModalOrder.id}` : 'Прием заказа у клиента'}
                </h3>
              </div>
              <button onClick={() => setPickupModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', wordBreak: 'break-word' }}>
              <div>👤 <strong>Клиент:</strong> {pickupModalOrder.clientName} ({pickupModalOrder.phone || pickupModalOrder.clientPhone})</div>
              <div style={{ marginTop: '2px' }}>🏠 <strong>Адрес:</strong> {pickupModalOrder.address}</div>
              {pickupModalOrder.notes && (
                <div style={{ color: '#facc15', marginTop: '4px', fontWeight: '600' }}>
                  💬 Примечание: {pickupModalOrder.notes}
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmPickupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Dynamic Items Picker: Что ты берешь? */}
              <div style={{ background: 'rgba(250, 204, 21, 0.12)', border: '1.5px solid #facc15', padding: '14px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#facc15', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={18} />
                  <span>📦 ЧТО ТЫ БЕРЁШЬ У КЛИЕНТА?</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pickupItemsList.map((item, idx) => (
                    <div key={idx} style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8' }}>Позиция #{idx + 1}</span>
                        {pickupItemsList.length > 1 && (
                          <button type="button" onClick={() => setPickupItemsList(pickupItemsList.filter((_, i) => i !== idx))} className="btn-icon" style={{ padding: '2px' }}>
                            <X size={14} color="#f43f5e" />
                          </button>
                        )}
                      </div>

                      {/* Stacked mobile-responsive inputs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="input-group" style={{ width: '100%' }}>
                          <label className="input-label" style={{ fontSize: '11px' }}>Услуга / Продукт</label>
                          <select 
                            value={item.name}
                            onChange={(e) => {
                              const selectedSvc = availableServices.find(s => s.name === e.target.value);
                              const nextList = [...pickupItemsList];
                              nextList[idx] = {
                                ...nextList[idx],
                                name: e.target.value,
                                unit: selectedSvc?.unit || 'шт',
                                price: selectedSvc?.price || nextList[idx].price
                              };
                              setPickupItemsList(nextList);
                            }}
                            className="select-field"
                            style={{ fontSize: '13px', padding: '8px 10px', width: '100%' }}
                          >
                            {availableServices.map(svc => (
                              <option key={svc.id} value={svc.name}>
                                {svc.name} ({svc.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '11px' }}>Кол-во ({item.unit}) *</label>
                            <input 
                              type="number" 
                              min="1"
                              required
                              value={item.qty}
                              onChange={(e) => {
                                const nextList = [...pickupItemsList];
                                nextList[idx].qty = parseInt(e.target.value) || 1;
                                setPickupItemsList(nextList);
                              }}
                              className="input-field"
                              style={{ fontSize: '13.5px', fontWeight: '800', padding: '8px 10px' }}
                            />
                          </div>

                          <div className="input-group">
                            <label className="input-label" style={{ fontSize: '11px' }}>Ставка ({item.unit})</label>
                            <input 
                              type="number"
                              value={item.price}
                              onChange={(e) => {
                                const nextList = [...pickupItemsList];
                                nextList[idx].price = parseFloat(e.target.value) || 0;
                                setPickupItemsList(nextList);
                              }}
                              className="input-field"
                              style={{ fontSize: '13.5px', color: '#10b981', fontWeight: '800', padding: '8px 10px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const firstSvc = availableServices[0] || { name: 'Мойка ковров', unit: 'м²', price: 15000 };
                    setPickupItemsList([
                      ...pickupItemsList,
                      { serviceId: firstSvc.id, name: firstSvc.name, unit: firstSvc.unit, qty: 1, price: firstSvc.price }
                    ]);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px', borderStyle: 'dashed' }}
                >
                  <Plus size={14} /> Добавить позицию
                </button>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: '#facc15', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⏱️ Срок доставки (дней):
                </label>
                <select 
                  value={pickupDeliveryDays}
                  onChange={(e) => setPickupDeliveryDays(parseInt(e.target.value, 10))}
                  className="select-field"
                  style={{ fontSize: '13.5px', padding: '8px 10px', fontWeight: '800', border: '1.5px solid #facc15', color: '#fff' }}
                >
                  <option value={1}>⚡ 1 день (Срочная доставка)</option>
                  <option value={2}>⚡ 2 дня</option>
                  <option value={3}>⚡ 3 дня</option>
                  <option value={4}>4 дня</option>
                  <option value={5}>📅 5 дней (По умолчанию)</option>
                  <option value={7}>📅 7 дней</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Примечания к состоянию изделий (дефекты / износ)</label>
                <input 
                  type="text" 
                  value={pickupConditionNotes} 
                  onChange={(e) => setPickupConditionNotes(e.target.value)} 
                  className="input-field" 
                  placeholder="Например: Пятна, износ ковра" 
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
                {gpsLocation ? `📍 GPS Захвачен (${gpsLocation})` : '📍 Захватить GPS забора'}
              </button>

              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)', color: '#070d1e', fontWeight: '900', padding: '12px', fontSize: '14px' }}>
                ✓ Забрал в цех (Присвоить номер заказа)
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


      {/* MODAL 5: Printable Electronic Receipt (Строгий белый чек) */}
      {receiptModalOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 250,
          padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '440px',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: '#ffffff',
            color: '#000000',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            border: '1px solid #cbd5e1',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            {/* Printable Receipt Content */}
            <div id="printable-receipt-area" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', color: '#000000' }}>
              
              {/* 1. Название */}
              <div style={{ textAlign: 'center', borderBottom: '2.5px solid #000000', paddingBottom: '10px' }}>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#000000', letterSpacing: '0.5px' }}>Cosmo Cleaning</div>
                <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '3px', color: '#1e293b' }}>
                  Чек заказа №{receiptModalOrder.id || 'Б/Н'}
                </div>
              </div>

              {/* 2. Дата и время оформления, затем дата и время окончания */}
              <div style={{ borderBottom: '1px dashed #64748b', paddingBottom: '10px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '13.5px' }}>
                <div><strong>Дата оформления:</strong> {receiptModalOrder.createdDate || '-'}</div>
                <div><strong>Дата окончания:</strong> {new Date().toLocaleString('ru-RU')}</div>
              </div>

              {/* 3. Данные клиента: имя, телефон, адрес */}
              <div style={{ borderBottom: '1px dashed #64748b', paddingBottom: '10px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '13.5px' }}>
                <div><strong>Клиент:</strong> {receiptModalOrder.clientName || 'Клиент'}</div>
                <div><strong>Телефон:</strong> {receiptModalOrder.phone || receiptModalOrder.clientPhone || '-'}</div>
                <div><strong>Адрес:</strong> {receiptModalOrder.district ? `[${receiptModalOrder.district}] ` : ''}{receiptModalOrder.address || '-'}{receiptModalOrder.landmark ? ` (${receiptModalOrder.landmark})` : ''}</div>
              </div>

              {/* 4. Кто обслуживал: курьер и диспетчер */}
              <div style={{ borderBottom: '1px dashed #64748b', paddingBottom: '10px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '13.5px' }}>
                <div><strong>Курьер:</strong> {courierName || receiptModalOrder.assignedCourier || '-'}</div>
                <div><strong>Диспетчер:</strong> {receiptModalOrder.dispatcherName || receiptModalOrder.createdBy || 'Мадина'}</div>
              </div>

              {/* 5. Размеры каждого изделия и цены */}
              <div style={{ borderBottom: '2.5px solid #000000', paddingBottom: '12px' }}>
                <div style={{ fontWeight: '800', marginBottom: '8px', fontSize: '14px' }}>Изделия и услуги:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {receiptModalOrder.items && receiptModalOrder.items.length > 0 ? (
                    receiptModalOrder.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: idx < receiptModalOrder.items.length - 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: '6px' }}>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '13.5px' }}>{it.name || it.serviceName}</div>
                          {it.width && it.length ? (
                            <div style={{ fontSize: '12px', color: '#475569', marginTop: '1px' }}>
                              Размеры: {it.width}м x {it.length}м = {it.area || (it.width * it.length)} м² ({it.price?.toLocaleString()} сум/м²)
                            </div>
                          ) : it.qty > 1 ? (
                            <div style={{ fontSize: '12px', color: '#475569', marginTop: '1px' }}>
                              Количество: {it.qty} {it.unit || 'шт'} x {it.price?.toLocaleString()} сум
                            </div>
                          ) : null}
                        </div>
                        <div style={{ fontWeight: '900', fontSize: '14px', textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                          {(it.total || it.price || 0).toLocaleString()} сум
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '13px', color: '#475569' }}>Ковры / изделия (замерены в цеху)</div>
                  )}
                </div>
              </div>

              {/* 6. В самом низу: итоговая сумма, оплаченная сумма и способ оплаты */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingTop: '4px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '800', fontSize: '15px' }}>Итоговая сумма:</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#000' }}>{(receiptModalOrder.totalAmount || receiptModalOrder.agreedAmount || 0).toLocaleString()} сум</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span>Оплаченная сумма:</span>
                  <span>{(receiptModalOrder.paidAmount !== undefined ? receiptModalOrder.paidAmount : (receiptModalOrder.totalAmount || 0)).toLocaleString()} сум</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Способ оплаты:</span>
                  <span style={{ fontWeight: '700' }}>{receiptModalOrder.paymentType || 'Наличные'}</span>
                </div>
              </div>

              {/* 7. Instagram QR Code & Footer */}
              <div style={{
                borderTop: '1px dashed #64748b',
                marginTop: '12px',
                paddingTop: '12px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>
                  Bizning Instagram sahifamiz:
                </div>
                <div style={{
                  padding: '4px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  display: 'inline-flex',
                  marginTop: '2px',
                  marginBottom: '2px'
                }}>
                  <img 
                    src={INSTAGRAM_QR_BASE64} 
                    alt="Instagram QR Code" 
                    style={{ width: '110px', height: '110px', display: 'block' }} 
                  />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#e1306c' }}>
                  @cosmocleaning.uz
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Kamerangizni QR kodga qarating • Toza va sifatli xizmat!
                </div>
              </div>
            </div>

            {/* Action Buttons: Print & Close */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <button 
                onClick={() => handlePrintReceiptWindow(receiptModalOrder)}
                className="btn btn-primary"
                style={{ flex: 1, background: '#0f172a', color: '#ffffff', padding: '10px', fontSize: '13px', fontWeight: '800', borderRadius: '8px' }}
              >
                Печать / PDF
              </button>

              <button 
                onClick={() => setReceiptModalOrder(null)}
                className="btn btn-secondary"
                style={{ flex: 1, background: '#f1f5f9', color: '#0f172a', padding: '10px', fontSize: '13px', fontWeight: '800', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Edit Order (Редактирование заказа) */}
      {editModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '12px' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-modal)', border: '1.5px solid #f59e0b', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#f59e0b', color: '#070d1e', padding: '2px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '13px' }}>
                  ✏️ Редактирование
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                  {editFormData.id ? `Заказ #${editFormData.id}` : 'Заявка (Б/Н)'}
                </h3>
              </div>
              <button onClick={() => setEditModalOrder(null)} className="btn-icon"><X size={18}/></button>
            </div>

            <form onSubmit={handleSaveEditOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11.5px' }}>Номер ID заказа</label>
                  <input 
                    type="text" 
                    value={editFormData.id} 
                    onChange={(e) => setEditFormData({ ...editFormData, id: e.target.value })} 
                    className="input-field" 
                    placeholder="Например: 5267 (или пусто)"
                    style={{ fontSize: '13px', padding: '8px 10px' }}
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11.5px' }}>Договорная сумма (сум)</label>
                  <input 
                    type="number" 
                    value={editFormData.totalAmount} 
                    onChange={(e) => setEditFormData({ ...editFormData, totalAmount: e.target.value })} 
                    className="input-field" 
                    style={{ fontSize: '13px', padding: '8px 10px', color: '#facc15', fontWeight: '800' }}
                  />
                </div>
              </div>

              <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11.5px' }}>ФИО Клиента *</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.clientName} 
                    onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })} 
                    className="input-field" 
                    style={{ fontSize: '13px', padding: '8px 10px' }}
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11.5px' }}>Телефон *</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.phone} 
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} 
                    className="input-field" 
                    style={{ fontSize: '13px', padding: '8px 10px' }}
                  />
                </div>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '11.5px' }}>Адрес клиента *</label>
                <input 
                  type="text" 
                  required
                  value={editFormData.address} 
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} 
                  className="input-field" 
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>

              <div className="responsive-grid-4" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11.5px' }}>Район Самарканда</label>
                  <select 
                    value={editFormData.district} 
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })} 
                    className="select-field"
                    style={{ fontSize: '13px', padding: '8px 10px' }}
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

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ fontSize: '11.5px' }}>Язык общения</label>
                  <select 
                    value={editFormData.language} 
                    onChange={(e) => setEditFormData({ ...editFormData, language: e.target.value })} 
                    className="select-field"
                    style={{ fontSize: '13px', padding: '8px 10px' }}
                  >
                    <option value="Русский">Русский</option>
                    <option value="Узбекский">O'zbek tili</option>
                    <option value="Таджикский">Тоҷикӣ</option>
                  </select>
                </div>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '11.5px' }}>Ориентир (Рядом с...)</label>
                <input 
                  type="text" 
                  value={editFormData.landmark} 
                  onChange={(e) => setEditFormData({ ...editFormData, landmark: e.target.value })} 
                  className="input-field" 
                  placeholder="Например: Возле Корзинки"
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>

              {/* GPS Capture / Point on Map */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '11.5px' }}>Точка на карте / GPS координаты</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={editFormData.gpsLocation} 
                    onChange={(e) => setEditFormData({ ...editFormData, gpsLocation: e.target.value })} 
                    className="input-field" 
                    placeholder="39.6547, 66.9758"
                    style={{ fontSize: '13px', padding: '8px 10px', flex: 1 }}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
                          setEditFormData({ ...editFormData, gpsLocation: coords });
                          alert(`GPS точка поставлена: ${coords}`);
                        });
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '8px 12px', flexShrink: 0 }}
                  >
                    <Compass size={14} /> Захватить GPS
                  </button>
                </div>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '11.5px' }}>Описание / Комментарий курьера</label>
                <textarea 
                  rows={2}
                  value={editFormData.notes} 
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} 
                  className="textarea-field" 
                  placeholder="Дополнительные детали заказа"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    const target = editModalOrder;
                    setEditModalOrder(null);
                    handleDeleteOrder(target);
                  }} 
                  className="btn" 
                  style={{ background: 'rgba(244, 63, 94, 0.2)', border: '1px solid #f43f5e', color: '#f87171', fontWeight: '700', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={15} /> Удалить заказ
                </button>
                <button type="button" onClick={() => setEditModalOrder(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#f59e0b', color: '#070d1e', fontWeight: '900' }}>
                  💾 Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
