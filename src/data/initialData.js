export const initialOrders = [
  {
    id: "1095",
    clientName: "Шерзод Абдуллаев",
    phone: "+998 90 123 45 67",
    address: "г. Ташкент, Мирабадский р-н, ул. Нукус, д. 45, кв. 12",
    status: "new",
    items: [
      { name: "Ковер шерстяной (3х4 м²)", qty: 12, price: 18000, total: 216000 },
      { name: "Химчистка дивана 3-мест.", qty: 1, price: 150000, total: 150000 }
    ],
    totalAmount: 366000,
    paidAmount: 0,
    paymentStatus: "unpaid",
    urgent: true,
    createdDate: "2026-08-06 14:30",
    pickupDate: "2026-08-06",
    assignedCourier: "Алишер Рахимов",
    assignedWasher: "Баходмир Муминов",
    notes: "Позвонить за 30 минут перед приездом курьера. Домофон 12."
  },
  {
    id: "1094",
    clientName: "Шахло Исмаилова",
    phone: "+998 97 765 43 21",
    address: "Яккасарайский р-н, ул. Шота Руставели, д. 88",
    status: "pickup",
    items: [
      { name: "Ковер синтетика (2х3 м²)", qty: 6, price: 15000, total: 90000 },
      { name: "Стирка одеяла евро", qty: 2, price: 45000, total: 90000 }
    ],
    totalAmount: 180000,
    paidAmount: 180000,
    paymentStatus: "paid",
    urgent: false,
    createdDate: "2026-08-06 12:15",
    pickupDate: "2026-08-06",
    assignedCourier: "Сардор Мирзаев",
    assignedWasher: "Баходмир Муминов",
    notes: "Оплата Payme произведена полностью."
  },
  {
    id: "1093",
    clientName: "Джамшид Каримов",
    phone: "+998 93 333 22 11",
    address: "Чиланзар, 14-кварцев, д. 15",
    status: "cleaning",
    items: [
      { name: "Ковер шелковый (4х5 м²)", qty: 20, price: 25000, total: 500000 }
    ],
    totalAmount: 500000,
    paidAmount: 200000,
    paymentStatus: "partial",
    urgent: true,
    createdDate: "2026-08-05 18:00",
    pickupDate: "2026-08-06",
    assignedCourier: "Алишер Рахимов",
    assignedWasher: "Дилшод Хакимов",
    notes: "Особая бережная стирка, дорогой ковер!"
  },
  {
    id: "1092",
    clientName: "Елена Смирнова",
    phone: "+998 91 999 88 77",
    address: "Юнусабад, 4-квартал, д. 2, кв. 44",
    status: "ready",
    items: [
      { name: "Химчистка кресла", qty: 2, price: 60000, total: 120000 },
      { name: "Стирка штор (комплект)", qty: 1, price: 80000, total: 80000 }
    ],
    totalAmount: 200000,
    paidAmount: 200000,
    paymentStatus: "paid",
    urgent: false,
    createdDate: "2026-08-04 10:20",
    pickupDate: "2026-08-04",
    assignedCourier: "Сардор Мирзаев",
    assignedWasher: "Баходмир Муминов",
    notes: "Готов к доставке. Клиент просит вывезти с 18:00 до 20:00."
  },
  {
    id: "1091",
    clientName: "Бобур Азимов",
    phone: "+998 95 111 00 22",
    address: "Сергели-7, д. 19, кв. 3",
    status: "delivery",
    items: [
      { name: "Ковер турецкий (3х5 м²)", qty: 15, price: 18000, total: 270000 }
    ],
    totalAmount: 270000,
    paidAmount: 0,
    paymentStatus: "unpaid",
    urgent: false,
    createdDate: "2026-08-03 16:45",
    pickupDate: "2026-08-04",
    assignedCourier: "Алишер Рахимов",
    assignedWasher: "Дилшод Хакимов",
    notes: "Курьер Алишер в пути на доставку. Наличный расчет."
  },
  {
    id: "1090",
    clientName: "Муниса Назарова",
    phone: "+998 99 444 55 66",
    address: "Шайхантахурский р-н, Ц-26, д. 5",
    status: "done",
    items: [
      { name: "Ковер синтетика (2.5х3.5 м²)", qty: 8.75, price: 16000, total: 140000 },
      { name: "Чистка матраса 2-спального", qty: 1, price: 160000, total: 160000 }
    ],
    totalAmount: 300000,
    paidAmount: 300000,
    paymentStatus: "paid",
    urgent: false,
    createdDate: "2026-08-02 09:10",
    pickupDate: "2026-08-02",
    assignedCourier: "Сардор Мирзаев",
    assignedWasher: "Баходмир Муминов",
    notes: "Успешно выполнен и оплачен по Uzum Bank."
  }
];

export const initialClients = [
  {
    id: "C-101",
    name: "Шерзод Абдуллаев",
    phone: "+998 90 123 45 67",
    address: "г. Ташкент, Мирабадский р-н, ул. Нукус, д. 45, кв. 12",
    totalOrders: 6,
    ltv: 1450000,
    tier: "VIP",
    discountPercent: 10,
    notes: "Постоянный VIP клиент, предпочитает доставку вечером."
  },
  {
    id: "C-102",
    name: "Шахло Исмаилова",
    phone: "+998 97 765 43 21",
    address: "Яккасарайский р-н, ул. Шота Руставели, д. 88",
    totalOrders: 3,
    ltv: 520000,
    tier: "Premier",
    discountPercent: 5,
    notes: "Заказывает стирку ковров каждые 3 месяца."
  },
  {
    id: "C-103",
    name: "Джамшид Каримов",
    phone: "+998 93 333 22 11",
    address: "Чиланзар, 14-кварцев, д. 15",
    totalOrders: 4,
    ltv: 1890000,
    tier: "VIP",
    discountPercent: 10,
    notes: "Большой загородный дом, дорогие шелковые изделия."
  },
  {
    id: "C-104",
    name: "Елена Смирнова",
    phone: "+998 91 999 88 77",
    address: "Юнусабад, 4-квартал, д. 2, кв. 44",
    totalOrders: 2,
    ltv: 380000,
    tier: "Standard",
    discountPercent: 0,
    notes: "Любит химчистку мягкой мебели."
  }
];

export const serviceCatalog = [
  { id: "S-1", name: "Стирка ковра (Синтетика)", category: "Ковры", unit: "м²", price: 15000, icon: "Layers" },
  { id: "S-2", name: "Стирка ковра (Шерсть/Турецкий)", category: "Ковры", unit: "м²", price: 18000, icon: "Sparkles" },
  { id: "S-3", name: "Стирка ковра (Шелк/Премиум)", category: "Ковры", unit: "м²", price: 25000, icon: "Crown" },
  { id: "S-4", name: "Химчистка дивана (1 посадочное место)", category: "Мебель", unit: "шт", price: 50000, icon: "Sofa" },
  { id: "S-5", name: "Чистка матраса 2-спального", category: "Мебель", unit: "шт", price: 160000, icon: "Bed" },
  { id: "S-6", name: "Стирка одеяла евро / Плед", category: "Текстиль", unit: "шт", price: 45000, icon: "Feather" },
  { id: "S-7", name: "Чистка штор и портьер", category: "Текстиль", unit: "комплект", price: 80000, icon: "Sun" }
];

export const staffMembers = [
  { id: "ST-1", name: "Мадина Сулейманова", role: "Dispatcher", phone: "+998 90 111 22 33", activeOrders: 12, rating: 4.9 },
  { id: "ST-2", name: "Алишер Рахимов", role: "Courier", phone: "+998 90 222 33 44", activeOrders: 4, rating: 4.8 },
  { id: "ST-3", name: "Сардор Мирзаев", role: "Courier", phone: "+998 90 333 44 55", activeOrders: 3, rating: 4.9 },
  { id: "ST-4", name: "Баходмир Муминов", role: "Washer", phone: "+998 90 444 55 66", activeOrders: 8, rating: 5.0 },
  { id: "ST-5", name: "Дилшод Хакимов", role: "Washer", phone: "+998 90 555 66 77", activeOrders: 5, rating: 4.7 }
];

export const activityLogs = [
  { id: 1, text: "Курьер Алишер взял заказ #1095 на забор", time: "10 мин назад", type: "courier" },
  { id: 2, text: "Поступила онлайн-оплата 180,000 сум за заказ #1094", time: "25 мин назад", type: "payment" },
  { id: 3, text: "Оператор Баходмир завершил стирку по заказу #1092", time: "1 час назад", type: "washer" },
  { id: 4, text: "Создан новый заказ #1095 для Шерзода Абдуллаева", time: "2 часа назад", type: "system" }
];
