import React from 'react';

/**
 * Calculates remaining delivery days for an order.
 * - Default delivery time is 5 days.
 * - Courier/Dispatcher can set `deliveryDays` (e.g. 1, 2, 3, 4, 5 days) upon pickup or order creation.
 * - Counting includes today (day 0).
 * - Returns an integer representing remaining days (e.g. 5, 3, 1, 0, -1, -2).
 */
export function calculateRemainingDays(order) {
  if (!order) return 5;
  
  // Default is 5 days unless explicitly changed by courier/dispatcher
  const deliveryDays = parseInt(order.deliveryDays, 10) || 5;

  // Use pickup date if order was picked up, or creation date
  const startTimestamp = order.pickupDate || order.created_at || order.createdDate;
  if (!startTimestamp) return deliveryDays;

  let startDate;
  if (typeof startTimestamp === 'string' && startTimestamp.includes('.')) {
    // Format "08.08.2026, 14:20" or "08.08.2026"
    const parts = startTimestamp.split(',');
    const dateParts = parts[0].trim().split('.');
    if (dateParts.length === 3) {
      startDate = new Date(parseInt(dateParts[2], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[0], 10));
    } else {
      startDate = new Date(startTimestamp);
    }
  } else {
    startDate = new Date(startTimestamp);
  }

  if (isNaN(startDate.getTime())) {
    startDate = new Date();
  }

  // Calculate calendar days difference
  const today = new Date();
  const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = todayMidnight.getTime() - startMidnight.getTime();
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Remaining days formula: deliveryDays - daysPassed
  return deliveryDays - daysPassed;
}

/**
 * Renders a clean badge displaying JUST a number (e.g. 5, 2, 0, -1, -2) as required by CRM specs:
 * "Оставшийся срок должен выводиться на панели просто цифрой (например, «2» или «1» день), без лишнего текста."
 * "Если срок вышел, счетчик дней должен уходить в минус (например: -1, -2, -3)."
 */
export function DeliveryDeadlineBadge({ order, style = {} }) {
  if (!order || order.status === 'done' || order.status === 'cancelled') {
    return null;
  }

  const remaining = calculateRemainingDays(order);

  let bg = 'rgba(16, 185, 129, 0.15)';
  let border = '#10b981';
  let color = '#34d399';
  let animation = 'none';

  if (remaining <= 0 && remaining >= -1) {
    // 0 or -1 days (Warning / Overdue)
    bg = 'rgba(245, 158, 11, 0.2)';
    border = '#f59e0b';
    color = '#fbbf24';
  }

  if (remaining < 0) {
    // Overdue penalty days (-1, -2, -3...)
    bg = 'rgba(239, 68, 68, 0.25)';
    border = '#ef4444';
    color = '#f87171';
    animation = 'pulse 1.8s infinite';
  }

  return (
    <span
      title={`Срок доставки: ${order.deliveryDays || 5} дн. (Осталось / Просрочка: ${remaining} дн.)`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '26px',
        height: '24px',
        padding: '0 6px',
        borderRadius: '12px',
        background: bg,
        border: `1px solid ${border}`,
        color: color,
        fontWeight: '900',
        fontSize: '12.5px',
        fontFamily: 'JetBrains Mono, monospace',
        lineHeight: 1,
        animation: animation,
        boxShadow: remaining < 0 ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none',
        ...style
      }}
    >
      {remaining}
    </span>
  );
}
