// Utility helper to extract live active couriers and washers from registered CRM accounts

export function getActiveCouriers(registeredUsers) {
  let list = registeredUsers;
  if (!list || !Array.isArray(list) || list.length === 0) {
    try {
      const saved = localStorage.getItem('cosmo_crm_registered_users');
      list = saved ? JSON.parse(saved) : [];
    } catch (e) {
      list = [];
    }
  }

  const couriers = (list || []).filter(u => {
    const r = String(u.role || u.Role || '').toLowerCase();
    const isCour = r.includes('courier') || r.includes('курьер') || r.includes('доставщик');
    return isCour && u.status !== 'blocked';
  });

  return couriers;
}

export function getActiveWashers(registeredUsers) {
  let list = registeredUsers;
  if (!list || !Array.isArray(list) || list.length === 0) {
    try {
      const saved = localStorage.getItem('cosmo_crm_registered_users');
      list = saved ? JSON.parse(saved) : [];
    } catch (e) {
      list = [];
    }
  }

  const washers = (list || []).filter(u => {
    const r = String(u.role || u.Role || '').toLowerCase();
    const isWasher = r.includes('washer') || r.includes('мойщик') || r.includes('цех');
    return isWasher && u.status !== 'blocked';
  });

  return washers;
}
