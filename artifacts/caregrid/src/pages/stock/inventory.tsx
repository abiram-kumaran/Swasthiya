import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Filter, Plus, AlertTriangle, Calendar, Package,
  ArrowRight, Trash2, History, CheckSquare, Zap, Camera,
  PenLine, X, ScanLine, Check, TrendingDown, Edit3,
} from 'lucide-react';
import { useInventoryStore, inventoryActions, type StockMedicine } from './inventoryStore';
import { stockRequestActions } from './stockRequestStore';

/* ─── Types ─────────────────────────────────────────────── */
type Tab = 'all' | 'critical' | 'low' | 'ok' | 'surplus' | 'expiring';
type AddMode = 'manual' | 'scan';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'critical', label: 'Critical' },
  { key: 'low',      label: 'Low Stock'},
  { key: 'expiring', label: 'Expiring' },
  { key: 'ok',       label: 'OK'       },
  { key: 'surplus',  label: 'Surplus'  },
];

const CATEGORIES = ['Analgesic','Antibiotic','Antidiabetic','Antimalarial',
                    'Rehydration','Supplement','Antihypertensive','Vitamin','Other'];
const UNITS      = ['tablets','capsules','packs','vials','bottles','ml','g'];
const STORAGE    = ['Room Temperature','Refrigerated (2–8°C)','Cold Chain','Controlled'];

const STATUS_STYLE: Record<string, { badge: string; card: string; bar: string }> = {
  critical: { badge: 'bg-red-100 text-red-700',    card: 'border-red-200',    bar: 'bg-red-500'    },
  low:      { badge: 'bg-orange-100 text-orange-700', card: 'border-orange-200', bar: 'bg-orange-400' },
  ok:       { badge: 'bg-green-100 text-green-700',  card: 'border-gray-100',   bar: 'bg-green-500'  },
  surplus:  { badge: 'bg-blue-100 text-blue-700',   card: 'border-gray-100',   bar: 'bg-blue-500'   },
};

/* ─── Helpers ───────────────────────────────────────────── */
function expiryBadge(dateStr: string) {
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000;
  if (diff < 7)  return { label: 'Expires in 7d',  style: 'bg-red-100 text-red-700'    };
  if (diff < 15) return { label: 'Expires in 15d', style: 'bg-orange-100 text-orange-700' };
  if (diff < 30) return { label: 'Expires in 30d', style: 'bg-amber-100 text-amber-700'  };
  return null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 font-semibold mb-0.5">{label}</p>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-emerald-400 bg-white"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

/* ─── Blank form factory ─────────────────────────────────── */
function blankForm() {
  return {
    name: '', strength: '', category: 'Analgesic', quantity: '',
    unit: 'tablets', dailyBurnRate: '', reorderLevel: '',
    expiryDate: '', batchNumber: '', storageLocation: 'Room Temperature',
    manufacturer: '',
  };
}

type FormData = ReturnType<typeof blankForm>;

/* ─── Add Stock Modal ────────────────────────────────────── */
function AddStockModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<AddMode>('manual');
  const [form, setForm] = useState<FormData>(blankForm());
  const [scanStep, setScanStep] = useState<'camera' | 'confirm'>('camera');
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(k: keyof FormData, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  /* Simulate Google Lens scan — prefills form with fake product data */
  function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setScanning(true);
    setTimeout(() => {
      setForm({
        name: 'Paracetamol', strength: '500mg', category: 'Analgesic',
        quantity: '200', unit: 'tablets', dailyBurnRate: '20',
        reorderLevel: '100', expiryDate: '2027-06-30',
        batchNumber: 'BT-PC5-2024', storageLocation: 'Room Temperature',
        manufacturer: 'Sun Pharma Ltd.',
      });
      setScanning(false);
      setScanStep('confirm');
    }, 1800);
  }

  function handleConfirm() {
    const qty = Number(form.quantity);
    const burn = Number(form.dailyBurnRate);
    const reorder = Number(form.reorderLevel);
    if (!form.name.trim()) { toast.error('Medicine name is required'); return; }
    if (!qty || qty <= 0)  { toast.error('Enter a valid quantity');   return; }
    if (!form.expiryDate)  { toast.error('Expiry date is required');  return; }
    inventoryActions.addMedicine({
      name: `${form.name.trim()} ${form.strength}`.trim(),
      category: form.category, strength: form.strength,
      quantity: qty, unit: form.unit,
      dailyBurnRate: burn || 0, reorderLevel: reorder || 50,
      expiryDate: form.expiryDate, batchNumber: form.batchNumber,
      storageLocation: form.storageLocation, manufacturer: form.manufacturer,
    });
    toast.success('Medicine added to inventory');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <p className="font-bold text-gray-900 text-sm">Add Medicine to Inventory</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 px-5 pt-3 pb-2 shrink-0">
          <button onClick={() => { setMode('manual'); setForm(blankForm()); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${mode === 'manual' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            <PenLine className="w-3.5 h-3.5" /> Manual Entry
          </button>
          <button onClick={() => { setMode('scan'); setScanStep('camera'); setForm(blankForm()); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${mode === 'scan' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            <Camera className="w-3.5 h-3.5" /> Scan Product
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5">

          {/* ── SCAN MODE ── */}
          {mode === 'scan' && scanStep === 'camera' && (
            <div className="pt-2 space-y-3">
              <div className="bg-gray-900 rounded-2xl aspect-video flex flex-col items-center justify-center relative overflow-hidden">
                {scanning ? (
                  <>
                    <motion.div animate={{ scaleX: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }}
                      className="absolute top-1/2 w-3/4 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                    <p className="text-white text-xs font-semibold mt-8">Scanning product…</p>
                    <p className="text-gray-400 text-[10px] mt-1">Google Lens analysing label</p>
                  </>
                ) : (
                  <>
                    <ScanLine className="w-10 h-10 text-emerald-400 mb-2" />
                    <p className="text-white text-xs font-semibold">Point camera at product label</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">AI will extract product details automatically</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handleScan} />
              <button disabled={scanning} onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors">
                <Camera className="w-4 h-4" />
                {scanning ? 'Scanning with Google Lens…' : 'Open Camera to Scan'}
              </button>
              <p className="text-center text-[10px] text-gray-400">
                Or{' '}
                <button className="text-emerald-600 font-semibold underline" onClick={() => setMode('manual')}>
                  enter details manually
                </button>
              </p>
            </div>
          )}

          {/* ── SCAN CONFIRM ── */}
          {mode === 'scan' && scanStep === 'confirm' && (
            <div className="pt-2 space-y-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[11px] text-emerald-700 font-semibold">
                  Product scanned successfully. Review & edit before confirming.
                </p>
              </div>
              <FormFields form={form} set={set} />
            </div>
          )}

          {/* ── MANUAL FORM ── */}
          {mode === 'manual' && (
            <div className="pt-2 space-y-2">
              <FormFields form={form} set={set} />
            </div>
          )}
        </div>

        {/* Confirm button */}
        {(mode === 'manual' || scanStep === 'confirm') && (
          <div className="px-5 pb-5 shrink-0">
            <button onClick={handleConfirm}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              {mode === 'scan' ? 'Confirm & Add to Inventory' : 'Add to Inventory'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Reusable form fields ───────────────────────────────── */
function FormFields({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <Field label="Medicine Name *">
        <Input value={form.name} onChange={v => set('name', v)} placeholder="e.g. Paracetamol" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Strength / Dose">
          <Input value={form.strength} onChange={v => set('strength', v)} placeholder="e.g. 500mg" />
        </Field>
        <Field label="Category">
          <Select value={form.category} onChange={v => set('category', v)} options={CATEGORIES} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Quantity *">
          <Input value={form.quantity} onChange={v => set('quantity', v)} placeholder="e.g. 500" type="number" />
        </Field>
        <Field label="Unit">
          <Select value={form.unit} onChange={v => set('unit', v)} options={UNITS} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Daily Usage (approx.)">
          <Input value={form.dailyBurnRate} onChange={v => set('dailyBurnRate', v)} placeholder="e.g. 20" type="number" />
        </Field>
        <Field label="Reorder Level">
          <Input value={form.reorderLevel} onChange={v => set('reorderLevel', v)} placeholder="e.g. 100" type="number" />
        </Field>
      </div>
      <Field label="Expiry Date *">
        <Input value={form.expiryDate} onChange={v => set('expiryDate', v)} type="date" />
      </Field>
      <Field label="Batch Number">
        <Input value={form.batchNumber} onChange={v => set('batchNumber', v)} placeholder="e.g. BT-PC5-2024" />
      </Field>
      <Field label="Storage Location">
        <Select value={form.storageLocation} onChange={v => set('storageLocation', v)} options={STORAGE} />
      </Field>
      <Field label="Manufacturer / Supplier">
        <Input value={form.manufacturer} onChange={v => set('manufacturer', v)} placeholder="e.g. Sun Pharma" />
      </Field>
    </>
  );
}

/* ─── Edit Medicine Modal ────────────────────────────────── */
function EditModal({ med, onClose }: { med: StockMedicine; onClose: () => void }) {
  const [form, setForm] = useState<FormData>({
    name: med.name.replace(med.strength, '').trim(),
    strength: med.strength,
    category: med.category,
    quantity: String(med.quantity),
    unit: med.unit,
    dailyBurnRate: String(med.dailyBurnRate),
    reorderLevel: String(med.reorderLevel),
    expiryDate: med.expiryDate,
    batchNumber: med.batchNumber,
    storageLocation: med.storageLocation,
    manufacturer: med.manufacturer,
  });

  function set(k: keyof FormData, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function save() {
    inventoryActions.updateMedicine(med.id, {
      name: `${form.name.trim()} ${form.strength}`.trim(),
      strength: form.strength, category: form.category,
      quantity: Number(form.quantity), unit: form.unit,
      dailyBurnRate: Number(form.dailyBurnRate),
      reorderLevel: Number(form.reorderLevel),
      expiryDate: form.expiryDate, batchNumber: form.batchNumber,
      storageLocation: form.storageLocation, manufacturer: form.manufacturer,
    });
    toast.success('Medicine details updated');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <p className="font-bold text-gray-900 text-sm">Edit Medicine Details</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
          <FormFields form={form} set={set} />
        </div>
        <div className="px-5 pb-5 shrink-0">
          <button onClick={save}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Action Modals ──────────────────────────────────────── */
function ReceiveModal({ med, onClose }: { med: StockMedicine; onClose: () => void }) {
  const [qty, setQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reqId, setReqId] = useState('');

  function confirm() {
    const n = Number(qty);
    if (!n || n <= 0) { toast.error('Enter a valid quantity'); return; }
    const id = stockRequestActions.submitRequest({
      medicineId: med.id,
      medicineName: med.name,
      requestedQty: n,
      currentStock: med.quantity,
      minThreshold: med.reorderLevel,
      remarks,
    });
    setReqId(id);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-bold text-gray-900 text-sm mb-1">Request Submitted!</p>
          <p className="text-[11px] text-gray-500 mb-1">Request ID: <span className="font-mono font-bold text-gray-700">{reqId}</span></p>
          <p className="text-[11px] text-gray-500 mb-4">
            Stock request has been successfully sent to the District Administrator. Inventory will be updated once the shipment is received.
          </p>
          <button onClick={onClose} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors">
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <SimpleModal title="Request Stock" onClose={onClose} onConfirm={confirm} confirmText="Submit Request">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 mb-2">
        <p className="text-[10px] text-amber-700 font-semibold">
          This request will be sent to the District Admin for approval before stock is dispatched.
        </p>
      </div>
      <p className="text-xs text-gray-600 mb-1">Current stock: <strong>{med.quantity} {med.unit}</strong> · Min: {med.reorderLevel}</p>
      <Field label="Requested Quantity *"><Input value={qty} onChange={setQty} placeholder="e.g. 100" type="number" /></Field>
      <Field label="Remarks (optional)"><Input value={remarks} onChange={setRemarks} placeholder="e.g. Running low due to increased OPD load" /></Field>
    </SimpleModal>
  );
}

function IssueModal({ med, onClose }: { med: StockMedicine; onClose: () => void }) {
  const [qty, setQty] = useState('');
  function confirm() {
    const n = Number(qty);
    if (!n || n <= 0 || n > med.quantity) { toast.error('Enter valid quantity'); return; }
    inventoryActions.issueStock(med.id, n);
    toast.success(`Issued ${n} ${med.unit} of ${med.name}`);
    onClose();
  }
  return (
    <SimpleModal title="Issue Medicine" onClose={onClose} onConfirm={confirm}>
      <p className="text-xs text-gray-600 mb-3">Available: <strong>{med.quantity} {med.unit}</strong></p>
      <Field label="Quantity to Issue"><Input value={qty} onChange={setQty} placeholder="e.g. 50" type="number" /></Field>
    </SimpleModal>
  );
}

function DamagedModal({ med, onClose }: { med: StockMedicine; onClose: () => void }) {
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  function confirm() {
    const n = Number(qty);
    if (!n || n <= 0 || n > med.quantity) { toast.error('Enter valid quantity'); return; }
    inventoryActions.issueStock(med.id, n); // remove from stock
    toast.warning(`Marked ${n} ${med.unit} as damaged: ${reason || 'No reason provided'}`);
    onClose();
  }
  return (
    <SimpleModal title="Mark as Damaged" onClose={onClose} onConfirm={confirm} confirmText="Mark Damaged" confirmColor="bg-red-600 hover:bg-red-700">
      <p className="text-xs text-gray-600 mb-3">Stock: <strong>{med.quantity} {med.unit}</strong></p>
      <Field label="Damaged Quantity"><Input value={qty} onChange={setQty} placeholder="e.g. 10" type="number" /></Field>
      <Field label="Reason"><Input value={reason} onChange={setReason} placeholder="Expired / Broken / Contaminated" /></Field>
    </SimpleModal>
  );
}

function SimpleModal({ title, onClose, onConfirm, confirmText = 'Confirm', confirmColor = 'bg-emerald-600 hover:bg-emerald-700', children }:
  { title: string; onClose: () => void; onConfirm: () => void; confirmText?: string; confirmColor?: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-sm text-gray-900">{title}</p>
          <button onClick={onClose} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
        <div className="space-y-2 mb-4">{children}</div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2 text-white text-xs font-semibold rounded-lg ${confirmColor}`}>{confirmText}</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Medicine Card ──────────────────────────────────────── */
type ActiveModal = 'receive' | 'issue' | 'damaged' | 'history' | 'edit' | null;

function MedicineCard({ med, idx }: { med: StockMedicine; idx: number }) {
  const [modal, setModal] = useState<ActiveModal>(null);
  const sc     = STATUS_STYLE[med.status] ?? STATUS_STYLE.ok;
  const pct    = med.reorderLevel > 0 ? Math.min((med.quantity / med.reorderLevel) * 100, 100) : 100;
  const expBdg = expiryBadge(med.expiryDate);

  return (
    <>
      <motion.div key={med.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: idx * 0.04 }}
        className={`bg-white rounded-xl border ${sc.card} p-3.5 shadow-sm`}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[12px] font-bold text-gray-900">{med.name}</p>
              <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{med.category}</span>
              {expBdg && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${expBdg.style}`}>{expBdg.label}</span>}
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1 leading-none">
              {med.quantity}<span className="text-xs font-normal text-gray-400 ml-1">{med.unit}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${sc.badge}`}>{med.status}</span>
            <button onClick={() => setModal('edit')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" title="Edit product details">
              <Edit3 className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
          <div><p className="text-[9px] text-gray-400">Min Required</p><p className="font-semibold text-gray-700">{med.reorderLevel} {med.unit}</p></div>
          <div><p className="text-[9px] text-gray-400">Expiry</p>
            <p className={`font-semibold ${expBdg ? 'text-red-600' : 'text-gray-600'}`}>
              {new Date(med.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div><p className="text-[9px] text-gray-400">Days Left</p>
            <p className={`font-bold ${med.daysLeft === 0 ? 'text-red-600' : med.daysLeft < 7 ? 'text-red-500' : 'text-gray-700'}`}>
              {med.daysLeft >= 999 ? '—' : med.daysLeft === 0 ? '0 today!' : `${med.daysLeft}d`}
            </p>
          </div>
          <div><p className="text-[9px] text-gray-400">Batch No.</p><p className="font-mono text-[10px] text-gray-600">{med.batchNumber || '—'}</p></div>
          <div><p className="text-[9px] text-gray-400">Storage</p><p className="font-semibold text-gray-600 text-[10px] leading-tight">{med.storageLocation}</p></div>
          <div><p className="text-[9px] text-gray-400">Burn Rate</p><p className="font-semibold text-gray-600">{med.dailyBurnRate > 0 ? `${med.dailyBurnRate}/day` : '—'}</p></div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
            <span>Stock Level</span><span>{Math.round(pct)}% of minimum</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${sc.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* AI stockout warning */}
        {med.predictedStockout && (
          <div className="flex items-center gap-1 bg-red-50 rounded-lg px-2 py-1 mb-2.5">
            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
            <p className="text-[10px] text-red-600 font-medium">
              AI predicts stockout: <strong>{med.predictedStockout}</strong> · Reorder{' '}
              <strong>{med.aiRecommendedOrder} {med.unit}</strong>
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setModal('receive')} className="flex items-center justify-center gap-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-lg border border-emerald-200 transition-colors">
            <Package className="w-3 h-3" /> Receive
          </button>
          <button onClick={() => setModal('issue')} className="flex items-center justify-center gap-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-lg border border-blue-200 transition-colors">
            <ArrowRight className="w-3 h-3" /> Issue
          </button>
          <button onClick={() => setModal('damaged')} className="flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold rounded-lg border border-red-200 transition-colors">
            <Trash2 className="w-3 h-3" /> Mark Damaged
          </button>
          <button onClick={() => setModal('history')} className="flex items-center justify-center gap-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-lg border border-gray-200 transition-colors">
            <History className="w-3 h-3" /> History
          </button>
        </div>
        <button onClick={() => {
          const n = prompt(`Update quantity for ${med.name} (current: ${med.quantity}):`);
          const num = Number(n);
          if (n !== null && !isNaN(num) && num >= 0) {
            inventoryActions.updateMedicine(med.id, { quantity: num });
            toast.success('Quantity updated');
          }
        }} className="w-full mt-1.5 flex items-center justify-center gap-1 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-[11px] font-semibold rounded-lg transition-colors">
          <CheckSquare className="w-3 h-3" /> Update Quantity
        </button>
      </motion.div>

      <AnimatePresence>
        {modal === 'receive'  && <ReceiveModal  med={med} onClose={() => setModal(null)} />}
        {modal === 'issue'    && <IssueModal    med={med} onClose={() => setModal(null)} />}
        {modal === 'damaged'  && <DamagedModal  med={med} onClose={() => setModal(null)} />}
        {modal === 'edit'     && <EditModal     med={med} onClose={() => setModal(null)} />}
        {modal === 'history'  && (
          <SimpleModal title="Stock History" onClose={() => setModal(null)} onConfirm={() => setModal(null)} confirmText="Close" confirmColor="bg-gray-600 hover:bg-gray-700">
            <p className="text-xs text-gray-500">Transaction history for <strong>{med.name}</strong>:</p>
            {[
              { date: 'Today 08:30', action: 'Received', qty: '+200', color: 'text-green-600' },
              { date: 'Yesterday',   action: 'Issued',   qty: '-50',  color: 'text-blue-600'  },
              { date: '2 days ago',  action: 'Damaged',  qty: '-5',   color: 'text-red-600'   },
            ].map((e, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <div><p className="text-xs font-semibold text-gray-700">{e.action}</p><p className="text-[9px] text-gray-400">{e.date}</p></div>
                <span className={`text-xs font-bold ${e.color}`}>{e.qty}</span>
              </div>
            ))}
          </SimpleModal>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function StockInventory() {
  const { medicines: meds } = useInventoryStore();
  const [activeTab, setActiveTab]   = useState<Tab>('all');
  const [category, setCategory]     = useState('all');
  const [search, setSearch]         = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);

  const filtered = meds.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== 'all' && m.category !== category) return false;
    if (activeTab === 'expiring') {
      const diff = (new Date(m.expiryDate).getTime() - Date.now()) / 86400000;
      return diff < 30;
    }
    if (activeTab !== 'all') return m.status === activeTab;
    return true;
  });

  const criticalMed = meds.find((m) => m.status === 'critical');

  function tabCount(key: Tab): number {
    if (key === 'all') return meds.length;
    if (key === 'expiring') return meds.filter(m => (new Date(m.expiryDate).getTime() - Date.now()) / 86400000 < 30).length;
    return meds.filter(m => m.status === key).length;
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 pt-5 pb-4 rounded-b-2xl">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-bold">Medicine Inventory</h1>
          {/* ADD STOCK button — the single entry point */}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-white text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-emerald-50 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Stock
          </button>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-200" />
            <input type="text" placeholder="Search medicines..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/15 border border-white/20 text-white placeholder:text-emerald-200 text-xs rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-white/50"
            />
          </div>
          <button onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-1.5 px-3 border rounded-lg text-xs font-medium transition-colors ${showFilter ? 'bg-white text-emerald-700 border-white' : 'bg-white/15 border-white/20 text-white'}`}>
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
        {showFilter && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {(['all', ...CATEGORIES] as string[]).map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${category === c ? 'bg-white text-emerald-700 border-white' : 'bg-white/10 text-white border-white/20'}`}>
                {c === 'all' ? 'All Categories' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* AI banner — only shows if there are meds AND a critical one */}
        {meds.length > 0 && criticalMed && (
          <div className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 p-3 text-white">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] font-bold mb-0.5">🤖 AI Stock Alert</p>
                <p className="text-[11px] text-purple-100 leading-relaxed">
                  <strong className="text-white">{criticalMed.name}</strong> — Predicted stockout:{' '}
                  <strong className="text-white">{criticalMed.predictedStockout ?? 'Soon'}</strong>.
                  Reorder <strong className="text-white">{criticalMed.aiRecommendedOrder} units</strong>.
                </p>
                <button onClick={() => toast.success('Transfer requested')}
                  className="mt-2 flex items-center gap-1 bg-white text-purple-700 text-[10px] font-bold px-3 py-1 rounded-lg">
                  Request Transfer <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const count = tabCount(tab.key);
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${activeTab === tab.key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                {tab.label}
                {count > 0 && <span className={`text-[9px] font-bold px-1 rounded-full ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Low stock alert strip — only when meds exist */}
        {meds.length > 0 && (activeTab === 'all' || activeTab === 'critical' || activeTab === 'low') &&
          meds.some(m => m.status === 'critical' || m.status === 'low') && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <p className="text-xs font-bold text-red-700">Low Stock Auto-Alert</p>
            </div>
            <div className="space-y-1.5">
              {meds.filter(m => m.status === 'critical' || m.status === 'low').map(m => (
                <div key={m.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-700 font-medium truncate max-w-[160px]">{m.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-bold ${m.status === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
                      {m.quantity} {m.unit}
                    </span>
                    <span className="text-gray-400 text-[9px]">Reorder: {m.aiRecommendedOrder}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiry tracker */}
        {meds.length > 0 && activeTab === 'expiring' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-bold text-amber-700">Expiry Tracker</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[7, 15, 30].map((days, i) => {
                const count = meds.filter(m => (new Date(m.expiryDate).getTime() - Date.now()) / 86400000 < days).length;
                const cls = ['bg-red-50 border-red-200 text-red-600', 'bg-orange-50 border-orange-200 text-orange-600', 'bg-amber-50 border-amber-200 text-amber-700'][i];
                return (
                  <div key={days} className={`text-center p-2 rounded-lg border ${cls.split(' ').slice(0,2).join(' ')}`}>
                    <p className={`text-lg font-black ${cls.split(' ')[2]}`}>{count}</p>
                    <p className="text-[9px] text-gray-500">In {days} Days</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">AI Recommendations</p>
            {meds.filter(m => (new Date(m.expiryDate).getTime() - Date.now()) / 86400000 < 30).map(m => {
              const d = (new Date(m.expiryDate).getTime() - Date.now()) / 86400000;
              const rec = d < 7 ? 'Use First' : d < 15 ? 'Transfer to High-Demand PHC' : 'Monitor & Plan';
              const rc  = d < 7 ? 'text-red-600 bg-red-50' : d < 15 ? 'text-orange-600 bg-orange-50' : 'text-amber-700 bg-amber-50';
              return (
                <div key={m.id} className="flex items-center justify-between text-[11px] p-2 bg-white rounded-lg border border-gray-100 mb-1">
                  <span className="font-medium text-gray-700 truncate max-w-[140px]">{m.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rc}`}>{rec}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {meds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-200 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-emerald-300" />
            </div>
            <p className="font-bold text-gray-700 text-sm">No medicines yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-5 max-w-[200px]">
              Tap the button below to add your first medicine stock entry.
            </p>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow">
              <Plus className="w-4 h-4" /> Add First Medicine
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs">No medicines match your filter.</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((med, i) => <MedicineCard key={med.id} med={med} idx={i} />)}
          </AnimatePresence>
        )}
      </div>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showAdd && <AddStockModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
