/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  LogOut, 
  Search, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  ShieldCheck,
  CheckCircle,
  TrendingDown,
  AlertCircle,
  RotateCcw,
  History,
  PhoneCall
} from 'lucide-react';
import { Guest, Room, Payment, DeletedGuest } from '../types';

interface GuestsSectionProps {
  guests: Guest[];
  rooms: Room[];
  payments: Payment[];
  deletedGuests: DeletedGuest[];
  onCheckInGuest: (guest: Guest, generateInitialBills: boolean) => void;
  onUpdateGuest: (guest: Guest) => void;
  onCheckoutGuest: (guestId: string) => void;
  onDeleteGuestHistory: (guestId: string) => void;
  onRestoreGuest: (guestId: string) => void;
  onPermanentDeleteGuest: (guestId: string) => void;
  onAddRoom: (room: Room) => void;
  onUpdateRoom: (room: Room) => void;
}

export default function GuestsSection({
  guests,
  rooms,
  payments,
  deletedGuests,
  onCheckInGuest,
  onUpdateGuest,
  onCheckoutGuest,
  onDeleteGuestHistory,
  onRestoreGuest,
  onPermanentDeleteGuest,
  onAddRoom,
  onUpdateRoom
}: GuestsSectionProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'CheckedOut' | 'Deleted'>('Active');

  // Modal control state
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [viewingGuestPhoto, setViewingGuestPhoto] = useState<Guest | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositPaid, setDepositPaid] = useState(300);
  const [generateBills, setGenerateBills] = useState(true);
  const [photoUrl, setPhotoUrl] = useState('');

  // Dynamic Room on-the-fly Check-In states
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [customRoomNo, setCustomRoomNo] = useState('');
  const [customRoomType, setCustomRoomType] = useState<Room['type']>('Four-Sharing');
  const [customRoomRent, setCustomRoomRent] = useState(400);
  const [customRoomUtility, setCustomRoomUtility] = useState<Room['utilityType']>('Shared');
  const [customRoomFixedUtility, setCustomRoomFixedUtility] = useState(30);

  // Dynamic Room Customize-in-Place Edit states
  const [isEditingSelectedRoom, setIsEditingSelectedRoom] = useState(false);
  const [editRoomNo, setEditRoomNo] = useState('');
  const [editRoomType, setEditRoomType] = useState<Room['type']>('Four-Sharing');
  const [editRoomRent, setEditRoomRent] = useState(450);
  const [editRoomUtility, setEditRoomUtility] = useState<Room['utilityType']>('Shared');
  const [editRoomFixedUtility, setEditRoomFixedUtility] = useState(30);

  // Find Room info for a guest with customizable label formatting
  const getRoomNumber = (roomId: string) => {
    const r = rooms.find(room => room.id === roomId);
    if (!r) return 'Unassigned';
    const numShare = r.type === 'Single' ? '1 Share' : r.type === 'Double' ? '2 Share' : r.type === 'Triple' ? '3 Share' : r.type === 'Four-Sharing' ? '4 Share' : r.type === 'Five-Sharing' ? '5 Share' : r.type;
    return `${r.roomNumber} (${numShare})`;
  };

  // Find remaining beds per room
  const getAvailableRooms = () => {
    return rooms.filter(room => {
      if (room.status === 'Maintenance') return false;
      const occupiedCount = guests.filter(g => g.roomId === room.id && g.status === 'Active').length;
      return occupiedCount < room.capacity;
    });
  };

  // Calculate unpaid dues for specific guest
  const getGuestDues = (guestId: string) => {
    return payments
      .filter(p => p.guestId === guestId && p.status !== 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setEmergencyContact('');
    setPhotoUrl('');
    const avRooms = getAvailableRooms();
    setRoomId(avRooms.length > 0 ? avRooms[0].id : '');
    setCheckInDate(new Date().toISOString().split('T')[0]);
    setDepositPaid(300);
    setGenerateBills(true);

    setIsCustomRoom(false);
    setCustomRoomNo('');
    setCustomRoomType('Four-Sharing');
    setCustomRoomRent(400);
    setCustomRoomUtility('Shared');
    setCustomRoomFixedUtility(30);

    setIsEditingSelectedRoom(false);
    setEditRoomNo('');
    setEditRoomType('Four-Sharing');
    setEditRoomRent(400);
    setEditRoomUtility('Shared');
    setEditRoomFixedUtility(30);
  };

  const handleOpenCheckIn = () => {
    resetForm();
    const avRooms = getAvailableRooms();
    if (avRooms.length === 0) {
      setIsCustomRoom(true);
    }
    setIsCheckInOpen(true);
  };

  const handleCreateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalRoomId = roomId;

    if (isCustomRoom) {
      if (!customRoomNo.trim()) {
        alert('Please specify a custom room number.');
        return;
      }

      // Check duplication
      let existingRoom = rooms.find(r => r.roomNumber.toLowerCase() === customRoomNo.trim().toLowerCase());
      if (existingRoom) {
        // If room exists, check capacity vs active guest count
        const ocCount = guests.filter(g => g.roomId === existingRoom!.id && g.status === 'Active').length;
        if (ocCount >= existingRoom.capacity) {
          alert(`Room ${existingRoom.roomNumber} already exists but is fully occupied (${ocCount}/${existingRoom.capacity} beds). Please choose another number or select from the list.`);
          return;
        }
        finalRoomId = existingRoom.id;
      } else {
        // Define on the fly
        const newRoomId = 'room_' + Date.now();
        let cap = 4;
        if (customRoomType === 'Single') cap = 1;
        else if (customRoomType === 'Double') cap = 2;
        else if (customRoomType === 'Triple') cap = 3;
        else if (customRoomType === 'Four-Sharing') cap = 4;
        else if (customRoomType === 'Five-Sharing') cap = 5;

        const newRoomObject: Room = {
          id: newRoomId,
          roomNumber: customRoomNo.trim(),
          type: customRoomType,
          rentPrice: Number(customRoomRent),
          utilityType: customRoomUtility,
          fixedUtilityAmount: customRoomUtility === 'Fixed' ? Number(customRoomFixedUtility) : undefined,
          capacity: cap,
          status: 'Available'
        };

        onAddRoom(newRoomObject);
        finalRoomId = newRoomId;
      }
    } else {
      if (!finalRoomId) {
        alert('Please assign a room or define a custom room.');
        return;
      }
    }

    const newGuest: Guest = {
      id: 'guest_' + Date.now(),
      name: name.trim(),
      phone: phone.trim() || '+1 (555) 000-0000',
      email: email.trim() || 'tenant@example.com',
      roomId: finalRoomId,
      checkInDate,
      depositPaid: Number(depositPaid),
      status: 'Active',
      photoUrl: photoUrl.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined
    };

    onCheckInGuest(newGuest, generateBills);
    setIsCheckInOpen(false);
    resetForm();
  };

  const handleRoomSelectionChangeInEdit = (selectedId: string) => {
    setRoomId(selectedId);
    const selectedRoom = rooms.find(r => r.id === selectedId);
    if (selectedRoom) {
      setEditRoomNo(selectedRoom.roomNumber);
      setEditRoomType(selectedRoom.type);
      setEditRoomRent(selectedRoom.rentPrice);
      setEditRoomUtility(selectedRoom.utilityType);
      setEditRoomFixedUtility(selectedRoom.fixedUtilityAmount || 0);
    }
  };

  const handleOpenEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setName(guest.name);
    setPhone(guest.phone);
    setEmail(guest.email);
    setEmergencyContact(guest.emergencyContact || '');
    setRoomId(guest.roomId);
    setCheckInDate(guest.checkInDate);
    setDepositPaid(guest.depositPaid);
    setPhotoUrl(guest.photoUrl || '');

    // Fill the editing selected room subform
    const selectedRoom = rooms.find(r => r.id === guest.roomId);
    if (selectedRoom) {
      setEditRoomNo(selectedRoom.roomNumber);
      setEditRoomType(selectedRoom.type);
      setEditRoomRent(selectedRoom.rentPrice);
      setEditRoomUtility(selectedRoom.utilityType);
      setEditRoomFixedUtility(selectedRoom.fixedUtilityAmount || 0);
    }

    setIsEditingSelectedRoom(false);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest || !name.trim()) return;

    let finalRoomId = roomId;

    if (isEditingSelectedRoom) {
      if (!editRoomNo.trim()) {
        alert('Please specify a room number.');
        return;
      }

      // Check selected room exists
      const targetRoom = rooms.find(r => r.id === roomId);
      if (targetRoom) {
        // Name conflict check excluding target itself
        const nameConflict = rooms.some(r => r.id !== targetRoom.id && r.roomNumber.toLowerCase() === editRoomNo.trim().toLowerCase());
        if (nameConflict) {
          alert(`Another room is already using number "${editRoomNo.trim()}".`);
          return;
        }

        let cap = 4;
        if (editRoomType === 'Single') cap = 1;
        else if (editRoomType === 'Double') cap = 2;
        else if (editRoomType === 'Triple') cap = 3;
        else if (editRoomType === 'Four-Sharing') cap = 4;
        else if (editRoomType === 'Five-Sharing') cap = 5;

        const updatedRoomObj: Room = {
          ...targetRoom,
          roomNumber: editRoomNo.trim(),
          type: editRoomType,
          rentPrice: Number(editRoomRent),
          utilityType: editRoomUtility,
          fixedUtilityAmount: editRoomUtility === 'Fixed' ? Number(editRoomFixedUtility) : undefined,
          capacity: cap
        };

        onUpdateRoom(updatedRoomObj);
      }
    }

    const updatedGuest: Guest = {
      ...editingGuest,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      roomId: finalRoomId,
      checkInDate,
      depositPaid: Number(depositPaid),
      photoUrl: photoUrl.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined
    };

    onUpdateGuest(updatedGuest);
    setIsEditOpen(false);
    setEditingGuest(null);
    resetForm();
  };

  const handleCheckoutCheck = (guest: Guest) => {
    const outstandingDues = getGuestDues(guest.id);
    
    if (outstandingDues > 0) {
      const confirmSettle = confirm(
        `Warning: ${guest.name} has pending unpaid balances of $${outstandingDues}.\n\n` +
        `Would you like to auto-settle this checkout anyway? (Note: Unpaid bills will remain in ledger history for reference)`
      );
      if (!confirmSettle) return;
    } else {
      const confirmCheckout = confirm(`Are you sure you want to trigger check-out for ${guest.name}? This will free up their bed immediately.`);
      if (!confirmCheckout) return;
    }

    onCheckoutGuest(guest.id);
  };

  // Safe delete history (only for checked out guests)
  const handleDeleteHistory = (guest: Guest) => {
    if (confirm(`Warning: Are you sure you want to permanently delete checkout history of ${guest.name}? This cannot be undone.`)) {
      onDeleteGuestHistory(guest.id);
    }
  };

  // Filter and search active/archived guests
  const filteredGuests = statusFilter === 'Deleted' ? [] : guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || 
                          getRoomNumber(g.roomId).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter and search soft-deleted guests
  const filteredDeletedGuests = statusFilter !== 'Deleted' ? [] : (deletedGuests || []).filter(dg => {
    const matchesSearch = dg.guest.name.toLowerCase().includes(search.toLowerCase()) || 
                          getRoomNumber(dg.guest.roomId).toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Active Guests & Tenant Registry</h3>
          <p className="text-xs text-slate-500">Record check-ins, edit contact cards, or prompt structured check-outs.</p>
        </div>
        <button 
          id="btn-checkin-guest-trigger"
          onClick={handleOpenCheckIn}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100 animate-pulse-subtle"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Guest Check-in</span>
        </button>
      </div>

      {/* Filter and search control bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search Bar */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by tenant name, assigned room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all font-medium text-slate-700"
          />
        </div>

        {/* Status Tab selections */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto border border-slate-205 flex-wrap gap-1 sm:gap-0">
          <button
            onClick={() => setStatusFilter('Active')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition ${statusFilter === 'Active' ? 'bg-white text-indigo-700 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Occupant (Active)
          </button>
          <button
            onClick={() => setStatusFilter('CheckedOut')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition ${statusFilter === 'CheckedOut' ? 'bg-white text-indigo-700 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Checked Out (Archived)
          </button>
          <button
            onClick={() => setStatusFilter('All')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition ${statusFilter === 'All' ? 'bg-white text-indigo-700 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            All Logs
          </button>
          <button
            onClick={() => setStatusFilter('Deleted')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 ${statusFilter === 'Deleted' ? 'bg-white text-indigo-700 border border-slate-200 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            title="Recycle bin: items are fully restorable within 30 days"
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span>Recycle Bin</span>
            {(deletedGuests || []).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                {(deletedGuests || []).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Guests grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGuests.map((guest) => {
          const unpaidAmt = getGuestDues(guest.id);
          const isArchived = guest.status === 'CheckedOut';
          return (
            <div 
              key={guest.id}
              className={`bg-white rounded-2xl border ${isArchived ? 'border-slate-200 opacity-80' : 'border-slate-200'} hover:border-indigo-300 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden relative`}
            >
              {/* Badge indicating arrears */}
              {!isArchived && unpaidAmt > 0 && (
                <span className="absolute top-4 right-4 bg-rose-50 text-rose-600 text-[9px] font-bold px-2 py-0.5 rounded-md border border-rose-100 animate-pulse flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Due: ₹{unpaidAmt}
                </span>
              )}

              {/* Header card with name & portrait photo */}
              <div className="p-5 flex items-center gap-3.5 border-b border-slate-100">
                <div 
                  onClick={() => setViewingGuestPhoto(guest)}
                  className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 border border-slate-100 cursor-pointer shadow-2xs hover:scale-105 hover:ring-2 hover:ring-indigo-150 transition-all duration-150 relative group ${isArchived ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-650'}`}
                  title="Click to zoom tenant portrait ID card"
                >
                  {guest.photoUrl ? (
                    <img 
                      src={guest.photoUrl} 
                      alt={guest.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    guest.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-sans font-medium transition duration-150 rounded-xl">
                    View
                  </div>
                </div>
                <div>
                  <h4 
                    onClick={() => setViewingGuestPhoto(guest)}
                    className="font-bold text-slate-900 text-sm md:text-base leading-tight hover:text-indigo-650 cursor-pointer transition-colors"
                  >
                    {guest.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block flex items-center gap-0.5">
                    <MapPin className="w-3.5 h-3.5 mr-0.5 text-indigo-500" />
                    Room {getRoomNumber(guest.roomId)} {isArchived && '(Historical)'}
                  </span>
                </div>
              </div>

              {/* Guest particulars */}
              <div className="p-5 flex-1 space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 mr-2 flex-wrap justify-between pr-2 border-b border-dashed border-slate-100 pb-1.5 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{guest.phone}</span>
                    </div>
                    {guest.emergencyContact && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100" title="Emergency Contact">
                        <PhoneCall className="w-3 h-3 text-rose-500" />
                        <span>SOS: {guest.emergencyContact}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 truncate">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{guest.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>In Date: {guest.checkInDate}</span>
                  </div>
                </div>

                {/* Financial detail card */}
                <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Security Deposit</span>
                    <span className="text-xs font-bold text-emerald-600 block mt-0.5 flex items-center gap-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ₹{guest.depositPaid}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Ledger Balance</span>
                    {isArchived ? (
                      <span className="text-xs font-bold text-slate-500 block mt-0.5">N/A</span>
                    ) : (
                      <span className={`text-xs font-extrabold block mt-0.5 ${unpaidAmt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {unpaidAmt > 0 ? `₹${unpaidAmt} Due` : 'Clear ✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 flex justify-between items-center">
                <span className={`text-[10px] font-semibold uppercase ${isArchived ? 'text-slate-450' : 'text-emerald-600'}`}>
                  {isArchived ? 'Checked Out' : 'Active Guest'}
                </span>

                <div className="flex gap-1 flex-wrap sm:gap-2">
                  {!isArchived ? (
                    <>
                      <button 
                        onClick={() => handleOpenEdit(guest)}
                        className="p-1 px-1.5 sm:px-2 hover:bg-slate-200/80 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        title="Edit contact information"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleCheckoutCheck(guest)}
                        className="p-1 px-1.5 sm:px-2 hover:bg-rose-55 text-rose-600 hover:text-rose-750 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        title="Check out and free bed vacancy"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check Out</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Warning: "${guest.name}" is currently active in Room ${getRoomNumber(guest.roomId)}.\n\nAre you sure you want to permanently delete and remove this tenant from the system? This frees up their bed immediately and removes unpaid bills from the ledger. This cannot be undone.`)) {
                            onDeleteGuestHistory(guest.id);
                          }
                        }}
                        className="p-1 px-1.5 sm:px-2 hover:bg-red-50 text-rose-600 hover:text-rose-800 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        title="Permanently remove tenant data"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleDeleteHistory(guest)}
                      className="p-1 px-2 hover:bg-red-50 text-rose-500 hover:text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Log</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {statusFilter === 'Deleted' && (filteredDeletedGuests || []).map((item) => {
          const guest = item.guest;
          const elapsedMs = Date.now() - new Date(item.deletedAt).getTime();
          const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
          const remainingDays = 30 - elapsedDays;
          
          let daysLeftStr = 'Expired';
          if (remainingDays > 0) {
            if (remainingDays < 1) {
              const hours = Math.max(1, Math.round(remainingDays * 24));
              daysLeftStr = `${hours} hr${hours > 1 ? 's' : ''} remaining`;
            } else {
              const days = Math.round(remainingDays);
              daysLeftStr = `${days} day${days > 1 ? 's' : ''} remaining`;
            }
          }

          const unpaidAmt = item.originalPayments?.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + p.amount, 0) || 0;
          return (
            <div 
              key={item.id}
              className="bg-white rounded-2xl border border-rose-100 hover:border-indigo-300 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden relative"
            >
              {/* Badge for Days Remaining */}
              <span className="absolute top-4 right-4 bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-md border border-amber-150 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500" />
                <span>{daysLeftStr}</span>
              </span>

              {/* Header card with name & portrait photo */}
              <div className="p-5 flex items-center gap-3.5 border-b border-slate-100">
                <div 
                  className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 border border-slate-100 bg-rose-50 text-rose-600 cursor-default shadow-2xs relative"
                >
                  {guest.photoUrl ? (
                    <img 
                      src={guest.photoUrl} 
                      alt={guest.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    guest.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                    {guest.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block flex items-center gap-0.5">
                    <MapPin className="w-3.5 h-3.5 mr-0.5 text-indigo-500" />
                    Originally Room {getRoomNumber(guest.roomId)}
                  </span>
                </div>
              </div>

              {/* Guest particulars */}
              <div className="p-5 flex-1 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Deleted On:</span>
                  <span className="font-semibold text-slate-700">{new Date(item.deletedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Contact:</span>
                  <span className="font-mono text-slate-700 font-semibold flex items-center gap-1.5 flex-wrap">
                    <span>{guest.phone}</span>
                    {guest.emergencyContact && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 border border-rose-100 rounded flex items-center gap-0.5" title="Emergency Contact">
                        <PhoneCall className="w-2.5 h-2.5" />
                        <span>SOS: {guest.emergencyContact}</span>
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Saved Ledger:</span>
                  <span className="font-semibold text-rose-600">
                    {item.originalPayments && item.originalPayments.length > 0 
                      ? `${item.originalPayments.length} invoices (₹${unpaidAmt} unpaid)` 
                      : 'No dues'
                    }
                  </span>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="px-5 py-3.5 bg-rose-50/10 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase text-rose-650 tracking-wider">
                  Temporary Saved
                </span>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onRestoreGuest(item.id)}
                    className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-850 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    title="Restore tenant data and ledger items completely"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button 
                    onClick={() => onPermanentDeleteGuest(item.id)}
                    className="p-1 px-1.5 sm:px-2 hover:bg-rose-100 text-rose-650 hover:text-rose-850 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    title="Permanently remove tenant and invoices from system history"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Purge</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {statusFilter !== 'Deleted' && filteredGuests.length === 0 && (
          <div className="bg-white col-span-full border border-dashed border-slate-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">No matching guests registered</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Try selecting a different registry category tab or add a new guest Check-in.</p>
          </div>
        )}

        {statusFilter === 'Deleted' && (filteredDeletedGuests || []).length === 0 && (
          <div className="bg-white col-span-full border border-dashed border-slate-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-50 text-indigo-400 rounded-full mb-3">
              <History className="w-8 h-8 text-indigo-500" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">Recycle Bin is empty</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Deleted guests are stored here for 30 days before permanent deletion, ready to be restored anytime.</p>
          </div>
        )}
      </div>

      {/* Guest Check-in Modal */}
      {isCheckInOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="text-indigo-600 w-5 h-5" />
                <h4 className="font-bold text-slate-800 text-sm md:text-base">New Guest Check-in</h4>
              </div>
              <button 
                onClick={() => setIsCheckInOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="p-4 md:p-5 space-y-3.5 overflow-y-auto flex-1 scrollbar-thin">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tenant Legal Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Liam Hemsworth"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Phone *</label>
                  <input 
                    type="tel"
                    required
                    placeholder="+91 98456..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-105"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1" title="In case of SOS emergencies">Emergency Contact No.</label>
                  <input 
                    type="tel"
                    placeholder="e.g. +91 98456..."
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-105"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input 
                  type="email"
                  placeholder="tenant@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-105"
                />
              </div>

              {/* Tenant Portrait Photo Selection / Upload */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center pb-0.5 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700">Add Tenant Portrait Photo</span>
                  <span className="text-[8px] font-bold text-indigo-650 bg-indigo-50 px-1 py-0.2 rounded">ID Verify</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Avatar preview */}
                  <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-white flex items-center justify-center relative shadow-2xs">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-slate-400 text-[8px] uppercase font-bold text-center leading-tight">No Photo</span>
                    )}
                    {photoUrl && (
                      <button 
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute inset-0 bg-red-650/80 opacity-0 hover:opacity-100 text-white font-bold text-[8px] flex items-center justify-center cursor-pointer transition-opacity"
                        title="Remove photo"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {/* Method 1: Local Upload converter */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">1. File Upload</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => {
                              if (typeof r.result === 'string') {
                                setPhotoUrl(r.result);
                              }
                            };
                            r.readAsDataURL(file);
                          }
                        }}
                        className="text-[10px] text-slate-500 file:mr-1 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 file:cursor-pointer hover:file:bg-indigo-100"
                      />
                    </div>

                    {/* Method 2: Custom input url */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">2. Image URL</span>
                      <input 
                        type="url"
                        placeholder="Paste web address..."
                        value={photoUrl.startsWith('data:') ? '' : photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        className="w-full px-2 py-0.5 border border-slate-200 bg-white rounded-md text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-100 text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Method 3: Instant Quick Avatar Presets */}
                <div className="space-y-1 pt-1.5 border-t border-slate-100/70">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase">3. Or Select Demo Portrait Presets</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {[
                      { gender: 'Shanmugam Style', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Balaji Style', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Female A', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Male A', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Female B', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Male B', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
                    ].map((entry, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(entry.url)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 text-[8px] rounded hover:border-indigo-200 text-slate-600 font-semibold cursor-pointer flex items-center gap-1 transition"
                      >
                        <span className="w-3 h-3 rounded-full overflow-hidden bg-slate-100 inline-block shrink-0">
                          <img src={entry.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </span>
                        <span>{entry.gender}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50/45 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="checkbox-is-custom-room"
                    checked={isCustomRoom}
                    onChange={(e) => {
                      setIsCustomRoom(e.target.checked);
                      if (e.target.checked) setRoomId('');
                      else {
                        const avRooms = getAvailableRooms();
                        setRoomId(avRooms.length > 0 ? avRooms[0].id : '');
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="checkbox-is-custom-room" className="text-xs font-bold text-indigo-900 cursor-pointer select-none">
                    Create a new custom room on-the-fly *
                  </label>
                </div>

                {isCustomRoom ? (
                  <div className="space-y-2 pt-1.5 border-t border-indigo-100 animate-in slide-in-from-top-1.5 duration-120">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-indigo-950 mb-0.5">Room Number / Name *</label>
                        <input 
                          type="text"
                          required={isCustomRoom}
                          placeholder="e.g. 702"
                          value={customRoomNo}
                          onChange={(e) => setCustomRoomNo(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-indigo-950 mb-0.5">Sharing Format *</label>
                        <select
                          value={customRoomType}
                          onChange={(e) => {
                            const val = e.target.value as Room['type'];
                            setCustomRoomType(val);
                            if (val === 'Four-Sharing') {
                              setCustomRoomRent(7000);
                            } else if (val === 'Five-Sharing') {
                              setCustomRoomRent(6500);
                            }
                          }}
                          className="w-full px-1.5 py-1 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 focus:outline-none"
                        >
                          <option value="Single">Single (1 share)</option>
                          <option value="Double">Double (2 share)</option>
                          <option value="Triple">Triple (3 share)</option>
                          <option value="Four-Sharing">Four Sharing</option>
                          <option value="Five-Sharing">Five Sharing</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-indigo-950 mb-0.5">Bed Rent (₹) *</label>
                        <input 
                          type="number"
                          required={isCustomRoom}
                          min={0}
                          value={customRoomRent}
                          onChange={(e) => setCustomRoomRent(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-indigo-950 mb-0.5">Utility Billing Plan</label>
                        <select
                          value={customRoomUtility}
                          onChange={(e) => setCustomRoomUtility(e.target.value as Room['utilityType'])}
                          className="w-full px-1.5 py-1 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                        >
                          <option value="Fixed">Fixed Fee Plan</option>
                          <option value="Shared">Shared Split</option>
                          <option value="Metered">Metered Plan</option>
                        </select>
                      </div>
                    </div>

                    {customRoomUtility === 'Fixed' && (
                      <div className="animate-in fade-in duration-100">
                        <label className="block text-[10px] font-bold text-indigo-950 mb-0.5">Fixed Monthly Utility Amount (₹)</label>
                        <input 
                          type="number"
                          min={0}
                          value={customRoomFixedUtility}
                          onChange={(e) => setCustomRoomFixedUtility(Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Vacant Bed *</label>
                      {getAvailableRooms().length > 0 ? (
                        <select
                          value={roomId}
                          required={!isCustomRoom}
                          onChange={(e) => setRoomId(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-205 rounded-lg text-xs bg-white text-slate-800 focus:outline-none"
                        >
                          {getAvailableRooms().map((room) => (
                            <option key={room.id} value={room.id}>
                              Room {room.roomNumber} ({room.type === 'Single' ? '1-sh' : room.type === 'Double' ? '2-sh' : room.type === 'Triple' ? '3-sh' : room.type === 'Four-Sharing' ? '4-sh' : room.type === 'Five-Sharing' ? '5-sh' : room.type} - ₹{room.rentPrice})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[9px] text-rose-500 font-bold leading-tight">No vacant beds remaining! Create custom room on-the-fly.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Check-In Date *</label>
                      <input 
                        type="date"
                        required
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs text-slate-705 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Safety Deposit Paid (₹)</label>
                  <input 
                    type="number"
                    min={0}
                    value={depositPaid}
                    onChange={(e) => setDepositPaid(Number(e.target.value))}
                    className="w-full px-3 py-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs text-slate-805 font-bold focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition">
                    <input 
                      type="checkbox"
                      id="checkbox-bills"
                      checked={generateBills}
                      onChange={(e) => setGenerateBills(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="checkbox-bills" className="text-[10px] font-semibold text-slate-600 cursor-pointer leading-tight select-none">
                      Auto-Bill Month 1
                    </label>
                  </div>
                </div>
              </div>

              {generateBills && (roomId || isCustomRoom) && (
                <p className="text-[9px] text-indigo-650 italic bg-indigo-50/40 p-2 rounded-lg border border-indigo-100/60 leading-normal">
                  ⚡ Auto-billing active: rent and fixed utility bills will automatically post to the ledger.
                </p>
              )}

              <div className="pt-3 border-t border-slate-100 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCheckInOpen(false)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!roomId && !isCustomRoom}
                  className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  Register check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Guest Particulars Modal */}
      {isEditOpen && editingGuest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="text-indigo-600 w-5 h-5" />
                <h4 className="font-bold text-slate-800 text-sm md:text-base">Edit Contacts for {editingGuest.name}</h4>
              </div>
              <button 
                onClick={() => { setIsEditOpen(false); setEditingGuest(null); }}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 md:p-5 space-y-3.5 overflow-y-auto flex-1 scrollbar-thin">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tenant Legal Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Liam Hemsworth"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp / Phone *</label>
                  <input 
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-105"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1" title="In case of SOS emergencies">Emergency Contact No.</label>
                  <input 
                    type="tel"
                    placeholder="e.g. +91 98456..."
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-105"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-105"
                />
              </div>

              {/* Edit Tenant Portrait Photo Selection / Upload */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center pb-0.5 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700">Update Tenant Portrait Photo</span>
                  <span className="text-[8px] font-bold text-indigo-650 bg-indigo-50 px-1 py-0.2 rounded">ID Verify</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Avatar preview */}
                  <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-white flex items-center justify-center relative shadow-2xs">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-slate-400 text-[8px] uppercase font-bold text-center leading-tight">No Photo</span>
                    )}
                    {photoUrl && (
                      <button 
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute inset-0 bg-red-650/80 opacity-0 hover:opacity-100 text-white font-bold text-[8px] flex items-center justify-center cursor-pointer transition-opacity"
                        title="Remove photo"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {/* Method 1: Local Upload converter */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">1. File Upload</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => {
                              if (typeof r.result === 'string') {
                                setPhotoUrl(r.result);
                              }
                            };
                            r.readAsDataURL(file);
                          }
                        }}
                        className="text-[10px] text-slate-500 file:mr-1 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-indigo-50 file:text-indigo-775 file:cursor-pointer hover:file:bg-indigo-100"
                      />
                    </div>

                    {/* Method 2: Custom input url */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">2. Image URL</span>
                      <input 
                        type="url"
                        placeholder="Paste web address..."
                        value={photoUrl.startsWith('data:') ? '' : photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        className="w-full px-2 py-0.5 border border-slate-200 bg-white rounded-md text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-100 text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Method 3: Instant Quick Avatar Presets */}
                <div className="space-y-1 pt-1.5 border-t border-slate-100/70">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase">3. Or Select Demo Portrait Presets</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {[
                      { gender: 'Shanmugam Style', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Balaji Style', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Female A', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Male A', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Female B', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
                      { gender: 'Male B', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
                    ].map((entry, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(entry.url)}
                        className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-205 text-[8px] rounded hover:border-indigo-200 text-slate-600 font-semibold cursor-pointer flex items-center gap-1 transition"
                      >
                        <span className="w-3 h-3 rounded-full overflow-hidden bg-slate-100 inline-block shrink-0">
                          <img src={entry.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </span>
                        <span>{entry.gender}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50/45 border border-indigo-100 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-0.5">Assigned Room</label>
                    <select
                      value={roomId}
                      onChange={(e) => handleRoomSelectionChangeInEdit(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none"
                    >
                      {/* Keep original assigned room even if full, along with other vacancies */}
                      {rooms.map((room) => {
                        const ocCount = guests.filter(g => g.roomId === room.id && g.status === 'Active' && g.id !== editingGuest.id).length;
                        const hasSeat = ocCount < room.capacity || room.id === editingGuest.roomId;
                        if (!hasSeat || room.status === 'Maintenance') return null;
                        return (
                          <option key={room.id} value={room.id}>
                            Room {room.roomNumber} ({room.type === 'Single' ? '1-sh' : room.type === 'Double' ? '2-sh' : room.type === 'Triple' ? '3-sh' : room.type === 'Four-Sharing' ? '4-sh' : room.type === 'Five-Sharing' ? '5-sh' : room.type})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-0.5 font-bold">Check-In Date *</label>
                    <input 
                      type="date"
                      required
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full px-2 py-0.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-indigo-105/50 pt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="checkbox-edit-selected-room"
                      checked={isEditingSelectedRoom}
                      onChange={(e) => setIsEditingSelectedRoom(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="checkbox-edit-selected-room" className="text-xs font-bold text-indigo-900 cursor-pointer select-none leading-none">
                      Edit details of Assigned Room (rent & sharing) *
                    </label>
                  </div>

                  {isEditingSelectedRoom && (
                    <div className="space-y-2 pt-1.5 mt-1.5 border-t border-dashed border-indigo-200/50 animate-in slide-in-from-top-1 duration-100">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Room No / Name</label>
                          <input 
                            type="text"
                            required={isEditingSelectedRoom}
                            value={editRoomNo}
                            onChange={(e) => setEditRoomNo(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Sharing Type</label>
                          <select
                            value={editRoomType}
                            onChange={(e) => {
                              const val = e.target.value as Room['type'];
                              setEditRoomType(val);
                              if (val === 'Four-Sharing') {
                                setEditRoomRent(7000);
                              } else if (val === 'Five-Sharing') {
                                setEditRoomRent(6500);
                              }
                            }}
                            className="w-full px-1.5 py-1 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                          >
                            <option value="Single">Single (1 share)</option>
                            <option value="Double">Double (2 share)</option>
                            <option value="Triple">Triple (3 share)</option>
                            <option value="Four-Sharing">Four Sharing</option>
                            <option value="Five-Sharing">Five Sharing</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Monthly Bed Rent (₹)</label>
                          <input 
                            type="number"
                            required={isEditingSelectedRoom}
                            min={0}
                            value={editRoomRent}
                            onChange={(e) => setEditRoomRent(Number(e.target.value))}
                            className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Utility Plan</label>
                          <select
                            value={editRoomUtility}
                            onChange={(e) => setEditRoomUtility(e.target.value as Room['utilityType'])}
                            className="w-full px-1.5 py-1 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                          >
                            <option value="Fixed">Fixed Fee Plan</option>
                            <option value="Shared">Shared Split</option>
                            <option value="Metered">Metered Plan</option>
                          </select>
                        </div>
                      </div>

                      {editRoomUtility === 'Fixed' && (
                        <div className="animate-in fade-in duration-100">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Fixed Monthly Utility Amount (₹)</label>
                          <input 
                            type="number"
                            min={0}
                            value={editRoomFixedUtility}
                            onChange={(e) => setEditRoomFixedUtility(Number(e.target.value))}
                            className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Safety Deposit (₹)</label>
                <input 
                  type="number"
                  min={0}
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setEditingGuest(null); }}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enlarged Tenant Photo & Detailed Identity Card Modal */}
      {viewingGuestPhoto && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Close bar */}
            <div className="p-4 bg-slate-50/50 flex justify-between items-center border-b border-slate-150">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Tenant Identity Card</span>
              <button 
                onClick={() => setViewingGuestPhoto(null)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Immersive Photo section */}
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-4 border-indigo-50 shadow-md mb-4 bg-slate-55 flex items-center justify-center text-center">
                {viewingGuestPhoto.photoUrl ? (
                  <img 
                    src={viewingGuestPhoto.photoUrl} 
                    alt={viewingGuestPhoto.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black bg-indigo-50 text-indigo-700">
                    {viewingGuestPhoto.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                )}
                {/* Visual Online status indicator */}
                {viewingGuestPhoto.status === 'Active' && (
                  <span className="absolute bottom-2 right-2 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white"></span>
                )}
              </div>

              <h4 className="text-lg font-extrabold text-slate-900 leading-tight">{viewingGuestPhoto.name}</h4>
              <p className="text-indigo-600 font-bold text-xs mt-1 bg-indigo-55 px-2.5 py-0.5 rounded-full inline-block">
                Room {getRoomNumber(viewingGuestPhoto.roomId)}
              </p>

              {/* Detail fields details */}
              <div className="w-full mt-6 space-y-3.5 text-left border-t border-slate-100 pt-5 text-xs text-slate-705">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-405 font-medium">WhatsApp Phone</span>
                  <span className="font-mono font-bold text-slate-800">{viewingGuestPhoto.phone}</span>
                </div>
                {viewingGuestPhoto.emergencyContact && (
                  <div className="flex justify-between items-center py-1 px-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 font-bold select-all" title="Click to select / copy emergency contact">
                    <span className="text-xs flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                      <span>SOS Emergency Contact</span>
                    </span>
                    <span className="font-mono text-sm leading-none">{viewingGuestPhoto.emergencyContact}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-405 font-medium">Email Address</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{viewingGuestPhoto.email}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-405 font-medium">Joined Date</span>
                  <span className="font-bold text-slate-850">{viewingGuestPhoto.checkInDate}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-405 font-medium">Security Deposit</span>
                  <span className="font-bold text-emerald-600">₹{viewingGuestPhoto.depositPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-450 font-medium">Outstanding Dues</span>
                  <span className={`font-bold ${getGuestDues(viewingGuestPhoto.id) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{getGuestDues(viewingGuestPhoto.id)} {getGuestDues(viewingGuestPhoto.id) > 0 ? 'Pending' : 'Clear ✓'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-405 font-medium">Current Status</span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${viewingGuestPhoto.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-105 text-slate-600'}`}>
                    {viewingGuestPhoto.status === 'Active' ? 'Active Occupant' : 'Checked Out'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <a 
                href={`tel:${viewingGuestPhoto.phone}`}
                className="flex-1 py-1.5 px-3 bg-white border border-slate-205 text-slate-705 hover:bg-slate-100/50 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Call Tenant</span>
              </a>
              <button 
                onClick={() => setViewingGuestPhoto(null)}
                className="flex-1 py-1.5 px-3 bg-indigo-650 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close ID View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
