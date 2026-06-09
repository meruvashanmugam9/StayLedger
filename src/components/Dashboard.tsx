/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  ChevronRight, 
  AlertCircle, 
  MessageSquare, 
  Check, 
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Room, Guest, Payment } from '../types';

interface DashboardProps {
  rooms: Room[];
  guests: Guest[];
  payments: Payment[];
  onQuickPay: (paymentId: string) => void;
  onNavigateTo: (tab: string) => void;
}

export default function Dashboard({ 
  rooms, 
  guests, 
  payments, 
  onQuickPay, 
  onNavigateTo 
}: DashboardProps) {
  const [selectedReminder, setSelectedReminder] = useState<Payment | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter current month's payments (e.g. "June 2026")
  const currentPeriod = 'June 2026';
  const currentPayments = payments.filter(p => p.billingPeriod === currentPeriod);

  // Calculations
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const activeGuestsCount = guests.filter(g => g.status === 'Active').length;
  const occupancyRate = totalCapacity > 0 ? Math.round((activeGuestsCount / totalCapacity) * 100) : 0;

  const totalRooms = rooms.length;
  const occupiedRoomIds = new Set(guests.filter(g => g.status === 'Active').map(g => g.roomId));
  const occupiedRoomsCount = rooms.filter(r => occupiedRoomIds.has(r.id)).length;
  const availableRoomsCount = totalRooms - occupiedRoomsCount;

  // Revenue Calculations for Current Period
  const totalExpectedCurrent = currentPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollectedCurrent = currentPayments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const collectionPercentage = totalExpectedCurrent > 0 
    ? Math.round((totalCollectedCurrent / totalExpectedCurrent) * 100) 
    : 0;

  // Pending debts (from both current month and historical periods)
  const unpaidPayments = payments.filter(p => p.status !== 'Paid');
  const totalPendingBalance = unpaidPayments.reduce((sum, p) => sum + p.amount, 0);

  // Helper: Find phone of a guest
  const getGuestContact = (guestId: string) => {
    const g = guests.find(g => g.id === guestId);
    return g ? g.phone : 'N/A';
  };

  // Build high-customization elegant mock visual trends for previous 4 months
  // March, April, May, June
  const monthData = [
    { name: 'Mar', expected: 1200, collected: 1200 },
    { name: 'Apr', expected: 1550, collected: 1500 },
    { name: 'May', expected: 1980, collected: 1980 },
    { name: 'Jun', expected: totalExpectedCurrent, collected: totalCollectedCurrent },
  ];

  const maxChartVal = Math.max(...monthData.map(d => d.expected), 1000);

  // Generate WhatsApp reminder link / string
  const handleOpenReminderModal = (payment: Payment) => {
    setSelectedReminder(payment);
    setCopied(false);
  };

  const generateReminderText = (payment: Payment | null) => {
    if (!payment) return '';
    const depositGreeting = `Hi ${payment.guestName}, this is a friendly reminder that your ${payment.type.toLowerCase()} payment for ${payment.billingPeriod} is due on ${payment.dueDate}.\n\n*Amount due:* ₹${payment.amount}\n*Description:* ${payment.description || 'Monthly bills'}\n\nPlease transfer to the PG account and share the receipt. Thank you!`;
    return depositGreeting;
  };

  const handleCopyReminder = () => {
    const text = generateReminderText(selectedReminder);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 md:p-8 text-slate-800 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Landlord Overview</h2>
            <p className="text-slate-500 mt-1 text-sm">
              Properties summary, automated billing periods, and real-time ledger accounting.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              id="dash-btn-split"
              onClick={() => onNavigateTo('Splitter')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Split Utility Bill</span>
            </button>
            <button 
              id="dash-btn-addguest"
              onClick={() => onNavigateTo('Guests')}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition duration-150 cursor-pointer"
            >
              <span>Manage Guests</span>
            </button>
          </div>
        </div>
      </div>

      {/* Numerical Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {occupancyRate}% Full
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">PG Occupancy</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeGuestsCount} <span className="text-sm font-normal text-slate-500">of {totalCapacity} beds</span></h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{occupiedRoomsCount} Premium Rooms occupied</span>
            <button 
              onClick={() => onNavigateTo('Rooms')} 
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Rooms</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current Month Collection Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {collectionPercentage}% Collected
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Collected ({currentPeriod})</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{totalCollectedCurrent} <span className="text-sm font-normal text-slate-500">of ₹{totalExpectedCurrent}</span></h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Outstanding: ₹{Math.max(0, totalExpectedCurrent - totalCollectedCurrent)}</span>
            <button 
              onClick={() => onNavigateTo('Ledger')} 
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Total Pending Dues Card (All Months) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
              {unpaidPayments.length} Bills Due
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Pending Balance</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">₹{totalPendingBalance}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Critical actions pending</span>
            <span className="text-slate-400 font-mono">All months</span>
          </div>
        </div>

        {/* Available Units Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-655 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {totalRooms} Total Rooms
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Vacancy Index</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{availableRoomsCount} <span className="text-sm font-normal text-slate-500">Rooms Vacant</span></h3>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Rooms needing tenants</span>
            <button 
              onClick={() => onNavigateTo('Rooms')} 
              className="text-indigo-650 hover:text-indigo-750 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Add</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Beautiful Custom SVG Charts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between pb-6">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm md:text-base">Monthly Billing Performance</h4>
              <p className="text-xs text-slate-400">Comparing expected total income vs actual collections</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 bg-slate-250 rounded-xs inline-block"></span>
                <span>Expected</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-600">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs inline-block"></span>
                <span>Collected</span>
              </div>
            </div>
          </div>

          {/* SVG Custom Responsive Bar Chart */}
          <div className="w-full h-60 flex items-end justify-between px-2 pt-4 border-b border-l border-slate-200 relative">
            {/* Guide lines */}
            <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-slate-200 text-[10px] text-slate-350 pr-2 text-right">
              ₹{Math.round(maxChartVal * 0.75)}
            </div>
            <div className="absolute left-0 right-0 top-2/4 border-t border-dashed border-slate-200 text-[10px] text-slate-350 pr-2 text-right">
              ₹{Math.round(maxChartVal * 0.5)}
            </div>
            <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-slate-200 text-[10px] text-slate-350 pr-2 text-right">
              ₹{Math.round(maxChartVal * 0.25)}
            </div>

            {monthData.map((d, index) => {
              const expectedPct = (d.expected / maxChartVal) * 90; // scale to max 90%
              const collectedPct = (d.collected / maxChartVal) * 90;
              return (
                <div key={index} className="flex flex-col items-center flex-1 group z-10">
                  <div className="flex items-end gap-2 h-44 w-full justify-center">
                    {/* Expected bar */}
                    <div 
                      className="w-5 bg-slate-100 rounded-t-md hover:bg-slate-250 transition-all duration-300 relative group-hover:scale-y-105 origin-bottom"
                      style={{ height: `${expectedPct}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white font-mono text-[9px] py-0.5 px-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-xs pointer-events-none">
                        Exp: ₹{d.expected}
                      </span>
                    </div>

                    {/* Collected bar */}
                    <div 
                      className="w-5 bg-gradient-to-t from-indigo-650 to-indigo-500 rounded-t-md hover:brightness-115 transition-all duration-300 relative group-hover:scale-y-105 origin-bottom shadow-xs"
                      style={{ height: `${collectedPct}%` }}
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-900 text-white font-mono text-[9px] py-0.5 px-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-xs pointer-events-none">
                        Paid: ₹{d.collected}
                      </span>
                    </div>
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-600">{d.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Action Reminders List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm md:text-base">Pending Collections</h4>
              <p className="text-xs text-slate-450">Action items for unpaid invoices</p>
            </div>
            <span className="px-2 py-0.5 bg-rose-50 border border-rose-150 text-rose-600 text-xs font-semibold rounded-full">
              {unpaidPayments.length} Active
            </span>
          </div>

          <div className="mt-4 space-y-3.5 max-h-68 overflow-y-auto pr-1">
            {unpaidPayments.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center text-slate-400">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-500">All clear! 100% payments completed.</p>
              </div>
            ) : (
              unpaidPayments.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 hover:shadow-xs transition duration-150 border border-slate-200 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{item.guestName}</h5>
                      <p className="text-[10px] text-slate-455 font-mono mt-0.5">Room {item.roomNumber} • {item.billingPeriod}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600">₹{item.amount}</span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 capitalize font-medium">{item.type} payment</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onQuickPay(item.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                        title="Mark as Paid"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleOpenReminderModal(item)}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Remind</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reminder Copying Overlay Modal */}
      {selectedReminder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-slate-800">Rent Reminder Message</h4>
              </div>
              <button 
                onClick={() => setSelectedReminder(null)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5">
              <p className="text-xs text-slate-500 mb-3">
                Send this friendly reminder statement to <strong className="text-slate-700">{selectedReminder.guestName}</strong> via WhatsApp, SMS, or Email:
              </p>

              <div className="text-xs text-slate-500 space-y-1 mb-4 font-mono bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                <p>Phone: {getGuestContact(selectedReminder.guestId)}</p>
                <p>Period: {selectedReminder.billingPeriod}</p>
                <p>Amount: ₹{selectedReminder.amount}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-700 select-all whitespace-pre-line relative">
                {generateReminderText(selectedReminder)}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleCopyReminder}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition duration-150 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied Message!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Direct Text</span>
                    </>
                  )}
                </button>
                <a
                  href={`https://wa.me/${getGuestContact(selectedReminder.guestId).replace(/[^\d+]/g, '')}?text=${encodeURIComponent(generateReminderText(selectedReminder))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm transition duration-150 cursor-pointer md:py-2.5 md:text-xs md:gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
