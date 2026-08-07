import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Clock, RefreshCw, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ onOpenNewOrder, searchQuery, setSearchQuery, notificationsCount, onToggleNotifications, currentUser, onLogout }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleLabel = (role) => {
    if (role === 'dispatcher') return 'Диспетчер';
    if (role === 'courier') return 'Курьер';
    if (role === 'washer') return 'Оператор стирки';
    return 'Администратор';
  };

  return (
    <header style={{
      minHeight: '64px',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      position: 'sticky',
      top: 0,
      zIndex: 15,
      flexWrap: 'wrap'
    }}>
      {/* Search Input Box */}
      <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '380px', minWidth: '140px' }}>
        <Search 
          size={16}
          color="var(--text-muted)" 
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{
            paddingLeft: '36px',
            paddingRight: '12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(17, 24, 39, 0.8)',
            fontSize: '13px',
            height: '38px'
          }}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Live Clock Badge */}
        <div className="mobile-hide" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-muted)'
        }}>
          <Clock size={14} color="var(--accent-secondary)" />
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{time || '19:16:00'}</span>
        </div>

        {/* Notifications Center */}
        <button 
          onClick={onToggleNotifications}
          className="btn-icon" 
          style={{ position: 'relative', width: '38px', height: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Уведомления"
        >
          <Bell size={18} />
          {notificationsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#f43f5e',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-main)'
            }}>
              {notificationsCount}
            </span>
          )}
        </button>

        {/* Primary Action Button */}
        <button onClick={onOpenNewOrder} className="btn btn-primary" style={{ padding: '8px 12px', height: '38px' }}>
          <Plus size={18} />
          <span className="mobile-hide">Новый Заказ</span>
        </button>

        {/* User Profile Avatar & Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingLeft: '6px',
          borderLeft: '1px solid var(--border-color)'
        }}>
          <div className="mobile-hide" style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '700',
            fontSize: '12px',
            boxShadow: '0 0 8px rgba(6, 182, 212, 0.3)',
            flexShrink: 0
          }}>
            {(currentUser?.name || 'А').charAt(0)}
          </div>
          <div className="mobile-hide" style={{ maxWidth: '80px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.name || 'User'}</div>
            <div style={{ fontSize: '10px', color: 'var(--accent-secondary)', fontWeight: '600' }}>
              Admin
            </div>
          </div>

          <button 
            onClick={onLogout} 
            className="btn-icon"
            style={{ color: '#f43f5e', padding: '6px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Выйти"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
