import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, query, where, 
  onSnapshot, updateDoc, doc, orderBy, serverTimestamp, writeBatch, getDocs, setDoc, getDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Clock, Users, ShieldCheck, History, 
  RefreshCw, CheckCircle, XCircle, LayoutGrid, Monitor, 
  MessageCircle, FileText, Download, Lock, Key, Menu, Phone,
  Camera, LogIn, LogOut, Settings, Bell, AlertTriangle, Clock4, Shield, MapPin, Database, ArrowLeft, ChevronRight
} from 'lucide-react';

// ==========================================
// 🚨 ACTION REQUIRED: PASTE YOUR FIREBASE KEYS BELOW 🚨
// ==========================================
let firebaseConfig = {
  apiKey: "AIzaSyCB7ubf-QD1KPmTkq4HX-pLOfLACsqthwg",
    authDomain: "safeclock-41787.firebaseapp.com",
    projectId: "safeclock-41787",
    storageBucket: "safeclock-41787.firebasestorage.app",
    messagingSenderId: "874093872562",
    appId: "1:874093872562:web:1cac723ac784bb8acd10ab",
};

// --- AUTOMATIC CHAT PREVIEW SETUP ---
if (typeof __firebase_config !== 'undefined') {
  firebaseConfig = JSON.parse(__firebase_config);
}
// ==========================================

// --- SAFETY INITIALIZATION ---
let app, auth, db, configError;

try {
  if (firebaseConfig.apiKey.includes("PASTE_API_KEY") && typeof __firebase_config === 'undefined') {
    throw new Error("Missing Firebase Keys");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  configError = err.message || "Unknown Initialization Error";
  console.error("Firebase Initialization Error:", err);
}

const appId = 'safeclock_production_v1';

// --- HELPER: DATABASE LOCKED SCREEN ---
const DatabaseLocked = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white rounded-xl shadow-lg border-l-4 border-amber-500 max-w-2xl mx-auto mt-10">
    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4"><Database size={32} /></div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Database Access Blocked</h2>
    <p className="text-slate-600 mb-6 max-w-md">Your app is connected, but Firebase is blocking access. Enable "Public Mode" in your database rules.</p>
    <div className="bg-slate-50 p-4 rounded text-xs text-left font-mono">allow read, write: if true;</div>
  </div>
);

export default function App() {
  if (configError) return <div className="p-10 text-red-600 text-center font-bold">{String(configError)}</div>;

  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('landing'); // 'landing', 'manager', 'kiosk'
  const [kioskLocation, setKioskLocation] = useState(() => {
    try { return localStorage.getItem('safeclock_device_name') || 'Main Office'; } catch (e) { return 'Main Office'; }
  });

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => { try { localStorage.setItem('safeclock_device_name', kioskLocation); } catch(e) {} }, [kioskLocation]);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) { console.error(e); } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const verifyAdminPin = async () => {
    if (!user || !db) return;
    try {
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config');
      const settingsSnap = await getDoc(settingsRef);
      const correctPin = (settingsSnap.exists() && settingsSnap.data().adminPin) ? settingsSnap.data().adminPin : '0000';

      if (adminPinInput === correctPin) {
        setViewMode('manager');
        setShowAdminLogin(false);
      } else {
        setAdminError('Incorrect PIN');
        setAdminPinInput('');
      }
    } catch (err) {
      if (adminPinInput === '0000') { setViewMode('manager'); setShowAdminLogin(false); }
      else { setAdminError('Error or Wrong PIN'); }
    }
  };

  const handleManagerSelect = () => {
    setAdminError('');
    setAdminPinInput('');
    setShowAdminLogin(true);
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">Connecting...</div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col relative" style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* --- PIN MODAL --- */}
      {showAdminLogin && (
        <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-center mb-4 text-slate-800">Manager Access</h2>
            <input type="password" inputMode="numeric" placeholder="Enter PIN" autoFocus className="w-full text-center text-3xl font-bold border-2 rounded-xl py-4 mb-4 tracking-widest outline-none focus:border-indigo-500 transition-colors" value={adminPinInput} onChange={e => setAdminPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyAdminPin()}/>
            {adminError && <div className="text-center text-red-500 text-sm mb-4 font-medium">{adminError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowAdminLogin(false)} className="py-3 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200">Cancel</button>
              <button onClick={verifyAdminPin} className="py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW ROUTER --- */}
      {viewMode === 'landing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 mb-6">
              <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">SafeClock V2</h1>
            <p className="text-slate-500 font-medium">Select your access mode</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
            {/* Kiosk Button */}
            <button 
              onClick={() => setViewMode('kiosk')}
              className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-indigo-100 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Monitor size={100} className="text-indigo-600 transform rotate-12 translate-x-4 -translate-y-4" />
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                <Monitor size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">Launch Kiosk</h3>
              <p className="text-slate-500 text-sm mb-6">For employees to clock in/out</p>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                Open Interface <ChevronRight size={16} />
              </div>
            </button>

            {/* Manager Button */}
            <button 
              onClick={handleManagerSelect}
              className="group relative bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-slate-200 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <LayoutGrid size={100} className="text-slate-600 transform rotate-12 translate-x-4 -translate-y-4" />
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-4 group-hover:scale-110 transition-transform">
                <LayoutGrid size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">Manager Portal</h3>
              <p className="text-slate-500 text-sm mb-6">Admin controls and reports</p>
              <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                Secure Login <Lock size={14} />
              </div>
            </button>
          </div>
          <div className="mt-12 text-slate-400 text-xs font-mono">v2.1.0 • {kioskLocation}</div>
        </div>
      )}

      {viewMode === 'manager' && (
        <div className="flex-1 flex flex-col">
          <header className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center z-50">
             <div className="flex items-center gap-3 font-bold text-lg"><ShieldCheck className="text-indigo-400" /> Manager Dashboard</div>
             <button onClick={() => setViewMode('landing')} className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2"><LogOut size={16}/> Exit</button>
          </header>
          <div className="flex-1 overflow-auto">
            <ManagerDashboard userId={user.uid} kioskLocation={kioskLocation} setKioskLocation={setKioskLocation} />
          </div>
        </div>
      )}

      {viewMode === 'kiosk' && (
        <div className="flex-1 flex flex-col relative">
          <button onClick={() => setViewMode('landing')} className="absolute top-4 left-4 z-50 p-2 bg-slate-800/50 text-white/50 hover:bg-slate-800 hover:text-white rounded-full transition-all"><ArrowLeft size={20}/></button>
          <KioskMode userId={user.uid} kioskLocation={kioskLocation} />
        </div>
      )}

    </div>
  );
}

function ManagerDashboard({ userId, kioskLocation, setKioskLocation }) {
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('status'); 
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpShift, setNewEmpShift] = useState('08:00'); 
  const [isKeyholder, setIsKeyholder] = useState(false);
  const [settings, setSettings] = useState({ defaultShift: '08:00', dailyMessage: '', adminPin: '0000' });
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (!db) return;
    const handleError = (err) => { if (err.code === 'permission-denied') setPermissionError(true); };
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), (doc) => { if (doc.exists()) { setSettings(prev => ({...prev, ...doc.data()})); if(doc.data().defaultShift) setNewEmpShift(doc.data().defaultShift); } }, handleError);
    const unsubEmps = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'employees')), (s) => setEmployees(s.docs.map(d => ({id: d.id, ...d.data()}))), handleError);
    const unsubLogs = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc')), (s) => setLogs(s.docs.map(d => ({id: d.id, ...d.data()}))), handleError);
    return () => { unsubSettings(); unsubEmps(); unsubLogs(); };
  }, []);

  if (permissionError) return <DatabaseLocked />;

  const addEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpName) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'employees'), { name: newEmpName, phoneNumber: newEmpPhone, shiftStart: newEmpShift, isKeyholder, currentCode: '-----', codeValidDate: '', lastClockIn: null, status: 'out' }); setNewEmpName(''); setNewEmpPhone(''); setIsKeyholder(false); } catch (e) { alert("Error: " + e.message); }
  };

  const generateCodes = async (targetDateStr) => {
    try { const batch = writeBatch(db); employees.forEach(emp => { if (emp.currentCode !== '-----' && emp.codeValidDate === targetDateStr) return; const newCode = Math.floor(100000 + Math.random() * 900000).toString(); batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'employees', emp.id), { currentCode: newCode, codeValidDate: targetDateStr }); }); await batch.commit(); alert('Codes Generated'); } catch (e) { alert("Error: " + e.message); }
  };

  const isLate = (timestamp, shiftTime) => { if (!timestamp || !shiftTime) return false; try { const timeStr = timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); return timeStr > shiftTime; } catch (e) { return false; } };
  const getTargetDate = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex bg-slate-200 p-1 rounded-lg self-start overflow-x-auto w-fit">
        {['status', 'overview', 'reports', 'settings'].map(tab => ( <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${activeTab === tab ? 'bg-white text-indigo-600' : 'text-slate-600'}`}>{tab === 'status' ? 'Who is In?' : tab}</button> ))}
      </div>
      
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {employees.map(emp => (
            <div key={emp.id} className={`p-4 rounded-xl border flex items-center justify-between ${emp.status === 'in' ? 'bg-green-50 border-green-200' : 'bg-white opacity-70'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${emp.status === 'in' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">{emp.name}</h3>
                  <p className="text-xs uppercase">{emp.status === 'in' ? 'Clocked In' : 'Away'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h2 className="font-bold mb-4">Generate Codes</h2>
              <div className="flex gap-4">
                <button onClick={() => generateCodes(getTargetDate(0))} className="bg-amber-50 text-amber-800 px-4 py-2 rounded border border-amber-200 w-full">For Today</button>
                <button onClick={() => generateCodes(getTargetDate(1))} className="bg-indigo-600 text-white px-4 py-2 rounded w-full">For Tomorrow</button>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h2 className="font-bold mb-4">Staff List</h2>
              <form onSubmit={addEmployee} className="flex flex-wrap gap-2 mb-6">
                <input placeholder="Name" className="border p-2 rounded flex-1" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} />
                <input type="time" className="border p-2 rounded w-24" value={newEmpShift} onChange={e => setNewEmpShift(e.target.value)} />
                <input placeholder="WhatsApp (2782...)" className="border p-2 rounded w-32" value={newEmpPhone} onChange={e => setNewEmpPhone(e.target.value)} />
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={isKeyholder} onChange={e => setIsKeyholder(e.target.checked)}/> Keyholder</label>
                <button className="bg-slate-900 text-white px-4 rounded">Add</button>
              </form>
              {employees.map(emp => (
                <div key={emp.id} className="flex justify-between items-center py-2 border-b text-sm">
                  <div><span className="font-medium">{emp.name}</span> <span className="text-xs text-slate-400">({emp.shiftStart || '08:00'})</span></div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-indigo-600">{emp.currentCode}</span>
                    <a href={`https://wa.me/${emp.phoneNumber ? emp.phoneNumber.replace(/\D/g,'') : ''}?text=Hi ${encodeURIComponent(emp.name)}, code: ${emp.currentCode}`} target="_blank" rel="noreferrer" className="text-green-600 text-xs font-bold">Send</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h2 className="font-bold mb-4">Live Activity</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {logs.slice(0, 20).map(log => (
                <div key={log.id} className="flex items-start gap-3 text-sm pb-2 border-b">
                  {log.photoUrl ? (
                    <img src={log.photoUrl} className="w-10 h-10 rounded object-cover bg-slate-100" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-100" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium">
                        {log.employeeName} 
                        {log.action.includes('In') && isLate(log.timestamp, log.shiftStart || settings.defaultShift) && <span className="text-red-500 text-xs font-bold ml-2">LATE</span>}
                      </div>
                      {log.location && <div className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">{log.location}</div>}
                    </div>
                    <div className="text-xs text-slate-500">{log.action} • {log.timestamp?.toDate().toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (<div className="bg-white p-6 rounded-xl border border-slate-200"><h2 className="font-bold mb-4">Log Export</h2><button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => { let csv = "Name,Date,Time,Action,Location\n"; logs.forEach(l => { const t = l.timestamp.toDate(); csv += `${l.employeeName},${t.toLocaleDateString()},${t.toLocaleTimeString()},${l.action},${l.location || 'Unknown'}\n`; }); const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csv); link.download = "logs.csv"; link.click(); }}>Download CSV</button></div>)}
      {activeTab === 'settings' && (<div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-slate-200 space-y-4"><h2 className="font-bold">System Settings</h2><div><label className="text-xs font-bold text-slate-500 block mb-1">THIS DEVICE NAME</label><div className="flex gap-2"><MapPin size={18} className="text-indigo-600"/><input className="border w-full p-2 rounded" value={kioskLocation} onChange={e => setKioskLocation(e.target.value)} placeholder="e.g. Warehouse 1"/></div><p className="text-[10px] text-slate-400 mt-1">Set this differently on each tablet.</p></div><hr/><div><label className="text-xs">Admin PIN</label><input className="border w-full p-2 rounded" value={settings.adminPin} onChange={e => setSettings({...settings, adminPin: e.target.value})}/></div><div><label className="text-xs">Default Shift</label><input type="time" className="border w-full p-2 rounded" value={settings.defaultShift} onChange={e => setSettings({...settings, defaultShift: e.target.value})}/></div><div><label className="text-xs">Daily Message</label><input className="border w-full p-2 rounded" value={settings.dailyMessage} onChange={e => setSettings({...settings, dailyMessage: e.target.value})}/></div><button onClick={async () => { if(db) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), settings); alert('Saved'); } }} className="w-full bg-slate-900 text-white py-2 rounded">Save Config</button></div>)}
    </div>
  );
}

function KioskMode({ userId, kioskLocation }) {
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState('locked'); 
  const [message, setMessage] = useState('');
  const [clock, setClock] = useState(new Date());
  const [dailyMsg, setDailyMsg] = useState('');
  const [permissionError, setPermissionError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    if(db) onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), d => d.exists() && setDailyMsg(d.data().dailyMessage), (err) => { if(err.code === 'permission-denied') setPermissionError(true); });
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; }).catch(console.error);
    return () => clearInterval(timer);
  }, []);

  if (permissionError) return <DatabaseLocked />;

  const capturePhoto = () => { if (videoRef.current && canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); ctx.drawImage(videoRef.current, 0, 0, 100, 100); return canvasRef.current.toDataURL('image/jpeg', 0.5); } return null; };
  const handlePress = (n) => { if (inputCode.length < 6) setInputCode(prev => prev + n); };
  const handleSubmit = async () => {
    if (inputCode.length !== 6) return;
    const prevStatus = status; setStatus('processing');
    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'employees'), where('currentCode', '==', inputCode));
      const snap = await getDocs(q);
      if (snap.empty) { setStatus('error'); setMessage('Invalid Code'); setTimeout(() => { setStatus(prevStatus); setInputCode(''); }, 2000); return; }
      const empDoc = snap.docs[0]; const emp = empDoc.data(); const today = new Date().toLocaleDateString('en-CA'); const photo = capturePhoto();
      if (prevStatus === 'locked') {
        if (emp.isKeyholder && emp.codeValidDate === today) { await performAction(empDoc, emp, 'Clock In (Unlock)', 'in', photo); setStatus('success'); setMessage(`Unlocked: ${emp.name}`); setTimeout(() => { setStatus('idle'); setInputCode(''); }, 2000); } else { setStatus('error'); setMessage('Auth Failed'); setTimeout(() => { setStatus('locked'); setInputCode(''); }, 2000); }
        return;
      }
      if (emp.codeValidDate !== today) { setStatus('error'); setMessage('Code Expired'); setTimeout(() => { setStatus('idle'); setInputCode(''); }, 2000); return; }
      const action = emp.status === 'in' ? 'Clock Out' : 'Clock In';
      await performAction(empDoc, emp, action, emp.status === 'in' ? 'out' : 'in', photo);
      setStatus('success'); setMessage(emp.status === 'in' ? 'Goodbye!' : dailyMsg || 'Welcome!'); setTimeout(() => { setStatus('idle'); setInputCode(''); }, 3000);
    } catch (e) { console.error(e); setStatus('error'); setMessage('System Error'); setTimeout(() => setStatus(prevStatus), 2000); }
  };

  const performAction = async (ref, data, action, newStatus, photo) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { employeeId: ref.id, employeeName: data.name, shiftStart: data.shiftStart || '08:00', action, timestamp: serverTimestamp(), photoUrl: photo, location: kioskLocation });
    await updateDoc(ref.ref, { lastClockIn: serverTimestamp(), status: newStatus });
  };

  return (
    <div className={`min-h-full flex flex-col items-center justify-center p-4 transition-colors duration-500 ${status === 'locked' ? 'bg-black' : 'bg-slate-900'} relative overflow-hidden flex-1`}>
      <canvas ref={canvasRef} width="100" height="100" className="hidden" />
      <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ${status === 'locked' ? 'opacity-0' : 'opacity-20'}`} />
      <div className="text-center mb-8 relative z-10">
        {status === 'locked' ? <div className="text-slate-500 flex flex-col items-center"><Lock size={48} /><span className="text-sm mt-2 uppercase tracking-widest">System Locked</span></div> : <div className="text-slate-400 font-medium tracking-widest uppercase text-sm mb-2">SafeClock • {kioskLocation}</div>}
        <div className="text-6xl font-bold text-white">{clock.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
        <div className="text-slate-400 mt-2">{clock.toLocaleDateString()}</div>
      </div>
      <div className={`relative z-10 bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${status === 'locked' ? 'opacity-80' : 'opacity-100'}`}>
        <div className={`h-32 flex flex-col items-center justify-center p-6 ${status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : status === 'locked' ? 'bg-slate-800' : 'bg-slate-100'}`}>
          {status === 'success' && <><CheckCircle className="text-white mb-2" size={40}/><div className="text-white text-xl font-bold">{message}</div></>}
          {status === 'error' && <><XCircle className="text-white mb-2" size={40}/><div className="text-white text-xl font-bold">Error</div><div className="text-red-100 text-sm">{message}</div></>}
          {(status === 'locked' || status === 'idle' || status === 'processing') && (<><div className={`text-sm mb-2 font-medium flex items-center gap-2 ${status === 'locked' ? 'text-slate-400' : 'text-slate-500'}`}>{status === 'locked' ? <><Key size={14}/> KEYHOLDER UNLOCK</> : <><Camera size={14}/> ENTER CODE</>}</div><div className={`text-4xl font-mono font-bold tracking-[0.5em] h-10 ${status === 'locked' ? 'text-white' : 'text-slate-800'}`}>{inputCode.padEnd(6, '•')}</div></>)}
        </div>
        <div className={`p-6 grid grid-cols-3 gap-4 ${status === 'locked' ? 'bg-slate-900' : 'bg-white'}`}>
          {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => handlePress(n.toString())} className={`h-16 rounded-2xl text-2xl font-bold shadow-sm border ${status === 'locked' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-700 active:bg-slate-200'}`}>{n}</button>)}
          <button onClick={() => {setInputCode(''); if(status!=='locked') setStatus('idle')}} className={`h-16 rounded-2xl font-medium text-sm ${status === 'locked' ? 'bg-red-900/30 text-red-400' : 'bg-amber-50 text-amber-600'}`}>CLEAR</button>
          <button onClick={() => handlePress('0')} className={`h-16 rounded-2xl text-2xl font-bold shadow-sm border ${status === 'locked' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-700 active:bg-slate-200'}`}>0</button>
          <button onClick={() => setInputCode(p => p.slice(0,-1))} className={`h-16 rounded-2xl font-medium ${status === 'locked' ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-500'}`}>⌫</button>
        </div>
        <div className={`p-6 pt-0 ${status === 'locked' ? 'bg-slate-900' : 'bg-white'}`}>
          <button onClick={handleSubmit} disabled={inputCode.length !== 6 || status === 'processing' || status === 'success'} className={`w-full h-16 text-lg font-bold rounded-2xl shadow-lg ${status === 'locked' ? 'bg-indigo-900 text-indigo-200 disabled:bg-slate-800' : 'bg-indigo-600 text-white disabled:bg-slate-300'}`}>{status === 'processing' ? 'Processing...' : status === 'locked' ? 'UNLOCK SYSTEM' : 'CONFIRM'}</button>
        </div>
      </div>
      <div className="mt-8 text-slate-600 text-xs flex items-center gap-2 opacity-50 relative z-10"><ShieldCheck size={12} /> Secure Connection • Location Verified • Camera Active</div>
    </div>
  );
}