import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Shirt, 
  Truck, 
  DollarSign, 
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Clock,
  PlusCircle,
  KanbanSquare,
  Activity
} from 'lucide-react';

export default function DashboardView({ orders, clients, activityLogs, onOpenNewOrder, setActiveTab, setSelectedOrder }) {
  // Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'done' && o.status !== 'cancel').length;
  const inWorkCount = orders.filter(o => o.status === 'cleaning').length;
  const readyDeliveryCount = orders.filter(o => o.status === 'ready' || o.status === 'delivery').length;
  const urgentCount = orders.filter(o => o.urgent).length;

  const statCards = [
    {
      title: 'Общая Выручка',
      value: `${totalRevenue.toLocaleString('ru-RU')} сум`,
      change: '+18.4%',
      trend: 'up',
      icon: DollarSign,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.12)',
      tab: 'finance'
    },
    {
      title: 'Активные Заказы',
      value: activeOrdersCount,
      subtext: `${urgentCount} срочных`,
      icon: Package,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.12)',
      tab: 'kanban'
    },
    {
      title: 'Стирка в Цеху',
      value: `${inWorkCount} зак.`,
      subtext: 'Загрузка 75%',
      icon: Shirt,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      tab: 'kanban'
    },
    {
      title: 'Готово к Доставке',
      value: `${readyDeliveryCount} зак.`,
      subtext: '2 курьера на линии',
      icon: Truck,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      tab: 'yandexMap'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Welcome Banner */}
      <div className="responsive-header-banner" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-new" style={{ fontSize: '11px' }}>
              <Sparkles size={12} /> Cosmo CRM Premium
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Главный экран</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
            Обзор системы Cosmo Cleaning
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '600px' }}>
            Краткие показатели и быстрый доступ к текущим заказам. Подробные графики вынесены в боковую панель меню.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={onOpenNewOrder} className="btn btn-primary" style={{ flex: '1 1 auto' }}>
            <PlusCircle size={16} /> Создать Заказ
          </button>
          <button onClick={() => setActiveTab('kanban')} className="btn btn-secondary" style={{ flex: '1 1 auto' }}>
            <KanbanSquare size={16} /> Канбан Доска
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="responsive-grid-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              className="glass-card" 
              onClick={() => setActiveTab(card.tab)}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'var(--transition-fast)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                  {card.title}
                </span>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={20} color={card.color} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                  {card.value}
                </div>
                {card.subtext && (
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>
                    {card.subtext}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Main Content: Streamlined Recent Orders & Activity Log */}
      <div className="responsive-grid-7-5">
        {/* Recent Orders List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>📋 Последние заказы</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Нажмите на заказ для редактирования</p>
            </div>
            <button onClick={() => setActiveTab('ordersTable')} className="btn-icon" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Все заказы <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.slice(0, 5).map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '800', color: 'var(--accent-secondary)' }}>{order.id ? `#${order.id}` : 'Б/Н'}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700' }}>{order.clientName}</span>
                    {order.urgent && (
                      <span className="badge badge-cancel" style={{ fontSize: '10px' }}>
                        <ShieldAlert size={10} /> СРОЧНО
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {order.phone} • {order.items.length} поз.
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                    {order.totalAmount.toLocaleString()} сум
                  </div>
                  <span className={`badge badge-${order.status}`} style={{ fontSize: '11px', marginTop: '2px' }}>
                    {order.status === 'new' && 'Ожидает забора'}
                    {order.status === 'pickup' && 'Забор курьером'}
                    {order.status === 'cleaning' && 'В цеху (Стирка)'}
                    {order.status === 'ready' && 'Готов'}
                    {order.status === 'delivery' && 'На доставке'}
                    {order.status === 'done' && 'Выполнен'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed Log */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--accent-primary)" /> Лента событий
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Оперативный журнал действий</p>
            </div>
            <button onClick={() => setActiveTab('analytics')} className="btn-icon" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Аналитика <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activityLogs.slice(0, 5).map((log) => (
              <div 
                key={log.id} 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: log.type === 'status' ? 'var(--accent-primary)' : '#10b981',
                  marginTop: '6px',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>
                    {log.text}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> {log.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
