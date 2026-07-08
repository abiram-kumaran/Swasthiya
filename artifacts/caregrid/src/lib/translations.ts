import { useState, useEffect } from 'react';

export const INDIAN_LANGUAGES = [
  { code: 'en',  name: 'English',    native: 'English',      flag: '🇮🇳' },
  { code: 'hi',  name: 'Hindi',      native: 'हिन्दी',        flag: '🇮🇳' },
  { code: 'ta',  name: 'Tamil',      native: 'தமிழ்',         flag: '🇮🇳' },
  { code: 'te',  name: 'Telugu',     native: 'తెలుగు',        flag: '🇮🇳' },
  { code: 'kn',  name: 'Kannada',    native: 'ಕನ್ನಡ',         flag: '🇮🇳' },
  { code: 'ml',  name: 'Malayalam',  native: 'മലയാളം',        flag: '🇮🇳' },
  { code: 'mr',  name: 'Marathi',    native: 'मराठी',         flag: '🇮🇳' },
  { code: 'gu',  name: 'Gujarati',   native: 'ગુજરાતી',       flag: '🇮🇳' },
  { code: 'bn',  name: 'Bengali',    native: 'বাংলা',          flag: '🇮🇳' },
  { code: 'pa',  name: 'Punjabi',    native: 'ਪੰਜਾਬੀ',         flag: '🇮🇳' },
  { code: 'or',  name: 'Odia',       native: 'ଓଡ଼ିଆ',           flag: '🇮🇳' },
  { code: 'as',  name: 'Assamese',   native: 'অসমীয়া',        flag: '🇮🇳' },
  { code: 'ur',  name: 'Urdu',       native: 'اردو',           flag: '🇮🇳' },
  { code: 'ks',  name: 'Kashmiri',   native: 'कॉशुर',          flag: '🇮🇳' },
  { code: 'sd',  name: 'Sindhi',     native: 'سنڌي',           flag: '🇮🇳' },
  { code: 'sa',  name: 'Sanskrit',   native: 'संस्कृत',        flag: '🇮🇳' },
  { code: 'ne',  name: 'Nepali',     native: 'नेपाली',         flag: '🇮🇳' },
  { code: 'mai', name: 'Maithili',   native: 'मैथिली',         flag: '🇮🇳' },
  { code: 'bho', name: 'Bhojpuri',   native: 'भोजपुरी',        flag: '🇮🇳' },
  { code: 'kon', name: 'Konkani',    native: 'कोंकणी',         flag: '🇮🇳' },
  { code: 'mni', name: 'Manipuri',   native: 'মৈতৈলোন্',       flag: '🇮🇳' },
  { code: 'doi', name: 'Dogri',      native: 'डोगरी',          flag: '🇮🇳' },
] as const;

export type LangCode = typeof INDIAN_LANGUAGES[number]['code'];
export type Language  = string; // keep broad for compat

/* Core UI strings in the 3 main languages; rest fall back to English */
const T: Record<string, Record<string, string>> = {
  home:            { en: 'Home',      hi: 'होम',     ta: 'முகப்பு' },
  map:             { en: 'Map',       hi: 'मानचित्र', ta: 'வரைபடம்' },
  aiChat:          { en: 'AI Chat',   hi: 'एआई चैट', ta: 'ஏஐ அரட்டை' },
  profile:         { en: 'Profile',   hi: 'प्रोफ़ाइल', ta: 'சுயவிவரம்' },
  abhaCard:        { en: 'ABHA Health Card', hi: 'आभा हेल्थ कार्ड', ta: 'ஆபா சுகாதார அட்டை' },
  blood:           { en: 'Blood',     hi: 'रक्त',    ta: 'இரத்தம்' },
  age:             { en: 'Age',       hi: 'आयु',     ta: 'வயது' },
  allergy:         { en: 'Allergy',   hi: 'एलर्जी',  ta: 'ஒவ்வாமை' },
  aiRecommends:    { en: 'AI Recommends', hi: 'एआई की सिफारिश', ta: 'ஏஐ பரிந்துரைக்கிறது' },
  basedOnFactors:  { en: 'Based on 5 factors', hi: '5 कारकों के आधार पर', ta: '5 காரணிகளின் அடிப்படையில்' },
  bookAppointment: { en: 'Book Appointment', hi: 'अपॉइंटमेंट बुक करें', ta: 'பதிவு செய்ய' },
  viewMaps:        { en: 'View Maps', hi: 'मानचित्र देखें', ta: 'வரைபடம் பார்க்க' },
  nearbyCentres:   { en: 'Nearby Health Centres', hi: 'पास के स्वास्थ्य केंद्र', ta: 'அருகிலுள்ள சுகாதார நிலையங்கள்' },
  viewMapArrow:    { en: 'View Map →', hi: 'मानचित्र देखें →', ta: 'வரைபடம் பார்க்க →' },
  minWait:         { en: 'min wait',  hi: 'मिनट प्रतीक्षा', ta: 'நிமிட காத்திருப்பு' },
  doctors:         { en: 'doctors',   hi: 'डॉक्टर',  ta: 'மருத்துவர்கள்' },
  beds:            { en: 'beds',      hi: 'बिस्तर',  ta: 'படுக்கைகள்' },
  medicineLocator: { en: 'Medicine Locator', hi: 'दवा खोजक', ta: 'மருந்து கண்டறிவி' },
  medicineLocatorDesc: { en: 'Find nearby medicine centres with available stock.', hi: 'उपलब्ध स्टॉक वाले नजदीकी दवा केंद्र खोजें।', ta: 'அருகிலுள்ள மருந்து நிலையங்கள் மற்றும் கையிருப்பு கண்டறிய.' },
  searchPlaceholder: { en: 'Search medicine (e.g. Paracetamol)...', hi: 'दवा खोजें (जैसे पैरासिटामोल)...', ta: 'மருந்து தேடுக (எ.கா. பாராசிட்டமால்)...' },
  quickActions:    { en: 'Quick Actions', hi: 'त्वरित कार्रवाई', ta: 'விரைவு செயல்கள்' },
  emergencySos:    { en: 'Emergency SOS', hi: 'आपातकालीन एसओएस', ta: 'அவசர உதவி (SOS)' },
  sosSent:         { en: '🚨 SOS sent! Help is on the way.', hi: '🚨 एसओएस भेजा गया! मदद आ रही है।', ta: '🚨 அவசர உதவி கோரப்பட்டது! உதவி விரைவில் வரும்.' },
  healthAdvisories:{ en: 'Health Advisories', hi: 'स्वास्थ्य सलाह', ta: 'சுகாதார ஆலோசனைகள்' },
  chatGreeting:    { en: "Hello! I'm CareGrid AI, your personal health assistant. Describe your symptoms and I'll help you find the best care. 🏥", hi: "नमस्ते! मैं CareGrid AI हूं, आपका व्यक्तिगत स्वास्थ्य सहायक। अपने लक्षण बताएं। 🏥", ta: "வணக்கம்! நான் CareGrid AI, உங்கள் தனிப்பட்ட சுகாதார உதவியாளர். உங்கள் அறிகுறிகளை விவரிக்கவும். 🏥" },
  chatPlaceholder: { en: 'Ask me anything about your health…', hi: 'अपने स्वास्थ्य के बारे में कुछ भी पूछें…', ta: 'உங்கள் உடல்நலம் பற்றி எதையும் கேளுங்கள்…' },
  geminiPowered:   { en: 'Gemini-powered', hi: 'जेमिनी द्वारा संचालित', ta: 'ஜெமினி ஆதரவுடையது' },
  worksOffline:    { en: 'Works offline', hi: 'ऑफलाइन काम करता है', ta: 'ஆஃப்லைனில் செயல்படும்' },
  fever:           { en: 'Fever', hi: 'बुखार', ta: 'காய்ச்சல்' },
  headache:        { en: 'Headache', hi: 'सिरदर्द', ta: 'தலைவலி' },
  cough:           { en: 'Cough', hi: 'खांसी', ta: 'இருமல்' },
  stomachPain:     { en: 'Stomach Pain', hi: 'पेट दर्द', ta: 'வயிற்று வலி' },
  emergency:       { en: 'Emergency', hi: 'आपातकाल', ta: 'அவசரம்' },
  healthInfo:      { en: 'Health Information', hi: 'स्वास्थ्य संबंधी जानकारी', ta: 'சுகாதார விவரங்கள்' },
  bloodGroup:      { en: 'Blood Group', hi: 'रक्त समूह', ta: 'இரத்த வகை' },
  weight:          { en: 'Weight', hi: 'वजन', ta: 'எடை' },
  height:          { en: 'Height', hi: 'ऊंचाई', ta: 'உயரம்' },
  currentIssues:   { en: 'Current Health Issues', hi: 'वर्तमान स्वास्थ्य समस्याएं', ta: 'தற்போதைய உடல்நலப் பிரச்சினைகள்' },
  addCondition:    { en: 'Add condition', hi: 'समस्या जोड़ें', ta: 'பிரச்சினையை சேர்க்க' },
  addAllergy:      { en: 'Add allergy', hi: 'एलर्जी जोड़ें', ta: 'ஒவ்வாமை சேர்க்க' },
  medicalHistory:  { en: 'Medical History', hi: 'चिकित्सा इतिहास', ta: 'மருத்துவ வரலாறு' },
  settings:        { en: 'Settings', hi: 'सेटिंग्स', ta: 'அமைப்புகள்' },
  language:        { en: 'Language', hi: 'भाषा', ta: 'மொழி' },
  notifications:   { en: 'Notifications', hi: 'सूचनाएं', ta: 'அறிவிப்புகள்' },
  logout:          { en: 'Logout', hi: 'लॉगआउट', ta: 'வெளியேறு' },
  editProfile:     { en: 'Edit Profile', hi: 'प्रोफ़ाइल संपादित करें', ta: 'விவரம் திருத்த' },
  searchHospitals: { en: 'Search hospitals, clinics...', hi: 'अस्पतालों की खोज करें...', ta: 'மருத்துவமனைகளைத் தேடுக...' },
  nearbyHospitals: { en: 'nearby hospitals & clinics', hi: 'पास के अस्पताल और क्लीनिक', ta: 'அருகிலுள்ள மருத்துவமனைகள்' },
  locationActive:  { en: 'Location active', hi: 'स्थान सक्रिय', ta: 'இடம் செயல்படுகிறது' },
  openNow:         { en: '🟢 Open Now', hi: '🟢 अभी खुला है', ta: '🟢 திறந்துள்ளது' },
  getDirections:   { en: 'Get Directions', hi: 'दिशा-निर्देश प्राप्त करें', ta: 'வழிசெலுத்தவும்' },
  distance:        { en: 'Distance', hi: 'दूरी', ta: 'தொலைவு' },
  status:          { en: 'Status', hi: 'स्थिति', ta: 'நிலை' },
};

function getLangCode(lang: string): string {
  const match = INDIAN_LANGUAGES.find(l => l.name === lang || l.native === lang || l.code === lang);
  return match?.code ?? 'en';
}

export function useTranslation() {
  const [lang, setLangState] = useState<string>(() => {
    return localStorage.getItem('caregrid_lang') ?? 'English';
  });

  const changeLanguage = (newLang: string) => {
    setLangState(newLang);
    localStorage.setItem('caregrid_lang', newLang);
    window.dispatchEvent(new CustomEvent('langChanged', { detail: newLang }));
  };

  useEffect(() => {
    const handle = (e: Event) => {
      const v = (e as CustomEvent<string>).detail ?? localStorage.getItem('caregrid_lang');
      if (v) setLangState(v);
    };
    window.addEventListener('langChanged', handle);
    return () => window.removeEventListener('langChanged', handle);
  }, []);

  const t = (key: string, fallback?: string): string => {
    const code = getLangCode(lang);
    return T[key]?.[code] ?? T[key]?.['en'] ?? fallback ?? key;
  };

  return { t, lang, changeLanguage };
}
