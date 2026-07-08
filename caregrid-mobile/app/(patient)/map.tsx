import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, ActivityIndicator, Linking, Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/data';

const MAPS_KEY = 'AIzaSyDXWdXKaSpKOFEuxq0sFV89F-WaOxIs9Gs';
const { height: SCREEN_H } = Dimensions.get('window');

/* ─── Types ───────────────────────────────────────────── */
interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
  types?: string[];
  photos?: Array<{ photo_reference: string }>;
}

interface PlaceDetail extends PlaceResult {
  formatted_phone_number?: string;
  website?: string;
  formatted_address?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
}

/* ─── Distance helper ─────────────────────────────────── */
function calcDist(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

/* ─── Hospital Detail Sheet ───────────────────────────── */
function HospitalSheet({
  place, distance, onClose,
}: { place: PlaceDetail; distance: string; onClose: () => void }) {
  const isOpen = place.opening_hours?.open_now;
  const isHospital = place.types?.includes('hospital');
  const lat = place.geometry.location.lat;
  const lng = place.geometry.location.lng;

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${place.place_id}&travelmode=driving`;
    Linking.openURL(url);
  };

  const callHospital = () => {
    if (place.formatted_phone_number) {
      Linking.openURL(`tel:${place.formatted_phone_number}`);
    } else {
      Alert.alert('No phone number available');
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={sheet.container}>
        {/* Handle + Close */}
        <View style={sheet.header}>
          <View style={sheet.handle} />
          <TouchableOpacity onPress={onClose} style={sheet.closeBtn}>
            <Ionicons name="close" size={20} color={COLORS.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={sheet.content} showsVerticalScrollIndicator={false}>
          {/* Hospital name & status */}
          <View style={sheet.nameRow}>
            <View style={[sheet.typeIcon, { backgroundColor: isHospital ? '#ede9fe' : '#dbeafe' }]}>
              <Ionicons name="medical" size={24} color={isHospital ? '#7c3aed' : COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sheet.name}>{place.name}</Text>
              <Text style={sheet.address}>{place.formatted_address ?? place.vicinity}</Text>
              {isOpen !== undefined && (
                <View style={[sheet.openBadge, { backgroundColor: isOpen ? '#f0fdf4' : '#fef2f2' }]}>
                  <View style={[sheet.openDot, { backgroundColor: isOpen ? COLORS.green : COLORS.red }]} />
                  <Text style={[sheet.openText, { color: isOpen ? COLORS.green : COLORS.red }]}>
                    {isOpen ? 'Open Now' : 'Closed Now'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats row */}
          <View style={sheet.statsRow}>
            <View style={sheet.statCard}>
              <Ionicons name="navigate" size={18} color={COLORS.primary} />
              <Text style={sheet.statVal}>{distance}</Text>
              <Text style={sheet.statLabel}>Distance</Text>
            </View>
            <View style={sheet.statCard}>
              <Ionicons name="star" size={18} color="#f59e0b" />
              <Text style={sheet.statVal}>{place.rating ? place.rating.toFixed(1) : 'N/A'}</Text>
              <Text style={sheet.statLabel}>{place.user_ratings_total ? `${place.user_ratings_total} reviews` : 'Rating'}</Text>
            </View>
            <View style={sheet.statCard}>
              <Ionicons name="time" size={18} color={COLORS.orange} />
              <Text style={sheet.statVal}>{isOpen === undefined ? '—' : isOpen ? 'Open' : 'Closed'}</Text>
              <Text style={sheet.statLabel}>Status</Text>
            </View>
          </View>

          {/* Phone */}
          {place.formatted_phone_number && (
            <TouchableOpacity onPress={callHospital} style={sheet.infoRow}>
              <Ionicons name="call" size={16} color={COLORS.green} />
              <Text style={[sheet.infoText, { color: COLORS.green }]}>{place.formatted_phone_number}</Text>
            </TouchableOpacity>
          )}

          {/* Website */}
          {place.website && (
            <TouchableOpacity onPress={() => Linking.openURL(place.website!)} style={sheet.infoRow}>
              <Ionicons name="globe" size={16} color={COLORS.primary} />
              <Text style={[sheet.infoText, { color: COLORS.primary }]} numberOfLines={1}>{place.website}</Text>
            </TouchableOpacity>
          )}

          {/* Opening hours */}
          {place.opening_hours?.weekday_text && (
            <View style={sheet.hoursBox}>
              <Text style={sheet.hoursTitle}>Opening Hours</Text>
              {place.opening_hours.weekday_text.map((line, i) => (
                <Text key={i} style={sheet.hoursLine}>{line}</Text>
              ))}
            </View>
          )}

          {/* Types */}
          {place.types && place.types.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {place.types.slice(0, 5).map(t => (
                <View key={t} style={sheet.typeChip}>
                  <Text style={sheet.typeChipText}>{t.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action buttons */}
          <View style={sheet.actionRow}>
            <TouchableOpacity onPress={openDirections} style={sheet.directionsBtn} activeOpacity={0.85}>
              <Ionicons name="navigate-circle" size={20} color="#fff" />
              <Text style={sheet.directionsBtnText}>Get Directions</Text>
            </TouchableOpacity>
            {place.formatted_phone_number && (
              <TouchableOpacity onPress={callHospital} style={sheet.callBtn} activeOpacity={0.85}>
                <Ionicons name="call" size={18} color={COLORS.green} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={sheet.poweredBy}>📍 Powered by Google Maps</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ─── Main Map Screen ─────────────────────────────────── */
export default function PatientMap() {
  const mapRef = useRef<MapView>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [selected, setSelected] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  /* Get user location */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setUserLoc({ lat, lng });
        setLocating(false);
        searchNearby(lat, lng, '');
      } else {
        // Fallback: Erode, TN
        const lat = 11.0168, lng = 76.9558;
        setUserLoc({ lat, lng });
        setLocating(false);
        Alert.alert('Location Access', 'Using default location (Erode). Allow location for accurate results.');
        searchNearby(lat, lng, '');
      }
    })();
  }, []);

  /* Nearby search via Places API */
  const searchNearby = useCallback(async (lat: number, lng: number, keyword: string) => {
    setSearching(true);
    try {
      const typeQuery = keyword.trim()
        ? buildKeyword(keyword)
        : 'hospital';

      // Use textSearch for flexible results
      const url =
        `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(typeQuery + ' near me')}` +
        `&location=${lat},${lng}` +
        `&radius=10000` +
        `&key=${MAPS_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        setPlaces(data.results.slice(0, 20));
      } else {
        // Fallback: nearbySearch with type hospital
        const fallbackUrl =
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
          `?location=${lat},${lng}` +
          `&radius=10000` +
          `&type=hospital` +
          `&key=${MAPS_KEY}`;
        const res2 = await fetch(fallbackUrl);
        const data2 = await res2.json();
        if (data2.status === 'OK') {
          setPlaces(data2.results.slice(0, 20));
        } else {
          Alert.alert('Places API', `Status: ${data2.status}\nEnable Places API in Google Cloud Console.`);
        }
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not fetch nearby hospitals.');
    }
    setSearching(false);
    setLoading(false);
  }, []);

  /* Fetch full place details when a marker is tapped */
  const fetchDetails = async (placeId: string) => {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${placeId}` +
        `&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,geometry,types,vicinity` +
        `&key=${MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK') {
        setSelected(data.result as PlaceDetail);
      }
    } catch (_) {
      Alert.alert('Error', 'Could not load hospital details.');
    }
  };

  /* Debounced search */
  useEffect(() => {
    if (!userLoc) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchNearby(userLoc.lat, userLoc.lng, query);
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, userLoc, searchNearby]);

  if (locating) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location…</Text>
      </View>
    );
  }

  const pinColor = (types?: string[]) =>
    types?.includes('hospital') ? '#8b5cf6' : COLORS.primary;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={COLORS.textSub} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hospitals, clinics, specialty…"
          placeholderTextColor={COLORS.textLight}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {searching
          ? <ActivityIndicator size="small" color={COLORS.primary} />
          : query
            ? <TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={16} color={COLORS.textSub} /></TouchableOpacity>
            : null
        }
      </View>

      {/* Result count */}
      {places.length > 0 && (
        <View style={styles.countPill}>
          <Ionicons name="location" size={11} color={COLORS.primary} />
          <Text style={styles.countText}>{places.length} hospitals nearby</Text>
        </View>
      )}

      {/* Google Map */}
      {userLoc && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: userLoc.lat,
            longitude: userLoc.lng,
            latitudeDelta: 0.07,
            longitudeDelta: 0.07,
          }}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          showsPointsOfInterest={false}
        >
          {/* Accuracy circle */}
          <Circle
            center={{ latitude: userLoc.lat, longitude: userLoc.lng }}
            radius={200}
            fillColor="rgba(66,133,244,0.1)"
            strokeColor="rgba(66,133,244,0.3)"
            strokeWidth={1}
          />

          {/* Hospital markers */}
          {places.map((place, i) => (
            <Marker
              key={place.place_id}
              coordinate={{
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
              }}
              pinColor={pinColor(place.types)}
              onPress={() => fetchDetails(place.place_id)}
            >
              <Callout tooltip={false}>
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutName}>{place.name}</Text>
                  {place.rating && (
                    <Text style={styles.calloutRating}>★ {place.rating}</Text>
                  )}
                  <Text style={styles.calloutTap}>Tap for details</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Bottom hospital list strip */}
      {places.length > 0 && (
        <View style={styles.strip}>
          <Text style={styles.stripTitle}>Nearby Hospitals & Clinics</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}
          >
            {places.slice(0, 12).map(place => {
              const isOpen = place.opening_hours?.open_now;
              const dist = userLoc
                ? calcDist(userLoc.lat, userLoc.lng,
                    place.geometry.location.lat, place.geometry.location.lng)
                : '';
              return (
                <TouchableOpacity
                  key={place.place_id}
                  onPress={() => {
                    mapRef.current?.animateToRegion({
                      latitude: place.geometry.location.lat,
                      longitude: place.geometry.location.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }, 600);
                    fetchDetails(place.place_id);
                  }}
                  style={styles.listCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.listCardHeader}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: isOpen === false ? COLORS.red : isOpen ? COLORS.green : '#94a3b8' }
                    ]} />
                    <Text style={styles.listName} numberOfLines={1}>{place.name}</Text>
                  </View>
                  <Text style={styles.listSub} numberOfLines={1}>{(place.vicinity ?? '').split(',')[0]}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    {dist && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="navigate-outline" size={10} color={COLORS.textSub} />
                        <Text style={styles.listMeta}>{dist}</Text>
                      </View>
                    )}
                    {place.rating && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="star" size={10} color="#f59e0b" />
                        <Text style={styles.listMeta}>{place.rating}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Hospital detail modal */}
      {selected && userLoc && (
        <HospitalSheet
          place={selected}
          distance={calcDist(
            userLoc.lat, userLoc.lng,
            selected.geometry.location.lat,
            selected.geometry.location.lng
          )}
          onClose={() => setSelected(null)}
        />
      )}
    </View>
  );
}

/* ─── Keyword mapper ──────────────────────────────────── */
function buildKeyword(q: string): string {
  const l = q.toLowerCase();
  if (/fever|cold|flu|viral/.test(l))    return 'general physician clinic';
  if (/heart|chest|cardiac/.test(l))     return 'hospital emergency cardiology';
  if (/eye|vision/.test(l))              return 'eye hospital ophthalmologist';
  if (/child|baby|paed/.test(l))         return 'paediatric children hospital';
  if (/dental|tooth/.test(l))            return 'dental clinic';
  if (/bone|ortho/.test(l))              return 'orthopaedic hospital';
  if (/skin|rash|derma/.test(l))         return 'dermatology skin clinic';
  if (/emergency|urgent/.test(l))        return 'emergency hospital';
  if (/phc|government|govt/.test(l))     return 'government primary health centre';
  return `hospital ${q}`;
}

/* ─── Styles ──────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.bg },
  loadingText: { color: COLORS.textSub, fontSize: 13 },
  searchBar: {
    position: 'absolute', top: 52, left: 12, right: 12, zIndex: 10,
    backgroundColor: '#fff', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11, gap: 9,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  countPill: {
    position: 'absolute', top: 108, left: 12, zIndex: 10,
    backgroundColor: '#fff', borderRadius: 100,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  countText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  map: { flex: 1 },
  calloutBox: { backgroundColor: '#fff', borderRadius: 10, padding: 10, minWidth: 150, maxWidth: 220, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  calloutName: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  calloutRating: { fontSize: 12, color: '#f59e0b', marginBottom: 2 },
  calloutTap: { fontSize: 10, color: COLORS.textSub },
  strip: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, paddingBottom: 14 },
  stripTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textSub, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 14, marginBottom: 8 },
  listCard: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border, minWidth: 160, maxWidth: 200 },
  listCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  listName: { fontSize: 12, fontWeight: '800', color: COLORS.text, flex: 1 },
  listSub: { fontSize: 10, color: COLORS.textSub },
  listMeta: { fontSize: 10, color: COLORS.textSub },
});

/* ─── Sheet Styles ────────────────────────────────────── */
const sheet = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  handle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginBottom: 8 },
  closeBtn: { position: 'absolute', right: 16, top: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 40 },
  nameRow: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  typeIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name: { fontSize: 17, fontWeight: '900', color: COLORS.text, lineHeight: 23 },
  address: { fontSize: 12, color: COLORS.textSub, marginTop: 3, lineHeight: 17 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6, alignSelf: 'flex-start' },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border },
  statVal: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: 9, color: COLORS.textSub, textAlign: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  infoText: { fontSize: 13, flex: 1 },
  hoursBox: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  hoursTitle: { fontSize: 12, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  hoursLine: { fontSize: 12, color: COLORS.textSub, marginBottom: 3 },
  typeChip: { backgroundColor: '#eff6ff', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  typeChipText: { fontSize: 10, color: COLORS.primary, fontWeight: '600', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  directionsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 14 },
  directionsBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  callBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  poweredBy: { textAlign: 'center', fontSize: 11, color: COLORS.textLight, marginTop: 20 },
});
