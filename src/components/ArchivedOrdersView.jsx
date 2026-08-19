import React, { useState } from 'react';
import { 
  Archive, 
  Search, 
  Download, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Shirt, 
  Eye, 
  Phone, 
  MapPin, 
  UserCheck,
  Trash2
} from 'lucide-react';
import { exportOrdersToCSV } from '../utils/googleSheetsSync';
import DeletedOrdersView from './DeletedOrdersView';

export default function ArchivedOrdersView({ 
  orders = [], 
  deletedOrders = [], 
  onRestoreOrder, 
  onPermanentDelete, 
  onClearAllDeleted,
  setSelectedOrder,
  initialSubTab = 'completed'
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'completed' | 'deleted'
  const [searchQuery, setSearchQuery] = useState('');

  // Filter only completed (done) orders for the Archive
  const archivedOrders = orders.filter(order => order.status === 'done');

  // Filtered Archive list
  const filteredArchive = archivedOrders.filter(order => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      String(order.clientName || order.client_name || '').toLowerCase().includes(q) ||
      String(order.phone || order.clientPhone || order.client_phone || '').includes(q) ||
      String(order.id || '').includes(q) ||
      String(order.address || '').toLowerCase().includes(q) ||
      String(order.comment || '').toLowerCase().includes(q);

    return matchesQuery;
  });

  // Archive Analytics
  const totalArchivedRevenue = archivedOrders.reduce((sum, o) => sum + (o.totalAmount || o.total_amount || 0), 0);
  const totalArchivedItems = archivedOrders.reduce((sum, o) => {
    const items = o.items || [];
    return sum + items.reduce((iSum, it) => iSum + (it.qty || 1), 0);
  }, 0);
  const avgOrderValue = archivedOrders.length > 0 ? Math.round(totalArchivedRevenue / archivedOrders.length) : 0;

  const handleExportCSV = () => {
    exportOrdersToCSV(filteredArchive);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
      {/* Navigation Sub-Tabs Switcher: Completed Archive vs Deleted Orders */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        paddingBottom: '8px'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('completed')}
          style={{
            background: activeSubTab === 'completed' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.1) 100%)' 
              : 'rgba(255, 255, 255, 0.04)',
            border: activeSubTab === 'completed' ? '1.5px solid #10b981' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            color: activeSubTab === 'completed' ? '#fff' : 'var(--text-muted, #94a3b8)',
            padding: '10px 18px',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'completed' ? '0 4px 14px rgba(16, 185, 129, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Archive size={16} color={activeSubTab === 'completed' ? '#10b981' : '#94a3b8'} />
          <span>📁 Выполненные заказы</span>
          <span style={{
            background: activeSubTab === 'completed' ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '800',
            padding: '2px 7px',
            borderRadius: '10px'
          }}>
            {archivedOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('deleted')}
          style={{
            background: activeSubTab === 'deleted' 
              ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(244, 63, 94, 0.1) 100%)' 
              : 'rgba(255, 255, 255, 0.04)',
            border: activeSubTab === 'deleted' ? '1.5px solid #f43f5e' : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            color: activeSubTab === 'deleted' ? '#fff' : 'var(--text-muted, #94a3b8)',
            padding: '10px 18px',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'deleted' ? '0 4px 14px rgba(244, 63, 94, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Trash2 size={16} color={activeSubTab === 'deleted' ? '#f43f5e' : '#94a3b8'} />
          <span>🗑️ Корзина / Удаленные</span>
          <span style={{
            background: activeSubTab === 'deleted' ? '#f43f5e' : 'rgba(244, 63, 94, 0.2)',
            color: activeSubTab === 'deleted' ? '#fff' : '#f87171',
            fontSize: '11px',
            fontWeight: '800',
            padding: '2px 7px',
            borderRadius: '10px'
          }}>
            {deletedOrders.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: Completed Orders Archive */}
      {activeSubTab === 'completed' && (
        <>
          {/* Header Banner */}
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-lg, 16px)',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-done" style={{ fontSize: '11px' }}>
                  <Archive size={12} /> Архив Выполненных
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Реестр закрытых заказов</span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>
                📁 Архив Выполненных Заказов
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', marginTop: '3px', margin: 0 }}>
                Все доставленные и оплаченные заказы вынесены в архив, чтобы не перегружать рабочую Канбан-доску.
              </p>
            </div>

            <button onClick={handleExportCSV} className="btn btn-secondary" style={{ height: '40px' }}>
              <Download size={16} /> Экспорт Архива в CSV
            </button>
          </div>

          {/* Archive Stats KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #10b981' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Выполнено Заказов</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{archivedOrders.length} зак.</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #6366f1' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <DollarSign size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Выручка Архива</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#818cf8' }}>{totalArchivedRevenue.toLocaleString('ru-RU')} сум</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <Shirt size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Постирано Изделий</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{totalArchivedItems} шт</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #06b6d4' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
                <Calendar size={22} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>Средний Чек Заказа</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#22d3ee' }}>{avgOrderValue.toLocaleString('ru-RU')} сум</div>
              </div>
            </div>
          </div>

          {/* Filter and Search Control Bar */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <Search size={16} color="var(--text-muted, #94a3b8)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Поиск по Архиву (Имя, Телефон, Адрес, #ID)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
              />
            </div>

            <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginLeft: 'auto' }}>
              Отображено {filteredArchive.length} из {archivedOrders.length} выполненных заказов
            </span>
          </div>

          {/* Archived Orders Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', color: 'var(--text-dim, #94a3b8)' }}>
                    <th style={{ padding: '12px 16px' }}>#ID Заказа</th>
                    <th style={{ padding: '12px 16px' }}>Клиент / Адрес (Ориентир)</th>
                    <th style={{ padding: '12px 16px' }}>Телефон</th>
                    <th style={{ padding: '12px 16px' }}>Принял курьер</th>
                    <th style={{ padding: '12px 16px' }}>Позиции заказа</th>
                    <th style={{ padding: '12px 16px' }}>Итоговая Оплата</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchive.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted, #94a3b8)' }}>
                        Архивных заказов по вашему запросу не найдено.
                      </td>
                    </tr>
                  ) : (
                    filteredArchive.map(order => {
                      const clientName = order.clientName || order.client_name || 'Клиент';
                      const phone = order.phone || order.clientPhone || order.client_phone || '-';
                      const address = order.address || 'Самарканд';
                      const courier = order.assignedCourier || order.courier || 'Акобир';
                      const total = order.totalAmount || order.total_amount || 0;
                      const items = order.items || [];

                      return (
                        <tr 
                          key={order.id}
                          style={{ borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', transition: 'background 0.2s' }}
                          className="table-row-hover"
                        >
                          <td style={{ padding: '12px 16px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>
                            #{order.id}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#fff' }}>{clientName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <MapPin size={11} color="#f59e0b" /> {address}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace' }}>
                            <a href={`tel:${phone.replace(/\D/g, '')}`} style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} /> {phone}
                            </a>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="badge badge-pickup" style={{ fontSize: '11px' }}>
                              <UserCheck size={11} /> {courier}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                              {items.length > 0 ? items.map(it => `${it.qty || 1}x ${it.name}`).join(', ') : 'Стирка ковров'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '800', color: '#34d399' }}>
                              {total.toLocaleString('ru-RU')} сум
                            </div>
                            <span className="badge badge-done" style={{ fontSize: '10px', marginTop: '2px' }}>
                              Оплачено
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              title="Открыть Карточку Заказа"
                            >
                              <Eye size={14} /> Просмотр
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: Deleted Orders / Trash */}
      {activeSubTab === 'deleted' && (
        <DeletedOrdersView
          deletedOrders={deletedOrders}
          onRestoreOrder={onRestoreOrder}
          onPermanentDelete={onPermanentDelete}
          onClearAllDeleted={onClearAllDeleted}
          setSelectedOrder={setSelectedOrder}
        />
      )}
    </div>
  );
}
