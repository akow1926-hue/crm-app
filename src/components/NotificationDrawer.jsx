import React from 'react';
import { X, Bell, CheckCircle2, DollarSign, Truck, Sparkles, ExternalLink } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose, logs, orders, setSelectedOrder }) {
  if (!isOpen) return null;

  const handleNotificationClick = (log) => {
    // Try to extract order ID from log text (e.g. #1095)
    const match = log.text.match(/#(\d+)/);
    if (match && match[1]) {
      const orderId = match[1];
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        setSelectedOrder(targetOrder);
        onClose();
        return;
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, right: 0, bottom: 0,
      width: 'min(400px, 100vw)',
      background: 'var(--bg-modal)',
      borderLeft: '1px solid var(--border-glow)',
      boxShadow: 'var(--shadow-md)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      paddingTop: 'calc(24px + var(--sat))'
    }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Bell size={20} color="var(--accent-primary)" />
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f43f5e'
            }} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Уведомления CRM</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Кликабельные карточки событий</span>
          </div>
        </div>
        <button onClick={onClose} className="btn-icon">
          <X size={16} />
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
        {logs.map((log) => {
          const match = log.text.match(/#(\d+)/);
          const hasOrderLink = match && match[1] && orders?.some(o => o.id === match[1]);

          return (
            <div 
              key={log.id} 
              onClick={() => handleNotificationClick(log)}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                cursor: hasOrderLink ? 'pointer' : 'default',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                if (hasOrderLink) {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasOrderLink) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: log.type === 'payment' ? 'rgba(16, 185, 129, 0.15)' : log.type === 'courier' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {log.type === 'payment' ? <DollarSign size={16} color="#10b981" /> : <Truck size={16} color="#6366f1" />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{log.text}</span>
                  {hasOrderLink && <ExternalLink size={13} color="var(--accent-secondary)" style={{ flexShrink: 0, marginLeft: '6px' }} />}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{log.time}</span>
                  {hasOrderLink && <span style={{ color: 'var(--accent-secondary)', fontSize: '10px', fontWeight: '700' }}>Открыть заказ →</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
