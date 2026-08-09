import React, { useState } from 'react';
import { exportOrdersToCSV } from '../utils/googleSheetsSync';
import { 
  Search, 
  Filter, 
  Printer, 
  MessageSquare, 
  Eye, 
  Trash2, 
  ShieldAlert, 
  Download, 
  CheckSquare, 
  Square,
  Plus
} from 'lucide-react';

import { deleteSupabaseOrder } from '../services/supabaseService';

export default function OrdersTableView({ orders, setOrders, setSelectedOrder, onOpenNewOrder, searchQuery }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  // Filtering
  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      String(order.clientName || '').toLowerCase().includes(q) ||
      String(order.phone || order.clientPhone || '').includes(q) ||
      String(order.id || '').includes(q) ||
      String(order.address || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const deleteOrder = (id) => {
    if (window.confirm(`Вы действительно хотите удалить заказ #${id}?`)) {
      setOrders(orders.filter(o => o.id !== id));
      deleteSupabaseOrder(id);
    }
  };

  const exportCSV = () => {
    exportOrdersToCSV(filteredOrders);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Table Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800' }}>📋 Таблица всех заказов</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Полный реестр заказов Cosmo Cleaning Service (Всего: {filteredOrders.length})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={exportCSV} className="btn btn-secondary">
            <Download size={16} /> Экспорт CSV
          </button>
          <button onClick={onOpenNewOrder} className="btn btn-primary">
            <Plus size={16} /> Новый Заказ
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-dim)" />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>Фильтры:</span>
        </div>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-field"
          style={{ width: '180px', fontSize: '13px' }}
        >
          <option value="all">Все статусы</option>
          <option value="new">Ожидает забора</option>
          <option value="pickup">Забор курьером</option>
          <option value="cleaning">В цеху (Стирка)</option>
          <option value="ready">Готов к отправке</option>
          <option value="delivery">На доставке</option>
          <option value="done">Выполнен</option>
        </select>

        <select 
          value={paymentFilter} 
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="select-field"
          style={{ width: '180px', fontSize: '13px' }}
        >
          <option value="all">Все оплаты</option>
          <option value="paid">Оплачено</option>
          <option value="unpaid">Не оплачено</option>
          <option value="partial">Частично</option>
        </select>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '12px', color: 'var(--accent-secondary)', fontWeight: '600' }}>
              Выбрано: {selectedIds.length}
            </span>
            <button 
              onClick={() => {
                if(window.confirm(`Изменить статус для ${selectedIds.length} заказов?`)) {
                  setOrders(orders.map(o => selectedIds.includes(o.id) ? { ...o, status: 'ready' } : o));
                  setSelectedIds([]);
                }
              }}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Отметить "Готов"
            </button>
          </div>
        )}
      </div>

      {/* Orders Table Container */}
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 16px', width: '40px' }}>
                <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {selectedIds.length === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare size={16} color="var(--accent-primary)" /> : <Square size={16} />}
                </button>
              </th>
              <th style={{ padding: '14px 16px' }}>ID</th>
              <th style={{ padding: '14px 16px' }}>Клиент & Телефон</th>
              <th style={{ padding: '14px 16px' }}>Адрес</th>
              <th style={{ padding: '14px 16px' }}>Позиции</th>
              <th style={{ padding: '14px 16px' }}>Сумма</th>
              <th style={{ padding: '14px 16px' }}>Статус</th>
              <th style={{ padding: '14px 16px' }}>Оплата</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  Заказы не найдены
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                return (
                  <tr 
                    key={order.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => toggleSelect(order.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {isSelected ? <CheckSquare size={16} color="var(--accent-primary)" /> : <Square size={16} />}
                      </button>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--accent-secondary)' }}>
                        {order.id ? `#${order.id}` : 'Б/Н'}
                      </span>
                      {order.urgent && (
                        <span style={{ display: 'block', fontSize: '9px', color: '#f43f5e', fontWeight: '700' }}>СРОЧНО</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#fff' }}>{order.clientName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{order.phone}</div>
                    </td>

                    <td style={{ padding: '14px 16px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)' }}>
                      {order.address}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {order.items.length} поз.
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: '800', color: '#fff' }}>
                      {order.totalAmount.toLocaleString()} сум
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${order.status}`}>
                        {order.status === 'new' && 'Ожидает забора'}
                        {order.status === 'pickup' && 'Забор курьером'}
                        {order.status === 'cleaning' && 'В цеху (Стирка)'}
                        {order.status === 'ready' && 'Готов к отправке'}
                        {order.status === 'delivery' && 'На доставке'}
                        {order.status === 'done' && 'Выполнен'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: order.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: order.paymentStatus === 'paid' ? '#34d399' : '#f87171'
                      }}>
                        {order.paymentStatus === 'paid' ? 'Оплачено' : 'Долг'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          onClick={() => setSelectedOrder(order)} 
                          className="btn-icon" 
                          title="Детали / Редактировать"
                        >
                          <Eye size={15} />
                        </button>

                        <button 
                          onClick={() => deleteOrder(order.id)} 
                          className="btn-icon" 
                          style={{ color: '#f43f5e' }}
                          title="Удалить заказ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
