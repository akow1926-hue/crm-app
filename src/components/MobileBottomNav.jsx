import React from 'react';
import { LayoutDashboard, KanbanSquare, Table, MapPin, Users, Calculator, ShieldCheck } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab, userRole }) {
  const tabs = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'kanban', label: 'Канбан', icon: KanbanSquare },
    { id: 'ordersTable', label: 'Заказы', icon: Table },
    { id: 'yandexMap', label: 'Карта', icon: MapPin },
    { id: 'clients', label: 'Клиенты', icon: Users },
  ];

  if (userRole === 'admin') {
    tabs.push({ id: 'adminCard', label: 'Кабинет', icon: ShieldCheck });
  }

  return (
    <div className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '8px 4px',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-dim)',
              fontSize: '11px',
              fontWeight: isActive ? '700' : '500',
              cursor: 'pointer'
            }}
          >
            <Icon size={20} color={isActive ? 'var(--accent-primary)' : 'var(--text-dim)'} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
