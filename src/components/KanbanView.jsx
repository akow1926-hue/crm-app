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
  GripVertical
} from 'lucide-react';

import { saveSupabaseOrder } from '../services/supabaseService';

export default function KanbanView({ orders, setOrders, setSelectedOrder, onOpenNewOrder }) {
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

  const columns = [
    { id: 'new', title: '📥 1. Ожидает забора', color: '#38bdf8', icon: Package, badgeClass: 'badge-new' },
    { id: 'cleaning', title: '🧼 2. Забран / В цеху', color: '#facc15', icon: Shirt, badgeClass: 'badge-cleaning' },
    { id: 'delivery', title: '📦 3. Готов / На доставке', color: '#a855f7', icon: Truck, badgeClass: 'badge-delivery' },
    { id: 'done', title: '✅ 4. Выполнен', color: '#10b981', icon: CheckCircle2, badgeClass: 'badge-done' }
  ];

  const statusFlow = ['new', 'cleaning', 'delivery', 'done'];

  const moveStatus = (orderId, direction) => {
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
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
          syncOrderToGoogleSheets(updatedOrder);
          return updatedOrder;
        }
      }
      return order;
    }));
  };

  const setExactStatus = (orderId, targetStatus) => {
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = { 
          ...order, 
          status: targetStatus,
          paymentStatus: targetStatus === 'done' ? 'paid' : order.paymentStatus 
        };
        saveSupabaseOrder(updatedOrder);
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800' }}>📌 Канбан-доска заказов (Drag & Drop)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Перетаскивайте карточки мышью между колонками или используйте стрелки для смены статуса
          </p>
        </div>

        <button onClick={onOpenNewOrder} className="btn btn-primary">
          <Plus size={16} /> Создать Заказ
        </button>
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
          const colOrders = orders.filter(o => {
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
                background: isTargetOver ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: isTargetOver ? '2px dashed var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
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
                paddingBottom: '12px',
                borderBottom: `2px solid ${col.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ColumnIcon size={18} color={col.color} />
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{col.title}</span>
                </div>
                <span className={`badge ${col.badgeClass}`} style={{ fontSize: '11px' }}>
                  {colOrders.length}
                </span>
              </div>

              {/* Column Total Price Summary */}
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'right' }}>
                Сумма: <strong style={{ color: '#fff' }}>{colTotal.toLocaleString()} сум</strong>
              </div>

              {/* Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: '120px' }}>
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

                    return (
                      <div
                        key={order.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        style={{
                          background: 'var(--bg-card)',
                          border: order.urgent ? '1px solid #f43f5e' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'grab',
                          opacity: isDragging ? 0.4 : 1,
                          transition: 'var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = order.urgent ? '#f43f5e' : 'var(--border-color)'}
                      >
                        {/* Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <GripVertical size={14} color="var(--text-dim)" style={{ cursor: 'grab' }} />
                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                              #{order.id}
                            </span>
                            {order.urgent && (
                              <span className="badge badge-cancel" style={{ fontSize: '9px', padding: '2px 6px' }}>
                                <ShieldAlert size={9} /> СРОЧНО
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{dateStr}</span>
                        </div>

                        {/* Client Info */}
                        <div onClick={() => setSelectedOrder(order)}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                            {order.clientName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Phone size={12} color="var(--text-dim)" /> {order.phone}
                          </div>
                        </div>

                        {/* Items Summary */}
                        <div 
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            background: 'rgba(0, 0, 0, 0.2)',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: 'var(--text-muted)'
                          }}
                        >
                          {(order.items || []).map((it, idx) => (
                            <div key={idx} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              • {it.name} ({it.qty})
                            </div>
                          ))}
                        </div>

                        {/* Price & Payment & Action controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                              {(order.totalAmount || 0).toLocaleString()} сум
                            </div>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              color: order.paymentStatus === 'paid' ? '#10b981' : order.paymentStatus === 'partial' ? '#f59e0b' : '#f43f5e'
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
                                style={{ padding: '4px' }}
                                title="Вернуть в предыдущий статус"
                              >
                                <ArrowLeft size={12} />
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); moveStatus(order.id, 'next'); }}
                                className="btn-icon"
                                style={{ padding: '4px', background: 'var(--accent-primary)', color: '#fff' }}
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
