import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Navigation, MapPin, Clock, Star, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CENTERS } from '@/lib/data';
import { useTranslation } from '@/lib/translations';

// --- Icons ---
function createCustomIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${color}"/>
      <circle cx="18" cy="17" r="8" fill="white"/>
      <text x="18" y="21" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">+</text>
    </svg>`;
  return L.divIcon({
    className: '', // Prevents Leaflet's default white box
    html: svg,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
  });
}

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width: 20px; height: 20px; background-color: #4285f4; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const redIcon = createCustomIcon('#dc2626');     // Too crowded
const yellowIcon = createCustomIcon('#f59e0b');  // Crowded
const greenIcon = createCustomIcon('#10b981');   // Free

// --- Types ---
interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  crowd: 'low' | 'moderate' | 'high';
  rating: number;
  reviews: number;
  isOpen: boolean;
}

// --- Hardcoded Real Hospitals from User's Screenshot ---
const REAL_HOSPITALS: Place[] = [
  { id: 'h1', name: "SUMITH MULTI SPECIALITY HOSPITAL", lat: 11.036, lng: 77.008, rating: 4.3, reviews: 799, address: "Villankurichi Rd, opp. GRG Ground", crowd: 'low', isOpen: true },
  { id: 'h2', name: "Kovai Medical Center and Hospital", lat: 11.038, lng: 77.031, rating: 3.3, reviews: 2107, address: "99, Avinashi Rd", crowd: 'high', isOpen: true },
  { id: 'h3', name: "NG Hospital & Research Centre", lat: 10.995, lng: 77.018, rating: 4.6, reviews: 2031, address: "577, Trichy Rd", crowd: 'moderate', isOpen: true },
  { id: 'h4', name: "PSG Hospitals", lat: 11.024, lng: 77.002, rating: 4.1, reviews: 5389, address: "Avinashi Rd", crowd: 'low', isOpen: true },
  { id: 'h5', name: "NALAM HOSPITAL", lat: 11.041, lng: 76.995, rating: 4.0, reviews: 120, address: "Coimbatore", crowd: 'moderate', isOpen: true },
  { id: 'h6', name: "MEDWIN Hospital", lat: 11.011, lng: 76.985, rating: 4.4, reviews: 310, address: "Coimbatore", crowd: 'low', isOpen: true }
];

// Combine mock CENTERS with the real ones
const ALL_PLACES: Place[] = [
  ...REAL_HOSPITALS,
  ...CENTERS.map(c => ({
    id: c.id,
    name: c.name,
    address: `${c.district}, Tamil Nadu`,
    lat: c.lat,
    lng: c.lng,
    crowd: c.crowd,
    rating: 4.5,
    reviews: 150,
    isOpen: true,
  }))
];

// --- Haversine distance ---
function dist(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

// --- Map Center & Bounds Updater Component ---
function MapController({ center, places }: { center: [number, number], places: Place[] }) {
  const map = useMap();
  useEffect(() => {
    if (places.length > 0) {
      const bounds = L.latLngBounds([center]);
      places.forEach(p => bounds.extend([p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, 13);
    }
  }, [map, center, places]);
  return null;
}

// --- Place Detail Sheet ---
function PlaceSheet({ place, userLat, userLng, onClose }: { place: Place; userLat: number; userLng: number; onClose: () => void; }) {
  const distance = dist(userLat, userLng, place.lat, place.lng);
  const { t } = useTranslation();
  // Construct a maps.google.com URL since they want real navigation
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=driving`;

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[2000] max-h-[72vh] overflow-y-auto"
    >
      <div className="p-5 pb-8">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200">
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pr-10">
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-gray-900 text-sm leading-tight">{place.name}</h2>
            <p className="text-gray-400 text-[11px] mt-0.5 leading-snug">{place.address}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${place.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {place.isOpen ? t('openNow', '🟢 Open Now') : t('closed', '🔴 Closed')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">🏥 Hospital</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                place.crowd === 'high' ? 'bg-red-100 text-red-700' : 
                place.crowd === 'moderate' ? 'bg-amber-100 text-amber-700' : 
                'bg-green-100 text-green-700'
              }`}>
                {place.crowd === 'high' ? t('tooCrowded', '🔴 Too Crowded') : place.crowd === 'moderate' ? t('crowded', '🟡 Crowded') : t('freeAvailable', '🟢 Free (Available)')}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: <Navigation className="w-3.5 h-3.5 text-blue-500" />, val: distance, label: t('distance', 'Distance') },
            { icon: <Star className="w-3.5 h-3.5 text-amber-400" />, val: place.rating.toFixed(1), label: `${place.reviews} reviews` },
            { icon: <Clock className="w-3.5 h-3.5 text-orange-400" />, val: place.isOpen ? t('openNow', 'Open Now') : t('closed', 'Closed'), label: t('status', 'Status') },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-2xl p-2.5 text-center">
              <div className="flex justify-center mb-1">{item.icon}</div>
              <p className="font-black text-gray-800 text-xs">{item.val}</p>
              <p className="text-gray-400 text-[10px] leading-tight">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600 text-white text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
            <Navigation className="w-3.5 h-3.5" /> {t('getDirections', 'Get Directions')}
          </a>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => toast.success('Appointment noted!', { description: `Head to ${place.name}` })} className="flex-1 bg-green-500 text-white text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> {t('bookGo', 'Book & Go')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Map Page ─────────────────────────────────────────
export default function PatientMap() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(() => {
    const saved = localStorage.getItem('user_pos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [selected, setSelected] = useState<Place | null>(null);
  const [locating, setLocating] = useState(!userPos);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter places based on search
  const filteredPlaces = useMemo(() => {
    if (!userPos) return [];
    
    let result = ALL_PLACES;
    if (debouncedQuery.trim()) {
      const lower = debouncedQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lower) || p.address.toLowerCase().includes(lower));
    }
    
    // Sort by distance
    result.sort((a, b) => {
      const d1 = Math.pow(a.lat - userPos.lat, 2) + Math.pow(a.lng - userPos.lng, 2);
      const d2 = Math.pow(b.lat - userPos.lat, 2) + Math.pow(b.lng - userPos.lng, 2);
      return d1 - d2;
    });
    
    return result.slice(0, 20); // Show top 20
  }, [debouncedQuery, userPos]);

  // Get User Location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        localStorage.setItem('user_pos', JSON.stringify(coords));
        setLocating(false);
      },
      () => {
        // Fallback to Coimbatore if location denied
        if (!userPos) {
          toast.warning('Using approximate location. Allow location for accurate results.');
          const fallback = { lat: 11.0168, lng: 76.9558 };
          setUserPos(fallback);
          localStorage.setItem('user_pos', JSON.stringify(fallback));
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Check for auto-focused hospital from booking page
  useEffect(() => {
    const focusedId = localStorage.getItem('focused_hospital_id');
    if (focusedId) {
      const found = ALL_PLACES.find(p => p.id === focusedId);
      if (found) {
        setSelected(found);
      }
      localStorage.removeItem('focused_hospital_id');
    }
  }, []);

  if (locating) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-white items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-500 text-sm">{t('gettingLocation', 'Getting your location...')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] relative bg-white overflow-hidden">
      {/* Search bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-3 pt-3 pb-2 bg-white/95 backdrop-blur-sm shadow-sm pointer-events-auto">
        <div className="flex items-center bg-gray-100 rounded-2xl px-3 py-2.5 gap-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
            placeholder={t('searchHospitals', 'Search hospitals, clinics...')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')}><X className="w-4 h-4 text-gray-400" /></button>
          )}
        </div>
        <div className="flex items-center justify-between mt-1 px-1">
          <p className="text-[11px] text-blue-600 font-semibold">
            {filteredPlaces.length} {t('nearbyHospitals', 'nearby hospitals & clinics')}
          </p>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full bg-green-500`} />
            <span className="text-[10px] text-gray-400">{t('locationActive', 'Location active')}</span>
          </div>
        </div>
      </div>

      {/* Map using Leaflet & Google Map Tiles */}
      <div className="flex-1 relative z-0">
        {userPos && (
          <MapContainer 
            center={[userPos.lat, userPos.lng]} 
            zoom={13} 
            zoomControl={false} 
            style={{ width: '100%', height: '100%' }}
          >
            {/* 
              This seamlessly loads Google Maps styling/tiles, 
              giving the exact 100% GMap look without requiring an API key. 
            */}
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
            />
            
            <MapController center={[userPos.lat, userPos.lng]} places={filteredPlaces} />

            {/* User Blue Dot */}
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />

            {/* Hospital Markers perfectly color coded by crowd size */}
            {filteredPlaces.map(p => {
              const icon = p.crowd === 'high' ? redIcon : p.crowd === 'moderate' ? yellowIcon : greenIcon;
              return (
                <Marker 
                  key={p.id} 
                  position={[p.lat, p.lng]} 
                  icon={icon} 
                  eventHandlers={{
                    click: () => setSelected(p)
                  }} 
                />
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Detail sheet */}
      <AnimatePresence>
        {selected && userPos && (
          <PlaceSheet place={selected} userLat={userPos.lat} userLng={userPos.lng} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
