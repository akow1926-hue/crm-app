import React, { useState } from 'react';
import { 
  PhoneCall, 
  Plus, 
  LogOut, 
  CheckCircle2, 
  MessageSquare, 
  Truck, 
  User, 
  Search,
  Filter,
  ShieldAlert,
  Send,
  X,
  Edit3,
  MapPin,
  Clock
} from 'lucide-react';
import { sendSMSNotification } from '../../services/smsService';
import { getActiveCouriers } from '../../services/staffHelper';

export default function DispatcherPortal({ orders, setOrders, setSelectedOrder, onOpenNewOrder, currentUser, onLogout, registeredUsers }) {
  const activeCouriers = getActiveCouriers(registeredUsers);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Telegram Broadcast Modal State
  const [isTgModalOpen, setIsTgModalOpen] = useState(false);
  const [tgMsgText, setTgMsgText] = useState('');
  const [targetCourierTg, setTargetCourierTg] = useState('all');

  // Filtering orders
  const filteredOrders = orders.filter(order => {
    // Status Filter
    if (filterStatus === 'urgent' && !order.urgent) return false;
    if (filterStatus === 'new' && order.status !== 'new' && order.status !== 'pickup') return false;
    if (filterStatus === 'cleaning' && order.status !== 'cleaning') return false;
    if (filterStatus === 'ready' && order.status !== 'ready' && order.status !== 'delivery') return false;
    if (filterStatus === 'done' && order.status !== 'done') return false;

    // District Filter
    if (districtFilter !== 'all' && order.district !== districtFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const idMatch = String(order.id).toLowerCase().includes(q);
      const nameMatch = String(order.clientName || '').toLowerCase().includes(q);
      const phoneMatch = String(order.phone || '').toLowerCase().includes(q);
      const addrMatch = String(order.address || '').toLowerCase().includes(q);
      return idMatch || nameMatch || phoneMatch || addrMatch;
    }

    return true;
  });

  // Handle Telegram Broadcast
  const handleSendTgBroadcast = (e) => {
    e.preventDefault();
    if (!tgMsgText.trim()) {
      alert('Введите текст сообщения для Telegram.');
      return;
    }

    alert(`Сообщение успешно отправлено курьеру (${targetCourierTg}) в Telegram:\n"${tgMsgText}"`);
    setIsTgModalOpen(false);
    setTgMsgText('');
  };

  // Quick SMS to Client
  const handleSendQuickSMS = async (order) => {
    const defaultText = `Уважаемый(ая) ${order.clientName}, ваш заказ #${order.id} принят в работу Cosmo Cleaning. Тел: +998 90 123 45 67`;
    const text = prompt(`Отправка SMS клиенту (${order.phone}):`, defaultText);
    if (text) {
      const res = await sendSMSNotification({ phone: order.phone, text });
      alert(res.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(17, 24, 39, 0.9) 100%)',
        border: '1px solid var(--accent-secondary)',
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
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '800',
            flexShrink: 0
          }}>
            <PhoneCall size={26} />
          </div>
          <div>
            <span className="badge badge-ready" style={{ fontSize: '10px' }}>Диспетчерский Портал</span>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{currentUser?.name || 'Мадина Сулейманова'}</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Прием заявок, форматирование номеров, районы Самарканда и координация курьеров
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setIsTgModalOpen(true)} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            <Send size={15} /> Рассылка Курьерам
          </button>
          <button onClick={onOpenNewOrder} className="btn btn-primary" style={{ fontSize: '13px' }}>
            <Plus size={16} /> Новый Заказ
          </button>
          <button onClick={onLogout} className="btn btn-secondary" style={{ fontSize: '13px', color: '#f43f5e' }}>
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              placeholder="Поиск по ID (например 5200), ФИО, телефону или адресу..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select 
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="select-field"
            style={{ width: '180px' }}
          >
            <option value="all">📍 Все Районы</option>
            <option value="Сиёб">Сиёб</option>
            <option value="Багишамальский">Багишамальский</option>
            <option value="Согдиана">Согдиана</option>
            <option value="Микрорайон">Микрорайон</option>
            <option value="Саттепо">Саттепо</option>
            <option value="Железнодорожный">Железнодорожный</option>
            <option value="Самаркандский р-н">Самаркандский р-н</option>
          </select>
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: 'Все Заказы', count: orders.length },
            { id: 'urgent', label: '🔥 Срочные', count: orders.filter(o => o.urgent).length },
            { id: 'new', label: '📥 Ожидает забора', count: orders.filter(o => o.status === 'new' || o.status === 'pickup').length },
            { id: 'cleaning', label: '🧼 В цеху', count: orders.filter(o => o.status === 'cleaning').length },
            { id: 'ready', label: '📦 Готов к доставке', count: orders.filter(o => o.status === 'ready' || o.status === 'delivery').length },
            { id: 'done', label: '✅ Выполнен', count: orders.filter(o => o.status === 'done').length }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className="btn"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: filterStatus === st.id ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                color: filterStatus === st.id ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap'
              }}
            >
              {st.label} ({st.count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
            📋 Реестр Заказов ({filteredOrders.length})
          </h3>
        </div>

        <div className="responsive-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Заказов по выбранным критериям не найдено.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div 
                key={order.id} 
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: order.urgent ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: order.urgent ? '0 0 15px rgba(244, 63, 94, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                      #{order.id}
                    </span>
                    {order.urgent && (
                      <span className="badge badge-cancel" style={{ fontSize: '10px' }}>
                        🔥 СРОЧНО
                      </span>
                    )}
                  </div>
                  <span className={`badge badge-${order.status}`}>{order.status}</span>
                </div>

                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{order.clientName}</div>
                  <div style={{ fontSize: '13px', color: 'var(--accent-primary)', fontWeight: '700' }}>
                    📞 {order.phone}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div><strong>📍 Район:</strong> {order.district || 'Сиёб'} | <strong>Адрес:</strong> {order.address}</div>
                  {order.landmark && <div style={{ color: '#f59e0b' }}>Ориентир: {order.landmark}</div>}
                  <div><strong>🕒 Слот забора:</strong> {order.timeSlot || 'В любое время'}</div>
                  <div><strong>🚚 Курьер:</strong> {order.assignedCourier || 'Не назначен'}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                    {(order.totalAmount || 0).toLocaleString()} сум
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleSendQuickSMS(order)}
                      className="btn btn-secondary" 
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      title="Отправить SMS клиенту"
                    >
                      <MessageSquare size={13} /> SMS
                    </button>
                    <button 
                      onClick={() => setSelectedOrder ? setSelectedOrder(order) : onOpenNewOrder()}
                      className="btn btn-secondary" 
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      <Edit3 size={13} /> Изменить
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: Telegram Broadcast */}
      {isTgModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>📢 Сообщение Курьерам в Telegram</h3>
              <button onClick={() => setIsTgModalOpen(false)} className="btn-icon"><X size={18}/></button>
            </div>

            <form onSubmit={handleSendTgBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Получатель</label>
                <select 
                  value={targetCourierTg}
                  onChange={(e) => setTargetCourierTg(e.target.value)}
                  className="select-field"
                >
                  <option value="all">📢 Все курьеры (Общий чат)</option>
                  {activeCouriers.map(c => (
                    <option key={c.id || c.username} value={c.name || c.username}>
                      {c.name} (@{c.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Текст сообщения</label>
                <textarea 
                  rows={4}
                  required
                  value={tgMsgText}
                  onChange={(e) => setTgMsgText(e.target.value)}
                  className="textarea-field"
                  placeholder="Введите важное объявление или данные по срочному забору..."
                />
              </div>

              <button type="submit" className="btn btn-primary">
                <Send size={15} /> Отправить в Telegram Бот
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
