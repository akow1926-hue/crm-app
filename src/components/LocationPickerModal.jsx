import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Search, 
  Check, 
  X, 
  ExternalLink, 
  LocateFixed, 
  Sparkles,
  Loader2,
  Copy,
  CheckCheck
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// Default Center: Samarkand, Uzbekistan
const SAMARKAND_DEFAULT_COORDS = [39.6542, 66.9597];

// Custom Client Pin Icon
const createClientPinIcon = () => {
  return L.divIcon({
    className: 'custom-client-picker-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
      ">
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 16px rgba(244, 63, 94, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 16px;
            line-height: 1;
          ">📍</span>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
  });
};

// Custom Courier GPS Icon
const createCourierGpsIcon = () => {
  return L.divIcon({
    className: 'custom-courier-gps-pin',
    html: `
      <div style="
        width: 22px;
        height: 22px;
        background: #06b6d4;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 14px #06b6d4, 0 0 0 6px rgba(6, 182, 212, 0.3);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

// Helper component for map viewport management and resizing
function MapController({ center, zoom, shouldFlyTo }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate map size to prevent gray tiles on modal load
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      if (shouldFlyTo) {
        map.flyTo(center, zoom || 16, { duration: 1.2 });
      } else {
        map.setView(center, zoom || map.getZoom());
      }
    }
  }, [center, zoom, shouldFlyTo, map]);

  return null;
}

// Map Click Listener component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (e.latlng) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

// Parse string coordinates helper
const parseCoords = (coordInput) => {
  if (!coordInput) return null;
  if (Array.isArray(coordInput) && coordInput.length === 2) {
    const lat = parseFloat(coordInput[0]);
    const lng = parseFloat(coordInput[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) return [lat, lng];
  }
  if (typeof coordInput === 'object' && coordInput.lat && coordInput.lng) {
    const lat = parseFloat(coordInput.lat);
    const lng = parseFloat(coordInput.lng);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  if (typeof coordInput === 'string') {
    const parts = coordInput.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] !== 0 && parts[1] !== 0) {
      return [parts[0], parts[1]];
    }
  }
  return null;
};

export default function LocationPickerModal({
  isOpen = true,
  onClose,
  initialGps = '',
  initialAddress = '',
  initialDistrict = 'Сиёб',
  initialLandmark = '',
  orderInfo = null,
  onSaveLocation
}) {
  const initialParsed = parseCoords(initialGps);
  const [selectedCoords, setSelectedCoords] = useState(initialParsed || SAMARKAND_DEFAULT_COORDS);
  
  // Courier Phone GPS
  const [phoneGps, setPhoneGps] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Address & Details State
  const [address, setAddress] = useState(initialAddress || '');
  const [district, setDistrict] = useState(initialDistrict || 'Сиёб');
  const [landmark, setLandmark] = useState(initialLandmark || '');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [suggestedAddress, setSuggestedAddress] = useState(null);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [shouldFlyMap, setShouldFlyMap] = useState(false);

  const markerRef = useRef(null);

  // Perform Reverse Geocoding with OpenStreetMap Nominatim
  const performReverseGeocode = useCallback(async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru,uz`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.path || '';
        const houseNum = addr.house_number || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || '';
        
        let streetFormatted = [road, houseNum].filter(Boolean).join(', ');
        if (!streetFormatted && suburb) streetFormatted = suburb;
        if (!streetFormatted && data.display_name) {
          streetFormatted = data.display_name.split(',').slice(0, 2).join(',');
        }

        // Auto-detect Samarkand District
        const fullText = `${suburb} ${data.display_name || ''}`.toLowerCase();
        let detectedDistrict = '';
        if (fullText.includes('сиёб') || fullText.includes('сиаб') || fullText.includes('siyob') || fullText.includes('сиоб')) {
          detectedDistrict = 'Сиёб';
        } else if (fullText.includes('багишамал') || fullText.includes('богишамол') || fullText.includes('bog\'ishamol')) {
          detectedDistrict = 'Багишамальский';
        } else if (fullText.includes('согдиана') || fullText.includes('sogdiana') || fullText.includes('соғдиёна')) {
          detectedDistrict = 'Согдиана';
        } else if (fullText.includes('микрорайон') || fullText.includes('mikrorayon')) {
          detectedDistrict = 'Микрорайон';
        } else if (fullText.includes('саттепо') || fullText.includes('sattepo')) {
          detectedDistrict = 'Саттепо';
        } else if (fullText.includes('железнодорожн') || fullText.includes('вокзал') || fullText.includes('temiryo')) {
          detectedDistrict = 'Железнодорожный';
        } else if (fullText.includes('центр') || fullText.includes('бульвар') || fullText.includes('марказ')) {
          detectedDistrict = 'Центр';
        }

        setSuggestedAddress({
          street: streetFormatted,
          suburb: suburb,
          district: detectedDistrict,
          displayName: data.display_name || ''
        });

        if (detectedDistrict && (!district || district === 'Сиёб')) {
          setDistrict(detectedDistrict);
        }

        // If address is currently empty, pre-fill with detected street
        if (!address && streetFormatted) {
          setAddress(streetFormatted);
        }
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [address, district]);

  // Request & Capture Phone GPS
  const handleGetPhoneGps = useCallback(async (centerMap = true) => {
    setIsLocating(true);
    setGpsError(null);

    try {
      if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        if (pos && pos.coords) {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setPhoneGps(coords);
          setSelectedCoords(coords);
          if (centerMap) setShouldFlyMap(true);
          performReverseGeocode(coords[0], coords[1]);
          setIsLocating(false);
          return;
        }
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = [pos.coords.latitude, pos.coords.longitude];
            setPhoneGps(coords);
            setSelectedCoords(coords);
            if (centerMap) setShouldFlyMap(true);
            performReverseGeocode(coords[0], coords[1]);
            setIsLocating(false);
          },
          (err) => {
            console.warn('Geolocation error:', err.message);
            setGpsError('Не удалось получить координаты: ' + err.message);
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
      } else {
        setGpsError('Геолокация не поддерживается вашим браузером');
        setIsLocating(false);
      }
    } catch (e) {
      setGpsError('Ошибка GPS: ' + (e.message || e));
      setIsLocating(false);
    }
  }, [performReverseGeocode]);

  // Auto-fetch phone GPS on mount if no initial location was saved
  useEffect(() => {
    if (!initialParsed) {
      handleGetPhoneGps(false);
    }
  }, [initialParsed, handleGetPhoneGps]);

  // Handle Location Change (from map click, drag, or search)
  const handleLocationChange = (lat, lng, shouldFly = false) => {
    setSelectedCoords([lat, lng]);
    setShouldFlyMap(shouldFly);
    performReverseGeocode(lat, lng);
  };

  // Search Address handler
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery.trim()}, Самарканд, Узбекистан`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=uz&limit=5&accept-language=ru`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        if (data.length > 0) {
          const first = data[0];
          handleLocationChange(parseFloat(first.lat), parseFloat(first.lon), true);
        }
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Quick Preset Locations in Samarkand
  const samarkandPresets = [
    { label: 'Регистан / Сиёб', coords: [39.6542, 66.9597], dist: 'Сиёб' },
    { label: 'Унив. Бульвар / Центр', coords: [39.6467, 66.9602], dist: 'Центр' },
    { label: 'Согдиана / Гагарина', coords: [39.6645, 66.9231], dist: 'Согдиана' },
    { label: 'Саттепо', coords: [39.6389, 66.9054], dist: 'Саттепо' },
    { label: 'Микрорайон', coords: [39.6710, 66.9450], dist: 'Микрорайон' },
    { label: 'Ж/Д Вокзал', coords: [39.6845, 66.9242], dist: 'Железнодорожный' },
    { label: 'Багишамальский', coords: [39.6234, 66.9712], dist: 'Багишамальский' }
  ];

  // Copy Coordinates to Clipboard
  const handleCopyCoords = () => {
    const str = `${selectedCoords[0].toFixed(6)}, ${selectedCoords[1].toFixed(6)}`;
    navigator.clipboard.writeText(str);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Save and Close
  const handleSave = () => {
    const coordString = `${selectedCoords[0].toFixed(6)}, ${selectedCoords[1].toFixed(6)}`;
    if (onSaveLocation) {
      onSaveLocation({
        gpsLocation: coordString,
        address: address.trim(),
        district: district,
        landmark: landmark.trim(),
        lat: selectedCoords[0],
        lng: selectedCoords[1]
      });
    }
    if (onClose) onClose();
  };

  const coordStr = `${selectedCoords[0].toFixed(6)}, ${selectedCoords[1].toFixed(6)}`;
  const yandexNaviUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(coordStr)}`;

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '12px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-modal, #0c1221)',
          border: '1.5px solid var(--accent-secondary, #06b6d4)',
          borderRadius: '20px',
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          position: 'relative'
        }}
      >
        {/* 1. Header Bar */}
        <div style={{
          padding: '14px 18px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <MapPin size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-pickup" style={{ fontSize: '10px', padding: '1px 6px', fontWeight: '800' }}>
                  Выбор точки на карте
                </span>
                {orderInfo?.id && (
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#facc15' }}>
                    Заказ #{orderInfo.id}
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', margin: '2px 0 0 0' }}>
                {orderInfo?.clientName ? `Клиент: ${orderInfo.clientName}` : 'Укажите точную локацию клиента'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleGetPhoneGps(true)}
              disabled={isLocating}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '800',
                padding: '8px 12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Определить мое текущее местоположение по GPS телефона"
            >
              {isLocating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
              <span>{isLocating ? 'GPS поиск...' : '🎯 GPS Телефона'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* 2. Search & District Presets Bar */}
        <div style={{
          padding: '10px 16px',
          background: 'rgba(10, 15, 30, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim, #64748b)' }} />
              <input
                type="text"
                placeholder="Поиск по улицам Самарканда (например: Гагарина, Регистан, Бульвар)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '36px', height: '36px', fontSize: '12.5px', borderRadius: '10px' }}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="btn btn-secondary"
              style={{ height: '36px', padding: '0 14px', fontSize: '12px', fontWeight: '700', borderRadius: '10px' }}
            >
              {isSearching ? <Loader2 size={13} className="animate-spin" /> : 'Найти'}
            </button>
          </form>

          {/* Search Results Dropdown / Chips if found */}
          {searchResults.length > 0 && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '110px',
              overflowY: 'auto'
            }}>
              {searchResults.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    handleLocationChange(parseFloat(r.lat), parseFloat(r.lon), true);
                    setSearchResults([]);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '11.5px',
                    textAlign: 'left',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  className="btn-hover"
                >
                  📍 {r.display_name}
                </button>
              ))}
            </div>
          )}

          {/* Quick Presets for Samarkand */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontWeight: '700' }}>
              Быстрый район:
            </span>
            {samarkandPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  handleLocationChange(p.coords[0], p.coords[1], true);
                  if (p.dist) setDistrict(p.dist);
                }}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {gpsError && (
            <div style={{ fontSize: '11.5px', color: '#f87171', background: 'rgba(244, 63, 94, 0.15)', padding: '4px 8px', borderRadius: '6px' }}>
              ⚠️ {gpsError}
            </div>
          )}
        </div>

        {/* 3. Interactive Leaflet Map Container */}
        <div style={{ position: 'relative', height: '340px', width: '100%', background: '#0a0e1a' }}>
          <MapContainer
            center={selectedCoords}
            zoom={15}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController center={selectedCoords} zoom={16} shouldFlyTo={shouldFlyMap} />
            <MapClickHandler onMapClick={(lat, lng) => handleLocationChange(lat, lng, false)} />

            {/* Draggable Client Marker */}
            <Marker
              ref={markerRef}
              position={selectedCoords}
              draggable={true}
              icon={createClientPinIcon()}
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target;
                  if (m) {
                    const pos = m.getLatLng();
                    handleLocationChange(pos.lat, pos.lng, false);
                  }
                }
              }}
            >
              <Popup>
                <div style={{ padding: '4px', fontSize: '12px', textAlign: 'center' }}>
                  <strong style={{ color: '#f43f5e' }}>📍 Точка клиента</strong>
                  <div style={{ marginTop: '2px', fontSize: '11px', color: '#475569' }}>
                    {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    (Можно перетаскивать пальцем)
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Courier Phone GPS Marker if available */}
            {phoneGps && (
              <Marker position={phoneGps} icon={createCourierGpsIcon()}>
                <Popup>
                  <div style={{ padding: '4px', fontSize: '11px', textAlign: 'center' }}>
                    <strong style={{ color: '#06b6d4' }}>📱 Мой телефон (GPS)</strong>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Floating Hint Overlay on Map */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(6px)',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '11px',
            color: '#38bdf8',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>👆 Нажмите на карту или перетащите метку</span>
          </div>

          {/* Floating Yandex Link */}
          <a
            href={yandexNaviUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11.5px',
              color: '#f87171',
              fontWeight: '800',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
            title="Открыть эту точку в Яндекс Картах / Навигаторе"
          >
            <span>Яндекс Навигатор</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* 4. Bottom Form Controls & Coordinate Details */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--bg-modal, #0c1221)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '38vh',
          overflowY: 'auto'
        }}>
          {/* Coordinates Bar + Suggested Reverse Geocode */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>GPS Координаты:</span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#38bdf8', fontFamily: 'monospace' }}>
                  {coordStr}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="btn-icon"
                  style={{ padding: '2px 4px', color: copiedCoords ? '#10b981' : '#94a3b8' }}
                  title="Скопировать координаты"
                >
                  {copiedCoords ? <CheckCheck size={13} /> : <Copy size={13} />}
                </button>
              </div>

              {isReverseGeocoding ? (
                <span style={{ fontSize: '11px', color: '#facc15', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Loader2 size={12} className="animate-spin" /> Определение адреса...
                </span>
              ) : suggestedAddress?.street ? (
                <button
                  type="button"
                  onClick={() => {
                    if (suggestedAddress.street) setAddress(suggestedAddress.street);
                    if (suggestedAddress.district) setDistrict(suggestedAddress.district);
                  }}
                  style={{
                    fontSize: '11px',
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Использовать адрес, определенный по карте"
                >
                  <Sparkles size={11} /> Использовать: {suggestedAddress.street}
                </button>
              ) : null}
            </div>
          </div>

          {/* Form Fields: Address, District, Landmark */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>Адрес клиента (Улица, дом, кв.) *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Улица, дом, квартира"
                className="input-field"
                style={{ fontSize: '13px', padding: '8px 10px', height: '38px' }}
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '11px' }}>Район Самарканда</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="select-field"
                style={{ fontSize: '12.5px', padding: '8px 10px', height: '38px' }}
              >
                <option value="Сиёб">Сиёб</option>
                <option value="Багишамальский">Багишамальский</option>
                <option value="Согдиана">Согдиана</option>
                <option value="Микрорайон">Микрорайон</option>
                <option value="Саттепо">Саттепо</option>
                <option value="Железнодорожный">Железнодорожный</option>
                <option value="Самаркандский р-н">Самаркандский р-н</option>
                <option value="Центр">Центр</option>
              </select>
            </div>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ fontSize: '11px' }}>Ориентир</label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Например: Возле Корзинки, напротив школы"
              className="input-field"
              style={{ fontSize: '12.5px', padding: '8px 10px', height: '36px' }}
            />
          </div>

          {/* Action Buttons: Cancel vs Apply */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '10px', fontWeight: '700' }}
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
              style={{
                flex: 2,
                padding: '11px',
                fontSize: '13.5px',
                fontWeight: '900',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} /> Сохранить точку & Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
