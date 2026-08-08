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
  PackageCheck,
  Globe,
  Clock,
  X,
  History,
  Tag,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function ClientsView({ clients, setClients, searchQuery, onOpenNewOrder, orders = [] }) {
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null);
  
  const [newClient, setNewClient] = useState({ 
    name: '', 
    phone: '+998 ', 
    address: '', 
    district: 'Сиёб',
    language: 'Русский',
    landmark: '',
    tier: 'Standard',
    notes: '' 
  });

  const filteredClients = clients.filter(client =>
    (client.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (client.phone || '').includes(searchQuery || '') ||
    (client.address || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (client.district || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.phone || newClient.phone.trim() === '+998') {
      alert('Пожалуйста, укажите имя и телефон клиента!');
      return;
    }

    const created = {
      id: `C-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newClient.name,
      phone: newClient.phone,
      address: newClient.address || 'Самарканд',
      district: newClient.district || 'Центр',
      landmark: newClient.landmark || '',
      language: newClient.language || 'Русский',
      totalOrders: 0,
      ltv: 0,
      tier: newClient.tier,
      discountPercent: newClient.tier === 'VIP' ? 10 : newClient.tier === 'Premier' ? 5 : 0,
      notes: newClient.notes || 'Новый клиент из CRM.',
      orderHistory: []
    };

    setClients([created, ...clients]);
    setNewClient({ name: '', phone: '+998 ', address: '', district: 'Сиёб', language: 'Русский', landmark: '', tier: 'Standard', notes: '' });
    setShowAddClientModal(false);
    alert(`Клиент ${created.name} (${created.phone}) успешно добавлен в базу CRM!`);
  };

  const handleDeleteClient = (clientId, clientName) => {
    if (window.confirm(`Вы действительно хотите удалить клиента "${clientName}" из базы?`)) {
      setClients(clients.filter(c => c.id !== clientId));
    }
  };

  // Helper to retrieve live orders associated with a client
  const getClientOrders = (client) => {
    const normPhone = (client.phone || '').replace(/\s+/g, '');
    const clientNameLower = (client.name || '').toLowerCase().trim();

    const matchedOrders = orders.filter(o => {
      const oPhoneNorm = (o.clientPhone || o.phone || '').replace(/\s+/g, '');
      const oNameLower = (o.clientName || '').toLowerCase().trim();
      return (normPhone && oPhoneNorm && normPhone === oPhoneNorm) || (clientNameLower && oNameLower && clientNameLower === oNameLower);
    });

    return matchedOrders;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner */}
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
            <Users size={26} />
          </div>
          <div>
            <span className="badge badge-ready" style={{ fontSize: '11px', fontWeight: '800' }}>
              База Лояльности & Клиентов
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
              👥 База Клиентов Cosmo CRM ({clients.length} чел)
            </h2>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Все клиенты автоматически группируются со всей историей заказов и повторными вызовами
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowAddClientModal(true)} 
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '12px 20px', fontSize: '14px', fontWeight: '800' }}
        >
          <Plus size={18} /> + Добавить Клиента
        </button>
      </div>

      {/* Clients Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {filteredClients.map((client) => {
          const clientLiveOrders = getClientOrders(client);
          const totalOrdersCount = Math.max(client.totalOrders || 0, clientLiveOrders.length);
          const totalLtvSum = Math.max(
            client.ltv || 0, 
            clientLiveOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || 0)), 0)
          );

          return (
            <div 
              key={client.id}
              className="glass-card animate-fade-in"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 17, 40, 0.98) 100%)',
                border: client.tier === 'VIP' ? '1.5px solid #facc15' : '1px solid var(--border-color)',
                borderTop: client.tier === 'VIP' ? '4px solid #facc15' : '4px solid #3b82f6',
                borderRadius: '16px',
                padding: '18px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: client.tier === 'VIP' ? 'linear-gradient(135deg, #facc15 0%, #eab308 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: client.tier === 'VIP' ? '#070d1e' : '#fff',
                    fontWeight: '900',
                    fontSize: '18px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    flexShrink: 0
                  }}>
                    {(client.name || 'К').charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{client.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>ID: {client.id}</span>
                      {client.language && (
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                          🗣️ {client.language}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className={`badge ${client.tier === 'VIP' ? 'badge-ready' : 'badge-new'}`} style={{ fontSize: '11px', fontWeight: '800' }}>
                    <Crown size={12} /> {client.tier} ({client.discountPercent || 0}%)
                  </span>

                  <button 
                    onClick={() => handleDeleteClient(client.id, client.name)}
                    className="btn-icon"
                    title="Удалить из базы"
                    style={{ padding: '2px' }}
                  >
                    <Trash2 size={14} color="#f43f5e" />
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="#10b981" />
                  <a href={`tel:${client.phone}`} style={{ fontWeight: '800', color: '#10b981', textDecoration: 'none' }}>
                    {client.phone}
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={14} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ color: '#e2e8f0', fontSize: '12.5px' }}>
                    {client.district ? `[${client.district}] ` : ''}{client.address}
                    {client.landmark ? ` (Ориентир: ${client.landmark})` : ''}
                  </span>
                </div>
              </div>

              {/* Metrics Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: '700' }}>ВСЕГО ЗАКАЗОВ</div>
                  <div style={{ fontSize: '17px', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <PackageCheck size={16} color="#10b981" />
                    <span>{totalOrdersCount} {totalOrdersCount === 1 ? 'заказ' : 'заказа'}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: '700' }}>ВЫРУЧКА (LTV)</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
                    {totalLtvSum.toLocaleString()} сум
                  </div>
                </div>
              </div>

              {/* Order History Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <History size={13} />
                  <span>История номеров заказов клиента:</span>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {clientLiveOrders.length > 0 ? (
                    clientLiveOrders.map((ord) => (
                      <span 
                        key={ord.id} 
                        style={{
                          background: ord.status === 'done' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(250, 204, 21, 0.2)',
                          border: ord.status === 'done' ? '1px solid #10b981' : '1px solid #facc15',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        #{ord.id} ({ord.totalAmount ? (ord.totalAmount / 1000) + 'k' : 'в цеху'})
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Новый клиент (заказы появятся автоматически при создании)
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              {client.notes && (
                <div style={{ fontSize: '11.5px', fontStyle: 'italic', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.08)', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
                  💬 "{client.notes}"
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '6px' }}>
                <button 
                  onClick={onOpenNewOrder}
                  className="btn btn-primary" 
                  style={{ flex: 1, fontSize: '12.5px', padding: '8px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                >
                  + Создать Заказ
                </button>
                
                <button 
                  onClick={() => alert(`Отправка SMS клиенту ${client.phone}:\nУважаемый(ая) ${client.name}, спасибо за выбор Cosmo Cleaning! Ваши накопительные заказы: ${totalOrdersCount} шт.`)}
                  className="btn btn-secondary" 
                  style={{ fontSize: '12.5px', padding: '8px 12px' }}
                  title="Отправить SMS"
                >
                  <MessageSquare size={15} /> SMS
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Centered Add Client Modal */}
      {showAddClientModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-modal)', border: '1.5px solid #3b82f6', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Добавление Нового Клиента в CRM</h3>
              </div>
              <button onClick={() => setShowAddClientModal(false)} className="btn-icon"><X size={18}/></button>
            </div>

            <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">ФИО / Имя Клиента *</label>
                <input 
                  type="text"
                  required
                  placeholder="Например: Алишер Навои"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '14px', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Номер телефона *</label>
                  <input 
                    type="text"
                    required
                    placeholder="+998 90 123 45 67"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="input-field"
                    style={{ fontSize: '13.5px', fontWeight: '800', color: '#10b981' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Район Самарканда</label>
                  <select 
                    value={newClient.district}
                    onChange={(e) => setNewClient({ ...newClient, district: e.target.value })}
                    className="select-field"
                  >
                    <option value="Сиёб">Сиёб</option>
                    <option value="Богишамол">Богишамол</option>
                    <option value="Железнодорожный">Железнодорожный</option>
                    <option value="Центр / Бродвей">Центр / Бродвей</option>
                    <option value="СамГАИ">СамГАИ</option>
                    <option value="Согдиана">Согдиана</option>
                    <option value="Микрорайон">Микрорайон</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Адрес (Улица, дом, квартира)</label>
                <input 
                  type="text"
                  placeholder="Улица Рудаки, д. 45, кв. 12"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Язык общения</label>
                  <select 
                    value={newClient.language}
                    onChange={(e) => setNewClient({ ...newClient, language: e.target.value })}
                    className="select-field"
                  >
                    <option value="Русский">Русский</option>
                    <option value="Узбекский">Ўзбекча</option>
                    <option value="Таджикский">Тоҷикӣ</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Статус Лояльности (Tier)</label>
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
              </div>

              <div className="input-group">
                <label className="input-label">Ориентир / Заметки</label>
                <input 
                  type="text"
                  placeholder="Например: Возле корзинки, 3 этаж"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddClientModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: '900' }}>
                  ✓ Сохранить Клиента
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
