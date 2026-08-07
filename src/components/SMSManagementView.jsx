import React, { useState } from 'react';
import { 
  Smartphone, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  FileText, 
  History, 
  Sliders, 
  Zap,
  Phone
} from 'lucide-react';
import { 
  getSMSConfig, 
  fetchSMSBalance, 
  getSMSTriggers, 
  saveSMSTriggers, 
  getSMSTemplates, 
  saveSMSTemplates, 
  getSMSHistory, 
  sendSMSNotification 
} from '../services/smsService';

export default function SMSManagementView() {
  const [config, setConfig] = useState(() => getSMSConfig() || {});
  const [triggers, setTriggers] = useState(() => getSMSTriggers() || {});
  const [templates, setTemplates] = useState(() => getSMSTemplates() || []);
  const [history, setHistory] = useState(() => getSMSHistory() || []);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Test SMS State
  const [testPhone, setTestPhone] = useState('+998 90 123 45 67');
  const [testMessage, setTestMessage] = useState('Тестовое СМС сообщение от системы Cosmo Cleaning CRM.');
  const [sendingTest, setSendingTest] = useState(false);

  const handleRefreshBalance = async () => {
    setLoadingBalance(true);
    try {
      const updated = await fetchSMSBalance();
      if (updated) {
        setConfig(updated);
        alert(`✅ Баланс успешно обновлен: ${(updated.balanceAmount || 0).toLocaleString()} сум (~${(updated.smsCountRemaining || 0).toLocaleString()} СМС)`);
      }
    } catch (e) {
      alert('Ошибка при обновлении баланса.');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleToggleTrigger = (key) => {
    const updated = { ...triggers, [key]: !triggers[key] };
    setTriggers(updated);
    saveSMSTriggers(updated);
  };

  const handleTemplateChange = (id, newText) => {
    const updated = (templates || []).map(t => t.id === id ? { ...t, text: newText } : t);
    setTemplates(updated);
    saveSMSTemplates(updated);
  };

  const handleSendTestSMS = async (e) => {
    e.preventDefault();
    if (!testPhone || !testMessage) {
      alert('Заполните номер телефона и текст сообщения.');
      return;
    }

    setSendingTest(true);
    const result = await sendSMSNotification({ phone: testPhone, text: testMessage, type: 'test' });
    setSendingTest(false);

    setHistory(getSMSHistory() || []);
    setConfig(getSMSConfig() || {});

    alert(result.message);
  };

  // Safe fallback values
  const balanceAmount = config?.balanceAmount ?? 185000;
  const smsCountRemaining = config?.smsCountRemaining ?? 9250;
  const providerName = (config?.provider || 'eskiz').toUpperCase();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-new" style={{ fontSize: '11px' }}>
              <Smartphone size={12} /> SMS Gateway Control
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Узбекистан (Eskiz.uz)</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
            Панель управления СМС-рассылками и шаблонами
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Проверяйте баланс шлюза, настраивайте триггеры авто-отправки и редактируйте тексты шаблонов.
          </p>
        </div>

        <button onClick={handleRefreshBalance} disabled={loadingBalance} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} className={loadingBalance ? 'spin' : ''} />
          {loadingBalance ? 'Проверка...' : 'Обновить баланс API'}
        </button>
      </div>

      {/* Top Balance & Status Grid */}
      <div className="responsive-grid-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* Card 1: Balance UZS */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Текущий Баланс Провайдера</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
              {balanceAmount.toLocaleString()} сум
            </div>
          </div>
        </div>

        {/* Card 2: Remaining SMS Count */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={24} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Остаток лимита СМС</div>
            <div style={{ fontSize: '20px', fontWeight: '800' }}>
              ~{smsCountRemaining.toLocaleString()} СМС
            </div>
          </div>
        </div>

        {/* Card 3: Gateway Status */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} color="#06b6d4" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Провайдер & Статус</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {providerName} (Eskiz.uz) <span className="pulse-dot" />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2 Column Grid */}
      <div className="responsive-grid-7-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* COLUMN 1: AUTO-SEND TRIGGERS */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent-primary)" /> Условия Автоматической Отправки СМС
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Включите или отключите автоматические СМС при смене статуса заказа
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>📦 При создании / заборе заказа</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Когда создается заказ или курьер берет его в работу (статус 'new' / 'pickup')</div>
              </div>
              <input 
                type="checkbox"
                checked={Boolean(triggers?.onOrderCreated)}
                onChange={() => handleToggleTrigger('onOrderCreated')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>🧺 При завершении стирки в цеху</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Когда оператор чистки сменяет статус заказа на 'ready' (Готов)</div>
              </div>
              <input 
                type="checkbox"
                checked={Boolean(triggers?.onCleaningDone)}
                onChange={() => handleToggleTrigger('onCleaningDone')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>🚚 При выезде курьера на доставку</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Когда курьер выезжает везти готовые изделия клиенту ('delivery')</div>
              </div>
              <input 
                type="checkbox"
                checked={Boolean(triggers?.onDeliveryStart)}
                onChange={() => handleToggleTrigger('onDeliveryStart')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>💳 При получении оплаты (СМС Чек)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Когда заказу присваивается статус 'paid' (Оплачен)</div>
              </div>
              <input 
                type="checkbox"
                checked={Boolean(triggers?.onPaymentReceived)}
                onChange={() => handleToggleTrigger('onPaymentReceived')}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* COLUMN 2: TEST SMS SENDING */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="#10b981" /> Отправка Тестового СМС
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Проверьте доставку СМС на любой телефонный номер в Узбекистане
          </p>

          <form onSubmit={handleSendTestSMS} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Телефон получателя *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Текст тестового СМС *</label>
              <textarea 
                rows={4}
                required
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="textarea-field"
                style={{ fontSize: '13px' }}
              />
            </div>

            <button type="submit" disabled={sendingTest} className="btn btn-primary" style={{ padding: '12px' }}>
              <Send size={16} /> {sendingTest ? 'Отправка...' : '📲 Отправить Тестовое СМС'}
            </button>
          </form>
        </div>
      </div>

      {/* SMS TEMPLATES EDITOR */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--accent-secondary)" /> Редактор Шаблонов СМС
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
          Используйте переменные: <code>{"{clientName}"}</code>, <code>{"{orderId}"}</code>, <code>{"{totalAmount}"}</code>, <code>{"{courier}"}</code>
        </p>

        <div className="responsive-grid-7-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {(templates || []).map((tpl) => (
            <div key={tpl.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#fff' }}>{tpl.title}</div>
              <textarea 
                rows={3}
                value={tpl.text || ''}
                onChange={(e) => handleTemplateChange(tpl.id, e.target.value)}
                className="textarea-field"
                style={{ fontSize: '12.5px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SMS SENT HISTORY */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="var(--accent-primary)" /> История Отправленных СМС
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Телефон</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Текст СМС</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Статус</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Дата & Время</th>
              </tr>
            </thead>
            <tbody>
              {(history || []).map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--accent-secondary)' }}>{item.phone}</td>
                  <td style={{ padding: '10px 12px', color: '#fff' }}>{item.text}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span className={`badge ${item.status === 'sent' ? 'badge-done' : 'badge-cancel'}`}>
                      {item.status === 'sent' ? '✅ Отправлено' : '⚠️ Ошибка'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-dim)' }}>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
