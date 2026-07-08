import { useState, useEffect } from 'react';

export type Language = 'English' | 'हिन्दी' | 'தமிழ்';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  English: {
    // Nav / Layout
    home: 'Home',
    map: 'Map',
    aiChat: 'AI Chat',
    profile: 'Profile',
    // Home Page
    abhaCard: 'ABHA Health Card',
    blood: 'Blood',
    age: 'Age',
    allergy: 'Allergy',
    aiRecommends: 'AI Recommends',
    basedOnFactors: 'Based on 5 factors',
    bookAppointment: 'Book Appointment',
    viewMaps: 'View Maps',
    nearbyCentres: 'Nearby Health Centres',
    viewMapArrow: 'View Map →',
    minWait: 'min wait',
    doctors: 'doctors',
    beds: 'beds',
    medicineLocator: 'Medicine Locator',
    medicineLocatorDesc: 'Find nearby medicine centres with available stock.',
    searchPlaceholder: 'Search medicine (e.g. Paracetamol)...',
    quickActions: 'Quick Actions',
    emergencySos: 'Emergency SOS',
    sosSent: '🚨 SOS sent! Help is on the way.',
    healthAdvisories: 'Health Advisories',
    heatwaveAdvisory: 'Heatwave Advisory',
    heatwaveDesc: 'Stay hydrated. Avoid outdoor activity 12pm–4pm.',
    dengueAlert: 'Dengue Alert — Karungal Ward',
    dengueDesc: '14 cases detected. Use mosquito repellent.',
    // Map Page
    searchHospitals: 'Search hospitals, clinics...',
    nearbyHospitals: 'nearby hospitals & clinics',
    locationActive: 'Location active',
    gettingLocation: 'Getting your location...',
    openNow: '🟢 Open Now',
    closed: '🔴 Closed',
    tooCrowded: '🔴 Too Crowded',
    crowded: '🟡 Crowded',
    freeAvailable: '🟢 Free (Available)',
    distance: 'Distance',
    status: 'Status',
    getDirections: 'Get Directions',
    bookGo: 'Book & Go',
    // Chat Page
    chatGreeting: "Hello! I'm your health assistant. You can describe your symptoms in Hindi, Tamil, or English. I'll help you find the right care. 🏥",
    chatPlaceholder: 'Describe your symptoms...',
    listening: 'Listening...',
    speakClearly: 'Speak your symptoms clearly',
    geminiPowered: 'Gemini-powered',
    worksOffline: 'Works offline',
    fever: 'Fever',
    headache: 'Headache',
    cough: 'Cough',
    stomachPain: 'Stomach Pain',
    emergency: 'Emergency',
    // Profile Page
    healthInfo: 'Health Information',
    bloodGroup: 'Blood Group',
    weight: 'Weight',
    height: 'Height',
    currentIssues: 'Current Health Issues',
    addCondition: 'Add condition',
    addAllergy: 'Add allergy',
    emergencyContacts: 'Emergency Contacts',
    relationWife: 'Wife',
    relationBrother: 'Brother',
    medicalHistory: 'Medical History',
    settings: 'Settings',
    language: 'Language',
    notifications: 'Notifications',
    logout: 'Logout',
    editProfile: 'Edit Profile',
  },
  हिन्दी: {
    home: 'होम',
    map: 'मानचित्र',
    aiChat: 'एआई चैट',
    profile: 'प्रोफ़ाइल',
    abhaCard: 'आभा हेल्थ कार्ड',
    blood: 'रक्त',
    age: 'आयु',
    allergy: 'एलर्जी',
    aiRecommends: 'एआई की सिफारिश',
    basedOnFactors: '5 कारकों के आधार पर',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    viewMaps: 'मानचित्र देखें',
    nearbyCentres: 'पास के स्वास्थ्य केंद्र',
    viewMapArrow: 'मानचित्र देखें →',
    minWait: 'मिनट प्रतीक्षा',
    doctors: 'डॉक्टर',
    beds: 'बिस्तर',
    medicineLocator: 'दवा खोजक',
    medicineLocatorDesc: 'उपलब्ध स्टॉक वाले नजदीकी दवा केंद्र खोजें।',
    searchPlaceholder: 'दवा खोजें (जैसे पैरासिटामोल)...',
    quickActions: 'त्वरित कार्रवाई',
    emergencySos: 'आपातकालीन एसओएस',
    sosSent: '🚨 एसओएस भेजा गया! मदद आ रही है।',
    healthAdvisories: 'स्वास्थ्य सलाह',
    heatwaveAdvisory: 'लू की चेतावनी',
    heatwaveDesc: 'हाइड्रेटेड रहें। दोपहर 12 से शाम 4 बजे तक बाहरी गतिविधि से बचें।',
    dengueAlert: 'डेंगू अलर्ट - करंगल वार्ड',
    dengueDesc: '14 मामले सामने आए। मच्छर भगाने वाली दवा का प्रयोग करें।',
    searchHospitals: 'अस्पतालों, क्लीनिकों की खोज करें...',
    nearbyHospitals: 'पास के अस्पताल और क्लीनिक',
    locationActive: 'स्थान सक्रिय',
    gettingLocation: 'आपका स्थान प्राप्त किया जा रहा है...',
    openNow: '🟢 अभी खुला है',
    closed: '🔴 बंद है',
    tooCrowded: '🔴 बहुत भीड़',
    crowded: '🟡 मध्यम भीड़',
    freeAvailable: '🟢 खाली (उपलब्ध)',
    distance: 'दूरी',
    status: 'स्थिति',
    getDirections: 'दिशा-निर्देश प्राप्त करें',
    bookGo: 'बुक करें और जाएं',
    chatGreeting: "नमस्ते! मैं आपका स्वास्थ्य सहायक हूं। आप अपने लक्षणों का वर्णन हिंदी, तमिल या अंग्रेजी में कर सकते हैं। मैं आपको सही देखभाल खोजने में मदद करूंगा। 🏥",
    chatPlaceholder: 'अपने लक्षणों का वर्णन करें...',
    listening: 'सुन रहा हूँ...',
    speakClearly: 'अपने लक्षणों को स्पष्ट रूप से बोलें',
    geminiPowered: 'जेमिनी द्वारा संचालित',
    worksOffline: 'ऑफलाइन काम करता है',
    fever: 'बुखार',
    headache: 'सिरदर्द',
    cough: 'खांसी',
    stomachPain: 'पेट दर्द',
    emergency: 'आपातकाल',
    healthInfo: 'स्वास्थ्य संबंधी जानकारी',
    bloodGroup: 'रक्त समूह',
    weight: 'वजन',
    height: 'ऊंचाई',
    currentIssues: 'वर्तमान स्वास्थ्य समस्याएं',
    addCondition: 'समस्या जोड़ें',
    addAllergy: 'एलर्जी जोड़ें',
    emergencyContacts: 'आपातकालीन संपर्क',
    relationWife: 'पत्नी',
    relationBrother: 'भाई',
    medicalHistory: 'चिकित्सा इतिहास',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    logout: 'लॉगआउट',
    editProfile: 'प्रोफ़ाइल संपादित करें',
  },
  தமிழ்: {
    home: 'முகப்பு',
    map: 'வரைபடம்',
    aiChat: 'ஏஐ அரட்டை',
    profile: 'சுயவிவரம்',
    abhaCard: 'ஆபா சுகாதார அட்டை',
    blood: 'இரத்தம்',
    age: 'வயது',
    allergy: 'ஒவ்வாமை',
    aiRecommends: 'ஏஐ பரிந்துரைக்கிறது',
    basedOnFactors: '5 காரணிகளின் அடிப்படையில்',
    bookAppointment: 'பதிவு செய்ய',
    viewMaps: 'வரைபடம் பார்க்க',
    nearbyCentres: 'அருகிலுள்ள சுகாதார நிலையங்கள்',
    viewMapArrow: 'வரைபடம் பார்க்க →',
    minWait: 'நிமிட காத்திருப்பு',
    doctors: 'மருத்துவர்கள்',
    beds: 'படுக்கைகள்',
    medicineLocator: 'மருந்து கண்டறிவி',
    medicineLocatorDesc: 'அருகிலுள்ள மருந்து நிலையங்கள் மற்றும் கையிருப்பு கண்டறிய.',
    searchPlaceholder: 'மருந்து தேடுக (எ.கா. பாராசிட்டமால்)...',
    quickActions: 'விரைவு செயல்கள்',
    emergencySos: 'அவசர உதவி (SOS)',
    sosSent: '🚨 அவசர உதவி கோரப்பட்டது! உதவி விரைவில் வரும்.',
    healthAdvisories: 'சுகாதார ஆலோசனைகள்',
    heatwaveAdvisory: 'வெப்ப அலை ஆலோசனை',
    heatwaveDesc: 'நிறைய தண்ணீர் குடிக்கவும். மதியம் 12 மணி முதல் மாலை 4 மணி வரை வெளியில் செல்வதை தவிர்க்கவும்.',
    dengueAlert: 'டெங்கு எச்சரிக்கை — கருங்கல் வார்டு',
    dengueDesc: '14 பாதிப்புகள் கண்டறியப்பட்டுள்ளது. கொசு விரட்டியைப் பயன்படுத்தவும்.',
    searchHospitals: 'மருத்துவமனைகளைத் தேடுக...',
    nearbyHospitals: 'அருகிலுள்ள மருத்துவமனைகள்',
    locationActive: 'இடம் செயல்படுகிறது',
    gettingLocation: 'உங்கள் இருப்பிடத்தை கண்டறிகிறது...',
    openNow: '🟢 திறந்துள்ளது',
    closed: '🔴 மூடப்பட்டுள்ளது',
    tooCrowded: '🔴 அதிக கூட்டம்',
    crowded: '🟡 நடுத்தர கூட்டம்',
    freeAvailable: '🟢 கூட்டம் இல்லை (செல்லலாம்)',
    distance: 'தொலைவு',
    status: 'நிலை',
    getDirections: 'வழிசெலுத்தவும்',
    bookGo: 'பதிவு செய்து செல்லவும்',
    chatGreeting: "வணக்கம்! நான் உங்கள் சுகாதார உதவியாளர். உங்கள் அறிகுறிகளை தமிழ், இந்தி அல்லது ஆங்கிலத்தில் விவரிக்கலாம். உங்களுக்கு சரியான சிகிச்சையை கண்டறிய நான் உதவுகிறேன். 🏥",
    chatPlaceholder: 'உங்கள் அறிகுறிகளை விவரிக்கவும்...',
    listening: 'கேட்கிறது...',
    speakClearly: 'உங்கள் அறிகுறிகளை தெளிவாகக் கூறவும்',
    geminiPowered: 'ஜெமினி ஆதரவுடையது',
    worksOffline: 'ஆஃப்லைனில் செயல்படும்',
    fever: 'காய்ச்சல்',
    headache: 'தலைவலி',
    cough: 'இருமல்',
    stomachPain: 'வயிற்று வலி',
    emergency: 'அவசரம்',
    healthInfo: 'சுகாதார விவரங்கள்',
    bloodGroup: 'இரத்த வகை',
    weight: 'எடை',
    height: 'உயரம்',
    currentIssues: 'தற்போதைய உடல்நலப் பிரச்சினைகள்',
    addCondition: 'பிரச்சினையை சேர்க்க',
    addAllergy: 'ஒவ்வாமை சேர்க்க',
    emergencyContacts: 'அவசரகால தொடர்புகள்',
    relationWife: 'மனைவி',
    relationBrother: 'சகோதரன்',
    medicalHistory: 'மருத்துவ வரலாறு',
    settings: 'அமைப்புகள்',
    language: 'மொழி',
    notifications: 'அறிவிப்புகள்',
    logout: 'வெளியேறு',
    editProfile: 'விவரம் திருத்த',
  }
};

export function useTranslation() {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('caregrid_lang');
    if (saved === 'हिन्दी' || saved === 'தமிழ்') return saved;
    return 'English';
  });

  const changeLanguage = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('caregrid_lang', newLang);
    window.dispatchEvent(new CustomEvent('langChanged', { detail: newLang }));
  };

  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail) {
        setLangState(customEvent.detail);
      } else {
        const saved = localStorage.getItem('caregrid_lang') as Language;
        if (saved === 'English' || saved === 'हिन्दी' || saved === 'தமிழ்') {
          setLangState(saved);
        }
      }
    };

    window.addEventListener('langChanged', handleStorageChange);
    return () => window.removeEventListener('langChanged', handleStorageChange);
  }, []);

  const t = (key: string, defaultText?: string): string => {
    return TRANSLATIONS[lang]?.[key] || defaultText || key;
  };

  return { t, lang, changeLanguage };
}
