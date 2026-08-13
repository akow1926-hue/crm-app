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
  sendSMSNotification,
  saveSMSConfig,
  loginEskiz
} from '../services/smsService';
import { Key, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function SMSManagementView() {
  const [config, setConfig] = useState(() => getSMSConfig() || {});
  const [triggers, setTriggers] = useState(() => getSMSTriggers() || {});
  const [templates, setTemplates] = useState(() => getSMSTemplates() || []);
  const [history, setHistory] = useState(() => getSMSHistory() || []);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Eskiz Connection State
  const [eskizEmail, setEskizEmail] = useState(config?.email || 'info@cosmocleaning.uz');
  const [eskizPassword, setEskizPassword] = useState('');
  const [eskizToken, setEskizToken] = useState(config?.token || '');
  const [eskizFromName, setEskizFromName] = useState(config?.fromName || '4546');
  const [loggingIn, setLoggingIn] = useState(false);

  // Test SMS State
  const [testPhone, setTestPhone] = useState('+998 90 123 45 67');
  const [testMessage, setTestMessage] = useState('Assalomu alaykum! Cosmo Cleaning test SMS xabari.');
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

  const handleSaveConnection = (e) => {
    e.preventDefault();
    const updated = {
      ...config,
      email: eskizEmail,
      token: eskizToken,
      fromName: eskizFromName
    };
    setConfig(updated);
    saveSMSConfig(updated);
    alert('✅ Настройки подключения Eskiz.uz успешно сохранены!');
  };

  const handleAutoLoginEskiz = async () => {
    if (!eskizEmail || !eskizPassword) {
      alert('Введите Email и Пароль от кабинета Eskiz.uz для получения токена.');
      return;
    }
    setLoggingIn(true);
    const res = await loginEskiz({ email: eskizEmail, password: eskizPassword });
    setLoggingIn(false);
    if (res.success && res.token) {
      setEskizToken(res.token);
      const updated = { ...config, email: eskizEmail, token: res.token, fromName: eskizFromName };
      setConfig(updated);
      saveSMSConfig(updated);
      alert(res.message);
    } else {
      alert(res.message);
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
  const hasToken = Boolean(config?.token && config.token.trim().length > 10);

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
            {config?.accountName && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {config.accountName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Eskiz.uz API Credentials & Auto-Login Card */}
      <div className="glass-card" style={{
        border: hasToken ? '1px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #f59e0b',
        background: hasToken ? 'rgba(16, 185, 129, 0.04)' : 'rgba(245, 158, 11, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: hasToken ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color={hasToken ? '#10b981' : '#f59e0b'} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800' }}>🔑 Подключение к Eskiz.uz (SMS Gateway API)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {hasToken 
                  ? '✅ API Токен активен — СМС отправляются автоматически после замерки'
                  : '⚠️ Введите Email и Пароль или вставьте Bearer Token от Eskiz.uz для отправки СМС'}
              </div>
            </div>
          </div>

          <span className={`badge ${hasToken ? 'badge-done' : 'badge-cancel'}`} style={{ fontSize: '12px' }}>
            {hasToken ? '● Шлюз подключен' : '● Требуется токен'}
          </span>
        </div>

        <form onSubmit={handleSaveConnection} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} /> Eskiz Email (Логин) *
            </label>
            <input 
              type="email"
              required
              value={eskizEmail}
              onChange={(e) => setEskizEmail(e.target.value)}
              placeholder="info@cosmocleaning.uz"
              className="input-field"
              style={{ fontSize: '13px' }}
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={13} /> Пароль кабинета Eskiz.uz
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="password"
                value={eskizPassword}
                onChange={(e) => setEskizPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                style={{ fontSize: '13px' }}
              />
              <button 
                type="button" 
                onClick={handleAutoLoginEskiz} 
                disabled={loggingIn || !eskizPassword}
                className="btn btn-secondary"
                title="Автоматически получить Bearer токен по логину и паролю"
                style={{ whiteSpace: 'nowrap', padding: '0 12px', fontSize: '12px', background: '#3b82f6', color: '#fff', border: 'none' }}
              >
                <Key size={14} /> {loggingIn ? 'Вход...' : 'Получить Токен'}
              </button>
            </div>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Bearer Token (или вставьте вручную)</label>
            <input 
              type="password"
              value={eskizToken}
              onChange={(e) => setEskizToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiI..."
              className="input-field"
              style={{ fontSize: '12px' }}
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ fontSize: '11.5px' }}>Отправитель (from)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text"
                value={eskizFromName}
                onChange={(e) => setEskizFromName(e.target.value)}
                placeholder="4546"
                className="input-field"
                style={{ fontSize: '13px', width: '90px' }}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ flex: 1, padding: '9px 12px', fontSize: '13px', fontWeight: '700' }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </form>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid #10b981' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#34d399' }}>📏 После размерки в цеху (Основное СМС клиенту)</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Отправляет клиенту состав ковров с замерами, общую сумму и контакты водителя сразу после ввода замеров</div>
              </div>
              <input 
                type="checkbox"
                checked={triggers?.onMeasured !== false}
                onChange={() => handleToggleTrigger('onMeasured')}
                style={{ width: '22px', height: '22px', accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>

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
          Используйте переменные: <code>{"{orderId}"}</code>, <code>{"{itemsList}"}</code>, <code>{"{totalAmount}"}</code>, <code>{"{courier}"}</code>, <code>{"{courierPhone}"}</code>, <code>{"{clientName}"}</code>
        </p>

        <div className="responsive-grid-7-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {(templates || []).map((tpl) => (
            <div key={tpl.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#fff' }}>{tpl.title}</div>
              <textarea 
                rows={4}
                value={tpl.text || ''}
                onChange={(e) => handleTemplateChange(tpl.id, e.target.value)}
                className="textarea-field"
                style={{ fontSize: '12.5px', whiteSpace: 'pre-wrap' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ESKIZ OFFICIAL TEMPLATES & MODERATION STATUS */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#10b981" /> Шаблоны в кабинете Eskiz.uz (Статус Модерации)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              По законам Узбекистана текст СМС должен быть утвержден модераторами Eskiz.uz
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '80px' }}>ID</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Текст шаблона</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: '150px' }}>Статус Eskiz</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--accent-secondary)' }}>#85543</td>
                <td style={{ padding: '10px 12px', color: '#fff' }}>
                  <div style={{ fontWeight: '600', color: '#38bdf8', marginBottom: '2px' }}>📏 Текст после размерки (Узбекский):</div>
                  Assalomu alaykum Cosmo. Buyurtmangiz - (номер заказа). Buyurtma tarkibi: 1. Gilam - 4.9x11.5=56.35 kv/m. Statusi: Yuvildi! Jami: (цена). Haydovchi: (водитель). Buyurtmangiz tayyor bo'lishi bilan xodimlarimiz siz bilan bog'lanishadi. Biz bilan bog'lanish: (номер)
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <span className="badge badge-waiting" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    ⏳ На модерации
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--accent-secondary)' }}>#84402</td>
                <td style={{ padding: '10px 12px', color: '#fff' }}>
                  Благодарим за оплату! По заказу %d получено %d сум. С уважением, Cosmo Cleaning Service.
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <span className="badge badge-done">
                    ✅ Одобрен (Сервис)
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 12px', fontWeight: '700', color: 'var(--accent-secondary)' }}>#84401</td>
                <td style={{ padding: '10px 12px', color: '#fff' }}>
                  Здравствуйте, %w Ваш заказ %d принят. Курьер %w выехал на забор. Тел: %d Cosmo Cleaning.
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <span className="badge badge-done">
                    ✅ Одобрен (Сервис)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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
