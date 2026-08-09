import { supabase } from '../lib/supabase.js';

function mapOrderFromDB(row) {
  if (!row) return null;
  const total = Number(row.total_amount || 0);
  const paid = Number(row.paid_amount || 0);
  let payStatus = 'unpaid';
  if (paid >= total && total > 0) payStatus = 'paid';
  else if (paid > 0) payStatus = 'partial';

  const commentStr = row.comment || '';
  const isUrgent = commentStr.includes('[СРОЧНО]');
  let district = '';
  if (commentStr.includes('[Район: ')) {
    const match = commentStr.match(/\[Район:\s*([^\]]+)\]/);
    if (match) district = match[1];
  }

  const rawId = String(row.id || '');
  const isTemp = rawId.startsWith('TMP-') || rawId.startsWith('REQ-') || rawId.startsWith('temp_');
  const officialId = isTemp ? null : rawId;

  return {
    id: officialId,
    tempId: rawId,
    clientName: row.client_name || '',
    phone: row.client_phone || '',
    clientPhone: row.client_phone || '',
    address: row.address || '',
    district: district,
    gpsLocation: row.gps_location || '',
    serviceType: row.service_type || '',
    totalAmount: total,
    paidAmount: paid,
    paymentStatus: payStatus,
    status: row.status || 'new',
    assignedCourier: row.courier || '',
    courier: row.courier || '',
    washer: row.washer || '',
    urgent: isUrgent,
    items: Array.isArray(row.items) ? row.items : [],
    notes: commentStr,
    comment: commentStr,
    createdDate: row.created_at ? new Date(row.created_at).toLocaleString('ru-RU') : new Date().toLocaleString('ru-RU')
  };
}

function mapOrderToDB(order) {
  if (!order) return {};
  const total = Number(order.totalAmount || 0);
  let paid = Number(order.paidAmount || 0);
  if (order.paymentStatus === 'paid' && paid < total) {
    paid = total;
  }

  let cleanComment = order.notes || order.comment || '';
  if (order.urgent && !cleanComment.includes('[СРОЧНО]')) {
    cleanComment = '[СРОЧНО] ' + cleanComment;
  }
  if (order.district && !cleanComment.includes(`[Район: ${order.district}]`)) {
    cleanComment = `[Район: ${order.district}] ` + cleanComment;
  }

  const dbId = order.id || order.tempId || (`TMP-${Date.now()}`);

  return {
    id: String(dbId),
    client_name: order.clientName || '',
    client_phone: order.phone || order.clientPhone || '',
    address: order.address || '',
    gps_location: order.gpsLocation || '',
    service_type: order.serviceType || '',
    total_amount: total,
    paid_amount: paid,
    status: order.status || 'new',
    courier: order.assignedCourier || order.courier || null,
    washer: order.washer || null,
    items: Array.isArray(order.items) ? order.items : [],
    comment: cleanComment,
    updated_at: new Date().toISOString()
  };
}

// --- USERS ---
export async function getSupabaseUsers() {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users from Supabase:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Supabase users error:', err);
    return null;
  }
}

export async function saveSupabaseUser(user) {
  try {
    const row = {
      id: user.id || `USR-${Date.now()}`,
      username: user.username,
      pass: user.pass,
      name: user.name,
      role: user.role || 'courier',
      phone: user.phone || '',
      status: user.status || 'active'
    };
    const { data, error } = await supabase.from('users').upsert(row).select();
    if (error) console.error('Error saving user to Supabase:', error);
    return data ? data[0] : null;
  } catch (err) {
    console.error('Supabase user save error:', err);
    return null;
  }
}

export async function deleteSupabaseUser(id) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error('Error deleting user from Supabase:', error);
  } catch (err) {}
}

// --- ORDERS ---
export async function getSupabaseOrders() {
  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching orders from Supabase:', error);
      return null;
    }
    return data.map(mapOrderFromDB);
  } catch (err) {
    console.error('Supabase orders error:', err);
    return null;
  }
}

export async function saveSupabaseOrder(order) {
  try {
    const dbRow = mapOrderToDB(order);
    const { data, error } = await supabase.from('orders').upsert(dbRow).select();
    if (error) console.error('Error saving order to Supabase:', error);
    return data ? mapOrderFromDB(data[0]) : null;
  } catch (err) {
    console.error('Supabase order save error:', err);
    return null;
  }
}

export async function deleteSupabaseOrder(id) {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', String(id));
    if (error) console.error('Error deleting order from Supabase:', error);
  } catch (err) {}
}

// --- CLIENTS ---
export async function getSupabaseClients() {
  try {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      console.error('Error fetching clients from Supabase:', error);
      return null;
    }
    return data.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      totalOrders: c.total_orders,
      totalSpent: c.total_spent
    }));
  } catch (err) {
    return null;
  }
}

export async function saveSupabaseClient(client) {
  try {
    const row = {
      id: client.id || `CL-${Date.now()}`,
      name: client.name,
      phone: client.phone || '',
      address: client.address || '',
      total_orders: client.totalOrders || 0,
      total_spent: client.totalSpent || 0
    };
    const { data, error } = await supabase.from('clients').upsert(row).select();
    if (error) console.error('Error saving client to Supabase:', error);
    return data ? data[0] : null;
  } catch (err) {}
}

export async function deleteSupabaseClient(id) {
  try {
    const { error } = await supabase.from('clients').delete().eq('id', String(id));
    if (error) console.error('Error deleting client from Supabase:', error);
  } catch (err) {}
}

// --- COURIER LOCATIONS ---
export async function getSupabaseCourierLocations() {
  try {
    const { data, error } = await supabase.from('courier_locations').select('*');
    if (error) {
      console.error('Error fetching courier locations from Supabase:', error);
      return {};
    }
    const map = {};
    (data || []).forEach(row => {
      map[row.courier_name] = {
        name: row.courier_name,
        lat: Number(row.lat),
        lng: Number(row.lng),
        speed: Number(row.speed || 0),
        status: row.status || 'В сети (GPS)',
        lastUpdate: row.last_update,
        isOnline: true
      };
    });
    return map;
  } catch (err) {
    return {};
  }
}

export async function updateSupabaseCourierLocation(courierName, positionData) {
  try {
    const row = {
      courier_name: courierName,
      lat: Number(positionData.lat),
      lng: Number(positionData.lng),
      speed: Number(positionData.speed || 0),
      status: positionData.status || 'В сети',
      last_update: new Date().toISOString()
    };
    await supabase.from('courier_locations').upsert(row);
  } catch (err) {}
}

// --- REALTIME SUBSCRIPTION ---
export function subscribeToSupabaseRealtime(onTableChange) {
  const channel = supabase.channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      if (onTableChange) {
        onTableChange(payload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
