export const COLORS = {
  primary:   '#0B6CBB',
  primaryDark:'#084e8a',
  green:     '#1a9b5c',
  red:       '#dc2626',
  orange:    '#d97706',
  purple:    '#7c3aed',
  bg:        '#f0f4f8',
  card:      '#ffffff',
  border:    '#e2e8f0',
  text:      '#1e293b',
  textSub:   '#64748b',
  textLight: '#94a3b8',
};

export interface Center {
  id: string; name: string; type: 'PHC'|'CHC';
  lat: number; lng: number;
  crowd: 'low'|'moderate'|'high'; waitMins: number;
  doctors: number; doctorsTotal: number;
  beds: number; bedsTotal: number;
  medicines: number; tests: number;
  status: 'healthy'|'warning'|'critical';
  footfallToday: number; riskScore: number;
  distance?: string;
}

export interface Medicine {
  id: string; name: string; category: string;
  quantity: number; unit: string;
  dailyBurnRate: number; daysLeft: number;
  status: 'ok'|'low'|'critical'|'surplus';
  expiryDate: string;
  predictedStockout: string | null;
  aiRecommendedOrder: number;
}

export interface AIAction {
  id: string; type: 'medicine'|'doctor'|'beds'|'disease'|'footfall';
  severity: 'info'|'warning'|'critical';
  phcName: string; title: string; message: string;
  recommendation: string; createdAt: string;
}

export interface Patient {
  id: string; name: string; abhaId: string;
  age: number; gender: 'M'|'F'; bloodGroup: string;
  phone: string; village: string;
  conditions: string[]; allergies: string[];
  tokenNumber: number | null;
  priority: 'normal'|'senior'|'pregnant'|'child'|'emergency';
}

export interface DispatchRoute {
  id: string; driverName: string;
  fromCenter: string; toCenter: string;
  payload: string; payloadQty: number;
  status: 'pending'|'in_transit'|'delivered';
  priority: 'normal'|'urgent'|'emergency';
  eta: string; createdAt: string;
}

export const CENTERS: Center[] = [
  { id:'phc-01', name:'PHC-Alpha',   type:'PHC', lat:11.028, lng:77.048, crowd:'high',     waitMins:150, doctors:1, doctorsTotal:3, beds:0,  bedsTotal:30,  medicines:8,  tests:40, status:'critical', footfallToday:187, riskScore:88, distance:'1.2 km' },
  { id:'phc-02', name:'PHC-Beta',    type:'PHC', lat:11.052, lng:77.072, crowd:'moderate', waitMins:60,  doctors:2, doctorsTotal:3, beds:6,  bedsTotal:30,  medicines:55, tests:70, status:'warning',  footfallToday:95,  riskScore:52, distance:'2.8 km' },
  { id:'phc-03', name:'PHC-North',   type:'PHC', lat:11.078, lng:77.035, crowd:'low',      waitMins:20,  doctors:3, doctorsTotal:3, beds:14, bedsTotal:30,  medicines:82, tests:90, status:'healthy',  footfallToday:44,  riskScore:18, distance:'3.4 km' },
  { id:'chc-01', name:'CHC-Central', type:'CHC', lat:11.041, lng:77.061, crowd:'low',      waitMins:15,  doctors:6, doctorsTotal:8, beds:28, bedsTotal:100, medicines:91, tests:95, status:'healthy',  footfallToday:88,  riskScore:12, distance:'2.1 km' },
  { id:'phc-04', name:'PHC-East',    type:'PHC', lat:11.019, lng:77.091, crowd:'moderate', waitMins:45,  doctors:2, doctorsTotal:3, beds:8,  bedsTotal:30,  medicines:61, tests:65, status:'warning',  footfallToday:72,  riskScore:44, distance:'4.1 km' },
];

export const MEDICINES: Medicine[] = [
  { id:'m1', name:'Paracetamol 500mg',  category:'Analgesic',    quantity:5,    unit:'tabs',  dailyBurnRate:40, daysLeft:0,  status:'critical', expiryDate:'2026-12-01', predictedStockout:'Today',    aiRecommendedOrder:500 },
  { id:'m2', name:'ORS Sachets',        category:'Rehydration',  quantity:12,   unit:'packs', dailyBurnRate:8,  daysLeft:1,  status:'critical', expiryDate:'2027-03-15', predictedStockout:'Tomorrow', aiRecommendedOrder:200 },
  { id:'m3', name:'Amoxicillin 250mg',  category:'Antibiotic',   quantity:80,   unit:'caps',  dailyBurnRate:10, daysLeft:8,  status:'low',      expiryDate:'2026-11-20', predictedStockout:'Aug 12',   aiRecommendedOrder:150 },
  { id:'m4', name:'Metformin 500mg',    category:'Antidiabetic', quantity:320,  unit:'tabs',  dailyBurnRate:15, daysLeft:21, status:'ok',       expiryDate:'2027-06-10', predictedStockout:null,       aiRecommendedOrder:0   },
  { id:'m5', name:'Iron Folic Acid',    category:'Supplement',   quantity:600,  unit:'tabs',  dailyBurnRate:12, daysLeft:50, status:'ok',       expiryDate:'2027-02-28', predictedStockout:null,       aiRecommendedOrder:0   },
  { id:'m6', name:'Chloroquine 250mg',  category:'Antimalarial', quantity:20,   unit:'tabs',  dailyBurnRate:6,  daysLeft:3,  status:'critical', expiryDate:'2026-10-15', predictedStockout:'Jul 11',   aiRecommendedOrder:120 },
];

export const AI_ACTIONS: AIAction[] = [
  { id:'ai-01', type:'medicine', severity:'critical', phcName:'PHC-Alpha',   title:'Paracetamol Stock Out',    message:'PHC-Alpha has only 5 tablets left. Stock exhausts today. CHC-Central has 5,000 surplus.',       recommendation:'Transfer 500 tablets from CHC-Central → PHC-Alpha immediately.', createdAt:'5 min ago' },
  { id:'ai-02', type:'doctor',   severity:'warning',  phcName:'PHC-Alpha',   title:'Doctor Attendance Low',    message:'PHC-Alpha at 33% attendance (1/3 doctors). Patient load is 156% capacity.',                   recommendation:'Reassign Dr. Meena from PHC-North to PHC-Alpha.', createdAt:'12 min ago' },
  { id:'ai-03', type:'footfall', severity:'warning',  phcName:'PHC-Beta',    title:'Surge Predicted Tomorrow', message:'AI predicts +48% patient surge at PHC-Beta due to IMD heatwave (42°C).',                     recommendation:'Stock 200 ORS sachets, deploy 1 extra nurse, extend OPD 2hrs.', createdAt:'20 min ago' },
  { id:'ai-04', type:'disease',  severity:'critical', phcName:'PHC-Beta',    title:'Dengue Cluster Detected',  message:'14 fever cases in Karungal ward. Outbreak probability 78%.',                                 recommendation:'Deploy 50 rapid test kits. Initiate fogging in ward 7–9.', createdAt:'1 hr ago' },
];

export const PATIENTS: Patient[] = [
  { id:'p1', name:'Muthu Selvam',  abhaId:'14-2345-6789-0001', age:67, gender:'M', bloodGroup:'B+', phone:'+91 98765 11111', village:'Karungal',      conditions:['Hypertension','Diabetes'],  allergies:['Penicillin'], tokenNumber:3, priority:'senior'   },
  { id:'p2', name:'Kavitha Rajan', abhaId:'14-2345-6789-0002', age:28, gender:'F', bloodGroup:'O+', phone:'+91 98765 22222', village:'Veerappanchatram', conditions:['Anaemia'],                allergies:[],             tokenNumber:4, priority:'pregnant' },
  { id:'p3', name:'Arjun Kumar',   abhaId:'14-2345-6789-0003', age:8,  gender:'M', bloodGroup:'A-', phone:'+91 98765 33333', village:'Thirunagar',    conditions:['Asthma'],                   allergies:['Aspirin'],    tokenNumber:5, priority:'child'    },
  { id:'p4', name:'Senthil Nathan',abhaId:'14-2345-6789-0005', age:34, gender:'M', bloodGroup:'B-', phone:'+91 98765 55555', village:'Erode',         conditions:['Fever','Cough'],            allergies:[],             tokenNumber:6, priority:'normal'   },
];

export const DISPATCH: DispatchRoute[] = [
  { id:'d1', driverName:'Ravi Kumar', fromCenter:'CHC-Central', toCenter:'PHC-Alpha', payload:'Paracetamol 500mg', payloadQty:500, status:'pending',    priority:'urgent',    eta:'35 min', createdAt:'5 min ago' },
  { id:'d2', driverName:'Ravi Kumar', fromCenter:'CHC-Central', toCenter:'PHC-Beta',  payload:'ORS Sachets',       payloadQty:200, status:'in_transit', priority:'normal',    eta:'15 min', createdAt:'1 hr ago'  },
  { id:'d3', driverName:'Suresh P.',  fromCenter:'PHC-North',   toCenter:'PHC-East',  payload:'Iron Folic Acid',   payloadQty:150, status:'delivered',  priority:'normal',    eta:'Done',   createdAt:'3 hr ago'  },
];

export const KPIS = {
  patientsToday: 486, avgWaitMins: 52,
  doctorAttendance: 71, stockOuts: 3,
  pendingAiActions: AI_ACTIONS.length,
  criticalCenters: CENTERS.filter(c=>c.status==='critical').length,
};

export const FOOTFALL_WEEKLY = [
  { day:'Mon', v:412 }, { day:'Tue', v:387 }, { day:'Wed', v:445 },
  { day:'Thu', v:398 }, { day:'Fri', v:512 }, { day:'Sat', v:486 }, { day:'Sun', v:324 },
];
