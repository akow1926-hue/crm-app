import React from 'react';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Table, 
  Users, 
  Calculator, 
  Wallet, 
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  PhoneCall,
  Shirt,
  Sparkles,
  MapPin,
  BarChart3,
  Smartphone,
  Tag
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, isCollapsed, setIsCollapsed }) {
  const menuCategories = [
    {
      title: 'ОСНОВНОЕ',
      items: [
        { id: 'dashboard', label: 'Главный экран', icon: LayoutDashboard },
        { id: 'analytics', label: 'Аналитика & Графики', icon: BarChart3, badge: 'NEW' },
      ]
    },
    {
      title: 'ОПЕРАЦИИ',
      items: [
        { id: 'kanban', label: 'Канбан Доска', icon: KanbanSquare, badge: '6' },
        { id: 'ordersTable', label: 'Таблица Заказов', icon: Table },
        { id: 'yandexMap', label: 'Яндекс.Карта (GPS)', icon: MapPin, badge: 'Live' },
      ]
    },
    {
      title: 'БИЗНЕС И ФИНАНСЫ',
      items: [
        { id: 'servicesCatalog', label: 'Услуги и Прайс-лист', icon: Tag, badge: 'Прайс' },
        { id: 'clients', label: 'Клиенты (CRM)', icon: Users },
        { id: 'calculator', label: 'Калькулятор', icon: Calculator },
        { id: 'finance', label: 'Финансы & Зарплата', icon: Wallet },
        { id: 'smsControl', label: 'Управление СМС', icon: Smartphone, badge: 'API' },
        { id: 'adminCard', label: 'Карта Админа', icon: ShieldCheck, badge: 'Super' },
      ]
    }
  ];

  const roleConfigs = {
    admin: { label: '👑 Администратор', icon: ShieldCheck, color: '#6366f1' },
    dispatcher: { label: '📞 Диспетчер', icon: PhoneCall, color: '#06b6d4' },
    courier: { label: '🚚 Курьер', icon: Truck, color: '#f59e0b' },
    washer: { label: '🧺 Оператор стирки', icon: Shirt, color: '#10b981' }
  };

  const currentRole = currentUser?.role || 'admin';
  const CurrentRoleIcon = roleConfigs[currentRole]?.icon || ShieldCheck;

  return (
    <aside style={{
      width: isCollapsed ? '80px' : '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'var(--transition-smooth)',
      position: 'relative',
      zIndex: 20
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <img 
            src={localStorage.getItem('cosmo_crm_logo_url') || '/logo.jpg'} 
            alt="Cosmo Logo" 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              objectFit: 'cover', 
              border: '1.5px solid var(--accent-secondary)',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.3)',
              flexShrink: 0 
            }} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/logo.jpg';
            }}
          />
          {!isCollapsed && (
            <div>
              <h1 style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.3px', background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {localStorage.getItem('cosmo_crm_company_name') || 'COSMO CLEANING'}
              </h1>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Cleaning Service v3.0</span>
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="btn-icon"
          style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role Badge Indicator */}
      {!isCollapsed && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '0.5px' }}>
            Авторизован как:
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CurrentRoleIcon size={16} color={roleConfigs[currentRole]?.color} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>{roleConfigs[currentRole]?.label}</span>
          </div>
        </div>
      )}

      {/* Main Navigation List categorized */}
      <nav style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        {menuCategories.map((cat, catIdx) => (
          <div key={catIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!isCollapsed && (
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-dim)', letterSpacing: '0.8px', padding: '4px 10px 2px 10px' }}>
                {cat.title}
              </div>
            )}
            {cat.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '13.5px',
                    boxShadow: isActive ? '0 0 15px rgba(99, 102, 241, 0.15)' : 'none',
                    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 7px',
                      borderRadius: '8px',
                      background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                      color: '#fff'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* System Status Footer */}
      {!isCollapsed && (
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div className="pulse-dot"></div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600' }}>Сессия Активна</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Защищено паролем</div>
          </div>
        </div>
      )}
    </aside>
  );
}
