import React from 'react';
import { LayoutDashboard, KanbanSquare, MapPin, Users, Menu, Sparkles } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab, onOpenMenu, isMenuOpen }) {
  const tabs = [
    { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
    { id: 'kanban', label: 'Канбан', icon: KanbanSquare },
    { id: 'yandexMap', label: 'GPS Карта', icon: MapPin },
    { id: 'clients', label: 'Клиенты', icon: Users },
  ];

  const isOtherActive = !tabs.some(t => t.id === activeTab);

  return (
    <div className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id && !isMenuOpen;
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
              gap: '3px',
              padding: '6px 2px',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-dim)',
              fontSize: '11px',
              fontWeight: isActive ? '800' : '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              padding: '3px 12px',
              borderRadius: '12px',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={20} color={isActive ? 'var(--accent-primary)' : 'var(--text-dim)'} />
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* 5th Button: Open Full Mobile Menu Drawer */}
      <button
        onClick={onOpenMenu}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '6px 2px',
          background: 'none',
          border: 'none',
          color: (isMenuOpen || isOtherActive) ? 'var(--accent-secondary)' : 'var(--text-dim)',
          fontSize: '11px',
          fontWeight: (isMenuOpen || isOtherActive) ? '800' : '600',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative'
        }}
      >
        <div style={{
          padding: '3px 12px',
          borderRadius: '12px',
          background: (isMenuOpen || isOtherActive) ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Menu size={20} color={(isMenuOpen || isOtherActive) ? 'var(--accent-secondary)' : 'var(--text-dim)'} />
        </div>
        <span>Меню</span>
        {isOtherActive && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '18%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--accent-secondary)'
          }} />
        )}
      </button>
    </div>
  );
}
