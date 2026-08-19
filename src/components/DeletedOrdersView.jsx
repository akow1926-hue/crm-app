import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Search, 
  RotateCcw, 
  Download, 
  AlertTriangle, 
  Eye, 
  Phone, 
  MapPin, 
  DollarSign, 
  Shirt, 
  UserCheck, 
  X, 
  CheckSquare, 
  Square, 
  Clock, 
  ExternalLink
} from 'lucide-react';
import { exportOrdersToCSV } from '../utils/googleSheetsSync';

export default function DeletedOrdersView({ 
  deletedOrders = [], 
  onRestoreOrder, 
  onPermanentDelete, 
  onClearAllDeleted,
  setSelectedOrder 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | '3days' | 'week' | 'month'
  const [districtFilter, setDistrictFilter] = useState('all');
  const [deletedByFilter, setDeletedByFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewDetailOrder, setViewDetailOrder] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'amount_desc' | 'amount_asc'

  // Extract unique "deletedBy" users for filter dropdown
  const uniqueDeletedByUsers = useMemo(() => {
    const set = new Set();
    deletedOrders.forEach(o => {
      if (o.deletedBy) set.add(o.deletedBy);
    });
    return Array.from(set);
  }, [deletedOrders]);

  // Filter and Sort deleted orders
  const filteredOrders = useMemo(() => {
    return deletedOrders.filter(order => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        String(order.id || '').toLowerCase().includes(q) ||
        String(order.clientName || order.client_name || '').toLowerCase().includes(q) ||
        String(order.phone || order.clientPhone || order.client_phone || '').includes(q) ||
        String(order.address || '').toLowerCase().includes(q) ||
        String(order.district || '').toLowerCase().includes(q) ||
        String(order.landmark || '').toLowerCase().includes(q) ||
        String(order.deletedBy || '').toLowerCase().includes(q) ||
        String(order.deleteReason || '').toLowerCase().includes(q) ||
        String(order.assignedCourier || order.courier || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // District Filter
      if (districtFilter !== 'all' && order.district !== districtFilter) {
        return false;
      }

      // Deleted By Filter
      if (deletedByFilter !== 'all' && order.deletedBy !== deletedByFilter) {
        return false;
      }

      // Date Filter
      if (dateFilter !== 'all' && order.deletedAt) {
        const deletedTime = new Date(order.deletedAt).getTime();
        const now = Date.now();
        const diffHours = (now - deletedTime) / (1000 * 60 * 60);

        if (dateFilter === 'today' && diffHours > 24) return false;
        if (dateFilter === '3days' && diffHours > 72) return false;
        if (dateFilter === 'week' && diffHours > 168) return false;
        if (dateFilter === 'month' && diffHours > 720) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') {
        const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortOrder === 'oldest') {
        const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return timeA - timeB;
      }
      if (sortOrder === 'amount_desc') {
        return (b.totalAmount || b.total_amount || 0) - (a.totalAmount || a.total_amount || 0);
      }
      if (sortOrder === 'amount_asc') {
        return (a.totalAmount || a.total_amount || 0) - (b.totalAmount || b.total_amount || 0);
      }
      return 0;
    });
  }, [deletedOrders, searchQuery, dateFilter, districtFilter, deletedByFilter, sortOrder]);

  // Analytics Metrics
  const totalDeletedAmount = useMemo(() => {
    return deletedOrders.reduce((sum, o) => sum + (o.totalAmount || o.total_amount || o.agreedAmount || 0), 0);
  }, [deletedOrders]);

  const totalDeletedItems = useMemo(() => {
    return deletedOrders.reduce((sum, o) => {
      const items = o.items || [];
      return sum + (items.length > 0 ? items.reduce((iSum, it) => iSum + (parseInt(it.qty, 10) || 1), 0) : (o.itemsCount || 1));
    }, 0);
  }, [deletedOrders]);

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id || o.tempId));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Restore Selected
  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Восстановить выбранные заказы (${selectedIds.length} шт.) обратно в рабочую систему?`)) {
      selectedIds.forEach(id => {
        const target = deletedOrders.find(o => (o.id && String(o.id) === String(id)) || (o.tempId && String(o.tempId) === String(id)));
        if (target && onRestoreOrder) {
          onRestoreOrder(target);
        }
      });
      setSelectedIds([]);
    }
  };

  // Permanent Delete Selected
  const handlePermanentDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Вы действительно хотите БЕЗВОЗВРАТНО удалить выбранные заказы (${selectedIds.length} шт.) из корзины?`)) {
      selectedIds.forEach(id => {
        if (onPermanentDelete) onPermanentDelete(id);
      });
      setSelectedIds([]);
    }
  };

  const handleExportCSV = () => {
    exportOrdersToCSV(filteredOrders);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1.5px solid rgba(244, 63, 94, 0.4)',
        borderRadius: 'var(--radius-lg, 16px)',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 30px rgba(244, 63, 94, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(244, 63, 94, 0.5)',
            flexShrink: 0
          }}>
            <Trash2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="badge badge-cancel" style={{ fontSize: '11px', fontWeight: '800' }}>
                🗑️ Корзина CRM
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                Реестр удаленных заказов ({deletedOrders.length} в базе)
              </span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>
              Поиск и Восстановление Удаленных Заказов
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', marginTop: '3px', margin: 0 }}>
              Здесь сохраняются все заказы, удаленные курьерами, диспетчерами или администраторами. Любой заказ можно восстановить в 1 клик.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {selectedIds.length > 0 && (
            <>
              <button 
                onClick={handleRestoreSelected}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontWeight: '800',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                <RotateCcw size={15} /> Восстановить ({selectedIds.length})
              </button>
              <button 
                onClick={handlePermanentDeleteSelected}
                className="btn"
                style={{
                  background: 'rgba(244, 63, 94, 0.2)',
                  border: '1px solid #f43f5e',
                  color: '#f87171',
                  fontWeight: '700'
                }}
              >
                <Trash2 size={15} /> Удалить навсегда ({selectedIds.length})
              </button>
            </>
          )}

          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ height: '40px' }} title="Экспорт найденных удаленных заказов в Excel/CSV">
            <Download size={16} /> Экспорт CSV
          </button>

          {deletedOrders.length > 0 && (
            <button 
              onClick={onClearAllDeleted} 
              className="btn btn-secondary" 
              style={{
                height: '40px',
                borderColor: 'rgba(244, 63, 94, 0.4)',
                color: '#f87171'
              }}
              title="Полностью очистить корзину"
            >
              <Trash2 size={15} /> Очистить корзину
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
            <Trash2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Удалено заказов</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{deletedOrders.length} зак.</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Отмененная сумма</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fbbf24' }}>{totalDeletedAmount.toLocaleString('ru-RU')} сум</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <Shirt size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Кол-во изделий</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{totalDeletedItems} шт</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Последнее удаление</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#e2e8f0' }}>
              {deletedOrders[0]?.deletedAt ? new Date(deletedOrders[0].deletedAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : 'Нет удалений'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Control Toolbar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} color="var(--text-muted, #94a3b8)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Поиск по удаленным (Имя, Телефон, Адрес, #ID, Кто удалил)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <select 
          value={dateFilter} 
          onChange={(e) => setDateFilter(e.target.value)}
          className="select-field"
          style={{ height: '38px', fontSize: '12.5px', minWidth: '130px' }}
        >
          <option value="all">📅 Все даты</option>
          <option value="today">⚡ За сегодня</option>
          <option value="3days">📅 За 3 дня</option>
          <option value="week">📅 За неделю</option>
          <option value="month">📅 За месяц</option>
        </select>

        {/* District Filter */}
        <select 
          value={districtFilter} 
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="select-field"
          style={{ height: '38px', fontSize: '12.5px', minWidth: '140px' }}
        >
          <option value="all">📍 Все районы</option>
          <option value="Сиёб">Сиёб</option>
          <option value="Багишамальский">Багишамальский</option>
          <option value="Согдиана">Согдиана</option>
          <option value="Микрорайон">Микрорайон</option>
          <option value="Саттепо">Саттепо</option>
          <option value="Железнодорожный">Железнодорожный</option>
          <option value="Самаркандский р-н">Самаркандский р-н</option>
          <option value="Центр">Центр</option>
        </select>

        {/* Who Deleted Filter */}
        {uniqueDeletedByUsers.length > 0 && (
          <select 
            value={deletedByFilter} 
            onChange={(e) => setDeletedByFilter(e.target.value)}
            className="select-field"
            style={{ height: '38px', fontSize: '12.5px', minWidth: '140px' }}
          >
            <option value="all">👤 Кто удалил: Все</option>
            {uniqueDeletedByUsers.map((u, idx) => (
              <option key={idx} value={u}>{u}</option>
            ))}
          </select>
        )}

        {/* Sort Order */}
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
          className="select-field"
          style={{ height: '38px', fontSize: '12.5px', minWidth: '150px' }}
        >
          <option value="newest">🕒 Сначала новые</option>
          <option value="oldest">🕒 Сначала старые</option>
          <option value="amount_desc">💰 По сумме (убывание)</option>
          <option value="amount_asc">💰 По сумме (возрастание)</option>
        </select>

        <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          Найдено: <strong>{filteredOrders.length}</strong> из {deletedOrders.length}
        </span>
      </div>

      {/* Main Deleted Orders List Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', color: 'var(--text-dim, #94a3b8)' }}>
                <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                  <button 
                    type="button" 
                    onClick={toggleSelectAll} 
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredOrders.length ? (
                      <CheckSquare size={17} color="#f43f5e" />
                    ) : (
                      <Square size={17} />
                    )}
                  </button>
                </th>
                <th style={{ padding: '12px 14px' }}>#ID Заказа</th>
                <th style={{ padding: '12px 14px' }}>Клиент и Телефон</th>
                <th style={{ padding: '12px 14px' }}>Адрес и Район</th>
                <th style={{ padding: '12px 14px' }}>Сумма & Изделия</th>
                <th style={{ padding: '12px 14px' }}>Когда и Кто удалил</th>
                <th style={{ padding: '12px 14px' }}>Курьер</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted, #94a3b8)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Trash2 size={36} color="rgba(255, 255, 255, 0.2)" />
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Удаленных заказов не найдено</div>
                      <div style={{ fontSize: '12.5px' }}>
                        {searchQuery || dateFilter !== 'all' || districtFilter !== 'all' || deletedByFilter !== 'all'
                          ? 'Попробуйте изменить параметры поиска или сбросить фильтры.'
                          : 'Корзина пуста. Все заказы находятся в рабочей системе.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const orderId = order.id || order.tempId || 'Б/Н';
                  const clientName = order.clientName || order.client_name || 'Клиент без имени';
                  const phone = order.phone || order.clientPhone || order.client_phone || '-';
                  const address = order.address || 'Самарканд';
                  const district = order.district || 'Сиёб';
                  const courier = order.assignedCourier || order.courier || 'Не назначен';
                  const total = order.totalAmount || order.total_amount || order.agreedAmount || 0;
                  const items = order.items || [];
                  const isSelected = selectedIds.includes(order.id || order.tempId);
                  const deletedDateFormatted = order.deletedAt 
                    ? new Date(order.deletedAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Неизвестно';

                  return (
                    <tr 
                      key={order.id || order.tempId || Math.random()}
                      style={{ 
                        borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', 
                        background: isSelected ? 'rgba(244, 63, 94, 0.1)' : 'transparent',
                        transition: 'background 0.2s' 
                      }}
                      className="table-row-hover"
                    >
                      {/* Selection Checkbox */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => toggleSelect(order.id || order.tempId)} 
                          style={{ background: 'none', border: 'none', color: isSelected ? '#f43f5e' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          {isSelected ? <CheckSquare size={17} color="#f43f5e" /> : <Square size={17} />}
                        </button>
                      </td>

                      {/* Order ID & Tag */}
                      <td style={{ padding: '12px 14px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace' }}>
                        <span style={{ color: order.id ? '#facc15' : '#94a3b8' }}>
                          #{orderId}
                        </span>
                        {order.urgent && (
                          <div style={{ marginTop: '2px' }}>
                            <span className="badge badge-cancel" style={{ fontSize: '9.5px', padding: '1px 4px' }}>🔥 СРОЧНО</span>
                          </div>
                        )}
                      </td>

                      {/* Client Name & Phone */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#fff' }}>{clientName}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', marginTop: '2px' }}>
                          <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={11} /> {phone}
                          </a>
                        </div>
                      </td>

                      {/* Address & District */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#f59e0b" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {address}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                          📍 {district} {order.landmark ? `(${order.landmark})` : ''}
                        </div>
                      </td>

                      {/* Total & Items */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '800', color: '#f43f5e' }}>
                          {total > 0 ? `${total.toLocaleString('ru-RU')} сум` : '0 сум'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          {items.length > 0 ? items.map(it => `${it.qty || 1}x ${it.name}`).join(', ') : 'Стирка'}
                        </div>
                      </td>

                      {/* Deleted Date & Author */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '11.5px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} color="#f43f5e" />
                          <span>{deletedDateFormatted}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px', fontWeight: '600' }}>
                          👤 {order.deletedBy || 'Пользователь'}
                        </div>
                        {order.deleteReason && order.deleteReason !== 'Удален из списка' && (
                          <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic', marginTop: '1px' }}>
                            Причина: {order.deleteReason}
                          </div>
                        )}
                      </td>

                      {/* Assigned Courier */}
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge badge-pickup" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                          <UserCheck size={11} /> {courier}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {/* Restore Button */}
                          <button
                            type="button"
                            onClick={() => onRestoreOrder && onRestoreOrder(order)}
                            className="btn btn-primary"
                            style={{
                              padding: '5px 10px',
                              fontSize: '11.5px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              fontWeight: '800',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                            }}
                            title="Восстановить этот заказ обратно в активные"
                          >
                            <RotateCcw size={13} /> Восстановить
                          </button>

                          {/* View Detail */}
                          <button
                            type="button"
                            onClick={() => setViewDetailOrder(order)}
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '11.5px' }}
                            title="Посмотреть полные детали удаленного заказа"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Permanent Delete */}
                          <button
                            type="button"
                            onClick={() => onPermanentDelete && onPermanentDelete(order.id || order.tempId)}
                            className="btn-icon"
                            style={{
                              padding: '5px',
                              color: '#f87171',
                              background: 'rgba(244, 63, 94, 0.15)',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              borderRadius: '6px'
                            }}
                            title="Удалить из корзины навсегда"
                          >
                            <Trash2 size={13} />
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

      {/* DETAIL MODAL FOR DELETED ORDER */}
      {viewDetailOrder && (
        <div 
          onClick={() => setViewDetailOrder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'var(--bg-modal, #0c1221)',
              border: '1.5px solid #f43f5e',
              padding: '20px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: '#f43f5e', color: '#ffffff', padding: '3px 9px', borderRadius: '6px', fontWeight: '900', fontSize: '13px' }}>
                  #{viewDetailOrder.id || viewDetailOrder.tempId || 'Б/Н'}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0 }}>
                  Детали удаленного заказа
                </h3>
              </div>
              <button onClick={() => setViewDetailOrder(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Deletion Warning Banner */}
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertTriangle size={24} color="#f43f5e" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12.5px' }}>
                <div style={{ color: '#fca5a5', fontWeight: '800' }}>
                  Удален: {viewDetailOrder.deletedAt ? new Date(viewDetailOrder.deletedAt).toLocaleString('ru-RU') : 'Не указано'}
                </div>
                <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                  Удалил пользователь: <strong>{viewDetailOrder.deletedBy || 'Не указан'}</strong>
                </div>
                {viewDetailOrder.deleteReason && (
                  <div style={{ color: '#94a3b8', marginTop: '2px' }}>
                    Причина: {viewDetailOrder.deleteReason}
                  </div>
                )}
              </div>
            </div>

            {/* Client Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>Клиент</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                  {viewDetailOrder.clientName || 'Без имени'}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>Телефон</div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#38bdf8', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {viewDetailOrder.phone || viewDetailOrder.clientPhone || '-'}
                </div>
              </div>
            </div>

            {/* Address & GPS */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>Адрес и район</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>
                🏠 {viewDetailOrder.address || 'Адрес не указан'}
              </div>
              <div style={{ fontSize: '12px', color: '#38bdf8' }}>
                📍 Район: <strong>{viewDetailOrder.district || 'Сиёб'}</strong> {viewDetailOrder.landmark ? `(Ориентир: ${viewDetailOrder.landmark})` : ''}
              </div>
              {viewDetailOrder.gpsLocation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11.5px', color: '#34d399', fontFamily: 'monospace' }}>
                    🎯 GPS: {viewDetailOrder.gpsLocation}
                  </span>
                  <a
                    href={`https://yandex.ru/maps/?text=${encodeURIComponent(viewDetailOrder.gpsLocation)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                  >
                    Яндекс Навигатор <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>

            {/* Items List */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
                Позиции заказа ({viewDetailOrder.items?.length || 0}):
              </div>
              {viewDetailOrder.items && viewDetailOrder.items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {viewDetailOrder.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>{it.name || it.serviceName || 'Услуга'} ({it.qty || 1} {it.unit || 'шт'})</span>
                      <strong style={{ color: '#10b981' }}>{((it.price || 0) * (it.qty || 1)).toLocaleString('ru-RU')} сум</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Нет подробного списка позиций</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Итоговая сумма:</span>
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#f43f5e' }}>
                  {(viewDetailOrder.totalAmount || viewDetailOrder.total_amount || 0).toLocaleString('ru-RU')} сум
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => {
                  if (onRestoreOrder) {
                    onRestoreOrder(viewDetailOrder);
                    setViewDetailOrder(null);
                  }
                }}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  padding: '12px',
                  fontSize: '13.5px',
                  fontWeight: '900',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  justifyContent: 'center'
                }}
              >
                <RotateCcw size={16} /> Восстановить этот заказ
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onPermanentDelete) {
                    onPermanentDelete(viewDetailOrder.id || viewDetailOrder.tempId);
                    setViewDetailOrder(null);
                  }
                }}
                className="btn"
                style={{
                  flex: 1,
                  background: 'rgba(244, 63, 94, 0.2)',
                  border: '1px solid #f43f5e',
                  color: '#f87171',
                  fontWeight: '700',
                  padding: '12px',
                  fontSize: '13px',
                  justifyContent: 'center'
                }}
              >
                <Trash2 size={15} /> Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
