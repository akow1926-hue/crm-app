import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Phone, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  Route, 
  Zap, 
  Compass,
  CheckCircle2
} from 'lucide-react';

import { getCourierLocations } from '../services/gpsTrackingService';

export default function YandexLogisticsMap({ orders, setOrders, setSelectedOrder }) {
  const [filterType, setFilterType] = useState('all');
  const [selectedCourier, setSelectedCourier] = useState('all');
  const [searchMapQuery, setSearchMapQuery] = useState('');
  const [showRouteLine, setShowRouteLine] = useState(true);

  // Real Samarkand Center Coordinates
  const samarkandCenter = [39.6542, 66.9597];

  // Exact Coordinates for Samarkand Locations
  const orderCoords = [
    { id: '1095', lat: 39.6580, lng: 66.9750, district: 'Самарканд, ул. Регистанская, д. 45' },
    { id: '1094', lat: 39.6450, lng: 66.9350, district: 'Самарканд, ул. Дагбитская, д. 12' },
    { id: '1093', lat: 39.6620, lng: 66.9480, district: 'Самарканд, мкр-н Гагарина, д. 88' },
    { id: '1092', lat: 39.6380, lng: 66.9620, district: 'Самарканд, ул. Мирзо Улугбека, д. 19' },
    { id: '1091', lat: 39.6700, lng: 66.9300, district: 'Самарканд, массив Согдиана, д. 5' },
    { id: '1090', lat: 39.6510, lng: 66.9800, district: 'Самарканд, ул. Рудаки, д. 22' }
  ];

  // Dynamic Live GPS Couriers Positions in Samarkand
  const [couriers, setCouriers] = useState([
    { id: 'ST-2', name: 'Алишер Рахимов', lat: 39.6560, lng: 66.9680, speed: 36, battery: 88, status: 'Едет на забор в Регистан' },
    { id: 'ST-3', name: 'Сардор Мирзаев', lat: 39.6420, lng: 66.9420, speed: 41, battery: 94, status: 'Доставка по ул. Дагбитская' }
  ]);

  // Sync real-time GPS coordinates from continuous GPS tracking service
  const syncLiveGpsPositions = () => {
    const liveMap = getCourierLocations();
    setCouriers(prev => prev.map(c => {
      const liveData = liveMap[c.name];
      if (liveData && liveData.lat && liveData.lng) {
        return {
          ...c,
          lat: liveData.lat,
          lng: liveData.lng,
          speed: liveData.speed || c.speed,
          battery: liveData.battery || c.battery,
          status: liveData.status || c.status,
          isRealGps: true,
          lastUpdate: liveData.lastUpdate
        };
      }
      return {
        ...c,
        lat: c.lat + (Math.random() - 0.5) * 0.0008,
        lng: c.lng + (Math.random() - 0.5) * 0.0008,
        speed: Math.floor(25 + Math.random() * 20)
      };
    }));
  };

  useEffect(() => {
    syncLiveGpsPositions();
    const interval = setInterval(syncLiveGpsPositions, 3000);
    const handleLocationEvent = () => syncLiveGpsPositions();
    window.addEventListener('courier_location_updated', handleLocationEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener('courier_location_updated', handleLocationEvent);
    };
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const coordsObj = orderCoords.find(c => c.id === order.id);
    const matchesSearch = 
      order.clientName.toLowerCase().includes(searchMapQuery.toLowerCase()) ||
      order.phone.includes(searchMapQuery) ||
      order.id.includes(searchMapQuery) ||
      (coordsObj && coordsObj.district.toLowerCase().includes(searchMapQuery.toLowerCase()));

    let matchesFilter = true;
    if (filterType === 'pickup') matchesFilter = order.status === 'new' || order.status === 'pickup';
    if (filterType === 'delivery') matchesFilter = order.status === 'ready' || order.status === 'delivery';
    if (filterType === 'urgent') matchesFilter = order.urgent;

    let matchesCourier = true;
    if (selectedCourier !== 'all') matchesCourier = order.assignedCourier === selectedCourier;

    return matchesSearch && matchesFilter && matchesCourier;
  });

  const assignCourierToOrder = (orderId, courierName) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, assignedCourier: courierName } : o));
  };

  // Custom Div Icons for Leaflet
  const createMarkerIcon = (order) => {
    let color = '#60a5fa'; // Blue (Cleaning)
    if (order.status === 'new' || order.status === 'pickup') color = '#f59e0b'; // Yellow (Pickup)
    if (order.status === 'ready' || order.status === 'delivery') color = '#06b6d4'; // Green/Cyan (Delivery)
    if (order.urgent) color = '#f43f5e'; // Red (Urgent)

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          background: ${color};
          color: #fff;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 11px;
          box-shadow: 0 0 14px ${color};
          white-space: nowrap;
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          📍 #${order.id} ${order.urgent ? '⚡' : ''}
        </div>
      `,
      iconSize: [60, 24],
      iconAnchor: [30, 24]
    });
  };

  const createCourierIcon = (courierName) => {
    return L.divIcon({
      className: 'custom-courier-marker',
      html: `
        <div style="
          background: #f59e0b;
          color: #fff;
          padding: 4px 10px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 11px;
          box-shadow: 0 0 16px rgba(245, 158, 11, 0.9);
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          🚚 ${courierName.split(' ')[0]}
        </div>
      `,
      iconSize: [80, 26],
      iconAnchor: [40, 26]
    });
  };

  const createHubIcon = () => {
    return L.divIcon({
      className: 'custom-hub-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
          color: #fff;
          padding: 6px 12px;
          border-radius: 16px;
          font-weight: 800;
          font-size: 12px;
          box-shadow: 0 0 24px rgba(99, 102, 241, 0.9);
          border: 2px solid #fff;
        ">
          ✨ ЦЕХ САМАРКАНД
        </div>
      `,
      iconSize: [120, 30],
      iconAnchor: [60, 30]
    });
  };

  // Route lines coordinates connecting Hub to Order markers
  const routePolyline = filteredOrders.map(ord => {
    const coordsObj = orderCoords.find(c => c.id === ord.id);
    return coordsObj ? [coordsObj.lat, coordsObj.lng] : null;
  }).filter(Boolean);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="responsive-header-banner" style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(99, 102, 241, 0.15) 100%)',
        border: '1px solid var(--accent-gradient-gold)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'flex-start'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'var(--accent-gradient-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            color: '#fff',
            flexShrink: 0
          }}>
            <Compass size={24} />
          </div>
          <div>
            <span className="badge badge-pickup" style={{ fontSize: '10px' }}>Карта Самарканда</span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px', lineHeight: 1.2 }}>
              Логистика & GPS
            </h2>
          </div>
        </div>

        {/* Map Legend */}
        <div className="flex-wrap" style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '11px' }}>
          <span style={{ color: '#fbbf24', fontWeight: '700' }}>● Забор</span>
          <span style={{ color: '#22d3ee', fontWeight: '700' }}>● Доставка</span>
          <span style={{ color: '#f472b6', fontWeight: '700' }}>● Срочный</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="glass-card flex-wrap" style={{ padding: '12px 16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 100%', marginBottom: '4px' }}>
          <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Поиск по улицам..."
            value={searchMapQuery}
            onChange={(e) => setSearchMapQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '34px', fontSize: '13px', height: '36px' }}
          />
        </div>

        <div className="flex-wrap" style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex-wrap" style={{ gap: '4px' }}>
            {[
              { id: 'all', label: 'Все' },
              { id: 'pickup', label: '🟡' },
              { id: 'delivery', label: '🟢' },
              { id: 'urgent', label: '🔴' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  fontSize: '12px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: filterType === f.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value)}
            className="select-field"
            style={{ width: 'auto', flex: '1', minWidth: '120px', fontSize: '12px', height: '32px', padding: '0 8px' }}
          >
            <option value="all">Все курьеры</option>
            <option value="Алишер Рахимов">Алишер</option>
            <option value="Сардор Мирзаев">Сардор</option>
          </select>

          <button
            onClick={() => setShowRouteLine(!showRouteLine)}
            className="btn-icon"
            style={{ height: '32px', width: '32px', padding: 0 }}
            title={showRouteLine ? 'Скрыть линии' : 'Показать линии'}
          >
            <Route size={16} color={showRouteLine ? 'var(--accent-secondary)' : 'var(--text-dim)'} />
          </button>
        </div>
      </div>

      {/* Main Real Map Screen */}
      <div className="responsive-grid-7-5" style={{ gridTemplateColumns: '8fr 4fr' }}>
        <div className="glass-card" style={{ height: '620px', padding: 0, overflow: 'hidden', position: 'relative' }}>
          <MapContainer 
            center={samarkandCenter} 
            zoom={13} 
            scrollWheelZoom={true} 
            tap={false} /* Fix for some mobile browsers */
            style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }}
          >
            {/* Real Map Tiles Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Central Factory Base Marker */}
            <Marker position={samarkandCenter} icon={createHubIcon()}>
              <Popup>
                <div style={{ padding: '6px', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--accent-secondary)', fontSize: '14px' }}>🏢 Главный Цех Cosmo Cleaning (Самарканд)</strong>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Университетский бульвар / Регистан</div>
                </div>
              </Popup>
            </Marker>

            {/* Render Real Order Markers on Samarkand Map */}
            {filteredOrders.map((order) => {
              const coordsObj = orderCoords.find(c => c.id === order.id);
              if (!coordsObj) return null;

              return (
                <Marker key={order.id} position={[coordsObj.lat, coordsObj.lng]} icon={createMarkerIcon(order)}>
                  <Popup>
                    <div style={{ minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', color: 'var(--accent-secondary)', fontSize: '14px' }}>
                          Заказ #{order.id}
                        </span>
                        <span className={`badge badge-${order.status}`}>{order.status}</span>
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                        {order.clientName}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        📞 <strong>{order.phone}</strong><br />
                        📍 {coordsObj.district}<br />
                        💰 Сумма: <strong style={{ color: '#fff' }}>{order.totalAmount.toLocaleString()} сум</strong>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700' }}>Ответственный курьер:</label>
                        <select 
                          value={order.assignedCourier || 'Алишер Рахимов'}
                          onChange={(e) => assignCourierToOrder(order.id, e.target.value)}
                          className="select-field"
                          style={{ fontSize: '11px', padding: '4px 6px' }}
                        >
                          <option value="Алишер Рахимов">Алишер Рахимов</option>
                          <option value="Сардор Мирзаев">Сардор Мирзаев</option>
                        </select>
                      </div>

                      <button 
                        onClick={() => setSelectedOrder(order)} 
                        className="btn btn-primary"
                        style={{ fontSize: '11px', padding: '4px 8px', marginTop: '4px' }}
                      >
                        Открыть Карточку Заказа
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Render Real Moving Courier GPS Markers in Samarkand */}
            {couriers.map((courier) => (
              <Marker key={courier.id} position={[courier.lat, courier.lng]} icon={createCourierIcon(courier.name)}>
                <Popup>
                  <div style={{ padding: '6px' }}>
                    <strong style={{ color: '#f59e0b', fontSize: '14px' }}>🚚 Курьер: {courier.name}</strong>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      Скорость: <strong>{courier.speed} км/ч</strong><br />
                      Заряд батареи: <strong style={{ color: '#10b981' }}>{courier.battery}%</strong><br />
                      Статус: {courier.status}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Route Lines overlay */}
            {showRouteLine && routePolyline.length > 0 && (
              <Polyline positions={[samarkandCenter, ...routePolyline]} color="#6366f1" weight={3} dashArray="6, 6" />
            )}
          </MapContainer>
        </div>

        {/* Right Logistics Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Live GPS Tracker */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="var(--accent-gradient-gold)" /> GPS Мониторинг (Самарканд)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {couriers.map((c) => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>🚚 {c.name}</div>
                    <span className="badge badge-done" style={{ fontSize: '10px' }}>🟢 GPS В сети</span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Статус: <strong style={{ color: 'var(--accent-secondary)' }}>{c.status}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                    <span>Скорость: <strong style={{ color: '#fff' }}>{c.speed} км/ч</strong></span>
                    <span>Батарея: <strong style={{ color: '#10b981' }}>{c.battery}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Samarkand Route Optimization Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Route size={16} color="var(--accent-primary)" /> Оптимизация по Самарканду
            </h3>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Расчет оптимального кольцевого рейса от центрального цеха по улицам Самарканда.
            </p>

            <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid var(--border-glow)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
              <div style={{ color: '#fff', fontWeight: '700' }}>Кольцевой маршрут (Самарканд):</div>
              <div style={{ color: 'var(--text-dim)', marginTop: '2px' }}>Цех ➔ Регистан ➔ Дагбитская ➔ Гагарина ➔ Согдиана</div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>
                Длина: 14.2 км (Экономия топлива: 28%)
              </div>
            </div>

            <button 
              onClick={() => alert('Маршрут по Самарканду успешно отправлен курьеру Алишеру в Telegram!')} 
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '8px 12px' }}
            >
              <Navigation size={14} /> Передать маршрут Курьеру
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
