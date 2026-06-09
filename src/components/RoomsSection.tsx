/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Home, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Sliders, 
  AlertTriangle, 
  Search, 
  Users,
  Check,
  CheckCircle,
  Bolt
} from 'lucide-react';
import { Room, Guest } from '../types';

interface RoomsSectionProps {
  rooms: Room[];
  guests: Guest[];
  onAddRoom: (room: Room) => void;
  onUpdateRoom: (room: Room) => void;
  onDeleteRoom: (id: string) => void;
}

export default function RoomsSection({
  rooms,
  guests,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom
}: RoomsSectionProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Form fields
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<Room['type']>('Single');
  const [rentPrice, setRentPrice] = useState(400);
  const [utilityType, setUtilityType] = useState<Room['utilityType']>('Fixed');
  const [fixedUtilityAmount, setFixedUtilityAmount] = useState(30);
  const [capacity, setCapacity] = useState(1);
  const [status, setStatus] = useState<Room['status']>('Available');

  // Helper: Count active tenants/occupants per room ID
  const getOccupantCount = (roomId: string) => {
    return guests.filter(g => g.roomId === roomId && g.status === 'Active').length;
  };

  const getOccupantsNames = (roomId: string) => {
    return guests
      .filter(g => g.roomId === roomId && g.status === 'Active')
      .map(g => g.name);
  };

  // Reset form helper
  const resetForm = () => {
    setRoomNumber('');
    setRoomType('Single');
    setRentPrice(400);
    setUtilityType('Fixed');
    setFixedUtilityAmount(30);
    setCapacity(1);
    setStatus('Available');
  };

  // Auto adjusting capacity on room type change
  const handleRoomTypeChange = (type: Room['type']) => {
    setRoomType(type);
    if (type === 'Single') {
      setCapacity(1);
    } else if (type === 'Double') {
      setCapacity(2);
    } else if (type === 'Triple') {
      setCapacity(3);
    } else if (type === 'Four-Sharing') {
      setCapacity(4);
      setRentPrice(7000);
    } else if (type === 'Five-Sharing') {
      setCapacity(5);
      setRentPrice(6500);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return;

    // Check duplication
    if (rooms.some(r => r.roomNumber.toLowerCase() === roomNumber.trim().toLowerCase())) {
      alert('A room with this room number already exists.');
      return;
    }

    const newRoom: Room = {
      id: 'room_' + Date.now(),
      roomNumber: roomNumber.trim(),
      type: roomType,
      rentPrice: Number(rentPrice),
      utilityType,
      fixedUtilityAmount: utilityType === 'Fixed' ? Number(fixedUtilityAmount) : undefined,
      capacity,
      status: status
    };

    onAddRoom(newRoom);
    setIsAddOpen(false);
    resetForm();
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.roomNumber);
    setRoomType(room.type);
    setRentPrice(room.rentPrice);
    setUtilityType(room.utilityType);
    setFixedUtilityAmount(room.fixedUtilityAmount || 0);
    setCapacity(room.capacity);
    setStatus(room.status);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !roomNumber.trim()) return;

    // Check duplication (exclude self)
    if (rooms.some(r => r.id !== editingRoom.id && r.roomNumber.toLowerCase() === roomNumber.trim().toLowerCase())) {
      alert('A room with this room number already exists.');
      return;
    }

    const updatedRoom: Room = {
      ...editingRoom,
      roomNumber: roomNumber.trim(),
      type: roomType,
      rentPrice: Number(rentPrice),
      utilityType,
      fixedUtilityAmount: utilityType === 'Fixed' ? Number(fixedUtilityAmount) : undefined,
      capacity,
      status: status
    };

    onUpdateRoom(updatedRoom);
    setIsEditOpen(false);
    setEditingRoom(null);
    resetForm();
  };

  // Safe delete
  const handleDeleteCheck = (id: string, number: string) => {
    const occupants = getOccupantCount(id);
    if (occupants > 0) {
      alert(`Cannot delete Room ${number}. Move or checkout the ${occupants} active occupant(s) before deleting.`);
      return;
    }
    
    if (confirm(`Are you sure you want to remove Room ${number}?`)) {
      onDeleteRoom(id);
    }
  };

  // Searching & Filtering logic
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.includes(search) || room.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || room.type === filterType;
    
    // Custom status detection (including check if full)
    const occupants = getOccupantCount(room.id);
    const resolvedStatus = room.status === 'Maintenance' 
      ? 'Maintenance' 
      : (occupants >= room.capacity ? 'Full' : 'Available');

    const matchesStatus = filterStatus === 'All' || resolvedStatus === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title & Add Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Rooms & Accommodation</h3>
          <p className="text-xs text-slate-500">Add, edit, or configure room capacities, pricing model, and utility structures</p>
        </div>
        <button 
          id="btn-add-room-trigger"
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Control, Filter & Search Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search bar */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by room number or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-5050 transition-all font-medium text-slate-700"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-650 bg-slate-55 focus:outline-none focus:bg-white"
            >
              <option value="All">All Room Types</option>
              <option value="Single">Single Sharing</option>
              <option value="Double">Double Sharing</option>
              <option value="Triple">Triple Sharing</option>
              <option value="Four-Sharing">Four Sharing</option>
              <option value="Five-Sharing">Five Sharing</option>
            </select>
          </div>

          <div className="flex-1 md:flex-initial">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-650 bg-slate-55 focus:outline-none focus:bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available Only</option>
              <option value="Full">Fully Occupied</option>
              <option value="Maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const occupantsCount = getOccupantCount(room.id);
          const occupantNames = getOccupantsNames(room.id);
          const isMaintenance = room.status === 'Maintenance';
          const isFull = occupantsCount >= room.capacity;
          
          let statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
          let statusText = 'Available';

          if (isMaintenance) {
            statusBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
            statusText = 'Maintenance';
          } else if (isFull) {
            statusBadgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
            statusText = 'Fully Occupied';
          } else if (occupantsCount > 0) {
            statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
            statusText = `Partial (${occupantsCount}/${room.capacity})`;
          }

          return (
            <div 
              key={room.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Card Header area */}
              <div className="p-5 flex justify-between items-start border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                    <Home className="w-5 h-5 animate-pulse-subtle" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Room {room.roomNumber}</h4>
                    <span className="text-[11px] font-medium text-slate-450 capitalize">{room.type}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeColor}`}>
                  {statusText}
                </span>
              </div>

              {/* Central Area: pricing & capacity */}
              <div className="p-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Base Rent</span>
                    <span className="text-lg font-extrabold text-slate-900 block mt-0.5">₹{room.rentPrice} <span className="text-[10px] font-normal text-slate-400">/mo</span></span>
                  </div>

                  <div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Utility Plan</span>
                    <span className="text-xs font-semibold text-slate-800 block mt-1 flex items-center gap-1">
                      <Bolt className="w-3.5 h-3.5 text-indigo-500 inline" />
                      {room.utilityType} 
                      {room.utilityType === 'Fixed' && ` (₹${room.fixedUtilityAmount})`}
                    </span>
                  </div>
                </div>

                {/* Tenants status bar */}
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-450 mb-1">
                    <span>Occupancy Balance</span>
                    <span>{occupantsCount} of {room.capacity} beds taken</span>
                  </div>

                  {/* Progressive indicator */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${isMaintenance ? 'bg-slate-400' : (isFull ? 'bg-indigo-600' : 'bg-emerald-500')}`}
                      style={{ width: `${Math.min(100, (occupantsCount / room.capacity) * 100)}%` }}
                    />
                  </div>

                  {/* Occupant Names list */}
                  {occupantsCount > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 hover:opacity-100 transition">
                      {occupantNames.map((name, i) => (
                        <span key={i} className="text-[10px] bg-slate-50 border border-slate-150 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                          <Users className="w-3 h-3 text-slate-400" />
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Panel actions */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-50 flex justify-between items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">ID: {room.roomNumber}</span>
                <div className="flex gap-2.5">
                  <button 
                    onClick={() => handleOpenEdit(room)}
                    className="p-1 px-2 hover:bg-slate-200/70 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteCheck(room.id, room.roomNumber)}
                    className="p-1 px-2 hover:bg-red-50 text-rose-500 hover:text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredRooms.length === 0 && (
          <div className="bg-white col-span-full border border-dashed border-slate-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
              <Home className="w-8 h-8" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">No matching rooms found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Double-check filters or add a new room number using the button above.</p>
          </div>
        )}
      </div>

      {/* Add Room Modal Popup */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Plus className="text-indigo-600 w-5 h-5" />
                <h4 className="font-bold text-slate-800">Add New Guest Room</h4>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-5050 mb-1.5">Room Number / Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 101, Room A, Penthouse"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Room Type *</label>
                  <select
                    value={roomType}
                    onChange={(e) => handleRoomTypeChange(e.target.value as Room['type'])}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="Single">Single Sharing</option>
                    <option value="Double">Double Sharing</option>
                    <option value="Triple">Triple Sharing</option>
                    <option value="Four-Sharing">Four Sharing</option>
                    <option value="Five-Sharing">Five Sharing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Bed Capacity (Auto)</label>
                  <input 
                    type="number"
                    disabled
                    value={capacity}
                    className="w-full px-3.5 py-2 border border-slate-250 bg-slate-100 text-slate-500 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Monthly Rent (₹) *</label>
                  <input 
                    type="number"
                    required
                    min={0}
                    value={rentPrice}
                    onChange={(e) => setRentPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Room['status'])}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-3.5 border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Utility Billing Plan</label>
                  <div className="flex gap-2">
                    {['Fixed', 'Shared', 'Metered'].map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setUtilityType(plan as Room['utilityType'])}
                        className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition cursor-pointer ${utilityType === plan ? 'bg-indigo-600 text-white shadow-s' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>

                {utilityType === 'Fixed' ? (
                  <div className="animate-in slide-in-from-top-2 duration-150">
                    <label className="block text-[11px] font-medium text-slate-550 mb-1">Fixed Utility Amount (₹ / month)</label>
                    <input 
                      type="number"
                      min={0}
                      value={fixedUtilityAmount}
                      onChange={(e) => setFixedUtilityAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">This fixed cost will be appended to the tenant's invoice automatically as a flat fee.</p>
                  </div>
                ) : utilityType === 'Shared' ? (
                  <p className="text-[10px] text-slate-450"><strong>Shared Plan:</strong> Utilities are divided amongst active occupants on a monthly basis using the Utility Splitter.</p>
                ) : (
                  <p className="text-[10px] text-slate-450"><strong>Metered Plan:</strong> Charge custom utilities based on tenant meters dynamically.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal Popup */}
      {isEditOpen && editingRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit3 className="text-indigo-600 w-5 h-5" />
                <h4 className="font-bold text-slate-800">Edit Room {editingRoom.roomNumber}</h4>
              </div>
              <button 
                onClick={() => { setIsEditOpen(false); setEditingRoom(null); }}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-5050 mb-1.5">Room Number / Name *</label>
                <input 
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-105 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Room Type *</label>
                  <select
                    value={roomType}
                    onChange={(e) => handleRoomTypeChange(e.target.value as Room['type'])}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="Single">Single Sharing</option>
                    <option value="Double">Double Sharing</option>
                    <option value="Triple">Triple Sharing</option>
                    <option value="Four-Sharing">Four Sharing</option>
                    <option value="Five-Sharing">Five Sharing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Bed Capacity (Auto)</label>
                  <input 
                    type="number"
                    disabled
                    value={capacity}
                    className="w-full px-3.5 py-2 border border-slate-250 bg-slate-100 text-slate-500 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Monthly Rent (₹) *</label>
                  <input 
                    type="number"
                    required
                    min={0}
                    value={rentPrice}
                    onChange={(e) => setRentPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Room['status'])}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-3.5 border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Utility Billing Plan</label>
                  <div className="flex gap-2">
                    {['Fixed', 'Shared', 'Metered'].map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setUtilityType(plan as Room['utilityType'])}
                        className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition cursor-pointer ${utilityType === plan ? 'bg-indigo-600 text-white shadow-s' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>

                {utilityType === 'Fixed' ? (
                  <div className="animate-in slide-in-from-top-2 duration-150">
                    <label className="block text-[11px] font-medium text-slate-550 mb-1">Fixed Utility Amount (₹ / month)</label>
                    <input 
                      type="number"
                      min={0}
                      value={fixedUtilityAmount}
                      onChange={(e) => setFixedUtilityAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                    />
                  </div>
                ) : utilityType === 'Shared' ? (
                  <p className="text-[10px] text-slate-450"><strong>Shared Plan:</strong> Utilities divided amongst occupants proportionally using the Utility Splitter tool.</p>
                ) : (
                  <p className="text-[10px] text-slate-450"><strong>Metered Plan:</strong> Charge custom utilities based on tenant meters dynamically.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setEditingRoom(null); }}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
