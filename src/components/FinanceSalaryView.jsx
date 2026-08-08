import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { staffMembers } from '../data/initialData';

export default function FinanceSalaryView({ orders, setOrders, setSelectedOrder }) {
  const [activeSubTab, setActiveSubTab] = useState('debts'); // 'debts', 'salaries', 'history'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment Modal State
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [payAmountInput, setPayAmountInput] = useState('');
  
  // Salary Payout Modal State
  const [payoutStaffModal, setPayoutStaffModal] = useState(null);
  const [payoutAmountInput, setPayoutAmountInput] = useState('');

  // Local Transactions History State
  const [transactions, setTransactions] = useState([
    { id: 'TX-101', type: 'in', title: 'Оплата за заказ #1094 (Шахло Исмаилова)', amount: 180000, date: '2026-08-06 12:15', method: 'Payme' },
    { id: 'TX-102', type: 'out', title: 'Выплата ЗП курьеру Алишер Рахимов', amount: 140000, date: '2026-08-05 17:30', method: 'Наличность' },
    { id: 'TX-103', type: 'in', title: 'Частичная предоплата по заказу #1093', amount: 200000, date: '2026-08-05 18:00', method: 'Click' }
  ]);

  // Track salary payouts per staff
  const [staffPayouts, setStaffPayouts] = useState({
    'ST-1': 250000, // Fully paid
    'ST-2': 0,      // Unpaid
    'ST-3': 0,      // Unpaid
    'ST-4': 100000, // Partial
    'ST-5': 0       // Unpaid
  });

  // Calculate totals
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const paidRevenue = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const debtTotal = Math.max(0, totalRevenue - paidRevenue);

  // Unpaid or partially paid orders
  const debtorOrders = orders.filter(o => {
    const debt = (o.totalAmount || 0) - (o.paidAmount || 0);
    const matchesSearch = !searchQuery || 
      o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.id.includes(searchQuery) ||
      o.phone.includes(searchQuery);
    return debt > 0 && matchesSearch;
  });

  // Handle Full Debt Settlement
  const handleSettleFullDebt = (order) => {
    const remainingDebt = order.totalAmount - order.paidAmount;
    if (window.confirm(`Погасить полный долг ${remainingDebt.toLocaleString()} сум по заказу #${order.id} (${order.clientName})?`)) {
      const updatedOrders = orders.map(o => {
        if (o.id === order.id) {
          return {
            ...o,
            paidAmount: o.totalAmount,
            paymentStatus: 'paid'
          };
        }
        return o;
      });
      setOrders(updatedOrders);

      // Record transaction
      const transObj = {
        id: `TX-${Date.now()}`,
        type: 'in',
        title: `Полное погашение долга за заказ #${order.id} (${order.clientName})`,
        amount: remainingDebt,
        date: new Date().toLocaleString('ru-RU'),
        method: 'Касса CRM',
        orderId: order.id,
        client: order.clientName,
        courier: order.assignedCourier || 'Касса'
      };

      setTransactions([transObj, ...transactions]);

      alert(`✅ Долг по заказу #${order.id} успешно погашен!`);
    }
  };

  // Handle Partial Custom Payment
  const handleConfirmPartialPayment = (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmountInput);
    if (!amount || amount <= 0) {
      alert('Введите корректную сумму оплаты.');
      return;
    }

    const remainingDebt = paymentModalOrder.totalAmount - paymentModalOrder.paidAmount;
    const actualPay = Math.min(amount, remainingDebt);
    const newPaidTotal = paymentModalOrder.paidAmount + actualPay;
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

    // Record transaction
    const transObj = {
      id: `TX-${Date.now()}`,
      type: 'in',
      title: `Оплата по заказу #${paymentModalOrder.id} (${paymentModalOrder.clientName})`,
      amount: actualPay,
      date: new Date().toLocaleString('ru-RU'),
      method: 'Касса CRM',
      orderId: paymentModalOrder.id,
      client: paymentModalOrder.clientName,
      courier: paymentModalOrder.assignedCourier || 'Касса'
    };

    setTransactions([transObj, ...transactions]);
    syncFinanceToGoogleSheets(transObj).catch(() => {});

    setPaymentModalOrder(null);
    setPayAmountInput('');
    alert(`💳 Внесена оплата ${actualPay.toLocaleString()} сум по заказу #${paymentModalOrder.id}!`);
  };

  // Handle Staff Salary Payout
  const handleConfirmStaffPayout = (e) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmountInput);
    if (!amount || amount <= 0) {
      alert('Введите корректную сумму выплаты.');
      return;
    }

    const currentPaid = staffPayouts[payoutStaffModal.id] || 0;
    setStaffPayouts({
      ...staffPayouts,
      [payoutStaffModal.id]: currentPaid + amount
    });

    const payoutTrans = {
      id: `TX-${Date.now()}`,
      type: 'out',
      title: `Выплата зарплаты сотруднику ${payoutStaffModal.name} (${payoutStaffModal.role})`,
      amount: amount,
      date: new Date().toLocaleString('ru-RU'),
      method: 'Наличность',
      courier: payoutStaffModal.name
    };

    setTransactions([payoutTrans, ...transactions]);
    syncFinanceToGoogleSheets(payoutTrans).catch(() => {});

    setPayoutStaffModal(null);
    setPayoutAmountInput('');
    alert(`💸 Выплата ${amount.toLocaleString()} сум сотруднику ${payoutStaffModal.name} успешно проведена!`);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-new" style={{ fontSize: '11px' }}>
              <Wallet size={12} /> Финансовый Кабинет CRM
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
            Управление долгами клиентов и выплатами зарплаты
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Принимайте оплату задолженностей, проводите выплаты комиссий сотрудникам и отслеживайте кассу.
          </p>
        </div>
      </div>

      {/* Top Financial KPI Summary Cards */}
      <div className="responsive-grid-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Общий Оборот Заказов</div>
            <div style={{ fontSize: '20px', fontWeight: '800' }}>{totalRevenue.toLocaleString()} сум</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Поступило в Кассу</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{paidRevenue.toLocaleString()} сум</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={24} color="#f43f5e" />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Долги Клиентов (Неоплачено)</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#f43f5e' }}>{debtTotal.toLocaleString()} сум</div>
          </div>
        </div>
      </div>

      {/* Interactive Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveSubTab('debts')}
          className={`btn ${activeSubTab === 'debts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <CreditCard size={15} /> 🔴 Долги Клиентов ({debtorOrders.length})
        </button>

        <button
          onClick={() => setActiveSubTab('salaries')}
          className={`btn ${activeSubTab === 'salaries' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <UserCheck size={15} /> 🎖️ Выплаты Зарплаты Персоналу
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`btn ${activeSubTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Receipt size={15} /> 🧾 Кассовые Транзакции ({transactions.length})
        </button>
      </div>

      {/* TAB 1: CLIENT DEBTS MANAGEMENT */}
      {activeSubTab === 'debts' && (
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>🔴 Реестр Задолженностей Клиентов</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Вносите частичную или полную оплату по долгам</p>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Поиск по клиенту или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '32px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {debtorOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Все задолженности погашены!</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>В базе нет клиентам с открытым долгом.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>№ Заказа</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Клиент & Телефон</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Сумма Заказа</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Внесено</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Остаток Долга</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Действия Оплаты</th>
                  </tr>
                </thead>
                <tbody>
                  {debtorOrders.map((order) => {
                    const remainingDebt = order.totalAmount - order.paidAmount;
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px' }}>
                          <button 
                            onClick={() => setSelectedOrder && setSelectedOrder(order)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            #{order.id} <ExternalLink size={12} />
                          </button>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '700', color: '#fff' }}>{order.clientName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{order.phone}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                          {order.totalAmount.toLocaleString()} сум
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                          {order.paidAmount.toLocaleString()} сум
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: '#f43f5e' }}>
                          {remainingDebt.toLocaleString()} сум
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setPaymentModalOrder(order);
                                setPayAmountInput(remainingDebt.toString());
                              }}
                              className="btn btn-secondary"
                              style={{ fontSize: '11px', padding: '5px 10px' }}
                            >
                              <CreditCard size={13} /> Частично
                            </button>

                            <button
                              onClick={() => handleSettleFullDebt(order)}
                              className="btn btn-primary"
                              style={{ fontSize: '11px', padding: '5px 10px', background: '#10b981', borderColor: '#10b981' }}
                            >
                              <CheckCircle2 size={13} /> Погасить Полностью
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STAFF SALARY PAYROLL & PAYOUTS */}
      {activeSubTab === 'salaries' && (
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>🎖️ Расчет и Выплата Зарплаты Персоналу</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Начисляйте комиссии за заказы и выдавайте зарплату сотрудникам</p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Сотрудник</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Роль</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Заказов в работе</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Заработано (Всего)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Выплачено</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>К Выплате (Баланс)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((staff) => {
                  const calculatedEarnings = staff.role === 'Courier' ? staff.activeOrders * 35000 : staff.role === 'Washer' ? staff.activeOrders * 45000 : 250000;
                  const paidSoFar = staffPayouts[staff.id] || 0;
                  const balanceDue = Math.max(0, calculatedEarnings - paidSoFar);

                  return (
                    <tr key={staff.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '700', color: '#fff' }}>{staff.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{staff.phone}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-ready">{staff.role}</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>
                        {staff.activeOrders} зак.
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#fff' }}>
                        {calculatedEarnings.toLocaleString()} сум
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                        {paidSoFar.toLocaleString()} сум
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: balanceDue > 0 ? '#fbbf24' : '#10b981' }}>
                        {balanceDue.toLocaleString()} сум
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setPayoutStaffModal(staff);
                            setPayoutAmountInput(balanceDue > 0 ? balanceDue.toString() : '50000');
                          }}
                          className="btn btn-primary"
                          style={{ fontSize: '11px', padding: '5px 12px' }}
                        >
                          <DollarSign size={13} /> Выплатить ЗП
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTION HISTORY LOG */}
      {activeSubTab === 'history' && (
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>🧾 Журнал Кассовых Операций</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Все приходы по заказам и расходы на выдачу ЗП</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: tx.type === 'in' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {tx.type === 'in' ? <ArrowDownRight size={20} color="#10b981" /> : <ArrowUpRight size={20} color="#f43f5e" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#fff' }}>{tx.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {tx.date} • Метод: {tx.method} • Чек: {tx.id}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '15px', fontWeight: '800', color: tx.type === 'in' ? '#10b981' : '#f43f5e' }}>
                  {tx.type === 'in' ? '+' : '-'}{tx.amount.toLocaleString()} сум
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: PARTIAL DEBT PAYMENT */}
      {paymentModalOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', background: 'var(--bg-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>💳 Внести Оплату по Долгу</h3>
              <button onClick={() => setPaymentModalOrder(null)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>Заказ #{paymentModalOrder.id} — {paymentModalOrder.clientName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Общий долг: <strong style={{ color: '#f43f5e' }}>{(paymentModalOrder.totalAmount - paymentModalOrder.paidAmount).toLocaleString()} сум</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmPartialPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Сумма вносимой оплаты (сум) *</label>
                <input 
                  type="number"
                  required
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  className="input-field"
                  placeholder="Например: 100000"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setPaymentModalOrder(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#10b981', borderColor: '#10b981' }}>
                  <Check size={16} /> Провести Оплату
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STAFF SALARY PAYOUT */}
      {payoutStaffModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', background: 'var(--bg-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>💸 Выплата Зарплаты Сотруднику</h3>
              <button onClick={() => setPayoutStaffModal(null)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>{payoutStaffModal.name} ({payoutStaffModal.role})</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Телефон: {payoutStaffModal.phone}
              </div>
            </div>

            <form onSubmit={handleConfirmStaffPayout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Сумма выплаты из кассы (сум) *</label>
                <input 
                  type="number"
                  required
                  value={payoutAmountInput}
                  onChange={(e) => setPayoutAmountInput(e.target.value)}
                  className="input-field"
                  placeholder="Например: 140000"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setPayoutStaffModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Check size={16} /> Выплатить из Кассы
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
