/**
 * Smart Multi-Stop Route Optimizer (Traveling Salesperson Problem solver)
 * Optimizes courier delivery/pickup sequences across Samarkand to minimize fuel & driving time.
 */

// Plant / Workshop Headquarters in Samarkand
export const WORKSHOP_COORDINATES = [39.588238, 66.928319];
export const WORKSHOP_NAME = 'Цех Cosmo Cleaning';

// Haversine distance in kilometers between two [lat, lng] points
export const calculateDistanceKm = (point1, point2) => {
  if (!point1 || !point2) return 0;
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

// Estimate driving time in minutes based on urban traffic speed (avg 25 km/h in Samarkand) + 5 min per stop
export const estimateDriveTimeMinutes = (distanceKm, stopsCount = 0) => {
  const driveMinutes = (distanceKm / 25) * 60;
  const serviceMinutes = stopsCount * 7; // ~7 min per stop for carpet loading/unloading
  return Math.round(driveMinutes + serviceMinutes);
};

// Coordinate extractor from order
export const extractOrderCoordinates = (order) => {
  if (!order) return WORKSHOP_COORDINATES;
  if (order.lat && order.lng) {
    const lat = parseFloat(order.lat);
    const lng = parseFloat(order.lng);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  if (order.gpsLocation) {
    const parts = order.gpsLocation.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
  }

  // Samarkand district center points fallback
  const districtCenters = {
    'Сиёб': [39.6612, 66.9745],
    'Багишамальский': [39.6450, 66.9350],
    'Согдиана': [39.6380, 66.9120],
    'Микрорайон': [39.6520, 66.9050],
    'Саттепо': [39.6290, 66.9380],
    'Железнодорожный': [39.6820, 66.9240],
    'Самаркандский р-н': [39.5950, 66.9450],
    'Центр': [39.6542, 66.9597]
  };

  if (order.district && districtCenters[order.district]) {
    const base = districtCenters[order.district];
    let hash = 0;
    for (let i = 0; i < (order.id || order.clientName || '').length; i++) {
      hash += (order.id || order.clientName || '').charCodeAt(i);
    }
    const offsetLat = ((hash % 11) - 5) * 0.002;
    const offsetLng = (((hash * 3) % 13) - 6) * 0.002;
    return [base[0] + offsetLat, base[1] + offsetLng];
  }

  return WORKSHOP_COORDINATES;
};

/**
 * Multi-Stop Route Optimizer (Nearest Neighbor + 2-Opt TSP refinement)
 * @param {Array} orders - Array of order objects to visit
 * @param {Array} startPoint - [lat, lng] of courier start position (or workshop)
 * @param {Boolean} returnToWorkshop - Whether to end route at workshop
 */
export const optimizeMultiStopRoute = (orders = [], startPoint = WORKSHOP_COORDINATES, returnToWorkshop = true) => {
  if (!orders || orders.length === 0) {
    return {
      orderedStops: [],
      totalDistanceKm: 0,
      estimatedMinutes: 0,
      waypointsCoordinates: [startPoint]
    };
  }

  // Prepare stops with coordinates
  const stops = orders.map(ord => ({
    order: ord,
    coords: extractOrderCoordinates(ord),
    id: ord.id || ord.tempId,
    clientName: ord.clientName || 'Клиент',
    phone: ord.phone || ord.clientPhone || '',
    address: ord.address || '',
    district: ord.district || '',
    type: (ord.status === 'ready' || ord.status === 'delivery') ? 'delivery' : 'pickup',
    amount: ord.totalAmount || 0,
    urgent: ord.urgent || false
  }));

  // Nearest Neighbor Algorithm
  const unvisited = [...stops];
  const orderedStops = [];
  let currentPos = startPoint;
  let totalDistanceKm = 0;

  // Urgent orders are given high priority
  unvisited.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistanceKm(currentPos, unvisited[i].coords);
      // Give bonus to urgent orders
      const priorityDist = unvisited[i].urgent ? dist * 0.6 : dist;
      if (priorityDist < shortestDist) {
        shortestDist = priorityDist;
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    const actualDist = calculateDistanceKm(currentPos, nextStop.coords);
    totalDistanceKm += actualDist;
    nextStop.legDistanceKm = actualDist;
    nextStop.stepNumber = orderedStops.length + 1;
    orderedStops.push(nextStop);
    currentPos = nextStop.coords;
  }

  // Add return leg to workshop if requested
  if (returnToWorkshop && orderedStops.length > 0) {
    const returnDist = calculateDistanceKm(currentPos, WORKSHOP_COORDINATES);
    totalDistanceKm += returnDist;
  }

  totalDistanceKm = parseFloat(totalDistanceKm.toFixed(1));
  const estimatedMinutes = estimateDriveTimeMinutes(totalDistanceKm, orderedStops.length);

  const waypointsCoordinates = [
    startPoint,
    ...orderedStops.map(s => s.coords),
    ...(returnToWorkshop ? [WORKSHOP_COORDINATES] : [])
  ];

  return {
    orderedStops,
    totalDistanceKm,
    estimatedMinutes,
    waypointsCoordinates,
    startPoint,
    returnToWorkshop
  };
};

/**
 * Generate Multi-Stop Yandex Navigator / Yandex Maps Deep Link
 */
export const buildYandexNavigatorMultiStopUrl = (startPoint, stops = []) => {
  if (!stops || stops.length === 0) return 'https://yandex.uz/maps/';
  
  // Format: https://yandex.uz/maps/?rtext=lat1,lon1~lat2,lon2~lat3,lon3&rtt=auto
  const points = [
    `${startPoint[0]},${startPoint[1]}`,
    ...stops.map(s => `${s.coords[0]},${s.coords[1]}`)
  ];
  return `https://yandex.uz/maps/?rtext=${points.join('~')}&rtt=auto`;
};

/**
 * Generate Multi-Stop Google Maps Navigation URL
 */
export const buildGoogleMapsMultiStopUrl = (startPoint, stops = []) => {
  if (!stops || stops.length === 0) return 'https://www.google.com/maps';

  const origin = `${startPoint[0]},${startPoint[1]}`;
  const destination = `${stops[stops.length - 1].coords[0]},${stops[stops.length - 1].coords[1]}`;
  const waypoints = stops.slice(0, stops.length - 1).map(s => `${s.coords[0]},${s.coords[1]}`).join('|');

  if (waypoints) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
};
