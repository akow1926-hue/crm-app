import React, { useState } from 'react';
import { 
  Package, 
  Truck, 
  Shirt, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldAlert, 
  Phone, 
  User, 
  DollarSign,
  Plus,
  GripVertical,
  LayoutGrid,
  List,
  Filter,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';

import { saveSupabaseOrder } from '../services/supabaseService';
import { syncOrderToGoogleSheets } from '../services/googleSheetsService';
import { DeliveryDeadlineBadge } from '../utils/deliveryDeadline';

export default function KanbanView({ orders, setOrders, setSelectedOrder, onOpenNewOrder }) {
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' | 'compact'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'urgent' | 'unpaid' | 'today'
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const columns = [
    { id: 'new', title: '📥 1. Ожидает забора', color: '#38bdf8', icon: Package, badgeClass: 'badge-new' },
    { id: 'cleaning', title: '🧼 2. Забран / В цеху', color: '#facc15', icon: Shirt, badgeClass: 'badge-cleaning' },
    { id: 'delivery', title: '📦 3. Готов / На доставке', color: '#a855f7', icon: Truck, badgeClass: 'badge-delivery' },
    { id: 'done', title: '✅ 4. Выполнен', color: '#10b981', icon: CheckCircle2, badgeClass: 'badge-done' }
  ];

  const statusFlow = ['new', 'cleaning', 'delivery', 'done'];

  const moveStatus = (orderId, direction) => {
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId || order.tempId === orderId) {
        const currentIndex = statusFlow.indexOf(order.status);
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < statusFlow.length) {
          const nextStatus = statusFlow[nextIndex];
          const updatedOrder = { 
            ...order, 
            status: nextStatus,
            paymentStatus: nextStatus === 'done' ? 'paid' : order.paymentStatus 
          };
          saveSupabaseOrder(updatedOrder);
          syncOrderToGoogleSheets(updatedOrder).catch(() => {});
          return updatedOrder;
        }
      }
      return order;
    }));
  };

  const setExactStatus = (orderId, targetStatus) => {
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId || order.tempId === orderId) {
        const updatedOrder = { 
          ...order, 
          status: targetStatus,
          paymentStatus: targetStatus === 'done' ? 'paid' : order.paymentStatus 
        };
        saveSupabaseOrder(updatedOrder);
        syncOrderToGoogleSheets(updatedOrder).catch(() => {});
        return updatedOrder;
      }
      return order;
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e, orderId) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColId(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (orderId) {
      setExactStatus(orderId, targetStatus);
    }
    setDraggedOrderId(null);
    setDragOverColId(null);
  };

  // Filter orders according to active quick filter & district
  const filteredOrders = orders.filter(o => {
    // Quick Filter
    if (activeFilter === 'urgent' && !o.urgent) return false;
    if (activeFilter === 'unpaid' && (o.paymentStatus === 'paid' || o.status === 'done')) return false;
    if (activeFilter === 'today') {
      const todayStr = new Date().toLocaleDateString('ru-RU');
      const orderDate = (o.createdDate || '');
      if (!orderDate.includes(todayStr) && !orderDate.includes(new Date().toISOString().split('T')[0])) return false;
    }
    // District Filter
    if (selectedDistrict !== 'all' && o.district !== selectedDistrict) return false;
    return true;
  });

  const totalFilteredCount = filteredOrders.length;
  const activeOrdersCount = orders.filter(o => o.status !== 'done').length;
  const totalPaidInActive = orders.filter(o => o.status !== 'done').reduce((sum, o) => sum + (parseFloat(o.paidAmount || (o.paymentStatus === 'paid' ? o.totalAmount : 0) || 0)), 0);
  const totalPendingInActive = orders.filter(o => o.status !== 'done').reduce((sum, o) => sum + Math.max(0, (parseFloat(o.totalAmount || 0)) - (parseFloat(o.paidAmount || (o.paymentStatus === 'paid' ? o.totalAmount : 0) || 0))), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header Banner */}
      <div className="glass-card" style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)' }}>
              📌 Канбан-доска заказов
            </h2>
            <span className="badge badge-pickup" style={{ fontSize: '11px', fontWeight: '800' }}>
              В работе: {activeOrdersCount}
            </span>
            <span className="badge badge-done" style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              Оплачено: {totalPaidInActive.toLocaleString()} сум
            </span>
            {totalPendingInActive > 0 && (
              <span className="badge badge-cleaning" style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(244, 63, 94, 0.15)', color: '#f87171' }}>
                Остаток к получению: {totalPendingInActive.toLocaleString()} сум
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '2px' }}>
            Перетаскивайте карточки между этапами или нажимайте стрелки для быстрой смены статуса.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Mode Toggle: Detailed vs Compact */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px'
          }}>
            <button
              onClick={() => setViewMode('detailed')}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'detailed' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'detailed' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '700'
              }}
              title="Подробный вид карточек"
            >
              <LayoutGrid size={14} /> Подробно
            </button>

            <button
              onClick={() => setViewMode('compact')}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                background: viewMode === 'compact' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'compact' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: '700'
              }}
              title="Компактный вид карточек"
            >
              <List size={14} /> Компактно
            </button>
          </div>

          <button onClick={onOpenNewOrder} className="btn btn-primary">
            <Plus size={16} /> Создать Заказ
          </button>
        </div>
      </div>

      {/* Quick Filters Pill Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', marginRight: '4px' }}>
            Фильтры:
          </span>

          <button
            onClick={() => setActiveFilter('all')}
            className="btn"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: 'var(--radius-full)',
              background: activeFilter === 'all' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)',
              border: activeFilter === 'all' ? 'none' : '1px solid var(--border-color)',
              color: activeFilter === 'all' ? '#fff' : 'var(--text-main)'
            }}
          >
            Все ({orders.length})
          </button>

          <button
            onClick={() => setActiveFilter('urgent')}
            className="btn"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: 'var(--radius-full)',
              background: activeFilter === 'urgent' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: activeFilter === 'urgent' ? '#fff' : '#f87171'
            }}
          >
            ⚡ Срочные ({orders.filter(o => o.urgent).length})
          </button>

          <button
            onClick={() => setActiveFilter('unpaid')}
            className="btn"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: 'var(--radius-full)',
              background: activeFilter === 'unpaid' ? '#f59e0b' : 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: activeFilter === 'unpaid' ? '#fff' : '#fbbf24'
            }}
          >
            💳 Неоплаченные
          </button>

          <button
            onClick={() => setActiveFilter('today')}
            className="btn"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: 'var(--radius-full)',
              background: activeFilter === 'today' ? '#06b6d4' : 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: activeFilter === 'today' ? '#fff' : '#22d3ee'
            }}
          >
            📅 Сегодня
          </button>
        </div>

        {/* District Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="var(--text-dim)" />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="select-field"
            style={{ padding: '4px 10px', fontSize: '12px', minWidth: '150px' }}
          >
            <option value="all">📍 Все районы Самарканда</option>
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

      {/* Kanban Board Columns Horizontal Scroll */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '16px',
        minHeight: '680px'
      }}>
        {columns.map((col) => {
          const colOrders = filteredOrders.filter(o => {
            if (col.id === 'new') return o.status === 'new' || o.status === 'pickup';
            if (col.id === 'cleaning') return o.status === 'cleaning';
            if (col.id === 'delivery') return o.status === 'ready' || o.status === 'delivery';
            if (col.id === 'done') return o.status === 'done';
            return o.status === col.id;
          });
          const ColumnIcon = col.icon;
          const colTotal = colOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          const isTargetOver = dragOverColId === col.id;

          return (
            <div 
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                background: isTargetOver ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                border: isTargetOver ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '750px',
                overflowY: 'auto',
                transition: 'var(--transition-fast)'
              }}
            >
              {/* Column Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '10px',
                borderBottom: `2.5px solid ${col.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ColumnIcon size={18} color={col.color} />
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-main)' }}>{col.title}</span>
                </div>
                <span className={`badge ${col.badgeClass}`} style={{ fontSize: '11.5px', fontWeight: '800' }}>
                  {colOrders.length}
                </span>
              </div>

              {/* Column Total Price Summary */}
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', textAlign: 'right' }}>
                {(col.id === 'delivery' || col.id === 'done') ? (
                  <span>Сумма: <strong style={{ color: '#10b981' }}>{colTotal.toLocaleString()} сум</strong></span>
                ) : (
                  <span>Позиций: <strong>{colOrders.length} заказов</strong></span>
                )}
              </div>

              {/* Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: viewMode === 'compact' ? '8px' : '12px', flex: 1, minHeight: '120px' }}>
                {colOrders.length === 0 ? (
                  <div style={{
                    padding: '30px 10px',
                    textAlign: 'center',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-dim)',
                    fontSize: '12px'
                  }}>
                    Перетащите заказ сюда
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const isDragging = draggedOrderId === order.id;
                    const dateStr = (order.createdDate || '').includes(' ') ? order.createdDate.split(' ')[1] : order.createdDate || '';
                    const itemsCount = (order.items || []).length || order.itemsCount || 1;
                    const totalArea = order.area || (order.items || []).reduce((acc, it) => acc + (it.area || 0), 0);

                    if (viewMode === 'compact') {
                      // COMPACT CARD VIEW
                      return (
                        <div
                          key={order.id || order.tempId}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, order.id)}
                          onClick={() => setSelectedOrder(order)}
                          className="kanban-card"
                          style={{
                            background: 'var(--bg-main)',
                            border: order.urgent ? '1.5px solid #ef4444' : '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            cursor: 'grab',
                            opacity: isDragging ? 0.4 : 1
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--accent-secondary)' }}>
                                #{order.id || order.tempId || 'Б/Н'}
                              </span>
                              {order.district && (
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>
                                  {order.district}
                                </span>
                              )}
                              {order.urgent && (
                                <span style={{ fontSize: '9px', background: '#ef4444', color: '#fff', padding: '1px 4px', borderRadius: '4px', fontWeight: '900' }}>
                                  ⚡
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>
                              {(order.totalAmount || 0).toLocaleString()} сум
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                              {order.clientName}
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {col.id !== 'new' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveStatus(order.id, 'prev'); }}
                                  className="btn-icon"
                                  style={{ padding: '3px 6px' }}
                                  title="Назад"
                                >
                                  <ArrowLeft size={11} />
                                </button>
                              )}
                              {col.id !== 'done' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveStatus(order.id, 'next'); }}
                                  className="btn-icon"
                                  style={{ padding: '3px 6px', background: 'var(--accent-primary)', color: '#fff' }}
                                  title="Вперед"
                                >
                                  <ArrowRight size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // DETAILED CARD VIEW
                    return (
                      <div
                        key={order.id || order.tempId}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        className="kanban-card"
                        style={{
                          background: 'var(--bg-main)',
                          border: order.urgent ? '1.5px solid #ef4444' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'grab',
                          opacity: isDragging ? 0.4 : 1
                        }}
                      >
                        {/* Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <GripVertical size={14} color="var(--text-dim)" style={{ cursor: 'grab' }} />
                            <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--accent-secondary)' }}>
                              {order.id ? `#${order.id}` : 'Б/Н'}
                            </span>
                            <DeliveryDeadlineBadge order={order} />
                            {order.urgent && (
                              <span className="badge badge-cancel" style={{ fontSize: '9px', padding: '2px 6px' }}>
                                <ShieldAlert size={9} /> СРОЧНО
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{dateStr}</span>
                        </div>

                        {/* Client Info */}
                        <div onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                            {order.clientName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Phone size={12} color="var(--text-dim)" /> {order.phone || order.clientPhone}
                          </div>
                          {order.district && (
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                              📍 {order.district} {order.address ? `• ${order.address}` : ''}
                            </div>
                          )}
                        </div>

                        {/* Items Summary */}
                        <div 
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            background: 'rgba(0, 0, 0, 0.1)',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {(order.items && order.items.length > 0) ? (
                            order.items.slice(0, 2).map((it, idx) => (
                              <div key={idx} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                • {it.name} {it.width && it.length ? `(${it.width}x${it.length}м)` : `(${it.qty || 1} шт)`}
                              </div>
                            ))
                          ) : (
                            <div>• Ковры: {totalArea ? `${totalArea} м²` : `${itemsCount} шт`}</div>
                          )}
                          {order.items && order.items.length > 2 && (
                            <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: '700', marginTop: '2px' }}>
                              + еще {order.items.length - 2} поз.
                            </div>
                          )}
                        </div>

                        {/* Price & Payment & Action controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-main)' }}>
                              {(order.totalAmount || 0).toLocaleString()} сум
                            </div>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              color: order.paymentStatus === 'paid' ? '#10b981' : order.paymentStatus === 'partial' ? '#f59e0b' : '#ef4444'
                            }}>
                              {order.paymentStatus === 'paid' ? '● Оплачено' : order.paymentStatus === 'partial' ? '● Частично' : '● Не оплачено'}
                            </span>
                          </div>

                          {/* Navigation controls */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {col.id !== 'new' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); moveStatus(order.id, 'prev'); }}
                                className="btn-icon"
                                style={{ padding: '5px 8px' }}
                                title="Вернуть в предыдущий статус"
                              >
                                <ArrowLeft size={12} />
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); moveStatus(order.id, 'next'); }}
                                className="btn-icon"
                                style={{ padding: '5px 8px', background: 'var(--accent-primary)', color: '#fff' }}
                                title="Передвинуть в следующий статус"
                              >
                                <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
