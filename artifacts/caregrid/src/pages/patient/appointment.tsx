import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, MapPin, ChevronLeft, CheckCircle2, X, Star, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/translations';
import { CENTERS } from '@/lib/data';

interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  address: string;
  crowd: 'low' | 'moderate' | 'high';
  isOpen: boolean;
  type: string;
}

interface Booking {
  id: string;
  hospitalId: string;
  hospitalName: string;
  address: string;
  date: string;
  timeSlot: string;
  token: string;
}

// --- Hardcoded Real Hospitals from User's Screenshot ---
const REAL_HOSPITALS = [
  { id: 'h1', name: "SUMITH MULTI SPECIALITY HOSPITAL", lat: 11.036, lng: 77.008, rating: 4.3, reviews: 799, address: "Villankurichi Rd, opp. GRG Ground", crowd: 'low', isOpen: true, type: 'Hospital' },
  { id: 'h2', name: "Kovai Medical Center and Hospital", lat: 11.038, lng: 77.031, rating: 3.3, reviews: 2107, address: "99, Avinashi Rd", crowd: 'high', isOpen: true, type: 'Hospital' },
  { id: 'h3', name: "NG Hospital & Research Centre", lat: 10.995, lng: 77.018, rating: 4.6, reviews: 2031, address: "577, Trichy Rd", crowd: 'moderate', isOpen: true, type: 'Hospital' },
  { id: 'h4', name: "PSG Hospitals", lat: 11.024, lng: 77.002, rating: 4.1, reviews: 5389, address: "Avinashi Rd", crowd: 'low', isOpen: true, type: 'Hospital' },
  { id: 'h5', name: "NALAM HOSPITAL", lat: 11.041, lng: 76.995, rating: 4.0, reviews: 120, address: "Coimbatore", crowd: 'moderate', isOpen: true, type: 'Hospital' },
  { id: 'h6', name: "MEDWIN Hospital", lat: 11.011, lng: 76.985, rating: 4.4, reviews: 310, address: "Coimbatore", crowd: 'low', isOpen: true, type: 'Hospital' }
];

// Combine mock CENTERS with the real ones
const ALL_HOSPITALS: Hospital[] = [
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
    type: c.type,
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

export default function PatientAppointment() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  // Booking Form State
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Load bookings from localStorage
  const [activeBookings, setActiveBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('patient_bookings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // User position coordinates
  const userPos = useMemo(() => {
    const saved = localStorage.getItem('user_pos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { lat: 11.0168, lng: 76.9558 }; // Fallback to Coimbatore Center
  }, []);

  // Filter and sort hospitals by search query & proximity
  const sortedHospitals = useMemo(() => {
    let list = [...ALL_HOSPITALS];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q));
    }
    // Proximity Sort
    list.sort((a, b) => {
      const d1 = Math.pow(a.lat - userPos.lat, 2) + Math.pow(a.lng - userPos.lng, 2);
      const d2 = Math.pow(b.lat - userPos.lat, 2) + Math.pow(b.lng - userPos.lng, 2);
      return d1 - d2;
    });
    return list;
  }, [query, userPos]);

  // Generate next 5 days for date picker
  const nextDays = useMemo(() => {
    const dates = [];
    const locale = 'en-US';
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString(locale, { weekday: 'short' });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString(locale, { month: 'short' });
      dates.push({
        value: d.toISOString().split('T')[0],
        dayName,
        dayNum,
        month,
        full: `${dayName}, ${dayNum} ${month}`
      });
    }
    return dates;
  }, []);

  const timeSlots = ["09:00 AM", "10:30 AM", "02:00 PM", "04:30 PM"];

  const handleBook = () => {
    if (!selectedHospital || !bookingDate || !bookingTime) {
      toast.error("Please select a date and time slot");
      return;
    }

    const token = `SW-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullDate = nextDays.find(d => d.value === bookingDate)?.full || bookingDate;
    
    const newBooking: Booking = {
      id: Date.now().toString(),
      hospitalId: selectedHospital.id,
      hospitalName: selectedHospital.name,
      address: selectedHospital.address,
      date: fullDate,
      timeSlot: bookingTime,
      token
    };

    const updated = [newBooking, ...activeBookings];
    setActiveBookings(updated);
    localStorage.setItem('patient_bookings', JSON.stringify(updated));
    setConfirmedBooking(newBooking);
    toast.success("Appointment Booked Successfully!");
  };

  const handleCancelBooking = (id: string) => {
    const updated = activeBookings.filter(b => b.id !== id);
    setActiveBookings(updated);
    localStorage.setItem('patient_bookings', JSON.stringify(updated));
    toast.success("Appointment Cancelled");
  };

  const handleViewInMap = (hospital: Hospital) => {
    // Save to localStorage so MapPage can focus/open details
    localStorage.setItem('focused_hospital_id', hospital.id);
    navigate('/patient/map');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-[480px] mx-auto relative shadow-xl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 flex-shrink-0 sticky top-0 z-30">
        <button onClick={() => navigate('/patient/home')} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-gray-900 text-base">{t('bookAppointment', 'Book Appointment')}</h1>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Active Tickets */}
        {activeBookings.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('myAppointments', 'My Appointments')}</p>
            {activeBookings.map(b => (
              <div key={b.id} className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full flex items-center justify-center pointer-events-none pr-2 pt-2">
                  <span className="text-[10px] font-black text-blue-600 rotate-12">ACTIVE</span>
                </div>
                <h3 className="font-black text-gray-900 text-sm leading-tight pr-10">{b.hospitalName}</h3>
                <p className="text-[10px] text-gray-400 mt-1 leading-snug">{b.address}</p>
                
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-gray-700">{b.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-semibold text-gray-700">{b.timeSlot}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="bg-blue-50 px-3 py-1 rounded-xl">
                    <span className="text-[10px] text-gray-500 font-medium">Token: </span>
                    <span className="text-xs font-bold text-blue-600">{b.token}</span>
                  </div>
                  <button 
                    onClick={() => handleCancelBooking(b.id)}
                    className="text-[10px] text-red-500 font-bold hover:underline"
                  >
                    Cancel Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('searchHospitals', 'Search Hospital or Clinic')}</p>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-2xl text-xs focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder={t('searchPlaceholder', 'Search by name or street...')}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Hospital List */}
        <div className="space-y-3">
          {sortedHospitals.map(h => {
            const distance = dist(userPos.lat, userPos.lng, h.lat, h.lng);
            return (
              <div key={h.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        h.type === 'Hospital' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {h.type}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">★ {h.rating} ({h.reviews})</span>
                    </div>
                    <h3 className="font-black text-gray-900 text-sm leading-snug">{h.name}</h3>
                    <p className="text-[10px] text-gray-400 leading-tight">{h.address}</p>
                  </div>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full shrink-0">
                    {distance}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => handleViewInMap(h)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {t('viewMap', 'View Map')}
                  </button>
                  <button 
                    onClick={() => setSelectedHospital(h)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Book Slot
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Form Dialog Sheet */}
      <AnimatePresence>
        {selectedHospital && !confirmedBooking && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.5 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedHospital(null)}
              className="absolute inset-0 bg-black z-40"
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('appointmentDetails', 'Booking Details')}</p>
                  <h3 className="font-black text-gray-900 text-sm leading-snug mt-0.5">{selectedHospital.name}</h3>
                </div>
                <button onClick={() => setSelectedHospital(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">{t('selectDate', 'Select Date')}</label>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {nextDays.map(d => {
                    const active = bookingDate === d.value;
                    return (
                      <button
                        key={d.value}
                        onClick={() => setBookingDate(d.value)}
                        className={`shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border text-center transition-all ${
                          active ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-700'
                        }`}
                      >
                        <span className={`text-[9px] uppercase font-bold ${active ? 'text-blue-100' : 'text-gray-400'}`}>{d.dayName}</span>
                        <span className="text-sm font-black mt-0.5">{d.dayNum}</span>
                        <span className={`text-[8px] uppercase font-semibold ${active ? 'text-blue-200' : 'text-gray-400'}`}>{d.month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">{t('selectTime', 'Select Time Slot')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map(tSlot => {
                    const active = bookingTime === tSlot;
                    return (
                      <button
                        key={tSlot}
                        onClick={() => setBookingTime(tSlot)}
                        className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          active ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {tSlot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confirm Action */}
              <button 
                onClick={handleBook}
                className="w-full bg-blue-600 text-white font-black text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                Confirm Appointment & Generate Token
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Receipt Ticket Dialog */}
      <AnimatePresence>
        {confirmedBooking && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-[360px] p-6 shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-green-500" />
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-black text-gray-900 text-lg">Booking Confirmed!</h3>
                <p className="text-xs text-gray-400 mt-1">Show this token at the reception desk</p>
              </div>

              {/* Token Ticket Box */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3 text-left">
                <div className="text-center pb-2 border-b border-dashed border-gray-200">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Appointment Token</p>
                  <p className="text-2xl font-black text-green-600 mt-0.5">{confirmedBooking.token}</p>
                </div>
                <div className="space-y-2 text-xs pt-1">
                  <div>
                    <span className="text-gray-400">Hospital:</span>
                    <p className="font-bold text-gray-800 leading-snug">{confirmedBooking.hospitalName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Date & Time:</span>
                    <p className="font-bold text-gray-800">{confirmedBooking.date} @ {confirmedBooking.timeSlot}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setConfirmedBooking(null);
                  setSelectedHospital(null);
                  setBookingDate('');
                  setBookingTime('');
                }}
                className="w-full bg-gray-900 hover:bg-black text-white font-black text-xs py-3 rounded-xl transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
