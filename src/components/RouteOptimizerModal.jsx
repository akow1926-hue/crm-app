import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Navigation, 
  MapPin, 
  Check, 
  Phone, 
  Zap, 
  Clock, 
  Route, 
  Truck, 
  Layers, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';

import { 
  optimizeMultiStopRoute, 
  buildYandexNavigatorMultiStopUrl, 
  buildGoogleMapsMultiStopUrl, 
  WORKSHOP_COORDINATES,
  calculateDistanceKm
} from '../services/routeOptimizer';

export default function RouteOptimizerModal({ 
  orders = [], 
  onClose, 
  courierName = 'Курьер',
  courierGps = null,
  onCompleteOrder = null
}) {
  // Filter active candidate orders (new, pickup, ready, delivery)
  const candidateOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'done');
  }, [orders]);
  
  // Selected order IDs for route optimization (by default all active orders selected)
  const [selectedIds, setSelectedIds] = useState(() => 
    candidateOrders.map(o => String(o.id || o.tempId))
  );

  const [startPointType, setStartPointType] = useState('courier'); // 'courier' | 'workshop'
  const [returnToWorkshop, setReturnToWorkshop] = useState(true);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Determine starting coordinates
  const startCoords = useMemo(() => {
    if (startPointType === 'courier' && courierGps && courierGps.lat && courierGps.lng) {
      return [courierGps.lat, courierGps.lng];
    }
    return WORKSHOP_COORDINATES;
  }, [startPointType, courierGps]);

  // Toggle single order selection
  const toggleSelectOrder = (id) => {
    const idStr = String(id);
    setSelectedIds(prev => 
      prev.includes(idStr) ? prev.filter(item => item !== idStr) : [...prev, idStr]
    );
  };

  // Select all orders
  const selectAll = () => {
    setSelectedIds(candidateOrders.map(o => String(o.id || o.tempId)));
  };

  // Deselect all orders
  const deselectAll = () => {
    setSelectedIds([]);
  };

  // Automatically calculate optimized route for SELECTED orders in real-time
  const selectedOrdersList = useMemo(() => {
    return candidateOrders.filter(o => selectedIds.includes(String(o.id || o.tempId)));
  }, [candidateOrders, selectedIds]);

  const optimizedRoute = useMemo(() => {
    if (selectedOrdersList.length === 0) return null;
    return optimizeMultiStopRoute(selectedOrdersList, startCoords, returnToWorkshop);
  }, [selectedOrdersList, startCoords, returnToWorkshop]);

  const toggleStepCompleted = (orderId) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const yandexUrl = optimizedRoute && optimizedRoute.orderedStops.length > 0
    ? buildYandexNavigatorMultiStopUrl(optimizedRoute.startPoint, optimizedRoute.orderedStops) 
    : '';

  const googleUrl = optimizedRoute && optimizedRoute.orderedStops.length > 0
    ? buildGoogleMapsMultiStopUrl(optimizedRoute.startPoint, optimizedRoute.orderedStops) 
    : '';

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '24px 16px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-card animate-fade-in" 
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '82vh',
          margin: 'auto',
          overflowY: 'auto',
          background: 'var(--bg-modal)',
          border: '1.5px solid var(--accent-primary)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)',
              flexShrink: 0
            }}>
              <Navigation size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                🗺️ Умный Оптимизатор Маршрута
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
                Водитель: <strong>{courierName}</strong> • Отметьте нужные заказы для расчёта кратчайшего пути
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1.5px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title="Закрыть окно (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls Bar: Start Point & Workshop Return */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          background: 'var(--bg-input)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          {/* Start Point Choice */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              ТОЧКА СТАРТА:
            </label>
            <select
              value={startPointType}
              onChange={(e) => setStartPointType(e.target.value)}
              className="select-field"
              style={{ fontSize: '12.5px', padding: '6px 10px' }}
            >
              <option value="courier">📍 Текущее положение GPS ({courierGps ? 'Онлайн' : 'По умолчанию'})</option>
              <option value="workshop">🏭 Цех Cosmo Cleaning (База)</option>
            </select>
          </div>

          {/* Return to Workshop Toggle */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              ФИНИШ МАРШРУТА:
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginTop: '6px' }}>
              <input
                type="checkbox"
                checked={returnToWorkshop}
                onChange={(e) => setReturnToWorkshop(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
              />
              Возврат на базу в Цех
            </label>
          </div>

          {/* Selection Status Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)' }}>ВЫБРАНО ДЛЯ МАРШРУТА:</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: selectedIds.length > 0 ? 'var(--accent-primary)' : '#f43f5e', marginTop: '2px' }}>
              {selectedIds.length} из {candidateOrders.length} заказов
            </div>
          </div>
        </div>

        {/* SECTION 1: Orders Checkboxes Selection List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase' }}>
              ✅ Выберите заказы для объезда ({selectedIds.length} выбрано):
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={selectAll} 
                className="btn btn-secondary" 
                style={{ fontSize: '11.5px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckSquare size={13} /> Выбрать все ({candidateOrders.length})
              </button>
              <button 
                onClick={deselectAll} 
                className="btn btn-secondary" 
                style={{ fontSize: '11.5px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Square size={13} /> Сбросить все
              </button>
            </div>
          </div>

          {/* Scrollable Checkbox List of Available Orders */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '8px',
            maxHeight: '180px',
            overflowY: 'auto',
            padding: '4px'
          }}>
            {candidateOrders.map(order => {
              const orderId = String(order.id || order.tempId);
              const isSelected = selectedIds.includes(orderId);
              const isDelivery = order.status === 'ready' || order.status === 'delivery';

              return (
                <div
                  key={orderId}
                  onClick={() => toggleSelectOrder(orderId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                    border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOrder(orderId)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: isDelivery ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                        color: isDelivery ? '#c084fc' : '#38bdf8'
                      }}>
                        {isDelivery ? '🚚 Доставка' : '📥 Забор'}
                      </span>
                      <strong style={{ fontSize: '12.5px', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        #{order.id || order.tempId} • {order.clientName}
                      </strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📍 {order.district ? `[${order.district}] ` : ''}{order.address || 'Адрес не указан'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Optimized Route Results & Metrics */}
        {optimizedRoute ? (
          <>
            {/* Optimized Summary Banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
              border: '1.5px solid var(--border-glow)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>ОБЩИЙ КИЛОМЕТРАЖ</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>
                  {optimizedRoute.totalDistanceKm} км
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>ПРИМЕРНОЕ ВРЕМЯ</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#38bdf8' }}>
                  ~{optimizedRoute.estimatedMinutes} мин
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '700' }}>ТОЧЕК В МАРШРУТЕ</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#f59e0b' }}>
                  {optimizedRoute.orderedStops.length} адресов
                </div>
              </div>
            </div>

            {/* Master Navigation Links */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={yandexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  flex: 1,
                  minWidth: '220px',
                  background: '#fc3f1d',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  padding: '12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(252, 63, 29, 0.35)'
                }}
              >
                <Navigation size={18} /> 🚀 Открыть весь маршрут в Яндекс.Картах ({optimizedRoute.orderedStops.length} точек)
              </a>

              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  minWidth: '180px',
                  fontWeight: '700',
                  fontSize: '13px',
                  padding: '12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={16} /> Google Maps
              </a>
            </div>

            {/* Itinerary Step-by-Step Sequence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase' }}>
                📍 Порядок объезда (Кратчайшая цепочка):
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {/* Start Point Line */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '8px'
                }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '12px'
                  }}>
                    A
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                      {startPointType === 'courier' ? '📍 Местоположение курьера (Старт)' : '🏭 Цех Cosmo Cleaning (База)'}
                    </strong>
                  </div>
                </div>

                {/* Ordered Steps */}
                {optimizedRoute.orderedStops.map((stop, idx) => {
                  const isCompleted = completedSteps.has(stop.id);
                  const isDelivery = stop.type === 'delivery';

                  return (
                    <div
                      key={stop.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 14px',
                        background: isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
                        border: isCompleted ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                        borderRadius: '8px',
                        opacity: isCompleted ? 0.75 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isDelivery ? '#a855f7' : '#38bdf8',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '900',
                          fontSize: '13px',
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '800',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: isDelivery ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                              color: isDelivery ? '#c084fc' : '#38bdf8'
                            }}>
                              {isDelivery ? '🚚 ДОСТАВКА' : '📥 ЗАБОР'}
                            </span>
                            <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                              #{stop.id} • {stop.clientName}
                            </strong>
                            {stop.urgent && (
                              <span style={{ fontSize: '9px', background: '#ef4444', color: '#fff', padding: '1px 4px', borderRadius: '4px', fontWeight: '900' }}>
                                ⚡ СРОЧНО
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            📍 {stop.district ? `[${stop.district}] ` : ''}{stop.address || 'Адрес не указан'}
                          </div>

                          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>
                            +{stop.legDistanceKm} км от пред. точки {stop.amount > 0 ? `• Сумма: ${stop.amount.toLocaleString()} сум` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Actions for this stop */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {stop.phone && (
                          <a
                            href={`tel:${stop.phone}`}
                            className="btn-icon"
                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}
                            title="Позвонить"
                          >
                            <Phone size={15} />
                          </a>
                        )}

                        <a
                          href={`https://yandex.uz/maps/?rtext=~${stop.coords[0]},${stop.coords[1]}&rtt=auto`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon"
                          style={{ background: 'rgba(252, 63, 29, 0.15)', color: '#fc3f1d' }}
                          title="Навигатор к этой точке"
                        >
                          <Navigation size={15} />
                        </a>

                        <button
                          onClick={() => toggleStepCompleted(stop.id)}
                          className="btn-icon"
                          style={{
                            background: isCompleted ? '#10b981' : 'rgba(255,255,255,0.06)',
                            color: isCompleted ? '#ffffff' : 'var(--text-muted)'
                          }}
                          title={isCompleted ? "Отмечено как выполненное" : "Отметить как выполненное"}
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Finish Workshop Line */}
                {returnToWorkshop && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px dashed #10b981',
                    borderRadius: '8px'
                  }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '12px'
                    }}>
                      🏁
                    </span>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        🏭 Финиш: Возврат в Цех Cosmo Cleaning (Сдача ковров / Отчёт)
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            padding: '30px 20px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-dim)',
            fontSize: '13.5px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Navigation size={32} color="var(--text-dim)" />
            <div>
              <strong>Заказы не выбраны</strong>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Отметьте галочками нужные заказы выше или нажмите <strong>«Выбрать все»</strong>, чтобы построить кратчайший маршрут.
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Close Action Button */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px' }}>
          <button 
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '12px',
              fontWeight: '800',
              fontSize: '14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <X size={18} /> Закрыть окно и вернуться к заказам
          </button>
        </div>
      </div>
    </div>
  );
}
