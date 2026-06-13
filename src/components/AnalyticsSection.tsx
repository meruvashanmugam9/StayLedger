/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  PieChart, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  MessageSquare, 
  Copy, 
  Check, 
  Send,
  Building,
  Clock,
  Briefcase
} from 'lucide-react';
import { Room, Guest, Payment } from '../types';

interface AnalyticsSectionProps {
  rooms: Room[];
  guests: Guest[];
  payments: Payment[];
  currencySymbol?: string;
}

export default function AnalyticsSection({
  rooms,
  guests,
  payments,
  currencySymbol = '₹'
}: AnalyticsSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Financial Calculations
  const currentPeriod = 'June 2026';
  const currentPayments = payments.filter(p => p.billingPeriod === currentPeriod);

  const totalExpectedCurrent = currentPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollectedCurrent = currentPayments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutstandingCurrent = totalExpectedCurrent - totalCollectedCurrent;

  const collectionPercent = totalExpectedCurrent > 0 
    ? Math.round((totalCollectedCurrent / totalExpectedCurrent) * 100) 
    : 0;

  // Lifetime Finance
  const lifetimeInvoiced = payments.reduce((sum, p) => sum + p.amount, 0);
  const lifetimeCollected = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const lifetimeUnpaid = lifetimeInvoiced - lifetimeCollected;

  // Occupancy Analysis
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const activeGuests = guests.filter(g => g.status === 'Active');
  const activeGuestsCount = activeGuests.length;
  const occupancyRate = totalCapacity > 0 ? Math.round((activeGuestsCount / totalCapacity) * 100) : 0;

  // Room type occupancy
  const roomTypes = ['Single', 'Double', 'Triple', 'Four-Sharing', 'Five-Sharing'] as const;
  const roomTypeDistribution = roomTypes.map(type => {
    const typeRooms = rooms.filter(r => r.type === type);
    const typeCapacity = typeRooms.reduce((sum, r) => sum + r.capacity, 0);
    const typeOccupants = activeGuests.filter(g => {
      const gRoom = rooms.find(r => r.id === g.roomId);
      return gRoom?.type === type;
    }).length;

    return {
      type,
      roomsCount: typeRooms.length,
      capacity: typeCapacity,
      occupied: typeOccupants,
      occupancyWeb: typeCapacity > 0 ? Math.round((typeOccupants / typeCapacity) * 100) : 0
    };
  });

  // Category Breakdown (Rent vs Utilities)
  const rentPayments = currentPayments.filter(p => p.type === 'Rent');
  const utilityPayments = currentPayments.filter(p => p.type === 'Utility');

  const expectedRent = rentPayments.reduce((sum, p) => sum + p.amount, 0);
  const collectedRent = rentPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

  const expectedUtility = utilityPayments.reduce((sum, p) => sum + p.amount, 0);
  const collectedUtility = utilityPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

  // Defaulters List (Tenants with Unpaid payments across all periods, sorted by total amount due)
  const unpaidRecords = payments.filter(p => p.status !== 'Paid');
  const tenantDebtMap = unpaidRecords.reduce((acc, p) => {
    if (!acc[p.guestId]) {
      acc[p.guestId] = {
        guestId: p.guestId,
        guestName: p.guestName,
        roomNumber: p.roomNumber,
        totalDue: 0,
        pendingInvoices: [] as Payment[]
      };
    }
    acc[p.guestId].totalDue += p.amount;
    acc[p.guestId].pendingInvoices.push(p);
    return acc;
  }, {} as Record<string, { guestId: string; guestName: string; roomNumber: string; totalDue: number; pendingInvoices: Payment[] }>);

  const debtorsList = Object.values(tenantDebtMap).sort((a, b) => b.totalDue - a.totalDue);

  // Growth / Trends
  // Hardcoded historical months for trends based on typical seed data trends
  const trendData = [
    { month: 'March 2026', expected: 1200, collected: 1200, label: 'Mar' },
    { month: 'April 2026', expected: 1550, collected: 1500, label: 'Apr' },
    { month: 'May 2026', expected: 1980, collected: 1980, label: 'May' },
    { month: 'June 2026', expected: totalExpectedCurrent, collected: totalCollectedCurrent, label: 'Jun' }
  ];

  const maxExpected = Math.max(...trendData.map(d => d.expected), 1000);

  const handleCopyReminder = (debtor: typeof debtorsList[0]) => {
    const dueSummary = debtor.pendingInvoices.map((inv) => `• ${inv.type} (${inv.billingPeriod}): ${currencySymbol}${inv.amount}`).join('\n');
    let text = `Hi ${debtor.guestName},\n\nThis is a payment update from PG management regarding your dues.\n\n*Total Pending Balance:* ${currencySymbol}${debtor.totalDue}\n\n*Pending Items:*\n${dueSummary}\n\nPlease transfer to the PG account and share the receipt. Thank you!`;
    navigator.clipboard.writeText(text);
    setCopiedId(debtor.guestId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getGuestPhone = (guestId: string) => {
    const g = guests.find(g => g.id === guestId);
    return g ? g.phone : '';
  };

  return (
    <div className="space-y-6" id="analytics-section">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Business Analytics Hub</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial performance reviews, tenant debt tracking, and accommodation occupancy audits.
          </p>
        </div>
        <div className="inline-flex bg-indigo-50 text-indigo-750 border border-indigo-150 px-3 py-1.5 rounded-xl text-xs font-bold items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Period Cycle: {currentPeriod}</span>
        </div>
      </div>

      {/* Numerical Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Collection card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-indigo-50 text-indigo-750 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Collection Rate
            </span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-black text-slate-900 leading-none">{collectionPercent}%</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Rent Collection</p>
            {/* progress indicator */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic gross collected card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-emerald-50 text-emerald-850 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Revenue (June)
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-extrabold text-emerald-700 leading-none">
              {currencySymbol}{totalCollectedCurrent.toLocaleString()}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Collected of {currencySymbol}{totalExpectedCurrent.toLocaleString()} expected</p>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12.4%</span>
              </span>
              <span>MoM growth</span>
            </div>
          </div>
        </div>

        {/* Pending Ledger Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Lease Debts
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-extrabold text-rose-600 leading-none">
              {currencySymbol}{totalOutstandingCurrent.toLocaleString()}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Dues outstanding (current month)</p>
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-rose-600 font-medium">
              <span>{currentPayments.filter(p => p.status !== 'Paid').length} invoices unpaid this period</span>
            </div>
          </div>
        </div>

        {/* Occupancy card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-violet-50 text-violet-750 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              PG Occupancy
            </span>
            <span className="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-extrabold text-slate-900 leading-none">
              {occupancyRate}%
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
              {activeGuestsCount} of {totalCapacity} beds filled
            </p>
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500 font-medium">
              <span>{rooms.filter(r => r.status === 'Available').length} rooms with vacancies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Occupancy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Comparative Monthly revenue bar chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Monthly Revenue Collections</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Tracking Billed expected vs Realized collections</p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 bg-slate-200 rounded-xs" />
                <span>Expected</span>
              </span>
              <span className="flex items-center gap-1 text-indigo-600">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs" />
                <span>Collected</span>
              </span>
            </div>
          </div>

          {/* SVG Custom Responsive Bar Chart */}
          <div className="relative pt-4 pb-2">
            <div className="flex items-end justify-between h-48 px-4 border-b border-slate-100">
              {trendData.map((d, index) => {
                const exptHeightPercent = Math.max(12, Math.round((d.expected / maxExpected) * 100));
                const collHeightPercent = Math.max(8, Math.round((d.collected / maxExpected) * 100));
                return (
                  <div key={d.month} className="flex flex-col items-center flex-1 max-w-[80px] group">
                    <div className="flex items-end gap-1.5 w-full justify-center h-40">
                      {/* Expected amount column bar */}
                      <div 
                        className="w-4 bg-slate-100 rounded-t-xs hover:bg-slate-200 transition-all duration-300 relative group-hover:scale-x-105"
                        style={{ height: `${exptHeightPercent}%` }}
                        title={`Expected: ${currencySymbol}${d.expected}`}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-xs z-10 pointer-events-none">
                          {currencySymbol}{d.expected}
                        </div>
                      </div>

                      {/* Collected amount column bar */}
                      <div 
                        className="w-4 bg-indigo-600 rounded-t-xs hover:bg-indigo-700 transition-all duration-300 relative group-hover:scale-x-105"
                        style={{ height: `${collHeightPercent}%` }}
                        title={`Collected: ${currencySymbol}${d.collected}`}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-xs z-10 pointer-events-none">
                          {currencySymbol}{d.collected}
                        </div>
                      </div>
                    </div>
                    {/* Month name indicator label */}
                    <span className="text-[10px] font-bold text-slate-500 mt-2.5 uppercase tracking-wider font-mono">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Share Breakdown (Rent vs Utility) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Income Stream share</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Rent vs Utility revenue contribution in {currentPeriod}</p>
          </div>

          <div className="my-5 flex justify-center relative">
            {/* Elegant SVG Custom Donut Pie chart */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="45"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="12"
              />
              {/* Rent share circle stroke */}
              {totalExpectedCurrent > 0 && (
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  fill="transparent"
                  stroke="#4f46e5"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - expectedRent / totalExpectedCurrent)}`}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-800">
                {totalExpectedCurrent > 0 ? Math.round((expectedRent / totalExpectedCurrent) * 100) : 0}%
              </span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Rent Share</span>
            </div>
          </div>

          <div className="space-y-2 text-[11px] font-medium text-slate-600">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span>Room Rent Dues</span>
              </div>
              <span className="font-semibold text-slate-800">{currencySymbol}{expectedRent.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-200" />
                <span>Utility Splits</span>
              </div>
              <span className="font-semibold text-slate-800">{currencySymbol}{expectedUtility.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Occupancy breakdown by Bed Capacity & Defaulter list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Debtor Defaulters List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs lg:col-span-3 space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Outstanding Debts & Defaulters Tracker</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Active guests with cumulative unpaid balances</p>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {debtorsList.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                🎉 No defaulters! All accounts are fully settled.
              </div>
            ) : (
              debtorsList.map((debtor) => (
                <div key={debtor.guestId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0 hover:bg-slate-50/20 px-1 rounded-lg transition">
                  <div>
                    <h5 className="font-bold text-slate-805 text-xs flex items-center gap-1.5">
                      <span>{debtor.guestName}</span>
                      <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-sm font-semibold">
                        Room {debtor.roomNumber}
                      </span>
                    </h5>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{debtor.pendingInvoices.length} invoices pending</span>
                      <span>•</span>
                      <span className="truncate max-w-[180px] italic">
                        Last due: {debtor.pendingInvoices[0]?.dueDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-sm font-extrabold text-rose-600 font-mono">
                      {currencySymbol}{debtor.totalDue}
                    </span>
                    
                    <button 
                      onClick={() => handleCopyReminder(debtor)}
                      className={`p-1.5 rounded-lg border transition text-xs font-bold cursor-pointer flex items-center gap-1 ${
                        copiedId === debtor.guestId 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-205'
                      }`}
                      title="Copy Payment Reminder Text"
                    >
                      {copiedId === debtor.guestId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {getGuestPhone(debtor.guestId) && (
                      <a 
                        href={`https://wa.me/${getGuestPhone(debtor.guestId).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hi ${debtor.guestName}, this is a payment notification regarding your total pending PG outstanding balance of *₹${debtor.totalDue}* on your room. Kindly settle at your earliest interest. Thank you!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition shadow-sm"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Ping</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Accommodation capacity distributions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs lg:col-span-2 space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Bed Capacity Audits</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Allocation rate by PG room structure categories</p>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {roomTypeDistribution.map((group) => (
              <div key={group.type} className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1 font-bold">
                    <span>{group.type}</span>
                    <span className="text-[9px] font-mono text-slate-400">({group.roomsCount} Rooms)</span>
                  </div>
                  <span className="font-bold text-slate-700">
                    {group.occupied} / {group.capacity} beds ({group.occupancyWeb}%)
                  </span>
                </div>
                {/* Visual grid meters */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${group.occupancyWeb}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
