import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  UserCheck, 
  Receipt, 
  Search, 
  Plus, 
  Clock, 
  Calendar,
  Check,
  X,
  Edit3,
  Trash2,
  Users,
  FileText,
  TrendingDown
} from 'lucide-react';
import { syncFinanceToGoogleSheets } from '../services/googleSheetsService';

export default function FinanceSalaryView({ 
  orders = [], 
  setOrders, 
  registeredUsers = [],
  setRegisteredUsers
}) {
  const [activeSubTab, setActiveSubTab] = useState('salaries'); // 'salaries' | 'advances' | 'debts' | 'history'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Base Salaries State (saved persistently)
  const [staffSalaries, setStaffSalaries] = useState(() => {
    try {
      const saved = localStorage.getItem('cosmo_crm_staff_base_salaries');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'USR-1': 6000000,
      'USR-2': 4500000,
      'USR-3': 4000000,
      'USR-4': 3500000
    };
  });

  // 2. Advance Payouts State (saved persistently)
  const [salaryAdvances, setSalaryAdvances] = useState(() => {
    try {
      const saved = localStorage.getItem('cosmo_crm_salary_advances');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'ADV-101',
        staffId: 'USR-2',
        staffName: 'Акобир (Курьер)',
        staffRole: 'courier',
        amount: 1500000,
        date: new Date().toISOString().split('T')[0],
        note: 'Аванс в середине месяца на бензин и личные расходы',
        method: 'Наличные',
        createdDate: new Date().toLocaleString('ru-RU')
      },
      {
        id: 'ADV-102',
        staffId: 'USR-3',
        staffName: 'Бобир (Мастер цеха)',
        staffRole: 'washer',
        amount: 1000000,
        date: new Date().toISOString().split('T')[0],
        note: 'Частичная выплата аванса',
        method: 'Click',
        createdDate: new Date().toLocaleString('ru-RU')
      }
    ];
  });

  // 3. Transactions Ledger State
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('cosmo_crm_finance_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'TX-101', type: 'in', title: 'Оплата за заказ (Клиент)', amount: 360000, date: new Date().toLocaleString('ru-RU'), method: 'Click' },
      { id: 'TX-102', type: 'out', title: 'Выдан аванс курьеру Акобир', amount: 1500000, date: new Date().toLocaleString('ru-RU'), method: 'Наличные' },
      { id: 'TX-103', type: 'out', title: 'Выдан аванс мастеру Бобир', amount: 1000000, date: new Date().toLocaleString('ru-RU'), method: 'Click' }
    ];
  });

  // Save to persistent storage
  useEffect(() => {
    localStorage.setItem('cosmo_crm_staff_base_salaries', JSON.stringify(staffSalaries));
  }, [staffSalaries]);

  useEffect(() => {
    localStorage.setItem('cosmo_crm_salary_advances', JSON.stringify(salaryAdvances));
  }, [salaryAdvances]);

  useEffect(() => {
    localStorage.setItem('cosmo_crm_finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // MODALS STATE
  // A. Issue Advance Modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    staffId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    method: 'Наличные'
  });

  // B. Edit Base Salary Modal
  const [editSalaryModalStaff, setEditSalaryModalStaff] = useState(null);
  const [newBaseSalaryInput, setNewBaseSalaryInput] = useState('');

  // C. View Staff Advance History Modal
  const [selectedStaffHistory, setSelectedStaffHistory] = useState(null);

  // D. Customer Debt Payment Modal
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [payAmountInput, setPayAmountInput] = useState('');

  // REAL Staff list derived from registeredUsers
  const realStaffList = (registeredUsers && registeredUsers.length > 0) 
    ? registeredUsers 
    : [
        { id: 'USR-1', name: 'Акобир (Администратор)', role: 'admin', phone: '+998 90 123 45 67' },
        { id: 'USR-2', name: 'Акобир (Курьер)', role: 'courier', phone: '+998 90 777 88 99' },
        { id: 'USR-3', name: 'Бобир (Мастер цеха)', role: 'washer', phone: '+998 93 333 22 11' },
        { id: 'USR-4', name: 'Мадина (Диспетчер)', role: 'dispatcher', phone: '+998 91 555 44 33' }
      ];

  // Helper to translate roles
  const getRoleBadge = (role) => {
    const r = String(role || '').toLowerCase();
    if (r.includes('courier') || r.includes('курьер')) return { text: '🚚 Курьер', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
    if (r.includes('washer') || r.includes('мойщик') || r.includes('цех')) return { text: '🧼 Мастер цеха', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)' };
    if (r.includes('dispatcher') || r.includes('диспетчер')) return { text: '🎧 Диспетчер', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' };
    return { text: '🛡️ Администратор', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
  };

  // Staff Salary Calculations
  const staffSalaryData = realStaffList.map(staff => {
    const baseSalary = staffSalaries[staff.id] !== undefined ? staffSalaries[staff.id] : (staff.baseSalary || 4000000);
    const advances = salaryAdvances.filter(a => a.staffId === staff.id || (staff.name && a.staffName && a.staffName.toLowerCase() === staff.name.toLowerCase()));
    const totalAdvancesPaid = advances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const balanceDue = Math.max(0, baseSalary - totalAdvancesPaid);

    return {
      ...staff,
      baseSalary,
      advances,
      advancesCount: advances.length,
      totalAdvancesPaid,
      balanceDue,
      isFullyPaid: totalAdvancesPaid >= baseSalary,
      isPartiallyPaid: totalAdvancesPaid > 0 && totalAdvancesPaid < baseSalary
    };
  });

  // Overall Salary Totals
  const totalMonthlyPayroll = staffSalaryData.reduce((sum, s) => sum + s.baseSalary, 0);
  const totalAdvancesGiven = staffSalaryData.reduce((sum, s) => sum + s.totalAdvancesPaid, 0);
  const totalRemainingPayrollDue = staffSalaryData.reduce((sum, s) => sum + s.balanceDue, 0);

  // Overall Order Revenue & Debts
  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.agreedAmount || 0)), 0);
  const paidRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.paidAmount || (o.paymentStatus === 'paid' ? o.totalAmount : 0) || 0)), 0);
  const debtTotal = Math.max(0, totalRevenue - paidRevenue);

  // Debtor Orders
  const debtorOrders = orders.filter(o => {
    const debt = (parseFloat(o.totalAmount || 0)) - (parseFloat(o.paidAmount || 0));
    const name = String(o.clientName || '').toLowerCase();
    const phone = String(o.phone || o.clientPhone || '');
    const idStr = String(o.id || '');
    const q = searchQuery.toLowerCase();
    const matches = !q || name.includes(q) || phone.includes(q) || idStr.includes(q);
    return debt > 0 && matches;
  });

  // HANDLERS
  // 1. Submit Issue Advance
  const handleCreateAdvanceSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(advanceForm.amount);
    if (!advanceForm.staffId || !amountNum || amountNum <= 0) {
      alert('Выберите сотрудника и укажите корректную сумму аванса!');
      return;
    }

    const selectedStaff = realStaffList.find(s => s.id === advanceForm.staffId) || { name: 'Сотрудник', role: 'courier' };
    const newAdvanceObj = {
      id: `ADV-${Date.now().toString().slice(-4)}`,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name || selectedStaff.username,
      staffRole: selectedStaff.role || 'courier',
      amount: amountNum,
      date: advanceForm.date || new Date().toISOString().split('T')[0],
      note: advanceForm.note || 'Частичная выплата / Аванс от зарплаты',
      method: advanceForm.method || 'Наличные',
      createdDate: new Date().toLocaleString('ru-RU')
    };

    const nextAdvances = [newAdvanceObj, ...salaryAdvances];
    setSalaryAdvances(nextAdvances);

    // Record in Transactions Ledger
    const transObj = {
      id: `TX-${Date.now()}`,
      type: 'out',
      title: `Выдан аванс: ${selectedStaff.name} (${amountNum.toLocaleString()} сум)`,
      amount: amountNum,
      date: new Date().toLocaleString('ru-RU'),
      method: advanceForm.method || 'Наличные',
      staffName: selectedStaff.name
    };
    setTransactions([transObj, ...transactions]);
    syncFinanceToGoogleSheets(transObj).catch(() => {});

    alert(`✅ Аванс в размере ${amountNum.toLocaleString()} сум успешно выдан сотруднику ${selectedStaff.name}!\nСумма автоматически вычтена из остатка зарплаты.`);
    setIsAdvanceModalOpen(false);
    setAdvanceForm({
      staffId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      method: 'Наличные'
    });
  };

  // 2. Quick Pay Full Remaining Balance
  const handlePayRemainingBalance = (staff) => {
    if (staff.balanceDue <= 0) {
      alert(`Зарплата сотрудника ${staff.name} уже полностью выплачена (${staff.totalAdvancesPaid.toLocaleString()} сум)!`);
      return;
    }

    setAdvanceForm({
      staffId: staff.id,
      amount: staff.balanceDue.toString(),
      date: new Date().toISOString().split('T')[0],
      note: 'Полный расчет по остатку зарплаты за месяц',
      method: 'Наличные'
    });
    setIsAdvanceModalOpen(true);
  };

  // 3. Save Base Salary
  const handleSaveBaseSalary = (e) => {
    e.preventDefault();
    const newSalary = parseFloat(newBaseSalaryInput);
    if (isNaN(newSalary) || newSalary < 0) {
      alert('Укажите корректную сумму оклада!');
      return;
    }

    setStaffSalaries({
      ...staffSalaries,
      [editSalaryModalStaff.id]: newSalary
    });

    if (setRegisteredUsers) {
      setRegisteredUsers(prev => prev.map(u => u.id === editSalaryModalStaff.id ? { ...u, baseSalary: newSalary } : u));
    }

    alert(`✅ Базовый месячный оклад для ${editSalaryModalStaff.name} установлен: ${newSalary.toLocaleString()} сум!`);
    setEditSalaryModalStaff(null);
  };

  // 4. Delete an advance payout
  const handleDeleteAdvance = (advId) => {
    if (window.confirm('Вы уверены, что хотите отменить и удалить эту запись о выдаче аванса?')) {
      const filtered = salaryAdvances.filter(a => a.id !== advId);
      setSalaryAdvances(filtered);
      if (selectedStaffHistory) {
        setSelectedStaffHistory({
          ...selectedStaffHistory,
          advances: selectedStaffHistory.advances.filter(a => a.id !== advId)
        });
      }
      alert('Запись об авансе удалена.');
    }
  };

  // 5. Settle Customer Debt
  const handleConfirmPartialPayment = (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmountInput);
    if (!amount || amount <= 0) {
      alert('Введите корректную сумму оплаты.');
      return;
    }

    const remainingDebt = (paymentModalOrder.totalAmount || 0) - (paymentModalOrder.paidAmount || 0);
    const actualPay = Math.min(amount, remainingDebt);
    const newPaidTotal = (paymentModalOrder.paidAmount || 0) + actualPay;
    const newPaymentStatus = newPaidTotal >= paymentModalOrder.totalAmount ? 'paid' : 'partial';

    const updatedOrders = orders.map(o => {
      if (o.id === paymentModalOrder.id) {
        return {
          ...o,
          paidAmount: newPaidTotal,
          paymentStatus: newPaymentStatus
        };
      }
      return o;
    });
    setOrders(updatedOrders);

    const transObj = {
      id: `TX-${Date.now()}`,
      type: 'in',
      title: `Оплата по заказу #${paymentModalOrder.id} (${paymentModalOrder.clientName})`,
      amount: actualPay,
      date: new Date().toLocaleString('ru-RU'),
      method: 'Касса CRM',
      orderId: paymentModalOrder.id
    };
    setTransactions([transObj, ...transactions]);
    syncFinanceToGoogleSheets(transObj).catch(() => {});

    setPaymentModalOrder(null);
    setPayAmountInput('');
    alert(`💳 Внесена оплата ${actualPay.toLocaleString()} сум по заказу #${paymentModalOrder.id}!`);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* Top Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)',
        border: '1.5px solid #10b981',
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '900',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
          }}>
            <Wallet size={26} />
          </div>
          <div>
            <span className="badge badge-ready" style={{ fontSize: '11px', fontWeight: '800' }}>
              Финансовый Кабинет & Зарплатный Фонд
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
              💰 Зарплаты Персонала, Авансы & Касса CRM
            </h2>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Управление базовыми окладами, выдачей авансов и автоматический расчет остатка к доплате
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            setAdvanceForm({
              staffId: realStaffList[0]?.id || '',
              amount: '',
              date: new Date().toISOString().split('T')[0],
              note: '',
              method: 'Наличные'
            });
            setIsAdvanceModalOpen(true);
          }}
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '10px 18px', fontWeight: '800', fontSize: '13.5px' }}
        >
          <Plus size={18} /> Выдать аванс / часть ЗП
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Metric 1: Общий ЗП Фонд */}
        <div className="glass-card" style={{ borderLeft: '4px solid #38bdf8', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>МЕСЯЧНЫЙ ФОНД ЗАРПЛАТ</span>
            <Users size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>
            {totalMonthlyPayroll.toLocaleString()} сум
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8' }}>
            Сумма базовых окладов {realStaffList.length} сотрудников
          </div>
        </div>

        {/* Metric 2: Выдано Авансов */}
        <div className="glass-card" style={{ borderLeft: '4px solid #facc15', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>ВЫДАНО АВАНСОВ В СЕРЕДИНЕ МЕСЯЦА</span>
            <TrendingDown size={18} color="#facc15" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#facc15' }}>
            {totalAdvancesGiven.toLocaleString()} сум
          </div>
          <div style={{ fontSize: '11px', color: '#facc15' }}>
            Всего выплат авансов: {salaryAdvances.length} операций
          </div>
        </div>

        {/* Metric 3: Остаток к Доплате */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>ОСТАЛОСЬ ДОПЛАТИТЬ (БАЛАНС)</span>
            <DollarSign size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>
            {totalRemainingPayrollDue.toLocaleString()} сум
          </div>
          <div style={{ fontSize: '11px', color: '#10b981' }}>
            Автоматически рассчитанный остаток в конце месяца
          </div>
        </div>

        {/* Metric 4: Долги Клиентов */}
        <div className="glass-card" style={{ borderLeft: '4px solid #f43f5e', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '700' }}>ДОЛГИ КЛИЕНТОВ КАССЕ</span>
            <ShieldAlert size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#f43f5e' }}>
            {debtTotal.toLocaleString()} сум
          </div>
          <div style={{ fontSize: '11px', color: '#f43f5e' }}>
            Неоплаченные заказы: {debtorOrders.length} шт
          </div>
        </div>

      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('salaries')}
          className="btn"
          style={{
            background: activeSubTab === 'salaries' ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontWeight: '800',
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '10px'
          }}
        >
          💼 Зарплаты & Авансы Персонала ({realStaffList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('advances')}
          className="btn"
          style={{
            background: activeSubTab === 'advances' ? '#f59e0b' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontWeight: '800',
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '10px'
          }}
        >
          💸 Журнал Частичных Выплат / Авансов ({salaryAdvances.length})
        </button>

        <button
          onClick={() => setActiveSubTab('debts')}
          className="btn"
          style={{
            background: activeSubTab === 'debts' ? '#f43f5e' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontWeight: '800',
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '10px'
          }}
        >
          🔴 Долги Клиентов по Заказам ({debtorOrders.length})
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className="btn"
          style={{
            background: activeSubTab === 'history' ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontWeight: '800',
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '10px'
          }}
        >
          🧾 Общий Кассовый Журнал ({transactions.length})
        </button>
      </div>

      {/* TAB 1: SALARIES & REAL STAFF ADVANCES OVERVIEW */}
      {activeSubTab === 'salaries' && (
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>
                👥 Реальные Сотрудники, Оклады и Расчет Доплаты
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Остаток к доплате вычисляется автоматически: Базовый оклад минус все выданные авансы за месяц
              </p>
            </div>

            <button
              onClick={() => {
                setAdvanceForm({
                  staffId: realStaffList[0]?.id || '',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  note: '',
                  method: 'Наличные'
                });
                setIsAdvanceModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ fontSize: '12.5px', padding: '8px 14px' }}
            >
              <Plus size={16} /> Выдать аванс сотруднику
            </button>
          </div>

          {/* Staff Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Сотрудник</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Роль</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Базовый Оклад (мес)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Выдано Авансов</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Осталось Доплатить</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Статус Выплаты</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {staffSalaryData.map((staff) => {
                  const badge = getRoleBadge(staff.role);
                  return (
                    <tr key={staff.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      {/* Name & Phone */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '14px' }}>{staff.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{staff.phone || '@' + staff.username}</div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                          {badge.text}
                        </span>
                      </td>

                      {/* Base Salary with Edit button */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ fontWeight: '900', color: '#ffffff', fontSize: '14px' }}>
                          {staff.baseSalary.toLocaleString()} сум
                        </div>
                        <button
                          onClick={() => {
                            setEditSalaryModalStaff(staff);
                            setNewBaseSalaryInput(staff.baseSalary.toString());
                          }}
                          className="btn"
                          style={{ fontSize: '10.5px', padding: '2px 6px', color: '#38bdf8', marginTop: '2px', background: 'transparent' }}
                        >
                          <Edit3 size={11} /> Изменить оклад
                        </button>
                      </td>

                      {/* Advances Paid */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: staff.totalAdvancesPaid > 0 ? '#facc15' : '#64748b' }}>
                          {staff.totalAdvancesPaid.toLocaleString()} сум
                        </div>
                        {staff.advancesCount > 0 && (
                          <button
                            onClick={() => setSelectedStaffHistory(staff)}
                            className="btn"
                            style={{ fontSize: '10.5px', padding: '2px 6px', color: '#facc15', marginTop: '2px', background: 'transparent' }}
                          >
                            📋 {staff.advancesCount} выплат(ы)
                          </button>
                        )}
                      </td>

                      {/* Balance Due (Остаток к доплате) */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: '900',
                          color: staff.balanceDue > 0 ? '#10b981' : '#64748b'
                        }}>
                          {staff.balanceDue.toLocaleString()} сум
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {staff.isFullyPaid ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                            ✅ Выплачено
                          </span>
                        ) : staff.isPartiallyPaid ? (
                          <span style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#facc15', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                            🟡 Выдан аванс
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
                            🔴 Ожидает
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setAdvanceForm({
                                staffId: staff.id,
                                amount: '',
                                date: new Date().toISOString().split('T')[0],
                                note: 'Аванс в середине месяца',
                                method: 'Наличные'
                              });
                              setIsAdvanceModalOpen(true);
                            }}
                            className="btn"
                            style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#facc15', border: '1px solid #facc15', fontSize: '11.5px', padding: '5px 10px', borderRadius: '8px', fontWeight: '700' }}
                            title="Выдать часть зарплаты (Аванс)"
                          >
                            + Аванс
                          </button>

                          {staff.balanceDue > 0 && (
                            <button
                              onClick={() => handlePayRemainingBalance(staff)}
                              className="btn btn-primary"
                              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontSize: '11.5px', padding: '5px 10px', borderRadius: '8px', fontWeight: '800' }}
                              title="Выплатить весь оставшийся долг по окладу"
                            >
                              ✅ Доплатить остаток
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ADVANCES JOURNAL (ЖУРНАЛ ЧАСТИЧНЫХ ВЫПЛАТ / АВАНСОВ) */}
      {activeSubTab === 'advances' && (
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>
                💸 Журнал Выданных Авансов Сотрудникам
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Полная история всех частичных выплат в середине месяца с датами, суммами и примечаниями
              </p>
            </div>

            <button
              onClick={() => {
                setAdvanceForm({
                  staffId: realStaffList[0]?.id || '',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  note: '',
                  method: 'Наличные'
                });
                setIsAdvanceModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ fontSize: '12.5px', padding: '8px 14px' }}
            >
              <Plus size={16} /> Записать новый аванс
            </button>
          </div>

          {salaryAdvances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
              В этом месяце еще не было выдачи авансов.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {salaryAdvances.map((adv) => (
                <div 
                  key={adv.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(250, 204, 21, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <DollarSign size={20} color="#facc15" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                        {adv.staffName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        📅 Дата: <strong>{adv.date}</strong> • Способ: <strong>{adv.method}</strong> • 💬 {adv.note}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#facc15' }}>
                        -{parseFloat(adv.amount).toLocaleString()} сум
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                        ID: {adv.id}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAdvance(adv.id)}
                      className="btn-icon"
                      style={{ color: '#f43f5e', padding: '6px' }}
                      title="Удалить запись об авансе"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER DEBTS */}
      {activeSubTab === 'debts' && (
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>
                🔴 Реестр Задолженностей Клиентов
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Заказы, по которым оплата получена не полностью
              </p>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                placeholder="Поиск по клиенту / телефону..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '32px', fontSize: '12.5px', padding: '6px 10px 6px 30px' }}
              />
            </div>
          </div>

          {debtorOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Все заказы оплачены! Долгов нет.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {debtorOrders.map(order => {
                const total = parseFloat(order.totalAmount || 0);
                const paid = parseFloat(order.paidAmount || 0);
                const debt = total - paid;

                return (
                  <div key={order.id} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#f43f5e', color: '#fff', fontSize: '11px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px' }}>
                          #{order.id}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{order.clientName}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>({order.phone || order.clientPhone})</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '3px' }}>
                        Адрес: {order.address} • Заказ: {order.serviceType || 'Чистка изделий'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: '#f43f5e' }}>
                          Долг: {debt.toLocaleString()} сум
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          (Оплачено {paid.toLocaleString()} из {total.toLocaleString()} сум)
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPaymentModalOrder(order);
                          setPayAmountInput(debt.toString());
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        💳 Внести оплату
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TRANSACTIONS HISTORY */}
      {activeSubTab === 'history' && (
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>
              🧾 Общий Кассовый Журнал Транзакций
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Приходы от клиентов и расходы на авансы / зарплаты
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {transactions.map(tx => (
              <div key={tx.id} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: tx.type === 'in' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {tx.type === 'in' ? <ArrowDownRight size={18} color="#10b981" /> : <ArrowUpRight size={18} color="#f43f5e" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#fff' }}>{tx.title}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {tx.date} • Способ: {tx.method}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '14.5px', fontWeight: '900', color: tx.type === 'in' ? '#10b981' : '#f43f5e' }}>
                  {tx.type === 'in' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()} сум
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ISSUE ADVANCE / PARTIAL SALARY PAYOUT */}
      {isAdvanceModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--bg-modal)',
            border: '1.5px solid #10b981',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="#10b981" />
                <h3 style={{ fontSize: '16.5px', fontWeight: '800', color: '#fff' }}>
                  Выдача Аванса / Частичной ЗП
                </h3>
              </div>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdvanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Select Employee */}
              <div className="input-group">
                <label className="input-label">Выберите Сотрудника *</label>
                <select 
                  value={advanceForm.staffId}
                  onChange={e => setAdvanceForm({ ...advanceForm, staffId: e.target.value })}
                  className="select-field"
                  required
                >
                  <option value="">-- Выберите из списка --</option>
                  {realStaffList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({getRoleBadge(st.role).text})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="input-group">
                <label className="input-label">Сумма выданного аванса (сум) *</label>
                <input 
                  type="number"
                  min="1000"
                  required
                  placeholder="Например: 1000000"
                  value={advanceForm.amount}
                  onChange={e => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '15px', fontWeight: '900', color: '#facc15' }}
                />
              </div>

              {/* Quick Amount Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[500000, 1000000, 1500000, 2000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAdvanceForm({ ...advanceForm, amount: val.toString() })}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    {(val / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>

              {/* Date & Payment Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Дата выдачи *</label>
                  <input 
                    type="date"
                    required
                    value={advanceForm.date}
                    onChange={e => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Способ выдачи</label>
                  <select 
                    value={advanceForm.method}
                    onChange={e => setAdvanceForm({ ...advanceForm, method: e.target.value })}
                    className="select-field"
                  >
                    <option value="Наличные">Наличные из кассы</option>
                    <option value="Click">Click перевод</option>
                    <option value="Payme">Payme перевод</option>
                    <option value="Банк">Банковский счет</option>
                  </select>
                </div>
              </div>

              {/* Note / Comment */}
              <div className="input-group">
                <label className="input-label">Примечание / Назначение</label>
                <textarea 
                  rows={2}
                  placeholder="Например: Аванс на личные нужды в середине месяца"
                  value={advanceForm.note}
                  onChange={e => setAdvanceForm({ ...advanceForm, note: e.target.value })}
                  className="textarea-field"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '12px', fontSize: '14px', fontWeight: '800', marginTop: '6px' }}
              >
                💸 Подтвердить и Вычесть из Зарплаты
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT BASE MONTHLY SALARY */}
      {editSalaryModalStaff && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '420px',
            background: 'var(--bg-modal)',
            border: '1.5px solid #38bdf8',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                ✏️ Установить Базовый Оклад
              </h3>
              <button onClick={() => setEditSalaryModalStaff(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }}>
              <div>👤 <strong>Сотрудник:</strong> {editSalaryModalStaff.name}</div>
              <div style={{ marginTop: '2px' }}>💼 <strong>Должность:</strong> {getRoleBadge(editSalaryModalStaff.role).text}</div>
            </div>

            <form onSubmit={handleSaveBaseSalary} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Базовая месячная зарплата (сум) *</label>
                <input 
                  type="number"
                  required
                  min="0"
                  value={newBaseSalaryInput}
                  onChange={e => setNewBaseSalaryInput(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '16px', fontWeight: '900', color: '#38bdf8' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '12px', fontWeight: '800' }}
              >
                💾 Сохранить новый оклад
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW STAFF ADVANCE HISTORY */}
      {selectedStaffHistory && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '500px',
            maxHeight: '85vh',
            overflowY: 'auto',
            background: 'var(--bg-modal)',
            border: '1.5px solid #facc15',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                  📋 История Выплат: {selectedStaffHistory.name}
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Базовый оклад: {selectedStaffHistory.baseSalary.toLocaleString()} сум
                </div>
              </div>
              <button onClick={() => setSelectedStaffHistory(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedStaffHistory.advances.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
                  Выплат авансов пока не производилось.
                </div>
              ) : (
                selectedStaffHistory.advances.map(adv => (
                  <div key={adv.id} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#facc15' }}>
                        -{parseFloat(adv.amount).toLocaleString()} сум
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        📅 {adv.date} • {adv.method} • {adv.note}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAdvance(adv.id)}
                      className="btn-icon"
                      style={{ color: '#f43f5e', padding: '4px' }}
                      title="Удалить выплату"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#fff' }}>
                Остаток к доплате: <strong style={{ color: '#10b981' }}>{selectedStaffHistory.balanceDue.toLocaleString()} сум</strong>
              </div>
              <button onClick={() => setSelectedStaffHistory(null)} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CUSTOMER DEBT PAYMENT */}
      {paymentModalOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '420px',
            background: 'var(--bg-modal)',
            border: '1.5px solid #f43f5e',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                💳 Внести Оплату по Заказу #{paymentModalOrder.id}
              </h3>
              <button onClick={() => setPaymentModalOrder(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '10px', fontSize: '13px' }}>
              <div>👤 <strong>Клиент:</strong> {paymentModalOrder.clientName}</div>
              <div style={{ marginTop: '2px', color: '#f43f5e' }}>
                🔴 <strong>Остаток долга:</strong> {((paymentModalOrder.totalAmount || 0) - (paymentModalOrder.paidAmount || 0)).toLocaleString()} сум
              </div>
            </div>

            <form onSubmit={handleConfirmPartialPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Вносимая сумма (сум) *</label>
                <input 
                  type="number"
                  required
                  min="1000"
                  value={payAmountInput}
                  onChange={e => setPayAmountInput(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '12px', fontWeight: '800' }}
              >
                ✅ Принять оплату в кассу
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
