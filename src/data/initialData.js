export const initialOrders = [
  {
    id: "5251",
    clientName: "Шерзод Рахимов",
    clientPhone: "+998 90 450 12 34",
    address: "г. Самарканд, ул. Мирзо Улугбека, д. 45, кв. 12",
    gpsLocation: "39.6547, 66.9758",
    district: "Центр",
    serviceType: "Стирка ковров",
    totalAmount: 360000,
    paidAmount: 0,
    paymentStatus: "unpaid",
    status: "cleaning",
    assignedCourier: "Акобир",
    assignedWasher: "Алишер",
    urgent: true,
    createdDate: "08.08.2026, 14:20",
    items: [
      { name: "Ковер Синтетика 3х4м", size: "12 м²", price: 15000, qty: 1, total: 180000 },
      { name: "Ковер Турецкий Шерсть 2х5м", size: "10 м²", price: 18000, qty: 1, total: 180000 }
    ],
    notes: "Срочная стирка, забрать с 3-го этажа"
  },
  {
    id: "5252",
    clientName: "Наргиза Каримова",
    clientPhone: "+998 93 320 88 99",
    address: "г. Самарканд, массив Согдиана, д. 18",
    gpsLocation: "39.6380, 66.9420",
    district: "Согдиана",
    serviceType: "Химчистка мебели",
    totalAmount: 250000,
    paidAmount: 250000,
    paymentStatus: "paid",
    status: "ready",
    assignedCourier: "Сардор",
    assignedWasher: "Алишер",
    urgent: false,
    createdDate: "08.08.2026, 11:15",
    items: [
      { name: "Химчистка углового дивана", size: "5 мест", price: 50000, qty: 1, total: 250000 }
    ],
    notes: "Оплачено через Click. Упаковать в защитную пленку."
  },
  {
    id: "5253",
    clientName: "ООО 'Самарканд Отель'",
    clientPhone: "+998 66 233 00 11",
    address: "г. Самарканд, ул. Университетский бульвар, д. 5",
    gpsLocation: "39.6490, 66.9610",
    district: "Центр",
    serviceType: "Стирка ковров (Премиум)",
    totalAmount: 625000,
    paidAmount: 300000,
    paymentStatus: "partial",
    status: "delivery",
    assignedCourier: "Акобир",
    assignedWasher: "Бобир",
    urgent: false,
    createdDate: "07.08.2026, 09:30",
    items: [
      { name: "Ковер Шелковый Премиум 5х5м", size: "25 м²", price: 25000, qty: 1, total: 625000 }
    ],
    notes: "Доставить до 18:00 на рецепшн"
  },
  {
    id: null,
    tempId: "TMP-5204",
    clientName: "Фарход Усманов",
    clientPhone: "+998 97 911 22 33",
    address: "г. Самарканд, Микрорайон 12, д. 4",
    gpsLocation: "39.6710, 66.9230",
    district: "Вокзал",
    serviceType: "Стирка овечьих шкур",
    totalAmount: 180000,
    paidAmount: 0,
    paymentStatus: "unpaid",
    status: "new",
    assignedCourier: "Не назначен",
    assignedWasher: "Не назначен",
    urgent: false,
    createdDate: "08.08.2026, 18:40",
    items: [
      { name: "Стирка пледа и штор", size: "4 шт", price: 45000, qty: 4, total: 180000 }
    ],
    notes: "Позвонить за 30 минут перед выездом"
  },
  {
    id: "5205",
    clientName: "Мадина Хасанова",
    clientPhone: "+998 90 700 55 44",
    address: "г. Самарканд, ул. Дагбитская, д. 88",
    gpsLocation: "39.6620, 66.9810",
    district: "Центр",
    serviceType: "Стирка ковров",
    totalAmount: 216000,
    paidAmount: 216000,
    paymentStatus: "paid",
    status: "done",
    assignedCourier: "Сардор",
    assignedWasher: "Бобир",
    urgent: false,
    createdDate: "06.08.2026, 16:00",
    items: [
      { name: "Ковер Турецкий 3х4м", size: "12 м²", price: 18000, qty: 1, total: 216000 }
    ],
    notes: "Успешно доставлен. Клиент доволен."
  }
];

export const initialClients = [
  { id: "CL-101", name: "Шерзод Рахимов", phone: "+998 90 450 12 34", address: "ул. Мирзо Улугбека, 45", district: "Центр", landmark: "Ориентир: Горбольница №1", language: "Узбекский", totalOrders: 5, totalSpent: 1250000, ltv: 1250000, tier: "VIP", discountPercent: 10, notes: "Постоянный VIP-клиент. Предпочитает выгрузку вечером." },
  { id: "CL-102", name: "Наргиза Каримова", phone: "+998 93 320 88 99", address: "массив Согдиана, 18", district: "Согдиана", landmark: "За супермаркетом 'Макро'", language: "Русский", totalOrders: 3, totalSpent: 570000, ltv: 570000, tier: "Premier", discountPercent: 5, notes: "Всегда просит упаковать в двойную пленку." },
  { id: "CL-103", name: "ООО 'Самарканд Отель'", phone: "+998 66 233 00 11", address: "Университетский бульвар, 5", district: "Центр", landmark: "Центральный вход отеля", language: "Русский", totalOrders: 12, totalSpent: 5400000, ltv: 5400000, tier: "VIP", discountPercent: 10, notes: "Корпоративный клиент. Оплата по безналичному расчету." },
  { id: "CL-104", name: "Фарход Усманов", phone: "+998 97 911 22 33", address: "Микрорайон 12, д. 4", district: "Вокзал", landmark: "Рядом с кондитерской", language: "Русский", totalOrders: 1, totalSpent: 180000, ltv: 180000, tier: "Standard", discountPercent: 0, notes: "Новый клиент. Требуется звонок за 30 минут." },
  { id: "CL-105", name: "Джамшид Баходиров", phone: "+998 91 522 77 88", address: "ул. Рудаки, 112", district: "Сиёб", landmark: "Напротив колледжа", language: "Узбекский", totalOrders: 4, totalSpent: 980000, ltv: 980000, tier: "Premier", discountPercent: 5, notes: "Ковры ручной работы, требовательный клиент." },
  { id: "CL-106", name: "Ресторан 'Регистан Палас'", phone: "+998 66 210 44 55", address: "ул. Регистанская, 30", district: "Центр", landmark: "Площадь Регистан", language: "Русский", totalOrders: 8, totalSpent: 3800000, ltv: 3800000, tier: "VIP", discountPercent: 10, notes: "Чистка ковролина и мягких стульев раз в месяц." }
];

export const serviceCatalog = [
  { id: "S-1", name: "Gilam Standart", category: "Ковры", unit: "м²", price: 14000, icon: "Layers" },
  { id: "S-2", name: "Gilam Srochna", category: "Ковры", unit: "м²", price: 20000, icon: "Sparkles" },
  { id: "S-3", name: "Gilam No standart", category: "Ковры", unit: "м²", price: 18000, icon: "Layers" },
  { id: "S-4", name: "Kurpacha", category: "Текстиль", unit: "метр", price: 15000, icon: "Bed" },
  { id: "S-5", name: "Kurpa", category: "Текстиль", unit: "шт", price: 70000, icon: "Bed" },
  { id: "S-6", name: "Adyol(1)", category: "Текстиль", unit: "шт", price: 50000, icon: "Bed" },
  { id: "S-7", name: "Adyol(2)", category: "Текстиль", unit: "шт", price: 70000, icon: "Bed" },
  { id: "S-8", name: "Yostiq", category: "Текстиль", unit: "шт", price: 15000, icon: "Feather" },
  { id: "S-9", name: "Parda Vilur", category: "Шторы", unit: "метр", price: 18000, icon: "Sun" },
  { id: "S-10", name: "Parda Tur", category: "Шторы", unit: "метр", price: 15000, icon: "Sun" },
  { id: "S-11", name: "Overlok", category: "Доп. услуги", unit: "метр", price: 20000, icon: "Tag" }
];

export const staffMembers = [
  { id: "ST-1", name: "Алишер Назаров", role: "washer", phone: "+998 90 111 22 33", status: "active", salary: 3500000 },
  { id: "ST-2", name: "Джамшид Бозоров", role: "courier", phone: "+998 91 222 33 44", status: "active", salary: 4000000 },
  { id: "ST-3", name: "Сардор Мирзаев", role: "courier", phone: "+998 93 444 55 66", status: "active", salary: 4000000 }
];

export const activityLogs = [
  { id: 1, text: "Создан новый заказ #5204 (Фарход Усманов)", time: "18:40", type: "order" },
  { id: 2, text: "Заказ #5202 переведен в статус 'Готов к доставке'", time: "15:10", type: "system" },
  { id: 3, text: "Получена оплата 250 000 сум по заказу #5202 (Click)", time: "14:55", type: "finance" },
  { id: 4, text: "Заказ #5201 передан в цех стирки (Оператор Алишер)", time: "14:30", type: "system" }
];
