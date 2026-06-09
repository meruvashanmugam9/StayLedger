/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, 
  Divide, 
  Layers, 
  Users, 
  Bolt, 
  Wifi, 
  Droplet, 
  Flame, 
  CheckCircle2, 
  ArrowRightLeft, 
  ArrowUpRight,
  Info 
} from 'lucide-react';
import { Guest, Room, Payment } from '../types';

interface UtilitySplitterProps {
  guests: Guest[];
  rooms: Room[];
  onApplyBills: (newBills: Payment[]) => void;
}

export default function UtilitySplitter({
  guests,
  rooms,
  onApplyBills
}: UtilitySplitterProps) {
  const [totalAmount, setTotalAmount] = useState(120);
  const [billingPeriod, setBillingPeriod] = useState('June 2026');
  const [dueDate, setDueDate] = useState('2026-06-10');
  const [utilityType, setUtilityType] = useState<'Electricity' | 'Water' | 'Gas' | 'Internet' | 'Other'>('Electricity');
  const [splitMethod, setSplitMethod] = useState<'equal_guests' | 'equal_rooms'>('equal_guests');
  const [successMsg, setSuccessMsg] = useState(false);

  // Active occupants list
  const activeGuests = guests.filter(g => g.status === 'Active');
  const activeGuestsCount = activeGuests.length;

  // Occupied Room list
  const uniqueOccupiedRoomIds = Array.from(new Set(activeGuests.map(g => g.roomId)));
  const occupiedRoomsCount = uniqueOccupiedRoomIds.length;

  // Real-time splitting calculations preview
  const getPrecalculatedSplits = () => {
    if (totalAmount <= 0) return [];

    if (splitMethod === 'equal_guests') {
      if (activeGuestsCount === 0) return [];
      const costPerGuest = Math.round((totalAmount / activeGuestsCount) * 100) / 100;
      return activeGuests.map(guest => {
        const roomObj = rooms.find(r => r.id === guest.roomId);
        return {
          guestId: guest.id,
          guestName: guest.name,
          roomNumber: roomObj ? roomObj.roomNumber : 'Unknown',
          amount: costPerGuest,
          description: `${utilityType} split equally among all tenants`
        };
      });
    } else {
      // Split by room first, then divide equally among room's occupants (standard fair landlords rule)
      if (occupiedRoomsCount === 0) return [];
      const costPerRoom = totalAmount / occupiedRoomsCount;

      return activeGuests.map(guest => {
        // Count how many co-sharers in this particular room
        const roomOccupantsCount = activeGuests.filter(g => g.roomId === guest.roomId).length;
        const shareOfRoomCost = Math.round((costPerRoom / roomOccupantsCount) * 100) / 100;
        
        const roomObj = rooms.find(r => r.id === guest.roomId);
        return {
          guestId: guest.id,
          guestName: guest.name,
          roomNumber: roomObj ? roomObj.roomNumber : 'Unknown',
          amount: shareOfRoomCost,
          description: `${utilityType} share divided by room limit, split among occupants`
        };
      });
    }
  };

  const currentSplits = getPrecalculatedSplits();

  // Apply bills to the ledger database
  const handleApplySplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSplits.length === 0) {
      alert('There are no active occupants checklist to split bills for.');
      return;
    }

    const paybills: Payment[] = currentSplits.map((split, i) => ({
      id: `split_${Date.now()}_${i}`,
      guestId: split.guestId,
      guestName: split.guestName,
      roomNumber: split.roomNumber,
      type: 'Utility',
      amount: split.amount,
      billingPeriod,
      dueDate,
      status: 'Unpaid',
      description: `${utilityType} share: ${billingPeriod}`
    }));

    onApplyBills(paybills);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 5000); // clear banner after 5s
  };

  // Icon maps
  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'Electricity': return <Bolt className="w-5 h-5 text-amber-500 animate-pulse-subtle" />;
      case 'Water': return <Droplet className="w-5 h-5 text-blue-500" />;
      case 'Internet': return <Wifi className="w-5 h-5 text-indigo-500" />;
      case 'Gas': return <Flame className="w-5 h-5 text-orange-500" />;
      default: return <Divide className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Smart Utility Bill Splitter</h3>
        <p className="text-xs text-slate-500 flex items-center gap-0.5 mt-0.5">
          <Info className="w-3.5 h-3.5 text-indigo-400 inline" />
          Easily split core building utility receipts (such as Electricity, Water or WiFi) equally across guests or room groups.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-650" />
          <div>
            <p>Utility splitting successful!</p>
            <p className="font-normal text-[11px] text-emerald-600 mt-0.5">
              Approved utility invoices have been credited to individual tenant due ledgers for {billingPeriod}.
            </p>
          </div>
        </div>
      )}

      {activeGuestsCount === 0 ? (
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl text-center text-amber-700 space-y-2">
          <Divide className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="font-bold text-sm">No Active Tenants Found</h4>
          <p className="text-xs text-amber-600 max-w-sm mx-auto">
            You cannot split building bills until at least one occupant is actively checked-in to your PG rooms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Split setup configurations column */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 uppercase tracking-wider">Configure Bill Details</h4>

            <form onSubmit={handleApplySplit} className="space-y-4">
              {/* Type Grid icon bar selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Utility Service Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Power', val: 'Electricity' as const },
                    { label: 'Water', val: 'Water' as const },
                    { label: 'WiFi', val: 'Internet' as const },
                    { label: 'Gas', val: 'Gas' as const },
                  ].map((service) => (
                    <button
                      key={service.val}
                      type="button"
                      onClick={() => setUtilityType(service.val)}
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${utilityType === service.val ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border-slate-200 text-slate-700'}`}
                    >
                      {getUtilityIcon(service.val)}
                      <span className="text-[10px] font-bold">{service.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Master Invoice Bill Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input 
                    type="number"
                    min={1}
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-4 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 font-extrabold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Billing Month *</label>
                  <input 
                    type="text"
                    required
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Due Date *</label>
                  <input 
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Split selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Division Splitting Method</label>
                <div className="grid grid-cols-2 gap-3.5">
                  <div 
                    onClick={() => setSplitMethod('equal_guests')}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition ${splitMethod === 'equal_guests' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 text-slate-650'}`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Equally by Tenant</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Split equally among {activeGuestsCount} active guests.</p>
                  </div>

                  <div 
                    onClick={() => setSplitMethod('equal_rooms')}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition ${splitMethod === 'equal_rooms' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-200 text-slate-650'}`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Equally by Room</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Divided among {occupiedRoomsCount} occupied rooms, then split per bed occupants.</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Publish Utility Bills</span>
              </button>
            </form>
          </div>

          {/* Allocation Preview results column */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Calculation Live Preview</h4>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Share Cost per Tenant</span>
                  <span className="text-sm font-extrabold text-indigo-700">
                    {splitMethod === 'equal_guests' 
                      ? `₹${activeGuestsCount > 0 ? (totalAmount / activeGuestsCount).toFixed(2) : '0.00'}`
                      : 'Pro-rata distribution'
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-76 overflow-y-auto pr-1">
                {currentSplits.map((item, index) => (
                  <div key={index} className="p-3 bg-slate-50 border border-slate-155 rounded-xl flex items-center justify-between gap-2.5 hover:bg-slate-100/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-650">
                        {item.guestName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 leading-tight">{item.guestName}</h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Room {item.roomNumber}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-sm font-bold text-slate-950">
                      ₹{item.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 mt-5 text-[10px] text-indigo-700 flex gap-2 w-full">
              <ArrowUpRight className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <strong className="block">Publishing Guidelines:</strong>
                <p className="mt-0.5">Click the "Publish Utility Bills" button on the left panel. It allocates individual charges based on the live calculations as separate billing entries in the system ledger.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
