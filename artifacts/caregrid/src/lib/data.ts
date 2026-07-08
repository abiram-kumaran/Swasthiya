/* ─────────────────────────────────────────────────────────
   CareGrid AI — Central Mock Data Store
   All 4 portals share this data layer.
───────────────────────────────────────────────────────── */

export interface PHC {
  id: string; name: string; type: 'PHC'|'CHC'; district: string;
  lat: number; lng: number;
  crowd: 'low'|'moderate'|'high'; waitMins: number;
  doctors: number; doctorsTotal: number;
  beds: number; bedsTotal: number;
  medicines: number; medicinesTotal: number; /* % */
  tests: number; /* % */
  status: 'healthy'|'warning'|'critical';
  footfallToday: number; footfallCapacity: number;
  riskScore: number; /* 0-100 */
  lastUpdated: string;
}

export interface Medicine {
  id: string; name: string; category: string;
  centerId: string; centerName: string;
  quantity: number; unit: string;
  dailyBurnRate: number; daysLeft: number;
  status: 'ok'|'low'|'critical'|'surplus';
  expiryDate: string; reorderLevel: number;
  predictedStockout: string | null;
  aiRecommendedOrder: number;
}

export interface AIAction {
  id: string; type: 'medicine'|'doctor'|'beds'|'disease'|'footfall';
  severity: 'info'|'warning'|'critical';
  phcId: string; phcName: string;
  title: string; message: string;
  recommendation: string;
  approved: boolean; rejected: boolean;
  createdAt: string;
  meta?: Record<string, string|number>;
}

export interface Patient {
  id: string; name: string; abhaId: string;
  age: number; gender: 'M'|'F'; bloodGroup: string;
  phone: string; village: string;
  conditions: string[]; allergies: string[];
  lastVisit: string; tokenNumber: number|null;
  priority: 'normal'|'senior'|'pregnant'|'child'|'emergency';
}

export interface DispatchRoute {
  id: string; driverId: string; driverName: string;
  fromCenter: string; toCenter: string;
  payload: string; payloadQty: number;
  status: 'pending'|'in_transit'|'delivered'|'cancelled';
  priority: 'normal'|'urgent'|'emergency';
  createdAt: string; eta: string;
  lat?: number; lng?: number;
}

/* ── PHC / CHC Centers ────────────────────────────────── */
export const CENTERS: PHC[] = [
  {
    id:'phc-01', name:'Peelamedu Urban PHC', type:'PHC', district:'Coimbatore',
    lat:11.0251, lng:76.9972, crowd:'high', waitMins:150,
    doctors:1, doctorsTotal:3, beds:0, bedsTotal:30,
    medicines:8, medicinesTotal:100, tests:40, status:'critical',
    footfallToday:187, footfallCapacity:120, riskScore:88,
    lastUpdated:'2 min ago',
  },
  {
    id:'phc-02', name:'Singanallur Urban PHC', type:'PHC', district:'Coimbatore',
    lat:11.0022, lng:77.0241, crowd:'moderate', waitMins:60,
    doctors:2, doctorsTotal:3, beds:6, bedsTotal:30,
    medicines:55, medicinesTotal:100, tests:70, status:'warning',
    footfallToday:95, footfallCapacity:120, riskScore:52,
    lastUpdated:'5 min ago',
  },
  {
    id:'phc-03', name:'Kalapatti PHC', type:'PHC', district:'Coimbatore',
    lat:11.0712, lng:77.0425, crowd:'low', waitMins:20,
    doctors:3, doctorsTotal:3, beds:14, bedsTotal:30,
    medicines:82, medicinesTotal:100, tests:90, status:'healthy',
    footfallToday:44, footfallCapacity:120, riskScore:18,
    lastUpdated:'1 min ago',
  },
  {
    id:'chc-01', name:'Peelamedu CHC', type:'CHC', district:'Coimbatore',
    lat:11.0260, lng:77.0040, crowd:'low', waitMins:15,
    doctors:6, doctorsTotal:8, beds:28, bedsTotal:100,
    medicines:91, medicinesTotal:100, tests:95, status:'healthy',
    footfallToday:88, footfallCapacity:300, riskScore:12,
    lastUpdated:'Just now',
  },
  {
    id:'phc-04', name:'Sowripalayam Urban PHC', type:'PHC', district:'Coimbatore',
    lat:11.0069, lng:77.0012, crowd:'moderate', waitMins:45,
    doctors:2, doctorsTotal:3, beds:8, bedsTotal:30,
    medicines:61, medicinesTotal:100, tests:65, status:'warning',
    footfallToday:72, footfallCapacity:120, riskScore:44,
    lastUpdated:'8 min ago',
  },
];

/* ── Medicines ────────────────────────────────────────── */
export const MEDICINES: Medicine[] = [
  { id:'m1',  name:'Paracetamol 500mg',    category:'Analgesic',    centerId:'phc-01', centerName:'PHC-Alpha',   quantity:5,    unit:'tabs',   dailyBurnRate:40, daysLeft:0,   status:'critical', expiryDate:'2026-12-01', reorderLevel:200, predictedStockout:'Today',     aiRecommendedOrder:500  },
  { id:'m2',  name:'ORS Sachets',          category:'Rehydration',  centerId:'phc-01', centerName:'PHC-Alpha',   quantity:12,   unit:'packs',  dailyBurnRate:8,  daysLeft:1,   status:'critical', expiryDate:'2027-03-15', reorderLevel:100, predictedStockout:'Tomorrow',  aiRecommendedOrder:200  },
  { id:'m3',  name:'Amoxicillin 250mg',    category:'Antibiotic',   centerId:'phc-01', centerName:'PHC-Alpha',   quantity:80,   unit:'caps',   dailyBurnRate:10, daysLeft:8,   status:'low',      expiryDate:'2026-11-20', reorderLevel:100, predictedStockout:'Aug 12',    aiRecommendedOrder:150  },
  { id:'m4',  name:'Metformin 500mg',      category:'Antidiabetic', centerId:'phc-02', centerName:'PHC-Beta',    quantity:320,  unit:'tabs',   dailyBurnRate:15, daysLeft:21,  status:'ok',       expiryDate:'2027-06-10', reorderLevel:100, predictedStockout:null,        aiRecommendedOrder:0    },
  { id:'m5',  name:'Paracetamol 500mg',    category:'Analgesic',    centerId:'chc-01', centerName:'CHC-Central', quantity:5000, unit:'tabs',   dailyBurnRate:50, daysLeft:100, status:'surplus',  expiryDate:'2027-01-01', reorderLevel:500, predictedStockout:null,        aiRecommendedOrder:0    },
  { id:'m6',  name:'Iron Folic Acid',      category:'Supplement',   centerId:'phc-03', centerName:'PHC-North',   quantity:600,  unit:'tabs',   dailyBurnRate:12, daysLeft:50,  status:'ok',       expiryDate:'2027-02-28', reorderLevel:200, predictedStockout:null,        aiRecommendedOrder:0    },
  { id:'m7',  name:'Chloroquine 250mg',    category:'Antimalarial', centerId:'phc-02', centerName:'PHC-Beta',    quantity:20,   unit:'tabs',   dailyBurnRate:6,  daysLeft:3,   status:'critical', expiryDate:'2026-10-15', reorderLevel:100, predictedStockout:'Jul 11',    aiRecommendedOrder:120  },
  { id:'m8',  name:'Oral Rehydration Salt',category:'Rehydration',  centerId:'chc-01', centerName:'CHC-Central', quantity:1500, unit:'packs',  dailyBurnRate:30, daysLeft:50,  status:'surplus',  expiryDate:'2027-04-10', reorderLevel:300, predictedStockout:null,        aiRecommendedOrder:0    },
];

/* ── AI Action Feed ───────────────────────────────────── */
export const AI_ACTIONS: AIAction[] = [
  {
    id:'ai-01', type:'medicine', severity:'critical',
    phcId:'phc-01', phcName:'PHC-Alpha',
    title:'Paracetamol Critical Stock',
    message:'PHC-Alpha has only 5 tablets left. At current burn rate, stock will exhaust today. CHC-Central has 5,000 surplus units.',
    recommendation:'Transfer 500 tablets from CHC-Central → PHC-Alpha immediately.',
    approved:false, rejected:false, createdAt:'5 min ago',
    meta:{ fromCenter:'CHC-Central', qty:500, medicine:'Paracetamol 500mg' },
  },
  {
    id:'ai-02', type:'doctor', severity:'warning',
    phcId:'phc-01', phcName:'PHC-Alpha',
    title:'Doctor Attendance Critical',
    message:'PHC-Alpha attendance at 33% (1/3 doctors present). Patient load is 156% of capacity.',
    recommendation:'Temporarily reassign Dr. Meena from PHC-North (low load) to PHC-Alpha.',
    approved:false, rejected:false, createdAt:'12 min ago',
    meta:{ attendance:33, doctorName:'Dr. Meena', fromCenter:'PHC-North' },
  },
  {
    id:'ai-03', type:'footfall', severity:'warning',
    phcId:'phc-02', phcName:'PHC-Beta',
    title:'Footfall Surge Predicted',
    message:'AI predicts +48% patient surge at PHC-Beta tomorrow due to IMD heatwave alert (42°C) in Erode district.',
    recommendation:'Stock 200 extra ORS sachets, deploy 1 additional nurse, extend OPD hours by 2hrs.',
    approved:false, rejected:false, createdAt:'20 min ago',
    meta:{ surgePercent:48, trigger:'Heatwave 42°C' },
  },
  {
    id:'ai-04', type:'disease', severity:'critical',
    phcId:'phc-02', phcName:'PHC-Beta',
    title:'Dengue Cluster Detected',
    message:'AI detected 14 fever cases with dengue symptoms in Karungal ward over 4 days. Outbreak probability: 78%.',
    recommendation:'Deploy rapid test kits (50), initiate fogging in ward 7-9, alert district vector control.',
    approved:false, rejected:false, createdAt:'1 hr ago',
    meta:{ cases:14, probability:78, ward:'Karungal ward 7-9' },
  },
  {
    id:'ai-05', type:'medicine', severity:'warning',
    phcId:'phc-02', phcName:'PHC-Beta',
    title:'Chloroquine Low Stock',
    message:'PHC-Beta Chloroquine will last only 3 days. With dengue alert active, demand may double.',
    recommendation:'Order 120 units. Consider emergency procurement from district pharmacy.',
    approved:false, rejected:false, createdAt:'2 hr ago',
    meta:{ daysLeft:3, medicine:'Chloroquine 250mg' },
  },
];

/* ── Patients ─────────────────────────────────────────── */
export const PATIENTS: Patient[] = [
  { id:'p1', name:'Muthu Selvam',    abhaId:'14-2345-6789-0001', age:67, gender:'M', bloodGroup:'B+', phone:'+91 98765 11111', village:'Karungal',      conditions:['Hypertension','Diabetes'],    allergies:['Penicillin'], lastVisit:'Today',     tokenNumber:3,  priority:'senior'    },
  { id:'p2', name:'Kavitha Rajan',   abhaId:'14-2345-6789-0002', age:28, gender:'F', bloodGroup:'O+', phone:'+91 98765 22222', village:'Veerappanchatram', conditions:['Anaemia'],                  allergies:[],             lastVisit:'Today',     tokenNumber:4,  priority:'pregnant'  },
  { id:'p3', name:'Arjun Kumar',     abhaId:'14-2345-6789-0003', age:8,  gender:'M', bloodGroup:'A-', phone:'+91 98765 33333', village:'Thirunagar',    conditions:['Asthma'],                     allergies:['Aspirin'],    lastVisit:'Jun 20',    tokenNumber:5,  priority:'child'     },
  { id:'p4', name:'Rajammal Devi',   abhaId:'14-2345-6789-0004', age:72, gender:'F', bloodGroup:'AB+',phone:'+91 98765 44444', village:'Marapalam',     conditions:['Arthritis','Hypertension'],   allergies:[],             lastVisit:'Today',     tokenNumber:6,  priority:'senior'    },
  { id:'p5', name:'Senthil Nathan',  abhaId:'14-2345-6789-0005', age:34, gender:'M', bloodGroup:'B-', phone:'+91 98765 55555', village:'Erode',         conditions:['Fever','Cough'],              allergies:[],             lastVisit:'Today',     tokenNumber:7,  priority:'normal'    },
  { id:'p6', name:'Priya Mohan',     abhaId:'14-2345-6789-0006', age:45, gender:'F', bloodGroup:'O-', phone:'+91 98765 66666', village:'Karungal',      conditions:['Diabetes'],                   allergies:['Sulpha'],     lastVisit:'Jul 01',    tokenNumber:null, priority:'normal'  },
];

/* ── Dispatch Routes ──────────────────────────────────── */
export const DISPATCH_ROUTES: DispatchRoute[] = [
  { id:'d1', driverId:'drv1', driverName:'Ravi Kumar', fromCenter:'CHC-Central', toCenter:'PHC-Alpha', payload:'Paracetamol 500mg', payloadQty:500, status:'pending',    priority:'urgent',    createdAt:'5 min ago', eta:'35 min', lat:11.041, lng:77.061 },
  { id:'d2', driverId:'drv1', driverName:'Ravi Kumar', fromCenter:'CHC-Central', toCenter:'PHC-Beta',  payload:'ORS Sachets',       payloadQty:200, status:'in_transit',  priority:'normal',    createdAt:'1 hr ago',  eta:'15 min', lat:11.047, lng:77.055 },
  { id:'d3', driverId:'drv2', driverName:'Suresh P.',  fromCenter:'PHC-North',   toCenter:'PHC-East',  payload:'Iron Folic Acid',   payloadQty:150, status:'delivered',   priority:'normal',    createdAt:'3 hr ago',  eta:'Done',   lat:11.078, lng:77.035 },
];

/* ── KPIs for Admin ───────────────────────────────────── */
export const DISTRICT_KPIS = {
  patientsToday: 486,
  avgWaitMins: 52,
  doctorAttendance: 71,
  stockOuts: 3,
  ambulanceResponseMins: 8.4,
  activeCenters: CENTERS.length,
  criticalCenters: CENTERS.filter(c=>c.status==='critical').length,
  warningCenters: CENTERS.filter(c=>c.status==='warning').length,
  pendingAiActions: AI_ACTIONS.filter(a=>!a.approved&&!a.rejected).length,
};

/* ── Analytics series ─────────────────────────────────── */
export const FOOTFALL_WEEKLY = [
  { day:'Mon', patients:412 },
  { day:'Tue', patients:387 },
  { day:'Wed', patients:445 },
  { day:'Thu', patients:398 },
  { day:'Fri', patients:512 },
  { day:'Sat', patients:486 },
  { day:'Sun', patients:324 },
];

export const MEDICINE_CONSUMPTION = [
  { name:'Paracetamol', used:1240, reordered:1000 },
  { name:'ORS',         used:680,  reordered:500  },
  { name:'Amoxicillin', used:420,  reordered:300  },
  { name:'Metformin',   used:380,  reordered:400  },
  { name:'Chloroquine', used:190,  reordered:120  },
];

export const BED_OCCUPANCY = [
  { center:'PHC-Alpha',   pct:100 },
  { center:'PHC-Beta',    pct:80  },
  { center:'PHC-North',   pct:53  },
  { center:'CHC-Central', pct:72  },
  { center:'PHC-East',    pct:73  },
];
