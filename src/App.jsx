import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  Clock,
  Users,
  ShieldCheck,
  History,
  RefreshCw,
  CheckCircle,
  XCircle,
  LayoutGrid,
  Monitor,
  MessageCircle,
  FileText,
  Download,
  Lock,
  Key,
  Menu,
  Phone,
  Camera,
  LogIn,
  LogOut,
  Settings,
  Bell,
  AlertTriangle,
  Clock4,
  Shield,
} from 'lucide-react';

// ==========================================
// PASTE YOUR FIREBASE KEYS HERE
// (Keep these placeholders if testing in this chat window.
//  Replace them only when pasting into StackBlitz)
// ==========================================
let firebaseConfig = {
  apiKey: 'AIzaSyCB7ubf-QD1KPmTkq4HX-pLOfLACsqthwg',
  authDomain: 'safeclock-41787.firebaseapp.com',
  projectId: 'safeclock-41787',
  storageBucket: 'safeclock-41787.firebasestorage.app',
  messagingSenderId: '874093872562',
  appId: '1:874093872562:web:1cac723ac784bb8acd10ab',
};

// --- AUTOMATIC CHAT PREVIEW SETUP ---
// This block allows the code to run HERE in the chat without crashing.
// When you copy this to StackBlitz, this block will simply be skipped
// because __firebase_config won't exist there.
if (typeof __firebase_config !== 'undefined') {
  firebaseConfig = JSON.parse(__firebase_config);
}
// ==========================================

// --- SAFETY INITIALIZATION ---
let app, auth, db, configError;

try {
  // 1. Check if keys are still placeholders AND we aren't in the chat environment
  if (
    firebaseConfig.apiKey.includes('PASTE_API_KEY') &&
    typeof __firebase_config === 'undefined'
  ) {
    throw new Error(
      'You must paste your real Firebase Keys in the code (lines 17-24).'
    );
  }

  // 2. Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  configError = err.message;
  console.error('Firebase Initialization Error:', err);
}

// Use a static App ID for your workplace (or dynamic if in chat)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-workplace-001';

export default function App() {
  // If config failed, show the error immediately instead of crashing
  if (configError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border-l-4 border-red-500">
          <div className="text-red-500 mb-4 flex justify-center">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            System Configuration Error
          </h2>
          <p className="text-slate-600 mb-6">{configError}</p>
          <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded text-left font-mono">
            Tip: Go to Firebase Console &gt; Project Settings &gt; General &gt;
            Your Apps to find your keys.
          </div>
        </div>
      </div>
    );
  }

  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('manager'); // 'manager' or 'kiosk'

  // Admin Auth State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    // Only run auth if initialization succeeded
    if (!auth) return;

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error('Auth Error:', e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleManagerClick = () => {
    if (viewMode === 'manager') return;
    setShowAdminLogin(true);
    setAdminError('');
    setAdminPinInput('');
  };

  const verifyAdminPin = async () => {
    if (!user || !db) return;
    try {
      // Fetch the configured PIN (or default to 0000)
      const settingsRef = doc(
        db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'settings',
        'config'
      );
      const settingsSnap = await getDoc(settingsRef);
      const correctPin =
        settingsSnap.exists() && settingsSnap.data().adminPin
          ? settingsSnap.data().adminPin
          : '0000';

      if (adminPinInput === correctPin) {
        setViewMode('manager');
        setShowAdminLogin(false);
      } else {
        setAdminError('Incorrect PIN');
        setAdminPinInput('');
      }
    } catch (err) {
      console.error('Auth error', err);
      // Fallback for first run if database is empty
      if (adminPinInput === '0000') {
        setViewMode('manager');
        setShowAdminLogin(false);
      } else {
        setAdminError('System Error or Wrong PIN');
      }
    }
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">
        Connecting to Cloud...
      </div>
    );

  return (
    <div
      className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col relative"
      // SAFETY STYLE: Forces good font/layout even if Tailwind fails to load
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f1f5f9',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <Shield className="text-indigo-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Admin Access</h2>
              <p className="text-sm text-slate-500">
                Enter Admin PIN to continue
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                placeholder="PIN"
                autoFocus
                className="w-full text-center text-3xl tracking-[0.5em] font-bold border-2 border-slate-200 rounded-xl py-3 focus:border-indigo-500 outline-none transition-colors"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verifyAdminPin()}
              />

              {adminError && (
                <div className="text-center text-red-500 text-sm font-medium animate-pulse">
                  {adminError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowAdminLogin(false)}
                  className="py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyAdminPin}
                  className="py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Unlock
                </button>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-slate-400">
              Default PIN: 0000
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="text-indigo-400" />
            SafeClock Pro
          </div>

          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={handleManagerClick}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'manager'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'manager' ? (
                <LayoutGrid size={14} />
              ) : (
                <Lock size={14} />
              )}
              Manager
            </button>
            <button
              onClick={() => setViewMode('kiosk')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'kiosk'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor size={14} /> Kiosk
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1">
        {viewMode === 'manager' ? (
          <ManagerDashboard userId={user.uid} />
        ) : (
          <KioskMode userId={user.uid} />
        )}
      </div>
    </div>
  );
}

// --- Manager Dashboard Component ---
function ManagerDashboard({ userId }) {
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('status');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpShift, setNewEmpShift] = useState('08:00');
  const [isKeyholder, setIsKeyholder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    defaultShift: '08:00',
    dailyMessage: 'Welcome to work!',
    adminPin: '0000',
  });

  // Fetch Settings
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      doc(db, 'artifacts', appId, 'users', userId, 'settings', 'config'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSettings((prev) => ({ ...prev, ...data }));
          if (data.defaultShift) setNewEmpShift(data.defaultShift);
        }
      }
    );
    return unsub;
  }, [userId]);

  // Fetch Employees
  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, 'artifacts', appId, 'users', userId, 'employees')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEmployees(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (error) => console.error('Error fetching employees:', error)
    );
    return () => unsubscribe();
  }, [userId]);

  // Fetch Logs
  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, 'artifacts', appId, 'users', userId, 'logs'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setLogs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => console.error('Error fetching logs:', error)
    );
    return () => unsubscribe();
  }, [userId]);

  const addEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpName || !db) return;
    await addDoc(
      collection(db, 'artifacts', appId, 'users', userId, 'employees'),
      {
        name: newEmpName,
        phoneNumber: newEmpPhone,
        shiftStart: newEmpShift,
        isKeyholder: isKeyholder,
        currentCode: '-----',
        codeValidDate: '',
        lastClockIn: null,
        status: 'out',
      }
    );
    setNewEmpName('');
    setNewEmpPhone('');
    setIsKeyholder(false);
  };

  const saveSettings = async () => {
    if (!db) return;
    await setDoc(
      doc(db, 'artifacts', appId, 'users', userId, 'settings', 'config'),
      settings
    );
    alert('Settings Saved');
  };

  const generateCodes = async (targetDateStr) => {
    if (!db) return;
    setLoading(true);
    const batch = writeBatch(db);
    let updatedCount = 0;

    employees.forEach((emp) => {
      if (emp.currentCode !== '-----' && emp.codeValidDate === targetDateStr) {
        return;
      }
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const empRef = doc(
        db,
        'artifacts',
        appId,
        'users',
        userId,
        'employees',
        emp.id
      );
      batch.update(empRef, {
        currentCode: newCode,
        codeValidDate: targetDateStr,
      });
      updatedCount++;
    });

    if (updatedCount > 0) {
      await batch.commit();
      alert(`Generated codes for ${updatedCount} employees.`);
    } else {
      alert('All employees already have codes for this date.');
    }
    setLoading(false);
  };

  const getTargetDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-CA');
  };

  const isLate = (timestamp, shiftTime) => {
    if (!timestamp || !shiftTime) return false;
    const date = timestamp.toDate();
    const timeStr = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return timeStr > shiftTime;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            Manager Dashboard
          </h1>
          <p className="text-slate-500">Overview & Controls</p>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-lg self-start overflow-x-auto">
          {['status', 'overview', 'reports', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'status' ? 'Who is In?' : tab}
            </button>
          ))}
        </div>
      </header>

      {/* --- TAB: WHO IS IN (Live Status) --- */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`p-4 rounded-xl border flex items-center justify-between ${
                emp.status === 'in'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-slate-200 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    emp.status === 'in'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{emp.name}</h3>
                  <p
                    className={`text-xs font-medium uppercase ${
                      emp.status === 'in' ? 'text-green-600' : 'text-slate-400'
                    }`}
                  >
                    {emp.status === 'in' ? 'Clocked In' : 'Away'}
                  </p>
                </div>
              </div>
              {emp.status === 'in' && (
                <CheckCircle size={20} className="text-green-500" />
              )}
            </div>
          ))}
          {employees.length === 0 && (
            <p className="text-slate-400">No employees found.</p>
          )}
        </div>
      )}

      {/* --- TAB: OVERVIEW (Actions & Logs) --- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Col: Actions & Staff */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RefreshCw size={20} className="text-indigo-500" />
                Generate Access Codes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <p className="font-bold text-amber-900">For Today</p>
                  <p className="text-xs text-amber-700 mb-3">
                    {new Date().toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => generateCodes(getTargetDate(0))}
                    disabled={loading || employees.length === 0}
                    className="w-full bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    Generate Today's Codes
                  </button>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <p className="font-bold text-indigo-900">For Tomorrow</p>
                  <p className="text-xs text-indigo-700 mb-3">
                    {getTargetDate(1)}
                  </p>
                  <button
                    onClick={() => generateCodes(getTargetDate(1))}
                    disabled={loading || employees.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                  >
                    Generate Tomorrow's Codes
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users size={20} className="text-slate-500" />
                Staff List
              </h2>

              <form
                onSubmit={addEmployee}
                className="flex flex-wrap items-end gap-2 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100"
              >
                <div className="flex-1 min-w-[150px]">
                  <label className="text-xs text-slate-500 font-medium ml-1">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                  />
                </div>

                <div className="w-[120px]">
                  <label className="text-xs text-slate-500 font-medium ml-1">
                    Shift Start
                  </label>
                  <input
                    type="time"
                    className="w-full px-2 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmpShift}
                    onChange={(e) => setNewEmpShift(e.target.value)}
                  />
                </div>

                <div className="flex-1 min-w-[140px] relative">
                  <label className="text-xs text-slate-500 font-medium ml-1">
                    WhatsApp
                  </label>
                  <div className="relative">
                    <Phone
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="tel"
                      placeholder="2782..."
                      className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newEmpPhone}
                      onChange={(e) => setNewEmpPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pb-3 px-1">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isKeyholder}
                      onChange={(e) => setIsKeyholder(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Keyholder
                  </label>
                </div>

                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 font-medium whitespace-nowrap h-[42px]">
                  Add
                </button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-500 uppercase border-b">
                      <th className="pb-3 pl-2">Name</th>
                      <th className="pb-3">Shift</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {employees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="border-b last:border-0 hover:bg-slate-50"
                      >
                        <td className="py-3 pl-2 font-medium text-slate-800">
                          {emp.name}
                        </td>
                        <td className="py-3 text-slate-500 flex items-center gap-1">
                          <Clock4 size={14} className="text-slate-400" />
                          {emp.shiftStart || '08:00'}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                              emp.status === 'in'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {emp.status === 'in' ? 'In' : 'Out'}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-indigo-600">
                          {emp.currentCode}
                        </td>
                        <td className="py-3">
                          {emp.currentCode && emp.currentCode !== '-----' && (
                            <a
                              href={`https://wa.me/${
                                emp.phoneNumber
                                  ? emp.phoneNumber.replace(/\D/g, '')
                                  : ''
                              }?text=Hi ${encodeURIComponent(
                                emp.name
                              )}, your clock-in code for ${
                                emp.codeValidDate
                              } is: ${emp.currentCode}`}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-xs transition-colors"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle size={14} /> Send
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Col: Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History size={20} className="text-slate-500" />
              Latest Activity
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {logs.slice(0, 15).map((log) => {
                const shiftTime =
                  log.shiftStart || settings.defaultShift || '08:00';
                const late =
                  log.action.includes('In') && isLate(log.timestamp, shiftTime);

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 text-sm pb-3 border-b last:border-0"
                  >
                    {log.photoUrl ? (
                      <img
                        src={log.photoUrl}
                        alt="selfie"
                        className="w-10 h-10 rounded object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users size={16} />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-slate-800">
                          {log.employeeName}
                        </p>
                        {late && (
                          <div className="text-right">
                            <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold block">
                              LATE
                            </span>
                            <span className="text-[9px] text-red-400 block">
                              Shift: {shiftTime}
                            </span>
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-xs ${
                          log.action.includes('In')
                            ? 'text-green-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {log.action}
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        {log.timestamp
                          ? new Date(log.timestamp.toDate()).toLocaleString()
                          : 'Just now'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: REPORTS --- */}
      {activeTab === 'reports' && (
        <WeeklyReport employees={employees} logs={logs} />
      )}

      {/* --- TAB: SETTINGS --- */}
      {activeTab === 'settings' && (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Settings className="text-indigo-600" /> System Configuration
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Admin PIN
              </label>
              <div className="flex items-center gap-3">
                <Shield className="text-indigo-500" size={18} />
                <input
                  type="text"
                  maxLength="4"
                  inputMode="numeric"
                  value={settings.adminPin || '0000'}
                  onChange={(e) =>
                    setSettings({ ...settings, adminPin: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 w-full tracking-widest font-mono"
                  placeholder="0000"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This PIN is required to switch from Kiosk to Manager mode.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Shift Start
              </label>
              <div className="flex items-center gap-3">
                <Clock4 className="text-slate-500" size={18} />
                <input
                  type="time"
                  value={settings.defaultShift || '08:00'}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultShift: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 w-full"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This time will be pre-filled when adding new employees.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Daily Announcement Message
              </label>
              <div className="flex items-center gap-3">
                <Bell className="text-indigo-500" size={18} />
                <input
                  type="text"
                  value={settings.dailyMessage || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, dailyMessage: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2 w-full"
                  placeholder="e.g. Happy Birthday John!"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This message is displayed to employees when they clock in.
              </p>
            </div>

            <button
              onClick={saveSettings}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Weekly Report Component ---
function WeeklyReport({ employees, logs }) {
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        comparisonStr: d.toLocaleDateString(),
        displayDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
        displayNum: d.getDate(),
        key: d.toISOString(),
      });
    }
    return days;
  };

  const daysData = getLast7Days();

  const findTime = (empName, dateStr) => {
    const entry = logs
      .filter((log) => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp.toDate()).toLocaleDateString();
        return (
          log.employeeName === empName &&
          logDate === dateStr &&
          log.action.includes('In')
        );
      })
      .sort((a, b) => a.timestamp - b.timestamp)[0];

    if (!entry) return '-';
    return new Date(entry.timestamp.toDate()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadReport = () => {
    let csv = 'Employee,Date,Time,Type,Scheduled Shift\n';
    logs.forEach((l) => {
      const t = l.timestamp ? new Date(l.timestamp.toDate()) : new Date();
      const shift = l.shiftStart || 'N/A';
      csv += `${
        l.employeeName
      },${t.toLocaleDateString()},${t.toLocaleTimeString()},${
        l.action
      },${shift}\n`;
    });
    const encoded = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', 'report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText size={20} className="text-indigo-500" />
          Last 7 Days (First Clock-In)
        </h2>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700"
        >
          <Download size={16} /> Download Full Log
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 font-semibold text-slate-700 min-w-[150px]">
                Employee
              </th>
              {daysData.map((day) => (
                <th
                  key={day.key}
                  className="p-3 font-semibold text-slate-600 text-center min-w-[80px]"
                >
                  <div className="text-xs uppercase text-slate-400">
                    {day.displayDay}
                  </div>
                  <div>{day.displayNum}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">
                  {emp.name}
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock4 size={8} /> {emp.shiftStart || '08:00'}
                  </div>
                </td>
                {daysData.map((day) => {
                  const time = findTime(emp.name, day.comparisonStr);
                  return (
                    <td
                      key={day.key}
                      className={`p-3 text-center text-sm ${
                        time !== '-'
                          ? 'text-green-600 font-medium bg-green-50/50'
                          : 'text-slate-300'
                      }`}
                    >
                      {time}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Kiosk Mode Component ---
function KioskMode({ userId }) {
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState('locked');
  const [message, setMessage] = useState('');
  const [clock, setClock] = useState(new Date());
  const [dailyMsg, setDailyMsg] = useState('');

  // Camera Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Fetch Settings for Daily Message
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      doc(db, 'artifacts', appId, 'users', userId, 'settings', 'config'),
      (doc) => {
        if (doc.exists()) setDailyMsg(doc.data().dailyMessage);
      }
    );
    return unsub;
  }, [userId]);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Activate Camera when Kiosk is Idle or Processing
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Camera error:', err);
      }
    };
    startCamera();
    // Cleanup not fully implemented for single-file simplicity, but browser handles stream release usually on nav
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      // Draw small thumbnail (100x100) to keep Firestore happy
      context.drawImage(videoRef.current, 0, 0, 100, 100);
      return canvasRef.current.toDataURL('image/jpeg', 0.5); // Low quality jpeg
    }
    return null;
  };

  const handlePress = (num) => {
    if (inputCode.length < 6) setInputCode((prev) => prev + num);
  };

  const handleClear = () => {
    setInputCode('');
    if (status !== 'locked') setStatus('idle');
  };

  const handleBackspace = () => setInputCode((prev) => prev.slice(0, -1));

  const handleSubmit = async () => {
    if (!db) return;
    if (inputCode.length !== 6) return;
    const previousStatus = status;
    setStatus('processing');

    try {
      const empQuery = query(
        collection(db, 'artifacts', appId, 'users', userId, 'employees'),
        where('currentCode', '==', inputCode)
      );
      const querySnapshot = await getDocs(empQuery);

      if (querySnapshot.empty) {
        showError('Invalid Code.', previousStatus);
        return;
      }

      const empDoc = querySnapshot.docs[0];
      const empData = empDoc.data();
      const todayStr = new Date().toLocaleDateString('en-CA');
      const photo = capturePhoto();

      // --- UNLOCK LOGIC ---
      if (previousStatus === 'locked') {
        if (empData.isKeyholder && empData.codeValidDate === todayStr) {
          await performClockAction(
            empDoc,
            empData,
            'Clock In (Unlock)',
            'in',
            photo
          );
          setStatus('success');
          setMessage(`Unlocked: ${empData.name}`);
          setTimeout(() => {
            setStatus('idle');
            setInputCode('');
          }, 3000);
          return;
        } else {
          showError('Auth Failed or Expired.', 'locked');
          return;
        }
      }

      // --- STANDARD LOGIC (In/Out) ---
      if (empData.codeValidDate && empData.codeValidDate !== todayStr) {
        showError(`Code expired.`, 'idle');
        return;
      }

      // Determine Action
      const isClockingOut = empData.status === 'in';
      const action = isClockingOut ? 'Clock Out' : 'Clock In';
      const newStatus = isClockingOut ? 'out' : 'in';

      await performClockAction(empDoc, empData, action, newStatus, photo);

      setStatus('success');
      setMessage(
        isClockingOut
          ? `Goodbye, ${empData.name.split(' ')[0]}`
          : dailyMsg || `Welcome, ${empData.name.split(' ')[0]}`
      );

      setTimeout(() => {
        setStatus('idle');
        setInputCode('');
      }, 4000);
    } catch (error) {
      console.error(error);
      showError('System Error.', previousStatus);
    }
  };

  const performClockAction = async (
    empDoc,
    empData,
    action,
    newStatus,
    photo
  ) => {
    if (!db) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'logs'), {
      employeeId: empDoc.id,
      employeeName: empData.name,
      shiftStart: empData.shiftStart || '08:00', // RECORD THE SHIFT TIME IN THE LOG
      action: action,
      timestamp: serverTimestamp(),
      photoUrl: photo,
    });

    await updateDoc(
      doc(db, 'artifacts', appId, 'users', userId, 'employees', empDoc.id),
      {
        lastClockIn: serverTimestamp(),
        status: newStatus,
      }
    );
  };

  const showError = (msg, revertToStatus) => {
    setStatus('error');
    setMessage(msg);
    setTimeout(() => {
      setStatus(revertToStatus);
      setInputCode('');
    }, 3000);
  };

  const isLocked = status === 'locked';

  return (
    <div
      className={`min-h-full flex flex-col items-center justify-center p-4 transition-colors duration-500 ${
        isLocked ? 'bg-black' : 'bg-slate-900'
      } relative overflow-hidden`}
    >
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} width="100" height="100" className="hidden" />

      {/* Camera Feed Background (Subtle) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none ${
          isLocked ? 'hidden' : 'block'
        }`}
      />

      {/* Kiosk Header */}
      <div className="text-center mb-8 mt-8 relative z-10">
        {isLocked ? (
          <div className="flex flex-col items-center text-slate-500 mb-4 animate-pulse">
            <Lock size={48} />
            <span className="text-sm mt-2 uppercase tracking-widest">
              System Locked
            </span>
          </div>
        ) : (
          <div className="text-slate-400 font-medium tracking-widest uppercase text-sm mb-2">
            SafeClock System
          </div>
        )}
        <div className="text-6xl font-bold text-white tracking-tight">
          {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-slate-400 mt-2">
          {clock.toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Main Interface */}
      <div
        className={`relative z-10 bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transition-opacity duration-500 ${
          isLocked ? 'opacity-80' : 'opacity-100'
        }`}
      >
        {/* Status Display Area */}
        <div
          className={`h-36 flex flex-col items-center justify-center p-6 transition-colors duration-300 
          ${
            status === 'success'
              ? 'bg-green-500'
              : status === 'error'
              ? 'bg-red-500'
              : isLocked
              ? 'bg-slate-800'
              : 'bg-slate-100'
          }`}
        >
          {status === 'success' && (
            <>
              <CheckCircle className="text-white mb-2" size={40} />
              <div className="text-white text-xl font-bold text-center px-4">
                {message}
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="text-white mb-2" size={40} />
              <div className="text-white text-xl font-bold">Error</div>
              <div className="text-red-100 text-sm">{message}</div>
            </>
          )}

          {status === 'locked' && (
            <>
              <div className="text-slate-400 text-sm mb-2 font-medium flex items-center gap-2">
                <Key size={14} /> KEYHOLDER UNLOCK
              </div>
              <div className="text-4xl font-mono font-bold text-white tracking-[0.5em] h-10">
                {inputCode.padEnd(6, '•')}
              </div>
            </>
          )}

          {(status === 'idle' || status === 'processing') && (
            <>
              <div className="text-slate-500 text-sm mb-2 font-medium flex items-center gap-2">
                <Camera size={14} /> ENTER CODE
              </div>
              <div className="text-4xl font-mono font-bold text-slate-800 tracking-[0.5em] h-10">
                {inputCode.padEnd(6, '•')}
              </div>
            </>
          )}
        </div>

        {/* Numpad */}
        <div
          className={`p-6 grid grid-cols-3 gap-4 ${
            isLocked ? 'bg-slate-900' : 'bg-white'
          }`}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePress(num.toString())}
              className={`h-16 rounded-2xl text-2xl font-bold transition-colors shadow-sm border
                ${
                  isLocked
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 active:bg-slate-600'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={handleClear}
            className={`h-16 rounded-2xl font-medium transition-colors text-sm
              ${
                isLocked
                  ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-600'
              }`}
          >
            CLEAR
          </button>

          <button
            onClick={() => handlePress('0')}
            className={`h-16 rounded-2xl text-2xl font-bold transition-colors shadow-sm border
              ${
                isLocked
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 active:bg-slate-600'
                  : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
              }`}
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className={`h-16 rounded-2xl font-medium transition-colors
              ${
                isLocked
                  ? 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
              }`}
          >
            ⌫
          </button>
        </div>

        {/* Submit Button */}
        <div className={`p-6 pt-0 ${isLocked ? 'bg-slate-900' : 'bg-white'}`}>
          <button
            onClick={handleSubmit}
            disabled={
              inputCode.length !== 6 ||
              status === 'processing' ||
              status === 'success'
            }
            className={`w-full h-16 text-lg font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]
              ${
                isLocked
                  ? 'bg-indigo-900 text-indigo-200 hover:bg-indigo-800 shadow-indigo-900/50 disabled:bg-slate-800 disabled:text-slate-600'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 disabled:bg-slate-300 disabled:cursor-not-allowed'
              }`}
          >
            {status === 'processing'
              ? 'Processing...'
              : isLocked
              ? 'UNLOCK SYSTEM'
              : 'CONFIRM'}
          </button>
        </div>
      </div>

      <div className="mt-8 text-slate-600 text-xs flex items-center gap-2 opacity-50 relative z-10">
        <ShieldCheck size={12} /> Secure Connection • Location Verified • Camera
        Active
      </div>
    </div>
  );
}
