import React, { useState, useEffect, lazy, Suspense } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import OrdersTableView from './components/OrdersTableView';
import ClientsView from './components/ClientsView';
import CalculatorView from './components/CalculatorView';
import SMSManagementView from './components/SMSManagementView';
import OrderModal from './components/OrderModal';
import NotificationDrawer from './components/NotificationDrawer';
import MobileDrawer from './components/MobileDrawer';
import ClientTrackingPortal from './components/ClientTrackingPortal';
import QRReceiptModal from './components/QRReceiptModal';
import AuthModal from './components/AuthModal';

// Lazy-loaded heavy views for code-splitting & fast mobile startup
const AnalyticsView = lazy(() => import('./components/AnalyticsView'));
const FinanceSalaryView = lazy(() => import('./components/FinanceSalaryView'));
const AdminCardView = lazy(() => import('./components/AdminCardView'));
const ServicesCatalogView = lazy(() => import('./components/ServicesCatalogView'));
const YandexLogisticsMap = lazy(() => import('./components/YandexLogisticsMap'));
const ArchivedOrdersView = lazy(() => import('./components/ArchivedOrdersView'));

// Dedicated Role Workspace Portals (Lazy Loaded)
const CourierPortal = lazy(() => import('./components/roles/CourierPortal'));
const DispatcherPortal = lazy(() => import('./components/roles/DispatcherPortal'));
const WasherPortal = lazy(() => import('./components/roles/WasherPortal'));

import { activityLogs as initialLogs, initialClients } from './data/initialData';
import { triggerAutoSMSForOrder } from './services/smsService';
import { 
  requestNotificationPermission, 
  notifyCourierNewOrder, 
  notifyWasherNewItem, 
  notifyDispatcherStatusChange, 
  notifyAdminPayment,
  checkOverdueOrders
} from './services/notificationService';
import { 
  notifyOrderCreated, 
  notifyOrderPickup, 
  notifyOrderReady, 
  notifyOrderCompleted,
  saveTelegramBotConfig
} from './services/telegramBotService';
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
import { flushOfflineQueue } from './services/offlineQueue';
import { fetchInitialServerState, subscribeToRealtimeSync, broadcastDataChange } from './services/syncEngine';

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
    <div style={{ fontSize: '14px', fontWeight: '600' }}>Загрузка модуля...</div>
  </div>
);

const OfflineBanner = ({ isDbConnected, onRetry }) => !isDbConnected ? (
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
      <span>Нет подключения к Интернету или базе данных. Приложение работает только с онлайн базой данных!</span>
    </div>
    <button 
      onClick={onRetry} 
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

export default function App() {
  // Auth Session State
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('cosmo_crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('cosmo_crm_theme');
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cosmo_crm_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDbConnected, setIsDbConnected] = useState(true);

  // UI Modals & Drawers State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [qrModalOrder, setQrModalOrder] = useState(null);
  const [presetOrderData, setPresetOrderData] = useState(null);

  // Public Online Tracking Route (?track=1054 or #track-1054)
  const [publicTrackingOrderId, setPublicTrackingOrderId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get('track');
    if (trackParam) return trackParam;
    const hash = window.location.hash;
    if (hash && hash.startsWith('#track-')) {
      return hash.replace('#track-', '');
    }
    return null;
  });

  // Production State strictly driven by Supabase Postgres DB with LocalStorage Fallback Cache
  const [orders, setOrdersState] = useState(() => {
    try {
      const saved = localStorage.getItem('cosmo_crm_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [clients, setClientsState] = useState(initialClients || []);
  const [logs, setLogs] = useState(initialLogs || []);
  const [registeredUsers, setRegisteredUsersState] = useState(() => {
    try {
      const saved = localStorage.getItem('cosmo_crm_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 'USR-1', username: 'admin', pass: 'admin123', name: 'Акобир (Администратор)', role: 'admin', phone: '+998 90 123 45 67', status: 'active', baseSalary: 6000000, createdDate: '2026-08-01 10:00' },
      { id: 'USR-2', username: 'courier1', pass: 'pass123', name: 'Акобир (Курьер)', role: 'courier', phone: '+998 90 777 88 99', status: 'active', baseSalary: 4500000, createdDate: '2026-08-01 10:00' },
      { id: 'USR-3', username: 'washer1', pass: 'pass123', name: 'Бобир (Мастер цеха)', role: 'washer', phone: '+998 93 333 22 11', status: 'active', baseSalary: 4000000, createdDate: '2026-08-01 10:00' },
      { id: 'USR-4', username: 'dispatcher1', pass: 'pass123', name: 'Мадина (Диспетчер)', role: 'dispatcher', phone: '+998 91 555 44 33', status: 'active', baseSalary: 3500000, createdDate: '2026-08-01 10:00' }
    ];
  });

  // Auto-sync clients database whenever orders are updated or completed!
  const syncClientsFromOrders = (allOrders) => {
    setClientsState(prevClients => {
      let updatedClients = [...prevClients];

      allOrders.forEach(ord => {
        const phoneNorm = String(ord.clientPhone || ord.phone || '').trim();
        if (!phoneNorm || phoneNorm === '+998') return;

        const existingIndex = updatedClients.findIndex(c => 
          String(c.phone || '').replace(/\s+/g, '') === phoneNorm.replace(/\s+/g, '') ||
          (c.name && ord.clientName && c.name.toLowerCase().trim() === ord.clientName.toLowerCase().trim())
        );

        const ordAmount = parseFloat(ord.totalAmount || ord.agreedAmount || 0);

        const orderRecord = {
          id: ord.id,
          date: ord.createdDate || new Date().toISOString().split('T')[0],
          status: ord.status,
          amount: ordAmount,
          itemsCount: ord.itemsCount || ord.items?.length || 1
        };

        if (existingIndex >= 0) {
          const existing = updatedClients[existingIndex];
          const history = existing.orderHistory || [];
          const hasOrderInHistory = history.some(h => String(h.id) === String(ord.id));

          const newHistory = hasOrderInHistory 
            ? history.map(h => String(h.id) === String(ord.id) ? orderRecord : h)
            : [...history, orderRecord];

          const clientOrders = allOrders.filter(o => 
            String(o.clientPhone || o.phone || '').replace(/\s+/g, '') === phoneNorm.replace(/\s+/g, '') ||
            (o.clientName && existing.name && o.clientName.toLowerCase().trim() === existing.name.toLowerCase().trim())
          );

          const totalOrdersCount = clientOrders.length;
          const totalLtv = clientOrders.reduce((sum, o) => {
            const paid = parseFloat(o.paidAmount !== undefined ? o.paidAmount : (o.paymentStatus === 'paid' ? (o.totalAmount || 0) : 0)) || 0;
            return sum + paid;
          }, 0);

          let tier = 'Standard';
          let discountPercent = 0;
          if (totalOrdersCount >= 5 || totalLtv >= 500000) {
            tier = 'VIP';
            discountPercent = 10;
          } else if (totalOrdersCount >= 2) {
            tier = 'Premier';
            discountPercent = 5;
          }

          updatedClients[existingIndex] = {
            ...existing,
            name: ord.clientName || existing.name,
            phone: ord.clientPhone || ord.phone || existing.phone,
            address: ord.address || existing.address,
            district: ord.district || existing.district || '',
            landmark: ord.landmark || existing.landmark || '',
            language: ord.language || existing.language || 'Русский',
            totalOrders: totalOrdersCount,
            ltv: totalLtv,
            tier: tier,
            discountPercent: discountPercent,
            orderHistory: newHistory
          };
        } else {
          // Create new client in CRM database automatically!
          const newClientObj = {
            id: `C-${Math.floor(1000 + Math.random() * 9000)}`,
            name: ord.clientName || 'Новый клиент',
            phone: phoneNorm,
            address: ord.address || 'Самарканд',
            district: ord.district || 'Сиёб',
            landmark: ord.landmark || '',
            language: ord.language || 'Русский',
            totalOrders: 1,
            ltv: ordAmount,
            tier: 'Standard',
            discountPercent: 0,
            notes: `Автоматически создан по заказу #${ord.id}`,
            orderHistory: [orderRecord]
          };
          updatedClients.push(newClientObj);
          saveSupabaseClient(newClientObj);
        }
      });

      return updatedClients;
    });
  };

  // Explicit order deletion function
  const deleteOrder = (orderId) => {
    if (!orderId) return;
    setOrdersState(prev => prev.filter(o => 
      String(o.id) !== String(orderId) && String(o.tempId) !== String(orderId)
    ));
    deleteSupabaseOrder(orderId);
  };

  // Wrapper for setOrders that updates local state and syncs modified/new/deleted items directly to Supabase DB
  const setOrders = (updater) => {
    setOrdersState(prevOrders => {
      const nextOrders = typeof updater === 'function' ? updater(prevOrders) : updater;

      // 1. Identify deleted orders and remove from DB
      prevOrders.forEach(prevOrder => {
        const stillExists = nextOrders.some(o => 
          (o.id && prevOrder.id && String(o.id) === String(prevOrder.id)) ||
          (o.tempId && prevOrder.tempId && String(o.tempId) === String(prevOrder.tempId))
        );
        if (!stillExists) {
          if (prevOrder.id) deleteSupabaseOrder(prevOrder.id);
          if (prevOrder.tempId && prevOrder.tempId !== prevOrder.id) deleteSupabaseOrder(prevOrder.tempId);
        }
      });

      // 2. Identify modified or new orders and persist to Supabase DB & Trigger Telegram Group Notifications
      nextOrders.forEach(nextOrder => {
        const prevOrder = prevOrders.find(o => 
          (o.id && nextOrder.id && String(o.id) === String(nextOrder.id)) ||
          (o.tempId && nextOrder.tempId && String(o.tempId) === String(nextOrder.tempId))
        );

        if (!prevOrder) {
          // Brand new order added
          if (nextOrder.id || nextOrder.tempId || nextOrder.clientName) {
            notifyOrderCreated(nextOrder).catch(err => console.warn('Telegram create notify error:', err));
          }
          saveSupabaseOrder(nextOrder);
        } else if (JSON.stringify(prevOrder) !== JSON.stringify(nextOrder)) {
          // If order just got an official ID assigned (upgraded from tempId), delete old temp row in DB
          if (prevOrder && !prevOrder.id && nextOrder.id && prevOrder.tempId) {
            deleteSupabaseOrder(prevOrder.tempId);
          }
          saveSupabaseOrder(nextOrder);

          // STATUS LIFECYCLE EVENT TRIGGERS:
          if (prevOrder.status !== nextOrder.status) {
            const oldStatus = prevOrder.status;
            const newStatus = nextOrder.status;

            // Trigger Push Notification to Dispatcher
            notifyDispatcherStatusChange(nextOrder, newStatus);

            // 1. Статус «В цеху» / «Забор у клиента» (cleaning)
            if (newStatus === 'cleaning') {
              notifyWasherNewItem(nextOrder);
              notifyOrderPickup(nextOrder, {
                courier: nextOrder.assignedCourier || nextOrder.courier || 'Курьер',
                items: nextOrder.items,
                notes: nextOrder.notes
              }).catch(err => console.warn('Telegram pickup notify error:', err));
            }
            // 2. Статус «Готов к доставке» (delivery или ready)
            else if (newStatus === 'delivery' || newStatus === 'ready') {
              notifyOrderReady(nextOrder, {
                washer: nextOrder.assignedWasher || nextOrder.washer || 'Мастер цеха',
                totalArea: nextOrder.area,
                totalAmount: nextOrder.totalAmount || nextOrder.agreedAmount,
                measuredItems: nextOrder.items
              }).catch(err => console.warn('Telegram ready notify error:', err));
            }
            // 3. Статус «Завершен» / Доставлен и закрыт (done)
            else if (newStatus === 'done') {
              notifyOrderCompleted(nextOrder, {
                courier: nextOrder.assignedCourier || nextOrder.courier || 'Курьер доставки',
                paidAmount: nextOrder.paidAmount || nextOrder.totalAmount,
                paymentType: nextOrder.paymentType || 'Наличные',
                underpaidReason: nextOrder.underpaidReason
              }).catch(err => console.warn('Telegram completed notify error:', err));
            }

            // Payment status changed to paid
            if (nextOrder.paymentStatus === 'paid' && prevOrder.paymentStatus !== 'paid') {
              notifyAdminPayment(nextOrder, nextOrder.paidAmount || nextOrder.totalAmount);
            }

            // Trigger auto SMS dispatcher
            triggerAutoSMSForOrder(nextOrder, oldStatus, prevOrder.paymentStatus, registeredUsers);
          }
        }
      });

      // Save locally to prevent order loss
      try {
        localStorage.setItem('cosmo_crm_orders', JSON.stringify(nextOrders));
      } catch (e) {}

      // Broadcast changes across gadgets
      broadcastDataChange('orders', nextOrders);

      // Auto-sync clients database
      setTimeout(() => syncClientsFromOrders(nextOrders), 0);

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

      if (Array.isArray(dbOrders) && dbOrders.length > 0) {
        setOrdersState(dbOrders);
        try {
          localStorage.setItem('cosmo_crm_orders', JSON.stringify(dbOrders));
        } catch (e) {}
        checkOverdueOrders(dbOrders);
        hasSuccess = true;
      } else if (Array.isArray(dbOrders) && dbOrders.length === 0) {
        // If Supabase returned 0 orders (e.g. fresh session or temporary fetch issue), check local cache before wiping!
        const local = localStorage.getItem('cosmo_crm_orders');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setOrdersState(parsed);
              // Push cached orders back to Supabase so nothing is lost!
              parsed.forEach(o => saveSupabaseOrder(o));
            }
          } catch (err) {}
        }
        hasSuccess = true;
      }
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        setRegisteredUsersState(dbUsers);
        hasSuccess = true;
      }
      if (Array.isArray(dbClients) && dbClients.length > 0) {
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

    // 2. Fetch central server state to load saved Telegram Bot token & DB config
    fetchInitialServerState().then(db => {
      if (db && db.tgBotConfig && db.tgBotConfig.botToken) {
        saveTelegramBotConfig(db.tgBotConfig, true);
      }
      if (db && db.serviceCatalog && Array.isArray(db.serviceCatalog)) {
        try {
          localStorage.setItem('cosmo_crm_service_catalog', JSON.stringify(db.serviceCatalog));
        } catch (e) {}
      }
    }).catch(() => {});

    // 3. Subscribe to Supabase Realtime Postgres Changes for instant multi-device updates
    const unsubscribeSupabase = subscribeToSupabaseRealtime((payload) => {
      loadSupabaseData();
    });

    // 4. Subscribe to Realtime Cross-Device Events for Telegram Bot config & Service Catalog sync
    const unsubscribeRealtime = subscribeToRealtimeSync((syncData) => {
      if (syncData.type === 'tg_bot_config' || syncData.type === 'tgBotConfig') {
        if (syncData.payload && syncData.payload.botToken) {
          saveTelegramBotConfig(syncData.payload, true);
        }
      }
      if ((syncData.type === 'service_catalog' || syncData.type === 'serviceCatalog') && Array.isArray(syncData.payload)) {
        try {
          localStorage.setItem('cosmo_crm_service_catalog', JSON.stringify(syncData.payload));
        } catch (e) {}
      }
    });

    // 5. Light background heartbeat sync (Supabase WebSocket handles instant realtime updates)
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden && navigator.onLine) {
        loadSupabaseData();
      }
    }, 20000);

    return () => {
      if (unsubscribeSupabase) unsubscribeSupabase();
      if (unsubscribeRealtime) unsubscribeRealtime();
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

  // Native Android Back Button Handler via Capacitor (Only on native devices)
  useEffect(() => {
    let listenerHandler = null;
    try {
      if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform() && CapApp && typeof CapApp.addListener === 'function') {
        CapApp.addListener('backButton', ({ canGoBack }) => {
          if (isNewOrderModalOpen || selectedOrder) {
            setIsNewOrderModalOpen(false);
            setSelectedOrder(null);
          } else if (isNotificationsOpen) {
            setIsNotificationsOpen(false);
          } else if (!canGoBack && typeof CapApp.exitApp === 'function') {
            CapApp.exitApp();
          }
        }).then(handler => {
          listenerHandler = handler;
        }).catch(() => {});
      }
    } catch (err) {}

    return () => {
      try {
        if (listenerHandler && typeof listenerHandler.remove === 'function') {
          listenerHandler.remove();
        }
      } catch (e) {}
    };
  }, [isNewOrderModalOpen, selectedOrder, isNotificationsOpen]);

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
    const existingOrder = orders.find(o => 
      (o.id && savedOrder.id && o.id === savedOrder.id) ||
      (o.tempId && savedOrder.tempId && o.tempId === savedOrder.tempId)
    );
    const prevStatus = existingOrder?.status;
    const prevPaymentStatus = existingOrder?.paymentStatus;

    if (existingOrder) {
      setOrders(orders.map(o => {
        const isMatch = (o.id && savedOrder.id && o.id === savedOrder.id) ||
                        (o.tempId && savedOrder.tempId && o.tempId === savedOrder.tempId);
        return isMatch ? savedOrder : o;
      }));
    } else {
      setOrders([savedOrder, ...orders]);
      const orderLabel = savedOrder.id ? `заказ #${savedOrder.id}` : `заявку (${savedOrder.clientName})`;
      setLogs([{ id: Date.now(), text: `Создана новая ${orderLabel}`, time: 'Только что', type: 'system' }, ...logs]);
      notifyCourierNewOrder(savedOrder);
    }

    setSelectedOrder(null);
    setIsNewOrderModalOpen(false);
    setPresetOrderData(null);
  };

  const handleOpenCalculatorPreset = (preset) => {
    setPresetOrderData(preset);
    setIsNewOrderModalOpen(true);
  };

  // 0. Public Client Online Tracking Portal (No login needed for clients)
  if (publicTrackingOrderId) {
    return (
      <ClientTrackingPortal 
        orderId={publicTrackingOrderId} 
        orders={orders} 
        onBackToCRM={() => {
          setPublicTrackingOrderId(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        }} 
      />
    );
  }

  // If not logged in -> Show Authentication / Registration Screen
  if (!currentUser) {
    return <AuthModal onLogin={handleLogin} registeredUsers={registeredUsers} onRegisterUser={handleRegisterUser} />;
  }

  // Dedicated Window based on User Role:
  // 1. Courier Portal (Отдельный мобильный кабинет Курьера)
  if (currentUser.role === 'courier') {
    return (
      <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '16px 12px 30px 12px' }}>
        <OfflineBanner isDbConnected={isDbConnected} onRetry={loadSupabaseData} />
        <Suspense fallback={<PageLoader />}>
          <CourierPortal 
            orders={orders} 
            setOrders={setOrders} 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            registeredUsers={registeredUsers}
            onOpenQRReceipt={(ord) => setQrModalOrder(ord)}
          />
        </Suspense>
        {qrModalOrder && (
          <QRReceiptModal 
            order={qrModalOrder} 
            onClose={() => setQrModalOrder(null)} 
          />
        )}
      </div>
    );
  }

  // 2. Washer Portal (Отдельный кабинет Оператора стирки)
  if (currentUser.role === 'washer') {
    return (
      <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '16px 12px 30px 12px' }}>
        <OfflineBanner isDbConnected={isDbConnected} onRetry={loadSupabaseData} />
        <Suspense fallback={<PageLoader />}>
          <WasherPortal 
            orders={orders} 
            setOrders={setOrders} 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            registeredUsers={registeredUsers}
          />
        </Suspense>
      </div>
    );
  }

  // 3. Dispatcher Portal (Отдельный кабинет Диспетчера)
  if (currentUser.role === 'dispatcher') {
    return (
      <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '16px 12px 30px 12px' }}>
        <OfflineBanner isDbConnected={isDbConnected} onRetry={loadSupabaseData} />
        <Suspense fallback={<PageLoader />}>
          <DispatcherPortal 
            orders={orders} 
            setOrders={setOrders} 
            setSelectedOrder={setSelectedOrder}
            onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            currentUser={currentUser} 
            onLogout={handleLogout} 
            registeredUsers={registeredUsers}
          />
        </Suspense>
        {(selectedOrder || isNewOrderModalOpen) && (
        <OrderModal 
          order={presetOrderData ? { ...presetOrderData, id: null, clientName: '', phone: '+998 ', status: 'new', paymentStatus: 'unpaid' } : selectedOrder}
          onClose={() => { setSelectedOrder(null); setIsNewOrderModalOpen(false); setPresetOrderData(null); }}
          onSave={handleSaveOrder}
          registeredUsers={registeredUsers}
          allOrders={orders}
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
        theme={theme}
        toggleTheme={toggleTheme}
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          toggleTheme={toggleTheme}
          onToggleMobileMenu={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        />

        <main className="page-wrapper">
          <OfflineBanner isDbConnected={isDbConnected} onRetry={loadSupabaseData} />
          <Suspense fallback={<PageLoader />}>
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

            {activeTab === 'archive' && (
              <ArchivedOrdersView 
                orders={orders} 
                setSelectedOrder={setSelectedOrder}
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
                registeredUsers={registeredUsers}
                setRegisteredUsers={setRegisteredUsers}
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
          </Suspense>
        </main>
      </div>

      {/* Mobile Phone Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
        isMenuOpen={isMobileDrawerOpen}
      />

      {/* Mobile Drawer (Full access to all sections on phone) */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
      />

      {/* Modals & Slide-overs */}
      {(selectedOrder || isNewOrderModalOpen) && (
        <OrderModal 
          order={presetOrderData ? { ...presetOrderData, id: null, clientName: '', phone: '+998 ', status: 'new', paymentStatus: 'unpaid' } : selectedOrder}
          onClose={() => { setSelectedOrder(null); setIsNewOrderModalOpen(false); setPresetOrderData(null); }}
          onSave={handleSaveOrder}
          registeredUsers={registeredUsers}
          allOrders={orders}
          onOpenQRReceipt={(ord) => setQrModalOrder(ord)}
        />
      )}

      {qrModalOrder && (
        <QRReceiptModal 
          order={qrModalOrder} 
          onClose={() => setQrModalOrder(null)} 
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
