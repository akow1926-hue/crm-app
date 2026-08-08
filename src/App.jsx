import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import DashboardView from './components/DashboardView';
import AnalyticsView from './components/AnalyticsView';
import KanbanView from './components/KanbanView';
import OrdersTableView from './components/OrdersTableView';
import ClientsView from './components/ClientsView';
import CalculatorView from './components/CalculatorView';
import FinanceSalaryView from './components/FinanceSalaryView';
import SMSManagementView from './components/SMSManagementView';
import AdminCardView from './components/AdminCardView';
import ServicesCatalogView from './components/ServicesCatalogView';
import YandexLogisticsMap from './components/YandexLogisticsMap';
import OrderModal from './components/OrderModal';
import NotificationDrawer from './components/NotificationDrawer';
import AuthModal from './components/AuthModal';

// Dedicated Role Workspace Portals
import CourierPortal from './components/roles/CourierPortal';
import DispatcherPortal from './components/roles/DispatcherPortal';
import WasherPortal from './components/roles/WasherPortal';

import { initialOrders, initialClients, activityLogs as initialLogs } from './data/initialData';
import { triggerAutoSMSForOrder } from './services/smsService';
import { 
  requestNotificationPermission, 
  notifyCourierNewOrder, 
  notifyWasherNewItem, 
  notifyDispatcherStatusChange, 
  notifyAdminPayment 
} from './services/notificationService';
import { 
  getSupabaseOrders, 
  saveSupabaseOrder, 
  deleteSupabaseOrder, 
  getSupabaseUsers, 
  saveSupabaseUser, 
  deleteSupabaseUser,
  getSupabaseClients, 
  saveSupabaseClient, 
  deleteSupabaseClient,
  subscribeToSupabaseRealtime 
} from './services/supabaseService';
import { flushOfflineQueue, enqueueOfflineMutation } from './services/offlineQueue';

export default function App() {
  // Auth Session State
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('cosmo_crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDbConnected, setIsDbConnected] = useState(true);

  // UI Modals & Drawers State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [presetOrderData, setPresetOrderData] = useState(null);

  // Production State strictly driven by Supabase Postgres DB
  const [orders, setOrdersState] = useState([]);
  const [clients, setClientsState] = useState([]);
  const [logs, setLogs] = useState(initialLogs);
  const [registeredUsers, setRegisteredUsersState] = useState([
    { id: 'USR-1', username: 'admin', pass: 'admin123', name: 'Администратор', role: 'admin', phone: '+998 90 123 45 67', status: 'active', createdDate: '2026-08-01 10:00' }
  ]);

  // Wrapper for setOrders that updates local state and syncs directly to Supabase DB
  const setOrders = (updater) => {
    setOrdersState(prevOrders => {
      const nextOrders = typeof updater === 'function' ? updater(prevOrders) : updater;

      // 1. Identify deleted orders and remove them from Supabase DB
      prevOrders.forEach(prevOrder => {
        const stillExists = nextOrders.some(n => String(n.id) === String(prevOrder.id));
        if (!stillExists) {
          deleteSupabaseOrder(prevOrder.id);
        }
      });

      // 2. Identify modified or new orders and persist to Supabase DB
      nextOrders.forEach(nextOrder => {
        const prevOrder = prevOrders.find(o => String(o.id) === String(nextOrder.id));
        if (!prevOrder || JSON.stringify(prevOrder) !== JSON.stringify(nextOrder)) {
          saveSupabaseOrder(nextOrder);
        }
      });
      return nextOrders;
    });
  };

  const setClients = (updater) => {
    setClientsState(prevClients => {
      const nextClients = typeof updater === 'function' ? updater(prevClients) : updater;

      // 1. Identify deleted clients
      prevClients.forEach(prevClient => {
        const stillExists = nextClients.some(c => String(c.id) === String(prevClient.id));
        if (!stillExists) {
          deleteSupabaseClient(prevClient.id);
        }
      });

      // 2. Identify modified or new clients
      nextClients.forEach(nextClient => {
        const prevClient = prevClients.find(c => String(c.id) === String(nextClient.id));
        if (!prevClient || JSON.stringify(prevClient) !== JSON.stringify(nextClient)) {
          saveSupabaseClient(nextClient);
        }
      });
      return nextClients;
    });
  };

  const setRegisteredUsers = (updater) => {
    setRegisteredUsersState(prevUsers => {
      const nextUsers = typeof updater === 'function' ? updater(prevUsers) : updater;

      // 1. Identify deleted users
      prevUsers.forEach(prevUser => {
        const stillExists = nextUsers.some(u => String(u.id) === String(prevUser.id) || u.username === prevUser.username);
        if (!stillExists) {
          deleteSupabaseUser(prevUser.id);
        }
      });

      // 2. Identify modified or new users
      nextUsers.forEach(newUser => {
        const prevUser = prevUsers.find(u => String(u.id) === String(newUser.id) || u.username === newUser.username);
        if (!prevUser || JSON.stringify(prevUser) !== JSON.stringify(newUser)) {
          saveSupabaseUser(newUser);
        }
      });
      return nextUsers;
    });
  };

  // Initial & Continuous Data Fetch from Spacebase / Supabase DB
  const loadSupabaseData = async () => {
    try {
      flushOfflineQueue().catch(() => {});

      const [dbOrders, dbUsers, dbClients] = await Promise.all([
        getSupabaseOrders(),
        getSupabaseUsers(),
        getSupabaseClients()
      ]);

      let hasSuccess = false;

      if (Array.isArray(dbOrders)) {
        setOrdersState(dbOrders);
        hasSuccess = true;
      }
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        setRegisteredUsersState(dbUsers);
        hasSuccess = true;
      }
      if (Array.isArray(dbClients)) {
        setClientsState(dbClients);
        hasSuccess = true;
      }

      setIsDbConnected(hasSuccess);
    } catch (e) {
      console.error('Spacebase / Supabase sync error:', e);
      setIsDbConnected(false);
    }
  };

  useEffect(() => {
    // 1. Load primary state from Supabase Postgres DB
    loadSupabaseData();

    // 2. Subscribe to Supabase Realtime Postgres Changes for instant multi-device updates
    const unsubscribeSupabase = subscribeToSupabaseRealtime((payload) => {
      loadSupabaseData();
    });

    // 3. Periodic 4-second heartbeat sync for Android APK stability over mobile networks
    const pollInterval = setInterval(() => {
      loadSupabaseData();
    }, 4000);

    return () => {
      if (unsubscribeSupabase) unsubscribeSupabase();
      clearInterval(pollInterval);
    };
  }, []);

  const handleRegisterUser = (newUser) => {
    setRegisteredUsers(prev => [newUser, ...prev]);
    saveSupabaseUser(newUser);
    setLogs(prev => [{ id: Date.now(), text: `Поступила новая заявка на регистрацию: ${newUser.name} (${newUser.username})`, time: 'Только что', type: 'system' }, ...prev]);
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cosmo_crm_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cosmo_crm_user');
    }
  }, [currentUser]);

  // Keyboard hotkey Ctrl + K for search focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = (userSession) => {
    setCurrentUser(userSession);
  };

  const handleLogout = () => {
    localStorage.removeItem('cosmo_crm_user');
    setCurrentUser(null);
  };

  // Request Push Notification permissions on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleSaveOrder = (savedOrder) => {
    const existingOrder = orders.find(o => o.id === savedOrder.id);
    const prevStatus = existingOrder?.status;
    const prevPaymentStatus = existingOrder?.paymentStatus;

    if (existingOrder) {
      setOrders(orders.map(o => o.id === savedOrder.id ? savedOrder : o));
    } else {
      setOrders([savedOrder, ...orders]);
      setLogs([{ id: Date.now(), text: `Создан новый заказ #${savedOrder.id} (${savedOrder.clientName})`, time: 'Только что', type: 'system' }, ...logs]);
      // Push notification to Courier
      notifyCourierNewOrder(savedOrder);
    }

    // Direct save to Supabase Postgres DB
    saveSupabaseOrder(savedOrder);

    // Status change push notifications
    if (prevStatus !== savedOrder.status) {
      notifyDispatcherStatusChange(savedOrder, savedOrder.status);
      if (savedOrder.status === 'cleaning') {
        notifyWasherNewItem(savedOrder);
      }
    }

    // Payment push notification to Admin
    if (savedOrder.paymentStatus === 'paid' && prevPaymentStatus !== 'paid') {
      notifyAdminPayment(savedOrder, savedOrder.paidAmount || savedOrder.totalAmount);
    }

    // Trigger auto SMS dispatcher if conditions match
    triggerAutoSMSForOrder(savedOrder, prevStatus, prevPaymentStatus);

    // Direct save to Supabase Postgres DB is handled inside setOrders & saveSupabaseOrder

    setSelectedOrder(null);
    setIsNewOrderModalOpen(false);
    setPresetOrderData(null);
  };

  const handleOpenCalculatorPreset = (preset) => {
    setPresetOrderData(preset);
    setIsNewOrderModalOpen(true);
  };

  // If not logged in -> Show Authentication / Registration Screen
  if (!currentUser) {
    return <AuthModal onLogin={handleLogin} registeredUsers={registeredUsers} onRegisterUser={handleRegisterUser} />;
  }

  const OfflineBanner = () => !isDbConnected ? (
    <div style={{
      background: 'rgba(244, 63, 94, 0.25)',
      border: '1px solid #f43f5e',
      color: '#f87171',
      padding: '12px 16px',
      borderRadius: '10px',
      marginBottom: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '13px',
      fontWeight: '600'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>⚠️</span>
        <span>Нет подключения к Интернету или базе данных Spacebase (Supabase). Приложение работает только с онлайн базой данных!</span>
      </div>
      <button 
        onClick={loadSupabaseData} 
        style={{
          background: '#f43f5e',
          color: '#fff',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          cursor: 'pointer',
          fontWeight: '700'
        }}
      >
        Повторить
      </button>
    </div>
  ) : null;

  // Dedicated Window based on User Role:
  // 1. Courier Portal (Отдельный мобильный кабинет Курьера)
  if (currentUser.role === 'courier') {
    return (
      <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '16px 12px 30px 12px' }}>
        <OfflineBanner />
        <CourierPortal 
          orders={orders} 
          setOrders={setOrders} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          registeredUsers={registeredUsers}
        />
      </div>
    );
  }

  // 2. Washer Portal (Отдельный кабинет Оператора стирки)
  if (currentUser.role === 'washer') {
    return (
      <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '16px 12px 30px 12px' }}>
        <OfflineBanner />
        <WasherPortal 
          orders={orders} 
          setOrders={setOrders} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />
      </div>
    );
  }

  // 3. Dispatcher Portal (Отдельный кабинет Диспетчера)
  if (currentUser.role === 'dispatcher') {
    return (
      <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '16px 12px 30px 12px' }}>
        <OfflineBanner />
        <DispatcherPortal 
          orders={orders} 
          setOrders={setOrders} 
          setSelectedOrder={setSelectedOrder}
          onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
          currentUser={currentUser} 
          onLogout={handleLogout} 
          registeredUsers={registeredUsers}
        />
        {(selectedOrder || isNewOrderModalOpen) && (
          <OrderModal 
            order={presetOrderData ? { ...presetOrderData, id: `${Math.floor(1096 + Math.random() * 100)}`, clientName: '', phone: '+998 ', status: 'new', paymentStatus: 'unpaid' } : selectedOrder}
            onClose={() => { setSelectedOrder(null); setIsNewOrderModalOpen(false); setPresetOrderData(null); }}
            onSave={handleSaveOrder}
            registeredUsers={registeredUsers}
          />
        )}
      </div>
    );
  }

  // 4. Admin Portal (Главный полнофункциональный интерфейс)
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      {/* Main Container */}
      <div className="main-content">
        <Navbar 
          onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          notificationsCount={logs.length}
          onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="page-wrapper">
          <OfflineBanner />
          {activeTab === 'dashboard' && (
            <DashboardView 
              orders={orders} 
              clients={clients} 
              activityLogs={logs}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
              setActiveTab={setActiveTab}
              setSelectedOrder={setSelectedOrder}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView 
              orders={orders} 
              clients={clients} 
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanView 
              orders={orders} 
              setOrders={setOrders} 
              setSelectedOrder={setSelectedOrder}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            />
          )}

          {activeTab === 'ordersTable' && (
            <OrdersTableView 
              orders={orders} 
              setOrders={setOrders} 
              setSelectedOrder={setSelectedOrder}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'yandexMap' && (
            <YandexLogisticsMap 
              orders={orders}
              setOrders={setOrders}
              setSelectedOrder={setSelectedOrder}
              registeredUsers={registeredUsers}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView 
              clients={clients} 
              setClients={setClients} 
              searchQuery={searchQuery}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            />
          )}

          {activeTab === 'calculator' && (
            <CalculatorView 
              onOpenNewOrderWithPreset={handleOpenCalculatorPreset}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceSalaryView 
              orders={orders} 
              setOrders={setOrders}
              setSelectedOrder={setSelectedOrder}
            />
          )}

          {activeTab === 'smsControl' && (
            <SMSManagementView />
          )}

          {activeTab === 'adminCard' && (
            <AdminCardView 
              orders={orders}
              setOrders={setOrders}
              clients={clients}
              currentUser={currentUser}
              registeredUsers={registeredUsers}
              setRegisteredUsers={setRegisteredUsers}
            />
          )}

          {activeTab === 'servicesCatalog' && (
            <ServicesCatalogView />
          )}
        </main>
      </div>

      {/* Mobile Phone Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={currentUser?.role} 
      />

      {/* Modals & Slide-overs */}
      {(selectedOrder || isNewOrderModalOpen) && (
        <OrderModal 
          order={presetOrderData ? { ...presetOrderData, id: `${Math.floor(1096 + Math.random() * 100)}`, clientName: '', phone: '+998 ', status: 'new', paymentStatus: 'unpaid' } : selectedOrder}
          onClose={() => { setSelectedOrder(null); setIsNewOrderModalOpen(false); setPresetOrderData(null); }}
          onSave={handleSaveOrder}
          registeredUsers={registeredUsers}
        />
      )}

      <NotificationDrawer 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        logs={logs}
        orders={orders}
        setSelectedOrder={setSelectedOrder}
      />
    </div>
  );
}
