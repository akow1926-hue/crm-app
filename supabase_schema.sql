-- ========================================================
-- COSMO CRM - SUPABASE POSTGRES DATABASE SCHEMA
-- Выполните этот скрипт в Supabase -> SQL Editor -> Run
-- ========================================================

-- 1. Удаляем старые таблицы если они существовали
DROP TABLE IF EXISTS courier_locations CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Таблица пользователей (Персонал CRM)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    pass TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'courier', -- 'admin', 'courier', 'dispatcher', 'washer'
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Единственный начальный аккаунт Администратора (согласно требованию)
INSERT INTO users (id, username, pass, name, role, phone, status)
VALUES ('USR-1', 'admin', 'admin123', 'Администратор', 'admin', '+998 90 123 45 67', 'active')
ON CONFLICT (username) DO NOTHING;

-- 3. Таблица заказов
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    client_name TEXT,
    client_phone TEXT,
    address TEXT,
    gps_location TEXT,
    service_type TEXT,
    total_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'new',
    courier TEXT,
    washer TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Таблица клиентов
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    total_orders INT DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Таблица геолокации курьеров (Real-time GPS Tracking)
CREATE TABLE courier_locations (
    courier_name TEXT PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION DEFAULT 0,
    status TEXT DEFAULT 'В сети',
    last_update TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Включаем Row Level Security (RLS) и открываем публичный доступ по anon key
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read/write on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous read/write on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous read/write on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous read/write on courier_locations" ON courier_locations FOR ALL USING (true) WITH CHECK (true);

-- 7. Включаем Supabase Realtime для мгновенной синхронизации ПК, телефонов и планшетов
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE courier_locations;
