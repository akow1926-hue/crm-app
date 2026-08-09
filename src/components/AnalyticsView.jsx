import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight,
  Sparkles,
  Layers,
  Award,
  Truck,
  Shirt,
  Users,
  Ruler,
  MapPin,
  Clock
} from 'lucide-react';

export default function AnalyticsView({ orders = [], clients = [] }) {
  const [timeFilter, setTimeFilter] = useState('all'); // 'week' | 'month' | 'all'

  // Helper to parse order date
  const parseOrderDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const match = String(dateStr).match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (match) {
        return new Date(`${match[3]}-${match[2]}-${match[1]}`);
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    } catch (e) {}
    return null;
  };

  // Filter orders by selected time window
  const activeOrders = orders.filter(o => {
    if (timeFilter === 'all') return true;
    const d = parseOrderDate(o.createdDate);
    if (!d) return true;
    const now = new Date();
    const diffDays = (now - d) / (1000 * 60 * 60 * 24);
    if (timeFilter === 'week') return diffDays <= 7;
    if (timeFilter === 'month') return diffDays <= 30;
    return true;
  });

  // Total Metrics from real database
  const totalGrossRevenue = activeOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.agreedAmount || 0)), 0);
  const totalPaidRevenue = activeOrders.reduce((sum, o) => sum + (parseFloat(o.paidAmount || (o.paymentStatus === 'paid' ? o.totalAmount : 0) || 0)), 0);
  const pendingRevenue = Math.max(0, totalGrossRevenue - totalPaidRevenue);
  
  const completedOrders = activeOrders.filter(o => o.status === 'done');
  const avgOrderValue = activeOrders.length > 0 ? Math.round(totalGrossRevenue / activeOrders.length) : 0;
  
  const totalAreaWashed = activeOrders.reduce((sum, o) => {
    if (o.area && parseFloat(o.area) > 0) return sum + parseFloat(o.area);
    if (o.items && Array.isArray(o.items)) {
      return sum + o.items.reduce((iSum, it) => iSum + (parseFloat(it.area) || 0), 0);
    }
    return sum;
  }, 0);

  // Status breakdown based on real orders
  const statusCounts = {
    pickup: activeOrders.filter(o => o.status === 'new' || o.status === 'pickup').length,
    cleaning: activeOrders.filter(o => o.status === 'cleaning').length,
    delivery: activeOrders.filter(o => o.status === 'ready' || o.status === 'delivery').length,
    done: activeOrders.filter(o => o.status === 'done').length
  };

  const statusProgressList = [
    { label: '📥 1. Ожидает забора (Новые)', count: statusCounts.pickup, color: '#facc15' },
    { label: '🧼 2. В цеху (Стирка & Замеры)', count: statusCounts.cleaning, color: '#38bdf8' },
    { label: '📦 3. Готов / На доставке', count: statusCounts.delivery, color: '#c084fc' },
    { label: '✅ 4. Выполнен & Оплачен', count: statusCounts.done, color: '#10b981' }
  ];

  // REAL Dynamic Day-of-Week Calculations from actual database
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dayRevenues = [0, 0, 0, 0, 0, 0, 0];
  const dayOrdersCount = [0, 0, 0, 0, 0, 0, 0];

  activeOrders.forEach(o => {
    const d = parseOrderDate(o.createdDate) || new Date();
    const jsDay = d.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1; // Map 0 (Mon) to 6 (Sun)
    const amount = parseFloat(o.totalAmount || o.paidAmount || 0);

    dayRevenues[dayIdx] += amount;
    dayOrdersCount[dayIdx] += 1;
  });

  const maxDayAmount = Math.max(...dayRevenues, 50000);

  // REAL Dynamic Services breakdown from actual order items
  const serviceMap = {};
  let totalItemsCount = 0;

  activeOrders.forEach(o => {
    if (o.items && Array.isArray(o.items) && o.items.length > 0) {
      o.items.forEach(it => {
        const name = it.serviceName || it.name?.split(' (')[0] || 'Мойка ковров';
        const q = parseInt(it.qty) || 1;
        const amt = parseFloat(it.total || (it.price ? it.price * q : 0));
        if (!serviceMap[name]) {
          serviceMap[name] = { count: 0, revenue: 0 };
        }
        serviceMap[name].count += q;
        serviceMap[name].revenue += amt;
        totalItemsCount += q;
      });
    } else {
      const name = o.serviceType || 'Мойка ковров';
      if (!serviceMap[name]) {
        serviceMap[name] = { count: 0, revenue: 0 };
      }
      const count = parseInt(o.itemsCount) || 1;
      serviceMap[name].count += count;
      serviceMap[name].revenue += parseFloat(o.totalAmount || 0);
      totalItemsCount += count;
    }
  });

  const palette = ['#38bdf8', '#facc15', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#818cf8'];
  const serviceStats = Object.keys(serviceMap).length > 0
    ? Object.entries(serviceMap)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, data], idx) => ({
          name: name,
          count: data.count,
          revenue: data.revenue,
          percent: totalItemsCount > 0 ? Math.round((data.count / totalItemsCount) * 100) : 0,
          color: palette[idx % palette.length]
        }))
    : [
        { name: 'Мойка ковров', count: activeOrders.length, percent: 100, color: '#38bdf8', revenue: totalGrossRevenue }
      ];

  // REAL Districts distribution from actual orders
  const districtMap = {};
  activeOrders.forEach(o => {
    const dist = (o.district || 'Центр').trim();
    if (!districtMap[dist]) districtMap[dist] = { count: 0, revenue: 0 };
    districtMap[dist].count += 1;
    districtMap[dist].revenue += parseFloat(o.totalAmount || 0);
  });

  const districtStats = Object.entries(districtMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([dist, data], idx) => ({
      name: dist,
      count: data.count,
      revenue: data.revenue,
      percent: activeOrders.length > 0 ? Math.round((data.count / activeOrders.length) * 100) : 0,
      color: palette[idx % palette.length]
    }));

  // REAL Courier performance
  const courierMap = {};
  activeOrders.forEach(o => {
    const courier = (o.assignedCourier || 'Не назначен').trim();
    if (!courierMap[courier]) courierMap[courier] = { totalOrders: 0, delivered: 0, revenue: 0 };
    courierMap[courier].totalOrders += 1;
    if (o.status === 'done' || o.status === 'delivery') courierMap[courier].delivered += 1;
    courierMap[courier].revenue += parseFloat(o.totalAmount || 0);
  });

  const courierStats = Object.entries(courierMap)
    .sort((a, b) => b[1].totalOrders - a[1].totalOrders);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1.5px solid var(--accent-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '900',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
          }}>
            <BarChart3 size={26} />
          </div>
          <div>
            <span className="badge badge-ready" style={{ fontSize: '11px', fontWeight: '800' }}>
              Живая Аналитика Базы Данных CRM
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
              📊 Аналитика & Реальная Статистика Заказов
            </h2>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              100% реальные цифры оборота, дней недели, услуг и выработки персонала
            </div>
          </div>
        </div>

        {/* Time Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setTimeFilter('week')}
            className="btn"
            style={{ fontSize: '12px', padding: '6px 12px', background: timeFilter === 'week' ? '#3b82f6' : 'transparent', color: '#fff', fontWeight: timeFilter === 'week' ? '800' : '500' }}
          >
            Неделя
          </button>
          <button 
            onClick={() => setTimeFilter('month')}
            className="btn"
            style={{ fontSize: '12px', padding: '6px 12px', background: timeFilter === 'month' ? '#3b82f6' : 'transparent', color: '#fff', fontWeight: timeFilter === 'month' ? '800' : '500' }}
          >
            Месяц
          </button>
          <button 
            onClick={() => setTimeFilter('all')}
            className="btn"
            style={{ fontSize: '12px', padding: '6px 12px', background: timeFilter === 'all' ? '#3b82f6' : 'transparent', color: '#fff', fontWeight: timeFilter === 'all' ? '800' : '500' }}
          >
            Вся история ({orders.length})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Metric 1: Общий Оборот */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>ОБЩИЙ ОБОРОТ (СУМ)</span>
            <DollarSign size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>
            {totalGrossRevenue.toLocaleString()} сум
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} /> <span>Оплачено: {totalPaidRevenue.toLocaleString()} сум ({totalGrossRevenue > 0 ? Math.round((totalPaidRevenue / totalGrossRevenue) * 100) : 0}%)</span>
          </div>
        </div>

        {/* Metric 2: Всего Заказов */}
        <div className="glass-card" style={{ borderLeft: '4px solid #38bdf8', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>ВСЕГО ЗАКАЗОВ В БАЗЕ</span>
            <Layers size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>
            {activeOrders.length} заказов
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8' }}>
            Выполнено: {completedOrders.length} | В работе: {activeOrders.length - completedOrders.length}
          </div>
        </div>

        {/* Metric 3: Средний Чек */}
        <div className="glass-card" style={{ borderLeft: '4px solid #facc15', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>СРЕДНИЙ ЧЕК ЗАКАЗА</span>
            <TrendingUp size={18} color="#facc15" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>
            {avgOrderValue.toLocaleString()} сум
          </div>
          <div style={{ fontSize: '11px', color: '#facc15' }}>
            В среднем на 1 заказ
          </div>
        </div>

        {/* Metric 4: Вымыто Площади */}
        <div className="glass-card" style={{ borderLeft: '4px solid #c084fc', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>ВЫМЫТО ПЛОЩАДИ (М²)</span>
            <Ruler size={18} color="#c084fc" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>
            {totalAreaWashed.toFixed(1)} м²
          </div>
          <div style={{ fontSize: '11px', color: '#c084fc' }}>
            Фактические замеры ковров в цеху
          </div>
        </div>
      </div>

      {/* REAL Day-by-Day Revenue and Orders Bar Chart Graph */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <TrendingUp size={20} color="#10b981" /> Реальное Распределение Выручки по Дням Недели
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Динамика рассчитывается строго на основе реальных дат оформления заказов в базе
            </p>
          </div>

          <span className="badge badge-ready" style={{ fontSize: '11.5px', fontWeight: '800' }}>
            📊 Точная статистика ({activeOrders.length} заказов)
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div style={{ 
          height: '240px', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'flex-end', 
          gap: '16px', 
          padding: '24px 16px 12px 16px', 
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)' 
        }}>
          {daysOfWeek.map((day, i) => {
            const amount = dayRevenues[i] || 0;
            const count = dayOrdersCount[i] || 0;
            const heightPercent = maxDayAmount > 0 ? Math.max(Math.round((amount / maxDayAmount) * 100), amount > 0 ? 10 : 4) : 4;
            const isHighest = amount === Math.max(...dayRevenues) && amount > 0;

            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '11px', color: amount > 0 ? '#10b981' : '#64748b', fontWeight: '800' }}>
                  {amount > 0 ? `${(amount / 1000).toFixed(0)}k` : '0'}
                </span>
                
                <div 
                  style={{
                    width: '100%',
                    maxWidth: '48px',
                    height: `${heightPercent}%`,
                    background: isHighest 
                      ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' 
                      : amount > 0 
                        ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)' 
                        : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.3s ease',
                    boxShadow: isHighest 
                      ? '0 0 16px rgba(16, 185, 129, 0.5)' 
                      : amount > 0 
                        ? '0 0 10px rgba(59, 130, 246, 0.3)' 
                        : 'none',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title={`${day}: ${amount.toLocaleString()} сум (${count} заказов)`}
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', color: '#ffffff', fontWeight: '800' }}>{day}</span>
                  <span style={{ fontSize: '10px', color: count > 0 ? '#38bdf8' : '#64748b', fontWeight: '600' }}>
                    {count > 0 ? `${count} зак.` : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid 2 Columns: Status Breakdown & Service Types */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        
        {/* Services Breakdown Card (Real Database) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <Layers size={18} color="#facc15" /> Реальное Распределение по Услугам & Изделиям
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Подсчитано строго по позициям всех оформленных заказов</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {serviceStats.map((svc, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                    {svc.name} <span style={{ fontSize: '11px', color: '#94a3b8' }}>({svc.count} шт / поз.)</span>
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: svc.color }}>{svc.percent}%</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>({svc.revenue.toLocaleString()} сум)</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(svc.percent, 4)}%`, height: '100%', background: svc.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Pipeline Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <PieChart size={18} color="#38bdf8" /> Текущая Загрузка Конвейера по Статусам
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Фактическое нахождение заказов в системе</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {statusProgressList.map((st, idx) => {
              const percent = activeOrders.length > 0 ? Math.round((st.count / activeOrders.length) * 100) : 0;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{st.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: st.color }}>{st.count} зак. ({percent}%)</span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(percent, st.count > 0 ? 8 : 2)}%`, height: '100%', background: st.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid 2 Columns: City Districts & Courier Workloads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        
        {/* Districts of Samarkand */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <MapPin size={18} color="#f43f5e" /> Распределение Заказов по Районам Самарканда
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Где чаще всего заказывают чистку</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {districtStats.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Нет данных по районам</div>
            ) : (
              districtStats.map((dst, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                      📍 {dst.name}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: dst.color }}>
                      {dst.count} зак. ({dst.percent}%)
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(dst.percent, 4)}%`, height: '100%', background: dst.color, borderRadius: '4px' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Courier Staff Workload */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <Truck size={18} color="#34d399" /> Нагрузка и Выработка Реальных Курьеров
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Сколько заказов закреплено и доставлено сотрудниками</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {courierStats.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Курьеры еще не назначены на заказы</div>
            ) : (
              courierStats.map(([courierName, data], idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="#38bdf8" />
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#fff' }}>{courierName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        Выполнено: {data.delivered} из {data.totalOrders} заказов
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#10b981' }}>
                      {data.revenue.toLocaleString()} сум
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {data.totalOrders} зак.
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
