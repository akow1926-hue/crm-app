import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function AuthModal({ onLogin, registeredUsers, onRegisterUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [role, setRole] = useState('admin');
  const [errorMsg, setErrorMsg] = useState('');
  const [successPendingMsg, setSuccessPendingMsg] = useState(null);

  // Master admin account
  const demoAccounts = [
    { label: '👑 Админ', user: 'admin', pass: 'admin123' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessPendingMsg(null);

    const cleanUsername = username.trim().toLowerCase();

    if (isRegister) {
      // Registration Flow
      if (!cleanUsername || !password || !fullName || !phone) {
        setErrorMsg('Пожалуйста, заполните все обязательные поля.');
        return;
      }

      // Check if username already exists
      const exists = registeredUsers.some(u => u.username.toLowerCase() === cleanUsername);
      if (exists) {
        setErrorMsg('Пользователь с таким логином уже зарегистрирован!');
        return;
      }

      // Register user with PENDING status requiring Admin approval
      const newUser = {
        id: `USR-${Date.now()}`,
        username: cleanUsername,
        pass: password,
        name: fullName,
        phone: phone,
        role: role,
        status: 'pending',
        createdDate: new Date().toLocaleString('ru-RU')
      };

      onRegisterUser(newUser);
      setSuccessPendingMsg(newUser);

      // Clear fields
      setUsername('');
      setPassword('');
      setFullName('');
      setPhone('+998 ');
      return;
    }

    // Login Flow
    if (!cleanUsername || !password) {
      setErrorMsg('Пожалуйста, введите логин и пароль.');
      return;
    }

    // Search user in database
    const userFound = registeredUsers.find(u => u.username.toLowerCase() === cleanUsername);

    if (!userFound) {
      setErrorMsg('Учетная запись не найдена. Проверьте логин или зарегистрируйтесь.');
      return;
    }

    if (userFound.pass !== password) {
      setErrorMsg('Неверный пароль. Попробуйте снова.');
      return;
    }

    // Check account approval status
    if (userFound.status === 'pending') {
      setErrorMsg('⏳ Ваш аккаунт зарегистрирован, но ещё ожидает подтверждения Администратором CRM. Пожалуйста, обратитесь к Администратору для активации доступа.');
      return;
    }

    if (userFound.status === 'blocked') {
      setErrorMsg('🚫 Ваш аккаунт заблокирован Администратором. Доступ ограничен.');
      return;
    }

    // Account is ACTIVE -> Log in!
    onLogin({
      username: userFound.username,
      name: userFound.name,
      role: userFound.role,
      phone: userFound.phone
    });
  };

  const handleQuickDemo = (acc) => {
    const userFound = registeredUsers.find(u => u.username === acc.user);
    if (userFound) {
      onLogin({
        username: userFound.username,
        name: userFound.name,
        role: userFound.role,
        phone: userFound.phone
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.25) 0%, rgba(9, 13, 22, 0.98) 70%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '460px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-modal)',
        border: '1px solid var(--border-glow)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '32px'
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Sparkles size={30} color="#fff" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            COSMO CRM
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {isRegister ? 'Регистрация нового сотрудника' : 'Вход в систему клининга и стирки'}
          </p>
        </div>

        {/* Form Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px',
          border: '1px solid var(--border-color)'
        }}>
          <button 
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessPendingMsg(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: !isRegister ? 'var(--accent-primary)' : 'transparent',
              color: '#fff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={14} /> Вход
          </button>

          <button 
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessPendingMsg(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: isRegister ? 'var(--accent-primary)' : 'transparent',
              color: '#fff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={14} /> Регистрация
          </button>
        </div>

        {/* Success Banner when Registered with Pending Status */}
        {successPendingMsg && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #f59e0b',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Clock size={32} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#fbbf24' }}>
                Заявка отправлена администратору!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                Аккаунт для <strong>{successPendingMsg.name}</strong> ({successPendingMsg.role}) успешно создан.
                По соображениям безопасности вход заблокирован до <strong>подтверждения Администратором</strong>.
              </div>
            </div>
            <button 
              onClick={() => { setIsRegister(false); setSuccessPendingMsg(null); }}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 14px', marginTop: '4px' }}
            >
              Перейти к форме входа
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            color: '#f87171',
            fontSize: '12.5px',
            textAlign: 'center',
            fontWeight: '600',
            lineHeight: '1.4'
          }}>
            {errorMsg}
          </div>
        )}

        {!successPendingMsg && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div className="input-group">
                  <label className="input-label">ФИО сотрудника *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text"
                      required
                      placeholder="Например: Сардор Мирзаев"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '38px' }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Телефон *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text"
                      required
                      placeholder="+998 90 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '38px' }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Желаемая роль в системе *</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="select-field"
                  >
                    <option value="admin">👑 Администратор (Главный кабинет CRM)</option>
                    <option value="dispatcher">📞 Диспетчер (Прием заказов)</option>
                    <option value="courier">🚚 Курьер (Забор и Доставка)</option>
                    <option value="washer">🧺 Оператор стирки (Цех)</option>
                  </select>
                </div>
              </>
            )}

            <div className="input-group">
              <label className="input-label">Логин / Имя пользователя *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  required
                  placeholder="например: sardor"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Пароль *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '15px', width: '100%', marginTop: '6px' }}>
              {isRegister ? 'Отправить заявку на регистрацию' : 'Войти в рабочий кабинет'} <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
