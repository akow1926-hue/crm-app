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
import { DeliveryDeadlineBadge } from '../utils/deliveryDeadline';

export default function DashboardView({ orders, clients, activityLogs, onOpenNewOrder, setActiveTab, setSelectedOrder }) {
  // Calculations: Revenue is STRICTLY calculated from actual payments received
  const totalPaidRevenue = orders.reduce((sum, o) => {
    const paid = parseFloat(o.paidAmount !== undefined ? o.paidAmount : (o.paymentStatus === 'paid' ? (o.totalAmount || 0) : 0)) || 0;
    return sum + paid;
  }, 0);

  const totalCalculatedOrdersAmount = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || 0)), 0);
  const pendingDebt = Math.max(0, totalCalculatedOrdersAmount - totalPaidRevenue);

  const activeOrdersCount = orders.filter(o => o.status !== 'done' && o.status !== 'cancel').length;
  const inWorkCount = orders.filter(o => o.status === 'cleaning').length;
  const readyDeliveryCount = orders.filter(o => o.status === 'ready' || o.status === 'delivery').length;
  const urgentCount = orders.filter(o => o.urgent).length;

  const statCards = [
    {
      title: 'Фактическая Выручка',
      value: `${totalPaidRevenue.toLocaleString('ru-RU')} сум`,
      subtext: pendingDebt > 0 ? `Ожидает оплаты: ${pendingDebt.toLocaleString('ru-RU')} сум` : 'Все начисления оплачены',
      badge: 'Оплачено',
      icon: DollarSign,
      color: '#10b981',
      accentBorder: 'rgba(16, 185, 129, 0.4)',
      bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
      tab: 'finance'
    },
    {
      title: 'Активные Заказы',
      value: `${activeOrdersCount} зак.`,
      subtext: urgentCount > 0 ? `🔥 ${urgentCount} срочных в работе` : 'В графике доставки',
      badge: 'В процессе',
      icon: Package,
      color: '#38bdf8',
      accentBorder: 'rgba(56, 189, 248, 0.4)',
      bg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(2, 132, 199, 0.05) 100%)',
      tab: 'kanban'
    },
    {
      title: 'Стирка & Сушка в Цеху',
      value: `${inWorkCount} зак.`,
      subtext: 'Конвейер загружен на 75%',
      badge: 'Цех',
      icon: Shirt,
      color: '#f59e0b',
      accentBorder: 'rgba(245, 158, 11, 0.4)',
      bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
      tab: 'kanban'
    },
    {
      title: 'Готово к Доставке',
      value: `${readyDeliveryCount} зак.`,
      subtext: 'Курьеры распределяют рейсы',
      badge: 'Логистика',
      icon: Truck,
      color: '#c084fc',
      accentBorder: 'rgba(192, 132, 252, 0.4)',
      bg: 'linear-gradient(135deg, rgba(192, 132, 252, 0.15) 0%, rgba(147, 51, 234, 0.05) 100%)',
      tab: 'yandexMap'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Welcome Banner */}
      <div className="responsive-header-banner" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(6, 182, 212, 0.14) 100%)',
        border: '1.5px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-new" style={{ fontSize: '11px', fontWeight: '800' }}>
              <Sparkles size={13} /> Cosmo CRM • Live Database
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '12.5px', fontWeight: '600' }}>Оперативная сводка</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.02em', color: '#fff', marginBottom: '4px' }}>
            Система Управления Чисткой Ковров & Мебели
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '650px', lineHeight: 1.5 }}>
            Автоматизированный учет заказов, GPS-маршрутизация курьеров, расчет площади и финансовая статистика.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={onOpenNewOrder} className="btn btn-primary" style={{ padding: '10px 18px', fontWeight: '800' }}>
            <PlusCircle size={18} /> Создать Заказ
          </button>
          <button onClick={() => setActiveTab('kanban')} className="btn btn-secondary" style={{ padding: '10px 18px', fontWeight: '700' }}>
            <KanbanSquare size={18} /> Канбан Доска
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
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                borderTop: `3px solid ${card.color}`,
                padding: '18px 20px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = card.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.borderTopColor = card.color;
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {card.title}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 12px ${card.accentBorder}`
                }}>
                  <Icon size={19} color={card.color} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.02em', color: card.color }}>
                  {card.value}
                </div>
                {card.subtext && (
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600', marginTop: '4px' }}>
                    {card.subtext}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Main Content: Streamlined Recent Orders & Activity Log */}
      <div className="responsive-grid-7-5">
        {/* Recent Orders List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Последние Заказы
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>Кликните на заказ для открытия карточки</p>
            </div>
            <button onClick={() => setActiveTab('ordersTable')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', height: '32px' }}>
              Все заказы <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '13px' }}>
                Нет активных заказов
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div 
                  key={order.id || Math.random()} 
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
                    transition: 'var(--transition-fast)',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                        {order.id ? `#${order.id}` : 'Б/Н'}
                      </span>
                      <DeliveryDeadlineBadge order={order} />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{order.clientName}</span>
                      {order.urgent && (
                        <span className="badge badge-cancel" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          <ShieldAlert size={10} /> СРОЧНО
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
                      {order.phone} • {Array.isArray(order.items) ? order.items.length : 1} поз. • {order.district || 'Самарканд'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14.5px', fontWeight: '900', color: '#10b981' }}>
                      {(parseFloat(order.totalAmount) || 0).toLocaleString()} сум
                    </div>
                    <span className={`badge badge-${order.status}`} style={{ fontSize: '11px', marginTop: '4px' }}>
                      {order.status === 'new' && '📥 Ожидает забора'}
                      {order.status === 'pickup' && '🚚 На заборе'}
                      {order.status === 'cleaning' && '🧼 В стирке'}
                      {order.status === 'ready' && '📦 Готов'}
                      {order.status === 'delivery' && '🚗 На доставке'}
                      {order.status === 'done' && '✅ Выполнен'}
                      {order.status === 'cancel' && '❌ Отменен'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Activity Feed Log */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                <Activity size={19} color="var(--accent-secondary)" /> Журнал Событий CRM
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>Хронология действий сотрудников</p>
            </div>
            <button onClick={() => setActiveTab('analytics')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', height: '32px' }}>
              Аналитика <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(activityLogs || []).slice(0, 5).map((log) => (
              <div 
                key={log.id} 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: log.type === 'status' ? 'var(--accent-primary)' : '#10b981',
                  marginTop: '6px',
                  boxShadow: log.type === 'status' ? '0 0 8px var(--accent-primary)' : '0 0 8px #10b981',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    {log.text}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
