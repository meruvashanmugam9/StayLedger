import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  Mail, 
  Phone, 
  RefreshCw, 
  Sliders, 
  MessageSquare,
  Building,
  Calendar,
  Lock,
  Unlock,
  Plus,
  Trash2,
  DollarSign,
  X,
  Check,
  Sparkles
} from 'lucide-react';

export interface SubscriptionMonthRecord {
  id: string;
  monthKey: string; // e.g. "June 2026"
  amountBilled: number;
  amountPaid: number;
  paidDate?: string;
  status: 'Paid' | 'Pending' | 'Waived';
  notes?: string;
}

interface PlatformUser {
  uid: string;
  email: string;
  displayName?: string;
  businessName?: string;
  phone?: string;
  roomCount?: number;
  guestCount?: number;
  subscriptionStatus?: 'active' | 'suspended' | 'unpaid';
  suspensionMessage?: string;
  lastActive?: string;
  subscriptionLedger?: SubscriptionMonthRecord[];
}

export default function PlatformAdmin() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'suspended' | 'active'>('all');
  
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'unpaid'>('active');
  const [newMessage, setNewMessage] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [syncCount, setSyncCount] = useState(0);

  // Global App Versioning states for Live Update system
  const [latestVersion, setLatestVersion] = useState('1.3.0');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [updateNotes, setUpdateNotes] = useState('Added Business Settings & Splitter modules!');
  const [isCritical, setIsCritical] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);

  // New billing cycle form state
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [billingMonth, setBillingMonth] = useState('');
  const [billingAmount, setBillingAmount] = useState('500');
  const [billingStatus, setBillingStatus] = useState<'Paid' | 'Pending'>('Pending');
  const [billingNotes, setBillingNotes] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      const list: PlatformUser[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        list.push({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          businessName: data.businessName || '',
          phone: data.phone || '',
          roomCount: data.roomCount || 0,
          guestCount: data.guestCount || 0,
          subscriptionStatus: data.subscriptionStatus || 'active',
          suspensionMessage: data.suspensionMessage || '',
          lastActive: data.lastActive || '',
          subscriptionLedger: data.subscriptionLedger || [],
        });
      });
      setUsers(list);
    } catch (error) {
      console.error("Error retrieving users for Platform Admin Panel:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const configRef = doc(db, 'system', 'app_config');
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        const data = snap.data();
        setLatestVersion(data.latestVersion || '1.3.0');
        setDownloadUrl(data.downloadUrl || '');
        setUpdateNotes(data.updateNotes || '');
        setIsCritical(!!data.isCritical);
      }
    } catch (err) {
      console.error("Error reading system app config: ", err);
    }
  };

  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setVersionLoading(true);
    try {
      const configRef = doc(db, 'system', 'app_config');
      await setDoc(configRef, {
        latestVersion,
        downloadUrl,
        updateNotes,
        isCritical,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("Live App Update parameters successfully saved. Friends & clients with older APK downloads will see an instant update overlay!");
    } catch (err) {
      console.error("Error saving system app config: ", err);
      alert("Failed to write global update configuration. Check internet connection.");
    } finally {
      setVersionLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSystemConfig();
  }, [syncCount]);

  const handleEditClick = (u: PlatformUser) => {
    setEditingUser(u);
    setNewStatus(u.subscriptionStatus || 'active');
    setNewMessage(u.suspensionMessage || '');
    setShowAddCycle(false);
  };

  const handleSaveStatus = async () => {
    if (!editingUser) return;
    setSaveLoading(true);
    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        subscriptionStatus: newStatus,
        suspensionMessage: newMessage,
      });

      // Update local state
      setUsers(users.map(u => u.uid === editingUser.uid ? {
        ...u,
        subscriptionStatus: newStatus,
        suspensionMessage: newMessage
      } : u));
      
      setEditingUser({
        ...editingUser,
        subscriptionStatus: newStatus,
        suspensionMessage: newMessage
      });
      
      alert(`Access mode successfully updated to ${newStatus.toUpperCase()}!`);
    } catch (error) {
      console.error("Error setting license status:", error);
      alert("Failed to update status. Check permissions or network.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddBillingCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !billingMonth) {
      alert("Please fill in the billing month (e.g. June 2026)");
      return;
    }

    const amount = Number(billingAmount) || 0;
    const newRecord: SubscriptionMonthRecord = {
      id: Date.now().toString(),
      monthKey: billingMonth,
      amountBilled: amount,
      amountPaid: billingStatus === 'Paid' ? amount : 0,
      paidDate: billingStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined,
      status: billingStatus === 'Paid' ? 'Paid' : 'Pending',
      notes: billingNotes,
    };

    const currentLedger = editingUser.subscriptionLedger || [];
    // Ensure no duplicate monthKey records
    if (currentLedger.some(r => r.monthKey.trim().toLowerCase() === billingMonth.trim().toLowerCase())) {
      alert("A billing record for this month already exists! Toggle the status of the existing record instead.");
      return;
    }

    const updatedLedger = [...currentLedger, newRecord].sort((a, b) => b.id.localeCompare(a.id));

    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        subscriptionLedger: updatedLedger
      });

      // Auto check if we should align subscription status based on pending bills
      let resolvedStatus = editingUser.subscriptionStatus;
      if (billingStatus === 'Pending') {
        resolvedStatus = 'unpaid';
      }

      if (resolvedStatus !== editingUser.subscriptionStatus) {
        await updateDoc(userRef, {
          subscriptionStatus: resolvedStatus,
          suspensionMessage: `Overdue payment alert! Your EasyStay workspace subscription fee for ${billingMonth} is pending.`
        });
      }

      // Sync local state
      setUsers(users.map(u => u.uid === editingUser.uid ? {
        ...u,
        subscriptionLedger: updatedLedger,
        subscriptionStatus: resolvedStatus || u.subscriptionStatus,
        suspensionMessage: billingStatus === 'Pending' ? `Overdue payment alert! Your EasyStay workspace subscription fee for ${billingMonth} is pending.` : u.suspensionMessage
      } : u));

      setEditingUser({
        ...editingUser,
        subscriptionLedger: updatedLedger,
        subscriptionStatus: resolvedStatus,
        suspensionMessage: billingStatus === 'Pending' ? `Overdue payment alert! Your EasyStay workspace subscription fee for ${billingMonth} is pending.` : editingUser.suspensionMessage
      });

      // Reset form fields
      setBillingMonth('');
      setBillingNotes('');
      setShowAddCycle(false);
      alert("New billing month recorded successfully!");
    } catch (err) {
      console.error("Error creating billing cycle invoice: ", err);
      alert("Failed to create billing record.");
    }
  };

  const handleToggleRecordStatus = async (recordId: string) => {
    if (!editingUser) return;
    const currentLedger = editingUser.subscriptionLedger || [];
    const updatedLedger = currentLedger.map((rec) => {
      if (rec.id === recordId) {
        const nextStatus = rec.status === 'Paid' ? 'Pending' : 'Paid';
        return {
          ...rec,
          status: nextStatus,
          amountPaid: nextStatus === 'Paid' ? rec.amountBilled : 0,
          paidDate: nextStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined,
          notes: nextStatus === 'Paid' ? `Paid via UPI on ${new Date().toLocaleDateString()}` : ''
        };
      }
      return rec;
    });

    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        subscriptionLedger: updatedLedger,
      });

      // Sync local state
      setUsers(users.map(u => u.uid === editingUser.uid ? {
        ...u,
        subscriptionLedger: updatedLedger
      } : u));

      setEditingUser({
        ...editingUser,
        subscriptionLedger: updatedLedger
      });
    } catch (err) {
      console.error("Error toggling payment state: ", err);
      alert("Error writing to cloud server.");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!editingUser) return;
    if (!window.confirm("Are you sure you want to delete this billing cycle?")) return;

    const currentLedger = editingUser.subscriptionLedger || [];
    const updatedLedger = currentLedger.filter(rec => rec.id !== recordId);

    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        subscriptionLedger: updatedLedger,
      });

      // Sync local state
      setUsers(users.map(u => u.uid === editingUser.uid ? {
        ...u,
        subscriptionLedger: updatedLedger
      } : u));

      setEditingUser({
        ...editingUser,
        subscriptionLedger: updatedLedger
      });
    } catch (err) {
      console.error("Error deleting cycle record: ", err);
    }
  };

  // Status Filter options
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      u.email.toLowerCase().includes(term) ||
      (u.displayName || '').toLowerCase().includes(term) ||
      (u.businessName || '').toLowerCase().includes(term) ||
      (u.phone || '').includes(term)
    );

    if (!matchesSearch) return false;

    // Filter by Ledger Status
    const clientLedger = u.subscriptionLedger || [];
    const hasPendingBills = clientLedger.some(r => r.status === 'Pending') || u.subscriptionStatus === 'unpaid';

    if (filterMode === 'pending') {
      return hasPendingBills;
    }
    if (filterMode === 'suspended') {
      return u.subscriptionStatus === 'suspended';
    }
    if (filterMode === 'active') {
      return u.subscriptionStatus === 'active' || !u.subscriptionStatus;
    }
    return true;
  });

  // Calculate high level stats
  const totalClients = users.length;
  const activeClients = users.filter(u => u.subscriptionStatus === 'active' || !u.subscriptionStatus).length;
  
  // Real-time pending billing calculation
  const unpaidClients = users.filter(u => {
    const clientLedger = u.subscriptionLedger || [];
    return clientLedger.some(r => r.status === 'Pending') || u.subscriptionStatus === 'unpaid';
  }).length;

  const suspendedClients = users.filter(u => u.subscriptionStatus === 'suspended').length;
  const totalRoomsManaged = users.reduce((sum, u) => sum + (u.roomCount || 0), 0);
  const totalGuestsManaged = users.reduce((sum, u) => sum + (u.guestCount || 0), 0);

  // Quick helper to generate a pre-populated WhatsApp message listing the unpaid month!
  const getWhatsAppLink = (u: PlatformUser) => {
    if (!u.phone) return null;
    const cleanPhone = u.phone.replace(/[^0-9]/g, '');
    
    // Find first pending month in ledger if any
    const pendingMonth = (u.subscriptionLedger || []).find(r => r.status === 'Pending');
    const invoiceContext = pendingMonth 
      ? `outstanding SaaS subscription invoice of ${pendingMonth.monthKey} (amount: ₹${pendingMonth.amountBilled}) is pending.`
      : `monthly app subscription invoice is outstanding.`;

    const message = `Hello ${u.displayName || 'PG Owner'}, this is a reminder from EasyStay SaaS platform. We notice that your ${invoiceContext} Please click to transfer dues directly to maintain unhindered platform services. Thank you!`;
    return `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div id="platform-admin-root" className="space-y-8 animate-in fade-in duration-205">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] uppercase font-bold tracking-widest text-indigo-300">
            👑 Super Administrator Controls
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">EasyStay SaaS Control Center</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Check real-time client payments, log month-by-month billing cycles, and suspend or restore client workspaces.
          </p>
        </div>
        <button
          onClick={() => setSyncCount(c => c + 1)}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 font-bold text-xs rounded-xl transition duration-150 shadow-md cursor-pointer self-start md:self-center disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh SaaS Database
        </button>
      </div>

      {/* Grid Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Total SaaS Clients</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">{totalClients}</span>
            <span className="text-xs text-slate-400">subscribed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest block font-mono">Active (All Paid)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-green-600 tracking-tight">{activeClients}</span>
            <span className="text-xs text-slate-400">normal hosting</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block font-mono">Unpaid / Overdue Bills</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 tracking-tight">{unpaidClients}</span>
            <span className="text-xs text-slate-400">clients pending payment</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block font-mono">Suspended Workspaces</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 tracking-tight">{suspendedClients}</span>
            <span className="text-xs text-slate-400">screen locked</span>
          </div>
        </div>
      </div>

      {/* Sub Stats Bar */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-wrap gap-8 items-center justify-between text-xs text-indigo-900 font-semibold">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-600" />
          <span>Combined Rooms Managed: <strong className="text-indigo-700">{totalRoomsManaged}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Combined Active Guests: <strong className="text-indigo-700">{totalGuestsManaged}</strong></span>
        </div>
        <span className="text-[10px] font-mono text-indigo-500 uppercase bg-white px-2 py-0.5 rounded-full border border-indigo-100/50">
          Sync status: Live Real-Time Multi-Tenant Database
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Filter Quick Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${filterMode === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-650 border border-slate-200 hover:bg-slate-50'}`}
          >
            All Clients ({totalClients})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${filterMode === 'pending' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-amber-600 border border-slate-200 hover:bg-amber-50/50'}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Pending Payment ({unpaidClients})
          </button>
          <button
            onClick={() => setFilterMode('suspended')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${filterMode === 'suspended' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-rose-600 border border-slate-200 hover:bg-rose-50/50'}`}
          >
            <Ban className="w-3.5 h-3.5" />
            Suspended ({suspendedClients})
          </button>
          <button
            onClick={() => setFilterMode('active')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${filterMode === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-650 border border-slate-200 hover:bg-slate-50'}`}
          >
            Active Paid ({activeClients})
          </button>
        </div>

        {/* Text Search Input */}
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <Search className="text-slate-400 w-5 h-5 shrink-0" />
          <input
            type="text"
            placeholder="Search SaaS clients by Email, PG Name, Landlord Name or Phone Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Main Grid: List and Editor */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Client List */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">
              Registered Workspace Clients ({filteredUsers.length})
            </h3>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Real-Time Sync</span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-550" />
              <p className="text-xs font-semibold">Populating cloud directories...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No PG clients found matching the selected filter.</p>
              <p className="text-[10px]">When a client signs in to EasyStay, they automatically register here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const pendingBills = (u.subscriptionLedger || []).filter(r => r.status === 'Pending');
                const totalBillsCount = (u.subscriptionLedger || []).length;
                const paidBillsCount = (u.subscriptionLedger || []).filter(r => r.status === 'Paid').length;

                return (
                  <div key={u.uid} className={`relative p-6 hover:bg-slate-50 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 ${editingUser?.uid === u.uid ? 'bg-indigo-50/30 ring-2 ring-indigo-500/20 ring-inset' : ''}`}>
                    
                    {/* Client Metadata */}
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{u.businessName || 'Unnamed PG Accommodation'}</h4>
                        
                        {/* Access status Badge */}
                        {u.subscriptionStatus === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-150 text-[10px] font-bold text-rose-600">
                            <Ban className="w-3 h-3" /> Suspended
                          </span>
                        ) : u.subscriptionStatus === 'unpaid' || pendingBills.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-150 text-[10px] font-bold text-amber-600">
                            <AlertTriangle className="w-3 h-3" /> Overdue ({pendingBills.length} Pending)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-150 text-[10px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Active / Paid
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.phone || 'No Phone Registered'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Scale: <strong>{u.roomCount}</strong> Rooms, <strong>{u.guestCount}</strong> Active Guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            SaaS billing months logged: <strong className="text-indigo-600">{totalBillsCount}</strong> ({paidBillsCount} Paid, <strong className="text-amber-600">{pendingBills.length} Overdue</strong>)
                          </span>
                        </div>
                      </div>

                      {/* Display warning highlighting pending payments */}
                      {pendingBills.length > 0 && (
                        <div className="text-[11px] text-amber-700 bg-amber-50/50 p-2 rounded-lg border border-amber-100 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            Outstanding SaaS fees pending for: <strong>{pendingBills.map(r => r.monthKey).join(', ')}</strong> (₹{pendingBills.reduce((sum, r) => sum + r.amountBilled, 0)} total)
                          </span>
                        </div>
                      )}

                      {u.subscriptionStatus !== 'active' && u.suspensionMessage && (
                        <p className="text-[11px] text-rose-650 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 font-medium">
                          📣 Custom Lock Message: "{u.suspensionMessage}"
                        </p>
                      )}
                    </div>

                    {/* Actions column */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Billing & Access
                      </button>

                      {u.phone && (
                        <a
                          href={getWhatsAppLink(u) || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-600 rounded-xl transition flex items-center justify-center cursor-pointer"
                          title="Send prefilled WhatsApp dues reminder"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* License Manager Panel (Side form) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-150 pb-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              SaaS Subscription Desk
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Set PG Owner's status, add monthly bills & check receipts.</p>
          </div>

          {editingUser ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-150">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Selected Client</p>
                  <p className="text-xs font-extrabold text-slate-800 mt-0.5">{editingUser.businessName || 'Unnamed PG'}</p>
                  <p className="text-[11px] text-slate-500">{editingUser.email}</p>
                </div>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="p-1 px-2 text-[10px] bg-slate-200 hover:bg-slate-300 rounded font-bold text-slate-600"
                >
                  Close
                </button>
              </div>

              {/* 1. SUBSCRIPTION ACCESS STATUS SETTINGS */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  1. Manual Lockout Override (Manual Feature)
                </label>
                <p className="text-[10px] text-slate-400 -mt-2.5">
                  Force active status or manually suspend/lock access immediately at your discretion.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('active')}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-black flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      newStatus === 'active'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Unlock className="w-4 h-4 text-emerald-500" />
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus('unpaid');
                      if (!newMessage) setNewMessage('Overdue payment alert! Your EasyStay workspace subscription invoice is outstanding. Public hosting service has flagged this instance.');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-black flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      newStatus === 'unpaid'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Overdue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStatus('suspended');
                      if (!newMessage) setNewMessage('SaaS Instance Suspended. Premium cloud hosting services for this accommodate are currently locked. Contact administrative support at meruvashanmugam9@gmail.com to proceed.');
                    }}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-black flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      newStatus === 'suspended'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-rose-500" />
                    Lock screen
                  </button>
                </div>
              </div>

              {/* Lock message details */}
              {newStatus !== 'active' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lock message shown on their screen</label>
                  <textarea
                    rows={2}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter message for client"
                    className="w-full text-xs p-2.5 bg-slate-10 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
                  />
                </div>
              )}

              {/* Save Lock Settings */}
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={saveLoading}
                className="w-full py-2 bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {saveLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                Apply Security Lockout Mode
              </button>

              {/* 2. MONTH-BY-MONTH SUBSCRIPTION HISTORY LEDGER */}
              <div className="border-t border-slate-150 pt-4 space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    2. Monthly Billing Cycle Receipts (Automatic Lock)
                  </span>
                  <p className="text-[10px] text-zinc-450 leading-normal">
                    * If <strong>any</strong> record below is set to <strong>Pending</strong>, the client's screen gets <strong>automatically locked</strong> with the subscription lockout message.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Monthly Billing Cycle Receipts</span>
                  
                  <button
                    type="button"
                    onClick={() => setShowAddCycle(!showAddCycle)}
                    className="text-[10px] font-black text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-md transition flex items-center gap-0.5 cursor-pointer"
                  >
                    {showAddCycle ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {showAddCycle ? 'Close Input' : 'Add Month Record'}
                  </button>
                </div>

                {/* Form to log a new billing month (e.g. Month 1, Month 2, Month 3) */}
                {showAddCycle && (
                  <form onSubmit={handleAddBillingCycle} className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-150">
                    <h4 className="text-[11px] font-black text-indigo-900 uppercase">Log Billing Transaction</h4>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 block uppercase">Billing Cycle Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. June 2026, 1st Month, 3rd Month"
                        value={billingMonth}
                        required
                        onChange={(e) => setBillingMonth(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">SaaS hosting fees (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 500"
                          value={billingAmount}
                          required
                          onChange={(e) => setBillingAmount(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Payment Status</label>
                        <select
                          value={billingStatus}
                          onChange={(e) => setBillingStatus(e.target.value as 'Paid' | 'Pending')}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending / Overdue</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 block uppercase">Transaction Notes / UPI ID</label>
                      <input
                        type="text"
                        placeholder="e.g. Received via GPay, Cash payment"
                        value={billingNotes}
                        onChange={(e) => setBillingNotes(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition"
                    >
                      Post Billing Month Invoice
                    </button>
                  </form>
                )}

                {/* Ledger cycle list */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(!editingUser.subscriptionLedger || editingUser.subscriptionLedger.length === 0) ? (
                    <div className="text-center py-6 text-[11px] text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No billing periods recorded. Create invoices so the client can check them transparently.
                    </div>
                  ) : (
                    editingUser.subscriptionLedger.map((record) => (
                      <div key={record.id} className="p-3 bg-slate-55 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0">
                          <p className="font-extrabold text-slate-800 text-xs truncate">
                            {record.monthKey}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-500 font-bold">
                              ₹{record.amountBilled} Billed
                            </span>
                            {record.status === 'Paid' ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-200">
                                Paid
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">
                                Overdue
                              </span>
                            )}
                          </div>
                          {record.notes && (
                            <p className="text-[10px] text-slate-400 italic">"{record.notes}"</p>
                          )}
                        </div>

                        {/* Fast Toggle and Delete actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleRecordStatus(record.id)}
                            className={`p-1.5 rounded-lg border transition ${
                              record.status === 'Paid'
                                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title={record.status === 'Paid' ? "Mark as Pending / Unpaid" : "Verify Payment as Recieved (Paid)"}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(record.id)}
                            className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Sliders className="w-8 h-8 mx-auto text-slate-300" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-605">No PG owner chosen</p>
                <p className="text-[10px] px-3">
                  Click the "Billing & Access" button on any client in your directories to edit their hosting status, view monthly receipts, or invoice additional months!
                </p>
              </div>
            </div>
          )}

          {/* Global APK Release Update configuration Panel */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-3xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 block">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs tracking-tight">APK Version & Remote Update</h4>
                <p className="text-[9px] text-slate-400 font-medium">Pushes version alerts instantly to all remote client installations.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSystemConfig} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">Target Version</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.3.1"
                    value={latestVersion}
                    onChange={(e) => setLatestVersion(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">Warn Settings</label>
                  <select
                    value={isCritical ? 'true' : 'false'}
                    onChange={(e) => setIsCritical(e.target.value === 'true')}
                    className="w-full text-xs p-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800"
                  >
                    <option value="false">Optional Alert</option>
                    <option value="true">Force Lockout</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 block uppercase">Direct Download URL (APK / Play Store)</label>
                <input
                  type="text"
                  placeholder="e.g. Google Play or Cloud Drive Link"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  className="w-full text-[11px] p-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg outline-none font-mono text-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 block uppercase">Release Notes (Shown on phones)</label>
                <textarea
                  placeholder="e.g. Added Business Settings tab, fixed payment receipts!"
                  rows={2}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg outline-none resize-none leading-relaxed text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={versionLoading}
                className="w-full py-2 bg-indigo-600 border border-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                {versionLoading ? 'Pushing Update...' : '💾 Push New Features Live Update'}
              </button>
            </form>
          </div>

          {/* Guide Card helper */}
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100/50 space-y-2 text-xs">
            <h5 className="font-bold text-indigo-900">💡 Administrator Billing Quick Guide</h5>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-indigo-850">
              <li>When a client is overdue, you can add their bills and toggle them as "Pending".</li>
              <li>You can click the green <strong>WhatsApp</strong> icon next to their phone number to launch a pre-populated chat request detailing their specific overdue months & amounts!</li>
              <li>Set their status to <strong>Lock screen</strong> to pause their instance access in 1 click; they will see your outstanding payment warning in full overlay.</li>
            </ol>
          </div>
        </div>

      </div>

    </div>
  );
}
