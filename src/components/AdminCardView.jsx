import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Send, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Users, 
  DollarSign, 
  Database, 
  Download, 
  History, 
  Globe, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  FileSpreadsheet,
  Copy,
  ExternalLink,
  CheckCircle,
  Radio,
  MapPin,
  Truck
} from 'lucide-react';
import { serviceCatalog } from '../data/initialData';
import { getSMSConfig, saveSMSConfig } from '../services/smsService';
import { 
  getGoogleSheetConfig, 
  saveGoogleSheetConfig, 
  syncAllOrdersToGoogleSheets, 
  getGoogleAppsScriptTemplate
} from '../services/googleSheetsService';
import { getCourierLocations } from '../services/gpsTrackingService';
import { broadcastDataChange } from '../services/syncEngine';
import { getTelegramBotConfig, saveTelegramBotConfig, testTelegramBotToken, testSendGroupMessage } from '../services/telegramBotService';

export default function AdminCardView({ orders, clients, currentUser, registeredUsers, setRegisteredUsers }) {
  const [activeSection, setActiveSection] = useState('profile');

  // Telegram Common Group Notification Bot Config State
  const [tgBotConfig, setTgBotConfig] = useState(getTelegramBotConfig);
  const [isTestingBotToken, setIsTestingBotToken] = useState(false);
  const [botTestResult, setBotTestResult] = useState(null);
  const [isSendingTestGroupMsg, setIsSendingTestGroupMsg] = useState(false);
  const [testGroupMsgResult, setTestGroupMsgResult] = useState(null);

  // Keep bot config in sync with localStorage and global events
  useEffect(() => {
    const loaded = getTelegramBotConfig();
    setTgBotConfig(loaded);

    const handleUpdate = (e) => {
      if (e.detail) setTgBotConfig(e.detail);
    };
    window.addEventListener('tg_bot_config_updated', handleUpdate);
    return () => window.removeEventListener('tg_bot_config_updated', handleUpdate);
  }, []);

  // New Employee Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    name: '',
    pass: '',
    role: 'courier',
    phone: '+998 '
  });

  // Live Courier Locations State
  const [courierGpsMap, setCourierGpsMap] = useState(getCourierLocations());

  useEffect(() => {
    const updateGps = () => setCourierGpsMap(getCourierLocations());
    updateGps();
    const interval = setInterval(updateGps, 20000);
    window.addEventListener('courier_location_updated', updateGps);
    return () => {
      clearInterval(interval);
      window.removeEventListener('courier_location_updated', updateGps);
    };
  }, []);

  // Telegram Binding State
  const [telegramId, setTelegramId] = useState('583920194');
  const [telegramCode, setTelegramCode] = useState('');
  const [isCodeGenerated, setIsCodeGenerated] = useState(false);

  // SMS Gateway Config State
  const [smsConfigState, setSmsConfigState] = useState(getSMSConfig);

  // Google Sheets Config State
  const [gsConfig, setGsConfig] = useState(getGoogleSheetConfig);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSaveGsConfig = () => {
    saveGoogleSheetConfig(gsConfig);
    alert('Настройки Google Таблиц успешно сохранены!');
  };

  const handleSyncAllOrders = async () => {
    if (!gsConfig.webhookUrl) {
      alert('Пожалуйста, укажите Webhook URL для Google Таблиц.');
      return;
    }
    setIsSyncingAll(true);
    const res = await syncAllOrdersToGoogleSheets(orders);
    setIsSyncingAll(false);
    if (res.success) {
      alert(`Успешно синхронизировано ${res.count} заказов с Google Таблицей!`);
      setGsConfig(getGoogleSheetConfig());
    } else {
      alert('Ошибка при синхронизации с Google Таблицами');
    }
  };

  const handleCopyScriptCode = () => {
    const code = getGoogleAppsScriptTemplate();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Pricing State
  const [pricingList, setPricingList] = useState(serviceCatalog);

  // Active Sessions
  const [sessions, setSessions] = useState([
    { id: 'SESS-101', user: 'admin', ip: '127.0.0.1', device: 'Браузер (Текущая сессия)', time: 'Сейчас', status: 'active' }
  ]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), user: 'admin', action: 'Вход в систему Администратора', ip: '127.0.0.1' }
  ]);

  // SMS Center
  const [smsBalance, setSmsBalance] = useState(48500); // 48,500 сум
  const [smsTemplates, setSmsTemplates] = useState({
    newOrder: 'Уважаемый {client}, ваш заказ #{id} успешно создан в Cosmo Cleaning. Тел: +998 90 123 45 67',
    readyOrder: 'Уважаемый {client}, ваш заказ #{id} выстиран и готов к доставке!',
    doneOrder: 'Спасибо за заказ #{id} в Cosmo Cleaning! Будем рады видеть вас снова.'
  });

  // Telegram Tunnel status
  const [tunnels, setTunnels] = useState([
    { name: 'Courier Telegram WebApp', url: 'https://courier-cosmo.trycloudflare.com', status: 'online' },
    { name: 'Dispatcher Telegram Bot', url: 'https://disp-cosmo.trycloudflare.com', status: 'online' }
  ]);

  // Generate Telegram binding token
  const handleGenerateTelegramCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setTelegramCode(code);
    setIsCodeGenerated(true);
  };

  // User management actions
  const toggleUserStatus = (userId) => {
    setRegisteredUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' } : u));
    setAuditLogs([{ id: Date.now(), time: new Date().toLocaleTimeString(), user: 'admin', action: `Изменение статуса пользователя ${userId}`, ip: '192.168.0.106' }, ...auditLogs]);
  };

  const resetBruteForce = (userId) => {
    setRegisteredUsers(prev => prev.map(u => u.id === userId ? { ...u, failedLogins: 0 } : u));
    alert(`Защита Brute-Force для ${userId} сброшена!`);
  };

  const terminateSession = (sessId) => {
    setSessions(sessions.filter(s => s.id !== sessId));
  };

  const handlePriceChange = (id, newPrice) => {
    setPricingList(pricingList.map(p => p.id === id ? { ...p, price: newPrice } : p));
  };

  const triggerBackup = (type) => {
    const data = type === 'orders' ? orders : type === 'users' ? registeredUsers : { orders, clients, registeredUsers };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${type}_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    alert(`Резервная копия ${type} успешно выгружена!`);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div className="responsive-header-banner" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'flex-start'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            color: '#fff',
            flexShrink: 0
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-ready" style={{ fontSize: '10px' }}>Superuser</span>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>SQLite</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px', lineHeight: 1.2 }}>
              Карта Администратора
            </h2>
          </div>
        </div>

        <button onClick={() => triggerBackup('full')} className="btn btn-primary" style={{ fontSize: '13px', padding: '10px 16px' }}>
          <Database size={16} /> Бэкап
        </button>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="grid-auto-2" style={{
        background: 'rgba(15, 23, 42, 0.6)',
        padding: '6px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        {[
          { id: 'profile', label: 'Профиль', icon: User },
          { id: 'users', label: 'Доступ', icon: Users },
          { id: 'operations', label: 'Финансы', icon: DollarSign },
          { id: 'security', label: 'Аудит', icon: History },
          { id: 'integrations', label: 'Связи', icon: Globe }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                padding: '10px 8px',
                fontSize: '12px',
                background: isActive ? 'var(--accent-gradient)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: isActive ? '700' : '500',
                transition: 'var(--transition-fast)'
              }}
            >
              <Icon size={14} /> <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: PROFILE & IDENTITY */}
      {activeSection === 'profile' && (
        <div className="responsive-grid-7-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Card Info */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              👤 Персональная Карточка Администратора
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>ID в базе (crm.db):</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>USR-01-SUPERADMIN</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>ФИО:</span>
                <span style={{ fontWeight: '700', color: '#fff' }}>{currentUser?.name || 'Администратор'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Роль в системе:</span>
                <span className="badge badge-new">Superuser (Администратор)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Статус аккаунта:</span>
                <span className="badge badge-done">● Активен</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Текущий IP-адрес:</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: '#fff' }}>192.168.0.106</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>JWT Токен Сессии:</span>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>Валиден (Истекает через 23 ч)</span>
              </div>
            </div>
          </div>

          {/* Telegram Binding */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              ✈️ Привязка Telegram Аккаунта
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Привязанный Telegram ID используется для беспарольного входа через Telegram WebApp и получения уведомлений.
            </p>

            <div className="input-group">
              <label className="input-label">Привязанный Telegram ID</label>
              <input 
                type="text" 
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="input-field" 
              />
            </div>

            {isCodeGenerated ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Код подтверждения для Telegram-бота:</div>
                <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#fff', letterSpacing: '4px', margin: '6px 0' }}>
                  {telegramCode}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Отправьте этот код боту @CosmoCRM_bot</div>
              </div>
            ) : (
              <button onClick={handleGenerateTelegramCode} className="btn btn-secondary">
                <Send size={16} /> Сгенерировать Код Привязки
              </button>
            )}
          </div>

          {/* SMS Gateway Settings (Eskiz.uz) */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              📱 Настройка СМС Шлюза (Eskiz.uz / PlayMobile)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Подключите официальный SMS API шлюз Узбекистана для авто-отправки смс клиентам.
            </p>

            <div className="input-group">
              <label className="input-label">Провайдер СМС *</label>
              <select 
                value={smsConfigState.provider} 
                onChange={(e) => setSmsConfigState({ ...smsConfigState, provider: e.target.value })}
                className="select-field"
              >
                <option value="eskiz">Eskiz.uz (Узбекистан API)</option>
                <option value="playmobile">PlayMobile Uzbekistan</option>
                <option value="twilio">Twilio Global SMS</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Eskiz Email / Логин *</label>
              <input 
                type="email" 
                value={smsConfigState.email} 
                onChange={(e) => setSmsConfigState({ ...smsConfigState, email: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label className="input-label">Bearer Token / API Key</label>
              <input 
                type="password" 
                placeholder="eyJhbGciOiJIUzI1NiI..."
                value={smsConfigState.token} 
                onChange={(e) => setSmsConfigState({ ...smsConfigState, token: e.target.value })}
                className="input-field" 
              />
            </div>

            <div className="input-group">
              <label className="input-label">Альфа-имя (Имя отправителя)</label>
              <input 
                type="text" 
                value={smsConfigState.fromName} 
                onChange={(e) => setSmsConfigState({ ...smsConfigState, fromName: e.target.value })}
                className="input-field" 
              />
            </div>

            <button 
              onClick={() => {
                saveSMSConfig(smsConfigState);
                alert('✅ Настройки СМС Шлюза успешно сохранены!');
              }} 
              className="btn btn-primary"
            >
              Сохранить Настройки СМС
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: USER & ROLE MANAGEMENT */}
      {activeSection === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Live Courier Geolocation Monitoring Card */}
          <div className="glass-card" style={{ border: '1px solid rgba(245, 158, 11, 0.4)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Radio size={22} color="#f59e0b" className="animate-pulse" />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>📡 Непрерывный GPS-Мониторинг Курьеров</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Реальное местоположение курьеров, передаваемое с их мобильных телефонов в режиме online</p>
                </div>
              </div>
              <span className="badge badge-pickup" style={{ fontSize: '11px', padding: '6px 12px' }}>
                🟢 Онлайн курьеров в сети: {Object.keys(courierGpsMap).length}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {/* Active Couriers List with Live GPS */}
              {(() => {
                const activeCouriers = (registeredUsers || []).filter(u => u.role === 'courier');
                if (activeCouriers.length === 0 && Object.keys(courierGpsMap).length === 0) {
                  return (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                      Ожидание регистрации курьеров и первого сеанса GPS геолокации...
                    </div>
                  );
                }
                const systemCouriers = (registeredUsers || []).filter(u => {
                  const r = String(u.role || u.Role || '').toLowerCase();
                  return (r.includes('courier') || r.includes('курьер')) && u.status !== 'blocked';
                });

                // Only list registered active couriers from system accounts
                const allCourierNames = new Set(systemCouriers.map(u => (u.name || u.username).trim()));

                if (allCourierNames.size === 0) {
                  return (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                      Ожидание регистрации курьеров и первого сеанса GPS геолокации...
                    </div>
                  );
                }

                return Array.from(allCourierNames).map(cName => {
                  const liveData = courierGpsMap[cName];
                  const isOnline = !!(liveData && liveData.lat && liveData.lng);
                  return (
                    <div key={cName} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Truck size={16} color="#f59e0b" /> {cName}
                        </div>
                        <span className={`badge ${isOnline ? 'badge-done' : 'badge-cancel'}`} style={{ fontSize: '10px' }}>
                          {isOnline ? '🟢 В ЭФИРЕ' : '⚪ ОФЛАЙН'}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#60a5fa" />
                        <span>
                          GPS: <strong>{isOnline ? `${liveData.lat.toFixed(5)}, ${liveData.lng.toFixed(5)}` : 'Ожидание первого подключения GPS'}</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Скорость: {isOnline ? (liveData.speed || 0) : 0} км/ч</span>
                        <span>Статус: {isOnline ? (liveData.status || 'В сети') : 'Вне сети'}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* User List & Add Employee Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>👥 Панель Управления Сотрудниками</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Создавайте аккаунты сотрудников, настраивайте роли, пароли и права доступа</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {registeredUsers && registeredUsers.some(u => u.status === 'pending') && (
                  <span className="badge badge-cancel" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    ⏳ Ожидают подтверждения: {registeredUsers.filter(u => u.status === 'pending').length}
                  </span>
                )}

                <button 
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  <Plus size={16} /> Добавить Сотрудника
                </button>
              </div>
            </div>

            {/* Inline Add User Modal / Form */}
            {isAddUserModalOpen && (
              <div style={{ background: 'rgba(17, 24, 39, 0.95)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>➕ Создание Новой Учетной Записи Сотрудника</h4>
                  <button onClick={() => setIsAddUserModalOpen(false)} className="btn-icon">✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div className="input-group">
                    <label className="input-label">ФИО Сотрудника *</label>
                    <input 
                      type="text" 
                      placeholder="Иван Иванов"
                      value={newUserForm.name} 
                      onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      className="input-field" 
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Логин (Username) *</label>
                    <input 
                      type="text" 
                      placeholder="courier2"
                      value={newUserForm.username} 
                      onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                      className="input-field" 
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Пароль *</label>
                    <input 
                      type="text" 
                      placeholder="pass123"
                      value={newUserForm.pass} 
                      onChange={e => setNewUserForm({ ...newUserForm, pass: e.target.value })}
                      className="input-field" 
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Роль в системе *</label>
                    <select 
                      value={newUserForm.role}
                      onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="select-field"
                    >
                      <option value="courier">🚚 Курьер</option>
                      <option value="dispatcher">🎧 Диспетчер</option>
                      <option value="washer">🧼 Мойщик (Оператор стирки)</option>
                      <option value="admin">🛡️ Администратор</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Номер телефона</label>
                    <input 
                      type="text" 
                      value={newUserForm.phone} 
                      onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                      className="input-field" 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button onClick={() => setIsAddUserModalOpen(false)} className="btn btn-secondary" style={{ fontSize: '12px' }}>Отмена</button>
                  <button 
                    onClick={() => {
                      if (!newUserForm.username || !newUserForm.name || !newUserForm.pass) {
                        alert('Заполните все обязательные поля!');
                        return;
                      }
                      const createdUser = {
                        id: `USR-${Date.now().toString().slice(-4)}`,
                        username: newUserForm.username.trim(),
                        name: newUserForm.name.trim(),
                        pass: newUserForm.pass.trim(),
                        role: newUserForm.role,
                        phone: newUserForm.phone.trim(),
                        status: 'active',
                        createdDate: new Date().toLocaleString('ru-RU')
                      };
                      setRegisteredUsers(prev => {
                        const updated = [createdUser, ...prev];
                        localStorage.setItem('cosmo_crm_registered_users', JSON.stringify(updated));
                        broadcastDataChange('registered_users', updated);
                        return updated;
                      });
                      setIsAddUserModalOpen(false);
                      setNewUserForm({ username: '', name: '', pass: '', role: 'courier', phone: '+998 ' });
                      alert(`Сотрудник ${createdUser.name} (@${createdUser.username}) успешно создан и АКТИВИРОВАН!`);
                    }}
                    className="btn btn-primary" 
                    style={{ fontSize: '12px' }}
                  >
                    Сохранить Сотрудника
                  </button>
                </div>
              </div>
            )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', minWidth: '650px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Логин / ID</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>ФИО Сотрудника</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Телефон</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Роль</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Статус доступа</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Действия Админа</th>
                </tr>
              </thead>
              <tbody>
                {(registeredUsers || staffList).map((user) => {
                  const isPending = user.status === 'pending';
                  const isActive = user.status === 'active';
                  const isBlocked = user.status === 'blocked';

                  return (
                    <tr 
                      key={user.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        background: isPending ? 'rgba(245, 158, 11, 0.08)' : 'transparent' 
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
                        @{user.username}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#fff' }}>{user.name}</td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{user.phone || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-ready">{user.role?.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {isPending && (
                          <span className="badge badge-new" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b' }}>
                            ⏳ Ожидает подтверждения
                          </span>
                        )}
                        {isActive && (
                          <span className="badge badge-done">
                            ✅ Активен
                          </span>
                        )}
                        {isBlocked && (
                          <span className="badge badge-cancel">
                            🚫 Заблокирован
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          {isPending && (
                            <button 
                              onClick={() => {
                                setRegisteredUsers(prev => {
                                  const updated = prev.map(u => u.id === user.id ? { ...u, status: 'active' } : u);
                                  localStorage.setItem('cosmo_crm_registered_users', JSON.stringify(updated));
                                  broadcastDataChange('registered_users', updated);
                                  return updated;
                                });
                                alert(`Пользователь @${user.username} (${user.name}) успешно АКТИВИРОВАН!`);
                              }} 
                              className="btn btn-primary" 
                              style={{ fontSize: '11px', padding: '5px 10px', background: '#10b981', borderColor: '#10b981' }}
                            >
                              <CheckCircle2 size={13} /> Подтвердить доступ
                            </button>
                          )}

                          {isActive && (
                            <button 
                              onClick={() => {
                                setRegisteredUsers(prev => {
                                  const updated = prev.map(u => u.id === user.id ? { ...u, status: 'blocked' } : u);
                                  localStorage.setItem('cosmo_crm_registered_users', JSON.stringify(updated));
                                  broadcastDataChange('registered_users', updated);
                                  return updated;
                                });
                              }} 
                              className="btn-icon" 
                              title="Заблокировать"
                            >
                              <Lock size={14} color="#f43f5e" />
                            </button>
                          )}

                          {isBlocked && (
                            <button 
                              onClick={() => {
                                setRegisteredUsers(prev => {
                                  const updated = prev.map(u => u.id === user.id ? { ...u, status: 'active' } : u);
                                  localStorage.setItem('cosmo_crm_registered_users', JSON.stringify(updated));
                                  broadcastDataChange('registered_users', updated);
                                  return updated;
                                });
                              }} 
                              className="btn-icon" 
                              title="Разблокировать / Активировать"
                            >
                              <Unlock size={14} color="#10b981" />
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              if (window.confirm(`Удалить учетную запись @${user.username}?`)) {
                                setRegisteredUsers(prev => prev.filter(u => u.id !== user.id && u.username !== user.username));
                              }
                            }} 
                            className="btn-icon" 
                            title="Удалить аккаунт"
                          >
                            <Trash2 size={14} color="#94a3b8" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* SECTION 3: OPERATIONS & FINANCE CONTROL */}
      {activeSection === 'operations' && (
        <div className="responsive-grid-7-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Service & Price Catalog Editor */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                  ⚙️ Управление Услугами, Ценами и Единицами измерний (Админ)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Настраивайте стоимость и структуру измерения для Курьера и Цеха (Ковры в м², Курпача в метрах, Подушки в шт и т.д.)
                </p>
              </div>

              <button 
                onClick={() => {
                  const newSvc = {
                    id: `S-${Date.now().toString().slice(-4)}`,
                    name: 'Новая услуга',
                    category: 'Текстиль',
                    unit: 'шт',
                    price: 20000,
                    icon: 'Sparkles'
                  };
                  setPricingList([...pricingList, newSvc]);
                }}
                className="btn btn-primary"
                style={{ fontSize: '13px', padding: '8px 14px' }}
              >
                <Plus size={16} /> Добавить Услугу
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
              {pricingList.map((svc, idx) => (
                <div 
                  key={svc.id} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '800' }}>ID: {svc.id}</span>
                    <button 
                      onClick={() => setPricingList(pricingList.filter(s => s.id !== svc.id))} 
                      className="btn-icon" 
                      title="Удалить услугу"
                    >
                      <Trash2 size={15} color="#f43f5e" />
                    </button>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Название услуги *</label>
                    <input 
                      type="text" 
                      value={svc.name}
                      onChange={(e) => {
                        const updated = pricingList.map(s => s.id === svc.id ? { ...s, name: e.target.value } : s);
                        setPricingList(updated);
                      }}
                      className="input-field"
                      placeholder="Например: Мойка курпачи"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="input-group">
                      <label className="input-label">Единица измерения *</label>
                      <select 
                        value={svc.unit}
                        onChange={(e) => {
                          const updated = pricingList.map(s => s.id === svc.id ? { ...s, unit: e.target.value } : s);
                          setPricingList(updated);
                        }}
                        className="select-field"
                      >
                        <option value="м²">м² (кв. метры)</option>
                        <option value="метр">метр (погонный)</option>
                        <option value="шт">шт (штука)</option>
                        <option value="комплект">комплект</option>
                        <option value="место">посадочное место</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Цена (сум) *</label>
                      <input 
                        type="number" 
                        value={svc.price ?? ''}
                        onChange={(e) => handlePriceChange(svc.id, e.target.value)}
                        className="input-field"
                        style={{ color: '#10b981', fontWeight: '800' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                const formattedPricing = pricingList.map(p => ({
                  ...p,
                  price: parseFloat(p.price) || 0
                }));
                localStorage.setItem('cosmo_crm_service_catalog', JSON.stringify(formattedPricing));
                alert('✅ Прайс-лист и структура услуг сохранены! Доступны курьеру и цеху.');
              }}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '12px', marginTop: '10px' }}
            >
              <CheckCircle2 size={18} /> Сохранить изменения для всех курьеров и цеха
            </button>
          </div>

          {/* Debts & Salary Modules */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              💸 Управление Долгами и Выплатами ЗП
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f87171' }}>Модуль дебиторской задолженности (`debt_manager.py`)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Общий долг клиентов: <strong>766,000 сум</strong> по 3 заказам.
                </div>
                <button onClick={() => alert('Долги актуализированы')} className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', marginTop: '8px' }}>
                  Ручное списание / Корректировка
                </button>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#34d399' }}>Модуль выплат ЗП (`salary_manager.py`)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  К выплате персоналу: <strong>685,000 сум</strong> за тек. неделю.
                </div>
                <button onClick={() => alert('Авансы внесены в реестр')} className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', marginTop: '8px' }}>
                  Внести Аванс / Выплату
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: AUDIT LOGS, SESSIONS & BACKUPS */}
      {activeSection === 'security' && (
        <div className="responsive-grid-7-5">
          {/* Audit Log */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>📜 Журнал Аудита (Audit Log)</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {auditLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', marginRight: '8px' }}>[{log.time}]</span>
                    <strong style={{ color: 'var(--accent-secondary)' }}>{log.user}</strong>: {log.action}
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-dim)' }}>{log.ip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Sessions & Backups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>🔑 Активные Сессии (JWT)</h3>
              {sessions.map((sess) => (
                <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <strong>{sess.user}</strong> ({sess.ip})
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{sess.device}</div>
                  </div>
                  <button onClick={() => terminateSession(sess.id)} className="btn-icon" style={{ color: '#f43f5e', padding: '4px' }} title="Завершить сессию">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>💾 Бэкапы (`backup_manager.py`)</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => triggerBackup('orders')} className="btn btn-secondary" style={{ flex: 1, fontSize: '11px' }}>
                  <Download size={12} /> Заказы
                </button>
                <button onClick={() => triggerBackup('users')} className="btn btn-secondary" style={{ flex: 1, fontSize: '11px' }}>
                  <Download size={12} /> Пользователи
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: SMS, GOOGLE SHEETS & TELEGRAM INTEGRATIONS */}
      {activeSection === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Google Sheets Real-time Integration Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}>
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                    📊 Онлайн Синхронизация с Google Таблицами
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Все новые и обновленные заказы автоматически записываются онлайн в вашу Google Таблицу
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${gsConfig.webhookUrl ? 'badge-done' : 'badge-new'}`}>
                  {gsConfig.webhookUrl ? '🟢 Онлайн Связь Подключена' : '🟡 Настройте Webhook'}
                </span>
                {gsConfig.lastSyncTime && (
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    Посл. синхронизация: {gsConfig.lastSyncTime}
                  </span>
                )}
              </div>
            </div>

            <div className="responsive-grid-7-5" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ссылка на Google Таблицу</span>
                    <a href={gsConfig.sheetUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Открыть <ExternalLink size={12} />
                    </a>
                  </label>
                  <input 
                    type="text" 
                    value={gsConfig.sheetUrl} 
                    onChange={(e) => setGsConfig({ ...gsConfig, sheetUrl: e.target.value })}
                    className="input-field" 
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Google Apps Script Webhook URL (Веб-Приложение)</label>
                  <input 
                    type="text" 
                    value={gsConfig.webhookUrl} 
                    onChange={(e) => setGsConfig({ ...gsConfig, webhookUrl: e.target.value })}
                    className="input-field" 
                    placeholder="https://script.google.com/macros/s/.../exec"
                    style={{ borderColor: gsConfig.webhookUrl ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-color)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button onClick={handleSaveGsConfig} className="btn btn-primary" style={{ flex: 1 }}>
                    <CheckCircle size={14} /> Сохранить Настройки
                  </button>
                  <button 
                    onClick={handleSyncAllOrders} 
                    disabled={isSyncingAll} 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    <RefreshCw size={14} className={isSyncingAll ? 'animate-spin' : ''} /> 
                    {isSyncingAll ? 'Синхронизация...' : `Записать ${orders.length} заказов`}
                  </button>
                </div>
              </div>

              {/* Setup Assistant & Script Template */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
                    💡 Как быстро настроить прямо в Google Таблице (1 минута):
                  </div>
                  <ol style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>Откройте вашу Google Таблицу и перейдите в <b>Расширения → Apps Script</b></li>
                    <li>Удалите базовый код и вставьте подготовленный скрипт CRM</li>
                    <li>Нажмите <b>Развернуть → Новое развертывание → Веб-приложение</b></li>
                    <li>Доступ: <b>"Все" (Anyone)</b>, нажмите Развернуть</li>
                    <li>Вставьте полученный URL в поле Webhook выше и нажмите "Сохранить"</li>
                  </ol>
                </div>

                <button 
                  onClick={handleCopyScriptCode} 
                  className="btn" 
                  style={{ 
                    marginTop: '12px', 
                    background: copiedCode ? '#10b981' : 'rgba(255,255,255,0.08)', 
                    color: '#fff', 
                    fontSize: '12px' 
                  }}
                >
                  {copiedCode ? <CheckCircle size={14} /> : <Copy size={14} />} 
                  {copiedCode ? 'Код скрипта скопирован в буфер!' : 'Скопировать Готовый Код Google Apps Script'}
                </button>
              </div>
            </div>
          </div>

          <div className="responsive-grid-7-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* SMS Center */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                📱 SMS-Центр (`sms_manager.py`)
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 182, 212, 0.15)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Баланс провайдера (Eskiz / SMS.ru):</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#22d3ee' }}>{smsBalance.toLocaleString()} сум</div>
                </div>
                <span className="badge badge-ready">~2,425 SMS</span>
              </div>

              <div className="input-group">
                <label className="input-label">Шаблон при создании заказа</label>
                <textarea 
                  rows={2}
                  value={smsTemplates.newOrder}
                  onChange={(e) => setSmsTemplates({ ...smsTemplates, newOrder: e.target.value })}
                  className="textarea-field"
                />
              </div>
            </div>

            {/* Telegram Common Group Notifier Bot Control Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1.5px solid rgba(99, 102, 241, 0.4)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.85) 100%)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={22} color="#818cf8" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                      🤖 Управление общим Telegram-ботом (Уведомления в группу)
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Один бот-уведомитель присылает все 4 ключевых статуса по заказам в общую Telegram-группу компании
                    </p>
                  </div>
                </div>

                <span className={`badge ${botTestResult?.success ? 'badge-done' : tgBotConfig.botToken ? 'badge-new' : 'badge-cancel'}`}>
                  {botTestResult?.success ? `🟢 Бот Активен (@${botTestResult.botInfo.username})` : tgBotConfig.botToken ? '🟡 Токен Введен' : '🔴 Ожидает Токена'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Токен Telegram-бота (BotFather API Token) *</label>
                  <input 
                    type="password"
                    placeholder="7890123456:AAEt..." 
                    value={tgBotConfig.botToken || ''} 
                    onChange={(e) => setTgBotConfig({ ...tgBotConfig, botToken: e.target.value })}
                    className="input-field" 
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
                    Получите токен бота у <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>@BotFather</a> в Telegram
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="input-group">
                    <label className="input-label">Username Бота (@username)</label>
                    <input 
                      type="text" 
                      placeholder="CosmoGroupNotifier_bot" 
                      value={tgBotConfig.botUsername || ''} 
                      onChange={(e) => setTgBotConfig({ ...tgBotConfig, botUsername: e.target.value.replace('@', '') })}
                      className="input-field" 
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Chat ID общей группы Telegram *</label>
                    <input 
                      type="text" 
                      placeholder="-1001234567890 или @group_name" 
                      value={tgBotConfig.channelId || ''} 
                      onChange={(e) => setTgBotConfig({ ...tgBotConfig, channelId: e.target.value })}
                      className="input-field" 
                    />
                  </div>
                </div>

                {/* 4 Event Toggles */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0', marginBottom: '8px' }}>
                    📢 4 Ключевых случая отправки уведомлений в общую группу:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={tgBotConfig.enabledEvents?.created !== false}
                        onChange={(e) => setTgBotConfig({
                          ...tgBotConfig,
                          enabledEvents: { ...tgBotConfig.enabledEvents, created: e.target.checked }
                        })}
                        style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                      />
                      <span>📥 <b>1. Создание:</b> Новый заказ диспетчера</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={tgBotConfig.enabledEvents?.pickup !== false}
                        onChange={(e) => setTgBotConfig({
                          ...tgBotConfig,
                          enabledEvents: { ...tgBotConfig.enabledEvents, pickup: e.target.checked }
                        })}
                        style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                      />
                      <span>🚗 <b>2. Забор у клиента:</b> Курьер забрал (кол-во)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={tgBotConfig.enabledEvents?.ready !== false}
                        onChange={(e) => setTgBotConfig({
                          ...tgBotConfig,
                          enabledEvents: { ...tgBotConfig.enabledEvents, ready: e.target.checked }
                        })}
                        style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                      />
                      <span>🧼 <b>3. Готовность:</b> Замеры & мойка в цеху</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#cbd5e1', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={tgBotConfig.enabledEvents?.done !== false}
                        onChange={(e) => setTgBotConfig({
                          ...tgBotConfig,
                          enabledEvents: { ...tgBotConfig.enabledEvents, done: e.target.checked }
                        })}
                        style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                      />
                      <span>✅ <b>4. Закрытие:</b> Доставка & оплата заказа</span>
                    </label>
                  </div>
                </div>

                {/* Test Bot Token Result Alert */}
                {botTestResult && (
                  <div style={{ 
                    padding: '10px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '12px', 
                    background: botTestResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    border: `1px solid ${botTestResult.success ? '#10b981' : '#f43f5e'}`
                  }}>
                    {botTestResult.success ? (
                      <div>
                        ✅ <strong>Успешное подключение к Telegram API!</strong><br />
                        Имя бота: <strong>{botTestResult.botInfo.name}</strong> (@{botTestResult.botInfo.username}) | ID: {botTestResult.botInfo.id}
                      </div>
                    ) : (
                      <div>❌ <strong>Ошибка подключения:</strong> {botTestResult.error}</div>
                    )}
                  </div>
                )}

                {/* Test Send Group Message Alert */}
                {testGroupMsgResult && (
                  <div style={{ 
                    padding: '10px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '12px', 
                    background: testGroupMsgResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    border: `1px solid ${testGroupMsgResult.success ? '#10b981' : '#f43f5e'}`
                  }}>
                    {testGroupMsgResult.success ? (
                      <div>
                        🚀 <strong>Тестовое сообщение успешно отправлено в общую Telegram-группу!</strong> Проверьте группу в Telegram.
                      </div>
                    ) : (
                      <div>❌ <strong>Ошибка отправки в группу:</strong> {testGroupMsgResult.error}<br /><small>Убедитесь, что бот добавлен в группу и назначен администратором.</small></div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <button 
                    type="button"
                    onClick={async () => {
                      if (!tgBotConfig.botToken) {
                        alert('Введите токен бота!');
                        return;
                      }
                      setIsTestingBotToken(true);
                      setBotTestResult(null);
                      const res = await testTelegramBotToken(tgBotConfig.botToken);
                      setIsTestingBotToken(false);
                      setBotTestResult(res);
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, minWidth: '150px', fontSize: '12px' }}
                  >
                    <RefreshCw size={14} className={isTestingBotToken ? 'animate-spin' : ''} /> 
                    {isTestingBotToken ? 'Проверка API...' : '⚡ Проверить Токен API'}
                  </button>

                  <button 
                    type="button"
                    onClick={async () => {
                      if (!tgBotConfig.botToken || !tgBotConfig.channelId) {
                        alert('Укажите токен бота и Chat ID общей группы!');
                        return;
                      }
                      setIsSendingTestGroupMsg(true);
                      setTestGroupMsgResult(null);
                      const res = await testSendGroupMessage(tgBotConfig.botToken, tgBotConfig.channelId);
                      setIsSendingTestGroupMsg(false);
                      setTestGroupMsgResult(res);
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, minWidth: '180px', fontSize: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                  >
                    <Send size={14} className={isSendingTestGroupMsg ? 'animate-spin' : ''} />
                    {isSendingTestGroupMsg ? 'Отправка...' : '💬 Отправить тест в группу'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      const ok = saveTelegramBotConfig(tgBotConfig);
                      if (ok) {
                        const fresh = getTelegramBotConfig();
                        setTgBotConfig(fresh);
                        alert(`✅ Настройки Telegram-бота сохранены!\nТокен: ${fresh.botToken ? 'Введен' : 'Не введен'}\nChat ID группы: ${fresh.channelId || 'Не указан'}`);
                      } else {
                        alert('Ошибка сохранения настроек бота.');
                      }
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1, minWidth: '160px', fontSize: '12px' }}
                  >
                    <CheckCircle size={14} /> Сохранить Настройки
                  </button>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  💡 <b>Инструкция по подключению:</b> 1. Создайте бота в @BotFather → 2. Создайте общую группу в Telegram и добавьте туда бота → 3. Сделайте бота администратором группы → 4. Укажите Chat ID группы (например: <code>-1001234567890</code>) и нажмите «Отправить тест в группу».
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
