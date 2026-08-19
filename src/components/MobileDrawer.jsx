import React from 'react';
import { 
  X,
  LayoutDashboard, 
  KanbanSquare, 
  Table, 
  Archive,
  Users, 
  Calculator, 
  Wallet, 
  ShieldCheck,
  Truck,
  PhoneCall,
  Shirt,
  MapPin,
  BarChart3,
  Smartphone,
  Tag,
  Sun,
  Moon,
  LogOut,
  Plus,
  ChevronRight,
  Trash2
} from 'lucide-react';

export default function MobileDrawer({ 
  isOpen, 
  onClose, 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout, 
  theme, 
  toggleTheme,
  onOpenNewOrder,
  deletedOrdersCount = 0
}) {
  if (!isOpen) return null;

  const menuCategories = [
    {
      title: 'ОСНОВНОЕ',
      items: [
        { id: 'dashboard', label: 'Главный экран', icon: LayoutDashboard },
        { id: 'analytics', label: 'Аналитика & Графики', icon: BarChart3, badge: 'NEW', color: '#6366f1' },
      ]
    },
    {
      title: 'ОПЕРАЦИИ С ЗАКАЗАМИ',
      items: [
        { id: 'kanban', label: 'Канбан Доска', icon: KanbanSquare, badge: 'Активные', color: '#38bdf8' },
        { id: 'ordersTable', label: 'Таблица Заказов', icon: Table, color: '#38bdf8' },
        { id: 'archive', label: 'Архив Заказов', icon: Archive, badge: '📁', color: '#94a3b8' },
        { id: 'trash', label: 'Корзина / Удаленные', icon: Trash2, badge: deletedOrdersCount > 0 ? String(deletedOrdersCount) : null, color: '#f43f5e' },
        { id: 'yandexMap', label: 'Яндекс.Карта (GPS)', icon: MapPin, badge: 'Live', color: '#f59e0b' },
      ]
    },
    {
      title: 'БИЗНЕС, ФИНАНСЫ И НАСТРОЙКИ',
      items: [
        { id: 'servicesCatalog', label: 'Услуги и Прайс-лист', icon: Tag, badge: 'Прайс', color: '#10b981' },
        { id: 'clients', label: 'База Клиентов (CRM)', icon: Users, color: '#06b6d4' },
        { id: 'calculator', label: 'Калькулятор цен', icon: Calculator, color: '#a855f7' },
        { id: 'finance', label: 'Финансы & Зарплаты', icon: Wallet, badge: 'Касса', color: '#eab308' },
        { id: 'smsControl', label: 'Управление СМС (Eskiz)', icon: Smartphone, badge: 'SMS', color: '#ec4899' },
        { id: 'adminCard', label: 'Карта Админа & Настройки', icon: ShieldCheck, badge: 'Super', color: '#6366f1' },
      ]
    }
  ];

  const roleConfigs = {
    admin: { label: '👑 Администратор', color: '#6366f1' },
    dispatcher: { label: '📞 Диспетчер', color: '#06b6d4' },
    courier: { label: '🚚 Курьер', color: '#f59e0b' },
    washer: { label: '🧺 Оператор стирки', color: '#10b981' }
  };

  const currentRole = currentUser?.role || 'admin';
  const roleInfo = roleConfigs[currentRole] || roleConfigs.admin;

  const handleSelectTab = (id) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Dark Blur Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Drawer Container */}
      <div style={{
        position: 'relative',
        width: '85%',
        maxWidth: '340px',
        height: '100%',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        zIndex: 101,
        animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src={localStorage.getItem('cosmo_crm_logo_url') || '/logo.jpg'} 
              alt="Logo" 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                objectFit: 'cover', 
                border: '1.5px solid var(--accent-secondary)' 
              }} 
              onError={(e) => { e.target.onerror = null; e.target.src = '/logo.jpg'; }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-main)' }}>
                {localStorage.getItem('cosmo_crm_company_name') || 'COSMO CRM'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Все разделы и настройки
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn-icon"
            style={{ width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>
              {currentUser?.name || 'Администратор'}
            </div>
            <div style={{ fontSize: '11px', color: roleInfo.color, fontWeight: '700', marginTop: '2px' }}>
              {roleInfo.label}
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenNewOrder) {
                onOpenNewOrder();
                onClose();
              }
            }}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '800' }}
          >
            <Plus size={14} /> Заказ
          </button>
        </div>

        {/* Categorized Menu Navigation */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {menuCategories.map((cat, catIdx) => (
            <div key={catIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ 
                fontSize: '10px', 
                fontWeight: '900', 
                color: 'var(--text-dim)', 
                letterSpacing: '0.8px', 
                padding: '0 8px 4px 8px' 
              }}>
                {cat.title}
              </div>

              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--text-main)',
                      cursor: 'pointer',
                      fontWeight: isActive ? '800' : '600',
                      fontSize: '13.5px',
                      borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={18} color={isActive ? 'var(--accent-primary)' : (item.color || 'var(--text-muted)')} />
                      <span>{item.label}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.badge && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                          color: '#fff'
                        }}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={14} color="var(--text-dim)" />
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Drawer Bottom Actions: Theme & Logout */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12.5px',
                fontWeight: '700'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
                <span>{theme === 'dark' ? '☀️ Переключить на Дневную тему' : '🌙 Переключить на Тёмную тему'}</span>
              </div>
            </button>
          )}

          {onLogout && (
            <button
              onClick={() => {
                if (window.confirm('Выйти из системы?')) {
                  onLogout();
                }
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '8px',
                color: '#f43f5e',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} /> Выйти из аккаунта
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
