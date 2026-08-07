import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight,
  Sparkles,
  Layers
} from 'lucide-react';

export default function AnalyticsView({ orders, clients }) {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const paidRevenue = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const activeOrdersCount = orders.filter(o => o.status !== 'done' && o.status !== 'cancel').length;

  const statusList = [
    { label: 'Ожидает забора (Новые)', count: orders.filter(o => o.status === 'new').length, color: '#60a5fa', percent: '16%' },
    { label: 'Забор курьером', count: orders.filter(o => o.status === 'pickup').length, color: '#a78bfa', percent: '16%' },
    { label: 'В цеху (Стирка/Чистка)', count: orders.filter(o => o.status === 'cleaning').length, color: '#fbbf24', percent: '16%' },
    { label: 'Готов к отправке', count: orders.filter(o => o.status === 'ready').length, color: '#22d3ee', percent: '16%' },
    { label: 'На доставке', count: orders.filter(o => o.status === 'delivery').length, color: '#f472b6', percent: '16%' },
    { label: 'Выполнен', count: orders.filter(o => o.status === 'done').length, color: '#34d399', percent: '20%' }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-new" style={{ fontSize: '11px' }}>
              <BarChart3 size={12} /> Аналитика & Статистика
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
            Детальный финансовый и операционный отчёт
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Графики динамики выручки, распределение статусов и ключевые KPI предприятия.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Всего заказов в базе</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-secondary)' }}>{orders.length}</div>
          </div>
        </div>
      </div>

      {/* Revenue Analytics Visual Chart */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--accent-primary)" /> Динамика выручки по дням недели
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Анализ поступающих средств и активности клиентов</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-ready">Текущая неделя</span>
          </div>
        </div>

        {/* SVG Bar Chart */}
        <div style={{ height: '220px', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px 10px 0 10px', borderBottom: '1px solid var(--border-color)' }}>
          {[
            { day: 'Пн', amount: 320000, height: '45%' },
            { day: 'Вт', amount: 480000, height: '65%' },
            { day: 'Ср', amount: 290000, height: '40%' },
            { day: 'Чт', amount: 620000, height: '85%' },
            { day: 'Пт', amount: 550000, height: '75%' },
            { day: 'Сб', amount: 780000, height: '95%' },
            { day: 'Вс', amount: 410000, height: '55%' }
          ].map((bar, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>{(bar.amount / 1000).toFixed(0)}k</span>
              <div 
                style={{
                  width: '100%',
                  maxWidth: '42px',
                  height: bar.height,
                  background: i === 5 ? 'var(--accent-gradient)' : 'rgba(99, 102, 241, 0.25)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'var(--transition-smooth)',
                  cursor: 'pointer',
                  boxShadow: i === 5 ? 'var(--shadow-glow)' : 'none'
                }}
                title={`${bar.day}: ${bar.amount.toLocaleString()} сум`}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{bar.day}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '10px' }}>
          <span>Средний чек заказа: <strong style={{ color: '#fff' }}>265,000 сум</strong></span>
          <span>Оплачено клиентами: <strong style={{ color: '#10b981' }}>{paidRevenue.toLocaleString()} сум</strong></span>
          <span>Общий оборот: <strong style={{ color: 'var(--accent-primary)' }}>{totalRevenue.toLocaleString()} сум</strong></span>
        </div>
      </div>

      {/* Status Breakdown & Process Distribution */}
      <div className="responsive-grid-7-5">
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={18} color="#06b6d4" /> Распределение заказов по этапам
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Текущая нагрузка на цех и курьерскую службу</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {statusList.map((st, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: st.color }} />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{st.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800' }}>{st.count} зак.</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: st.count ? `${Math.max((st.count / orders.length) * 100, 15)}%` : '5%', height: '100%', background: st.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top VIP Clients Breakdown */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👑 ТОП Клиенты по выручке (LTV)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Самые постоянные заказчики сервиса</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clients.map((client, idx) => (
              <div 
                key={client.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: idx === 0 ? 'var(--accent-gradient-gold)' : 'rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '13px',
                    color: '#fff'
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{client.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{client.totalOrders} заказов</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                    {client.ltv.toLocaleString()} сум
                  </div>
                  <span className="badge badge-ready" style={{ fontSize: '10px' }}>
                    {client.tier} ({client.discountPercent}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
