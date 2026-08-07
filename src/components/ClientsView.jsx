import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  Crown, 
  Plus, 
  MessageSquare, 
  DollarSign,
  PackageCheck
} from 'lucide-react';

export default function ClientsView({ clients, setClients, searchQuery, onOpenNewOrder }) {
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', address: '', tier: 'Standard' });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery) ||
    client.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.phone) return;

    const created = {
      id: `C-${Math.floor(100 + Math.random() * 900)}`,
      name: newClient.name,
      phone: newClient.phone,
      address: newClient.address,
      totalOrders: 0,
      ltv: 0,
      tier: newClient.tier,
      discountPercent: newClient.tier === 'VIP' ? 10 : newClient.tier === 'Premier' ? 5 : 0,
      notes: 'Новый клиент из CRM.'
    };

    setClients([created, ...clients]);
    setNewClient({ name: '', phone: '', address: '', tier: 'Standard' });
    setShowAddClientModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800' }}>👥 База Клиентов (CRM)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Управление лояльностью, история заказов и персональные скидки
          </p>
        </div>

        <button onClick={() => setShowAddClientModal(true)} className="btn btn-primary">
          <Plus size={16} /> Добавить Клиента
        </button>
      </div>

      {/* Clients Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredClients.map((client) => (
          <div 
            key={client.id}
            className="glass-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: client.tier === 'VIP' ? 'var(--accent-gradient-gold)' : 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '16px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{client.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--accent-secondary)', fontWeight: '600' }}>{client.id}</span>
                </div>
              </div>

              <span className={`badge ${client.tier === 'VIP' ? 'badge-ready' : 'badge-new'}`}>
                <Crown size={12} /> {client.tier} ({client.discountPercent}%)
              </span>
            </div>

            {/* Contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="var(--accent-primary)" />
                <span style={{ fontWeight: '600', color: '#fff' }}>{client.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={14} color="var(--accent-secondary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{client.address}</span>
              </div>
            </div>

            {/* Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Заказов всего</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <PackageCheck size={14} color="#10b981" /> {client.totalOrders}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>LTV (Выручка)</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                  {client.ltv.toLocaleString()} сум
                </div>
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-dim)', borderLeft: '2px solid var(--accent-primary)', paddingLeft: '8px' }}>
                "{client.notes}"
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button 
                onClick={onOpenNewOrder}
                className="btn btn-secondary" 
                style={{ flex: 1, fontSize: '12px' }}
              >
                + Заказ
              </button>
              <button 
                onClick={() => alert(`Отправка SMS клиенту ${client.phone}: Уважаемый ${client.name}, у вас скидка ${client.discountPercent}% в Cosmo Cleaning!`)}
                className="btn btn-secondary" 
                style={{ fontSize: '12px' }}
                title="Отправить SMS"
              >
                <MessageSquare size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Client */}
      {showAddClientModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '420px', background: 'var(--bg-modal)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Новый Клиент в CRM</h3>
            <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">ФИО Клиента *</label>
                <input 
                  type="text"
                  required
                  placeholder="Например: Алишер Усманов"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Номер телефона *</label>
                <input 
                  type="text"
                  required
                  placeholder="+998 90 123 45 67"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Адрес доставки</label>
                <input 
                  type="text"
                  placeholder="Район, улица, дом, квартира"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Уровень скидки (Tier)</label>
                <select 
                  value={newClient.tier}
                  onChange={(e) => setNewClient({ ...newClient, tier: e.target.value })}
                  className="select-field"
                >
                  <option value="Standard">Standard (0%)</option>
                  <option value="Premier">Premier (5%)</option>
                  <option value="VIP">VIP (10%)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddClientModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
