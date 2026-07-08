/**
 * CareGrid AI — Standalone Mock API Server (Coimbatore Localized)
 * No database required. All data lives in-memory with the demo seed state.
 * Run: node mock-server.mjs
 */

import http from 'http';

// ─── Demo Seed Data (Coimbatore Localized) ───────────────────────────────────

let centers = [
  {
    id: 1, name: 'Peelamedu Urban PHC', type: 'PHC',
    lat: 11.0312, lng: 77.0040,
    bedCapacity: 30, activeBeds: 0, // Matches your 0 Beds Available Staff screen!
    doctorsPresent: 1, patientFootfall: 187,
    status: 'critical', waitTimeMinutes: 150,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2, name: 'Singanallur Urban PHC', type: 'PHC',
    lat: 11.0065, lng: 77.0232,
    bedCapacity: 30, activeBeds: 6,
    doctorsPresent: 2, patientFootfall: 95,
    status: 'warning', waitTimeMinutes: 60,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3, name: 'Kalapatti PHC', type: 'PHC',
    lat: 11.0602, lng: 77.0425,
    bedCapacity: 30, activeBeds: 12,
    doctorsPresent: 3, patientFootfall: 45,
    status: 'healthy', waitTimeMinutes: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4, name: 'Peelamedu CHC', type: 'CHC',
    lat: 11.0284, lng: 77.0115,
    bedCapacity: 100, activeBeds: 28,
    doctorsPresent: 6, patientFootfall: 42,
    status: 'healthy', waitTimeMinutes: 15,
    createdAt: new Date().toISOString(),
  },
];

let inventory = [
  { id: 1, centerId: 1, medicineName: 'Paracetamol 500mg', quantity: 5, dailyBurnRate: 40, status: 'critical' },
  { id: 2, centerId: 1, medicineName: 'ORS Sachets', quantity: 12, dailyBurnRate: 15, status: 'low' },
  { id: 3, centerId: 1, medicineName: 'Amoxicillin 250mg', quantity: 80, dailyBurnRate: 10, status: 'ok' },
  { id: 4, centerId: 2, medicineName: 'Paracetamol 500mg', quantity: 120, dailyBurnRate: 25, status: 'low' },
  { id: 5, centerId: 2, medicineName: 'Metformin 500mg', quantity: 1200, dailyBurnRate: 15, status: 'ok' },
  { id: 6, centerId: 3, medicineName: 'Paracetamol 500mg', quantity: 400, dailyBurnRate: 20, status: 'ok' },
  { id: 7, centerId: 3, medicineName: 'Iron Folic Acid', quantity: 600, dailyBurnRate: 12, status: 'ok' },
  { id: 8, centerId: 4, medicineName: 'Paracetamol 500mg', quantity: 5000, dailyBurnRate: 50, status: 'surplus' },
  { id: 9, centerId: 4, medicineName: 'Amoxicillin 250mg', quantity: 2000, dailyBurnRate: 20, status: 'surplus' },
  { id: 10, centerId: 4, medicineName: 'ORS Sachets', quantity: 1500, dailyBurnRate: 30, status: 'surplus' },
];

// Added New Seed Array: Matches your Patient Queue Screen exactly
let patients = [
  { id: 1, centerId: 1, name: "Muthu Selvam", age: 67, gender: "M", category: "Senior", conditions: ["Hypertension", "Diabetes"], queue: "#3" },
  { id: 2, centerId: 1, name: "Rajammal Devi", age: 72, gender: "F", category: "Senior", conditions: ["Arthritis", "Hypertension"], queue: "#6" },
  { id: 3, centerId: 1, name: "Kavitha Rajan", age: 28, gender: "F", category: "Pregnant", conditions: ["Anaemia"], queue: "#4" },
  { id: 4, centerId: 1, name: "Arjun Kumar", age: 8, gender: "M", category: "Child", conditions: ["Asthma"], queue: "#5" }
];

let logs = [];
let attendance = [
  { id: 100, centerId: 1, centerName: 'Peelamedu Urban PHC', employeeId: 'CG-PHC01-N04', doctorName: 'Nurse Vijaya Lakshmi', role: 'Registered Nurse', checkInTime: '08:52 AM', present: true, date: new Date().toISOString().split('T')[0] }
];
let dispatch = [];
let chatMessages = [
  {
    id: 1, sessionId: 'demo-session', role: 'bot',
    content: "Hello! I'm CareGrid's health assistant. Ask me about wait times ('Check crowd at Peelamedu'), symptoms, or medicine availability.",
    isAlert: false, createdAt: new Date(Date.now() - 60000).toISOString(),
  },
];

let nextId = { log: 100, att: 101, dispatch: 100, chat: 100, patient: 100 };

// ─── Router helpers ────────────────────────────────────────────────────────

function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

function addCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve({}); }
    });
  });
}

function qs(url) {
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  return Object.fromEntries(new URLSearchParams(url.slice(idx + 1)));
}

function withDays(item) {
  const days = item.dailyBurnRate > 0 ? item.quantity / item.dailyBurnRate : 999;
  const center = centers.find(c => c.id === item.centerId);
  return { ...item, daysRemaining: Math.round(days * 10) / 10, centerName: center?.name ?? '' };
}

// ─── Chat bot logic ────────────────────────────────────────────────────────

function botReply(content) {
  const low = content.toLowerCase();
  if (/chest pain|heart|stroke|unconscious|not breathing/.test(low)) {
    return { reply: '🚨 CRITICAL ALERT: Your symptoms require immediate emergency care. Alerting frontline staff now. Please call 108 (ambulance) immediately. Do NOT wait in any queue.', isAlert: true };
  }
  if (/crowd|wait|queue|check/.test(low)) {
    if (/peelamedu/.test(low)) {
      return { reply: 'Peelamedu Urban PHC has a 2.5-hour wait. Beds are full (0 available). We recommend Peelamedu CHC (10 mins away, ~15-min wait, 28 beds free).', isAlert: false };
    }
    const summary = centers.map(c => `${c.name}: ${c.waitTimeMinutes ?? 'N/A'} min wait`).join(' | ');
    return { reply: `Current wait times — ${summary}`, isAlert: false };
  }
  if (/fever|headache|cold|cough/.test(low)) {
    return { reply: 'For headaches or migraines, we advise resting in a quiet, dark environment. To consult a doctor, visit Singanallur Urban PHC (3.7 km away) where physicians are available.', isAlert: false };
  }
  if (/dehydration|vomiting|diarrhea/.test(low)) {
    return { reply: 'These symptoms can escalate in heat. Visit Peelamedu CHC today. Drink ORS while travelling. Expected wait: ~15 minutes.', isAlert: false };
  }
  if (/medicine|paracetamol|stock/.test(low)) {
    return { reply: 'Medicine status: Paracetamol is CRITICALLY LOW at Peelamedu Urban PHC (5 units, 0 days). Peelamedu CHC has surplus (5,000 units). A redistribution is pending admin approval.', isAlert: false };
  }
  return { reply: "I can help with: wait times ('Check crowd at Peelamedu'), symptoms ('I have a headache'), or medicines ('Is Paracetamol available?'). How can I help?", isAlert: false };
}

// ─── HTTP Server ───────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  addCorsHeaders(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url ?? '/';
  const path = url.split('?')[0];
  const q = qs(url);
  const method = req.method ?? 'GET';

  // Health
  if (path === '/api/healthz') return json(res, { status: 'ok' });

  // ── Centers ─────────────────────────────────────────────────────────────
  if (path === '/api/centers' && method === 'GET') return json(res, centers);

  if (path === '/api/centers/summary' && method === 'GET') {
    return json(res, {
      totalBeds: centers.reduce((s, c) => s + c.bedCapacity, 0),
      activeBeds: centers.reduce((s, c) => s + c.activeBeds, 0),
      activeStaff: centers.reduce((s, c) => s + c.doctorsPresent, 0),
      criticalShortages: centers.filter(c => c.status === 'critical').length,
      pendingAiActions: centers.filter(c => c.status !== 'healthy').length,
      totalCenters: centers.length,
      criticalCenters: centers.filter(c => c.status === 'critical').length,
    });
  }

  const centerMatch = path.match(/^\/api\/centers\/(\d+)$/);
  if (centerMatch && method === 'PATCH') {
    const id = Number(centerMatch[1]);
    const body = await readBody(req);
    centers = centers.map(c => c.id === id ? { ...c, ...body } : c);
    return json(res, centers.find(c => c.id === id));
  }

  // ── Patients API Route ───────────────────────────────────────────────────
  if (path === '/api/patients' && method === 'GET') {
    const filtered = q.centerId ? patients.filter(p => p.centerId === Number(q.centerId)) : patients;
    return json(res, filtered);
  }

  if (path === '/api/patients' && method === 'POST') {
    const body = await readBody(req);
    const newPatient = { id: nextId.patient++, centerId: body.centerId || 1, name: body.name, age: body.age, gender: body.gender, category: body.category, conditions: body.conditions || [], queue: `#${nextId.patient}` };
    patients.push(newPatient);
    return json(res, newPatient, 201);
  }

  // ── Inventory ────────────────────────────────────────────────────────────
  if (path === '/api/inventory' && method === 'GET') {
    const items = q.centerId
      ? inventory.filter(i => i.centerId === Number(q.centerId))
      : inventory;
    return json(res, items.map(withDays));
  }

  if (path === '/api/inventory/alerts' && method === 'GET') {
    const alerts = inventory
      .filter(i => i.status === 'critical' || i.status === 'low')
      .map(i => {
        const center = centers.find(c => c.id === i.centerId);
        const days = i.dailyBurnRate > 0 ? i.quantity / i.dailyBurnRate : 999;
        return { inventoryItemId: i.id, centerId: i.centerId, centerName: center?.name ?? '', medicineName: i.medicineName, quantity: i.quantity, daysRemaining: Math.round(days), severity: i.status };
      });
    return json(res, alerts);
  }

  if (path === '/api/inventory/scan' && method === 'POST') {
    const body = await readBody(req);
    const existing = inventory.find(i => i.centerId === body.centerId && i.medicineName.toLowerCase().includes('paracetamol'));
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + (body.quantity ?? 1000);
      existing.status = existing.quantity > 100 ? 'ok' : existing.quantity > 20 ? 'low' : 'critical';
    }
    return json(res, withDays(existing ?? inventory[0]));
  }

  const invMatch = path.match(/^\/api\/inventory\/(\d+)$/);
  if (invMatch && method === 'PATCH') {
    const id = Number(invMatch[1]);
    const body = await readBody(req);
    inventory = inventory.map(i => i.id === id ? { ...i, ...body } : i);
    return json(res, withDays(inventory.find(i => i.id === id)));
  }

  // ── Logs ─────────────────────────────────────────────────────────────────
  if (path === '/api/logs' && method === 'GET') {
    const filtered = q.centerId ? logs.filter(l => l.centerId === Number(q.centerId)) : logs;
    return json(res, filtered);
  }
  if (path === '/api/logs' && method === 'POST') {
    const body = await readBody(req);
    const log = { id: nextId.log++, centerName: centers.find(c => c.id === body.centerId)?.name ?? '', aiAnomalyFlag: false, createdAt: new Date().toISOString(), ...body };
    logs.push(log);
    return json(res, log, 201);
  }

  // ── Attendance ───────────────────────────────────────────────────────────
  if (path === '/api/attendance' && method === 'GET') {
    const filtered = q.centerId ? attendance.filter(a => a.centerId === Number(q.centerId)) : attendance;
    return json(res, filtered);
  }
  if (path === '/api/attendance' && method === 'POST') {
    const body = await readBody(req);
    const existing = attendance.find(a => a.doctorName === body.doctorName && a.date === body.date && a.centerId === body.centerId);
    if (existing) return json(res, existing, 201);
    const rec = { id: nextId.att++, centerName: centers.find(c => c.id === body.centerId)?.name ?? '', checkInTime: new Date().toISOString(), present: true, createdAt: new Date().toISOString(), ...body };
    attendance.push(rec);
    centers = centers.map(c => c.id === body.centerId ? { ...c, doctorsPresent: c.doctorsPresent + 1 } : c);
    return json(res, rec, 201);
  }

  // ── Dispatch ─────────────────────────────────────────────────────────────
  if (path === '/api/dispatch' && method === 'GET') {
    const filtered = q.status ? dispatch.filter(d => d.status === q.status) : dispatch;
    return json(res, filtered);
  }
  if (path === '/api/dispatch' && method === 'POST') {
    const body = await readBody(req);
    const from = centers.find(c => c.id === body.fromCenterId);
    const to = centers.find(c => c.id === body.toCenterId);
    const route = { id: nextId.dispatch++, fromCenterName: from?.name ?? '', toCenterName: to?.name ?? '', status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
    dispatch.push(route);
    return json(res, route, 201);
  }

  // ── Chat ─────────────────────────────────────────────────────────────────
  if (path === '/api/chat/messages' && method === 'GET') {
    const sid = q.sessionId ?? 'demo-session';
    return json(res, chatMessages.filter(m => m.sessionId === sid));
  }
  if (path === '/api/chat/messages' && method === 'POST') {
    const body = await readBody(req);
    const userMsg = { id: nextId.chat++, sessionId: body.sessionId ?? 'demo-session', role: 'user', content: body.content, isAlert: false, createdAt: new Date().toISOString() };
    chatMessages.push(userMsg);
    const { reply, isAlert } = botReply(body.content);
    const botMsg = { id: nextId.chat++, sessionId: body.sessionId ?? 'demo-session', role: 'bot', content: reply, isAlert, createdAt: new Date(Date.now() + 500).toISOString() };
    chatMessages.push(botMsg);
    return json(res, { userMessage: userMsg, botMessage: botMsg, isAlert });
  }

  // ── AI ───────────────────────────────────────────────────────────────────
  if (path === '/api/ai/epidemic-radar' && method === 'GET') {
    return json(res, [
      { id: 'ep-001', type: 'Heatwave Surge Alert', severity: 'critical', message: '40°C heatwave detected from IMD weather data. AI model predicts 30% surge in dehydration and heat stroke cases across district PHCs.', affectedCenters: ['Peelamedu Urban PHC', 'Singanallur Urban PHC'], predictedSurgePercent: 30, weatherTrigger: 'Extreme Heat (40C+)', createdAt: new Date().toISOString() },
      { id: 'ep-002', type: 'Overcrowding Risk', severity: 'critical', message: 'Peelamedu Urban PHC operating above capacity. Immediate patient re-routing to Peelamedu CHC recommended.', affectedCenters: ['Peelamedu Urban PHC'], predictedSurgePercent: 45, weatherTrigger: null, createdAt: new Date(Date.now() - 1800000).toISOString() },
    ]);
  }

  if (path === '/api/ai/redistribution' && method === 'GET') {
    return json(res, [
      { id: 'redist-demo-001', fromCenterId: 4, fromCenterName: 'Peelamedu CHC', toCenterId: 1, toCenterName: 'Peelamedu Urban PHC', medicineName: 'Paracetamol 500mg', quantity: 500, reason: 'Peelamedu Urban PHC has critically low Paracetamol (5 units, 0 days remaining). Peelamedu CHC has surplus of 5,000 units. AI recommends immediate dispatch to prevent treatment gaps.', approved: false, estimatedTransitMinutes: 15, createdAt: new Date().toISOString() },
    ]);
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ error: `Not found: ${method} ${path}` }));
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`\n✅  CareGrid Mock API running at http://localhost:${PORT}/api`);
  console.log(`   Health check: http://localhost:${PORT}/api/healthz\n`);
});