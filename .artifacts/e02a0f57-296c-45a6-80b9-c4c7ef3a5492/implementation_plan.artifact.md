# План реализации: Создание полноценного CRM приложения "Cosmo CRM"

Этот план описывает шаги по превращению текущего набора файлов в полноценное, готовое к использованию Android-приложение для управления клининговым сервисом в Самарканде.

## Обзор
Приложение представляет собой кроссплатформенную систему на базе React + Vite + Capacitor. Оно уже имеет богатый функционал (роли, карты, управление заказами), но требует финальной шлифовки, настройки ресурсов и проверки мобильного опыта.

## Цели
1.  **Завершить UI/UX**: Улучшить мобильный опыт, добавив "edge-to-edge" поддержку и исправив мелкие недочеты.
2.  **Настроить ресурсы**: Добавить недостающие иконки и манифесты для полноценной установки.
3.  **Повысить надежность**: Проверить логику работы и подготовить проект к сборке APK.

## Предложенные изменения

### 1. Ресурсы и Конфигурация
- [ ] **[MODIFY] [manifest.json](file:///C:/Users/AKOBIR/crm-app/public/manifest.json)**: Обновить манифест для PWA, добавить корректные пути к иконкам.
- [ ] **[NEW] Placeholder Icons**: Создать или добавить инструкции по добавлению `pwa-192.png` и `pwa-512.png` в папку `public/`.
- [ ] **[MODIFY] [capacitor.config.json](file:///C:/Users/AKOBIR/crm-app/capacitor.config.json)**: Проверить настройки приложения (название, ID).

### 2. UI/UX (Mobile Experience)
- [ ] **[MODIFY] [index.css](file:///C:/Users/AKOBIR/crm-app/src/index.css)**:
    - Добавить поддержку `safe-area-inset-top` для Navbar.
    - Улучшить прокрутку на мобильных устройствах.
- [ ] **[MODIFY] [App.jsx](file:///C:/Users/AKOBIR/crm-app/src/App.jsx)**:
    - Добавить обработку системных кнопок "Назад" через Capacitor App plugin.
    - Добавить подтверждение выхода.
- [ ] **[MODIFY] [AuthModal.jsx](file:///C:/Users/AKOBIR/crm-app/src/components/AuthModal.jsx)**: Улучшить адаптивность полей ввода под экранную клавиатуру.

### 3. Функциональные дополнения
- [ ] **[MODIFY] [YandexLogisticsMap.jsx](file:///C:/Users/AKOBIR/crm-app/src/components/YandexLogisticsMap.jsx)**: Убедиться, что Leaflet правильно обрабатывает касания (zoom/pan) на Android.
- [ ] **[MODIFY] [NotificationDrawer.jsx](file:///C:/Users/AKOBIR/crm-app/src/components/NotificationDrawer.jsx)**: Сделать уведомления более заметными.

### 4. Native Integration (Android)
- [ ] **[MODIFY] [AndroidManifest.xml](file:///C:/Users/AKOBIR/crm-app/android/app/src/main/AndroidManifest.xml)**: Настроить `windowSoftInputMode` для корректной работы клавиатуры.
- [ ] **[MODIFY] [variables.gradle](file:///C:/Users/AKOBIR/crm-app/android/variables.gradle)**: Проверить версии SDK (рекомендуется target 35).

## План проверки
1.  **Сборка Web**: `npm run build` — проверка отсутствия ошибок в React коде.
2.  **Синхронизация Capacitor**: `npx cap sync android`.
3.  **Запуск на Android**: Проверка отображения на эмуляторе или реальном устройстве (если доступно).
4.  **Ручное тестирование**:
    - Вход под разными ролями (Админ, Курьер).
    - Создание заказа.
    - Переключение статусов.
    - Работа карты.

> [!IMPORTANT]
> Для корректной работы мобильного приложения необходимо сгенерировать иконки и Splash Screen. В рамках текущей задачи я настрою структуру, чтобы они подхватились автоматически.

## Вопросы к пользователю
1. Есть ли специфические требования к логотипу (иконке) приложения?
2. Требуется ли интеграция с реальным бэкендом на данном этапе, или `localStorage` достаточно для первой версии?
