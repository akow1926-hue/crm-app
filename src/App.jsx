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
import { syncOrderToGoogleSheets } from './services/googleSheetsService';
import { 
  requestNotificationPermission, 
  notifyCourierNewOrder, 
  notifyWasherNewItem, 
  notifyDispatcherStatusChange, 
  notifyAdminPayment 
} from './services/notificationService';
import { broadcastDataChange, subscribeToRealtimeSync } from './services/syncEngine';

export default function App() {
  // Auth Session State
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('cosmo_crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Persistent Orders & Clients (Clean Production State)
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('cosmo_crm_orders');
    const list = saved ? JSON.parse(saved) : initialOrders;
    return list.filter(o => !['1095', '1094', '1093', '1092', '1091', '1090'].includes(o.id));
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('cosmo_crm_clients');
    const list = saved ? JSON.parse(saved) : initialClients;
    return list.filter(c => !['C-101', 'C-102', 'C-103', 'C-104'].includes(c.id));
  });

  // Registered System Accounts
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('cosmo_crm_registered_users');
    return saved ? JSON.parse(saved) : [
      { id: 'USR-1', username: 'admin', pass: 'admin123', name: 'Администратор', role: 'admin', phone: '+998 90 123 45 67', status: 'active', createdDate: '2026-08-01 10:00' }
    ];
  });

  // Real-Time Cross-Device Sync Subscription
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeSync((event) => {
      if (event.type === 'registered_users' || event.type === 'users') {
        if (Array.isArray(event.payload)) setRegisteredUsers(event.payload);
      } else if (event.type === 'orders') {
        if (Array.isArray(event.payload)) setOrders(event.payload);
      } else if (event.type === 'clients') {
        if (Array.isArray(event.payload)) setClients(event.payload);
      }
    });
    return () => unsubscribe();
  }, []);

  const [logs, setLogs] = useState(initialLogs);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [presetOrderData, setPresetOrderData] = useState(null);

  // Handle Android Back Button
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const backHandler = CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });
      return () => {
        backHandler.then(h => h.remove());
      };
    }
  }, []);

  // Sync state & Broadcast real-time changes
  useEffect(() => {
    localStorage.setItem('cosmo_crm_orders', JSON.stringify(orders));
    broadcastDataChange('orders', orders);
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('cosmo_crm_clients', JSON.stringify(clients));
    broadcastDataChange('clients', clients);
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('cosmo_crm_registered_users', JSON.stringify(registeredUsers));
    broadcastDataChange('registered_users', registeredUsers);
  }, [registeredUsers]);

  const handleRegisterUser = (newUser) => {
    setRegisteredUsers(prev => {
      const updated = [newUser, ...prev];
      broadcastDataChange('registered_users', updated);
      return updated;
    });
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
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
      setCurrentUser(null);
    }
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

    // Online real-time sync to Google Sheets
    syncOrderToGoogleSheets(savedOrder);

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

  // Dedicated Window based on User Role:
  // 1. Courier Portal (Отдельный мобильный кабинет Курьера)
  if (currentUser.role === 'courier') {
    return (
      <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '16px 12px 30px 12px' }}>
        <CourierPortal 
          orders={orders} 
          setOrders={setOrders} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />
      </div>
    );
  }

  // 2. Washer Portal (Отдельный кабинет Оператора стирки)
  if (currentUser.role === 'washer') {
    return (
      <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '16px 12px 30px 12px' }}>
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
