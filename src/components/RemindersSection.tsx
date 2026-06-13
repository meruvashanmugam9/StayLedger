/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  MessageSquare, 
  Check, 
  Copy, 
  ExternalLink, 
  Calendar, 
  AlertTriangle,
  Clock,
  Filter,
  Users,
  CheckCircle,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { Room, Guest, Payment } from '../types';

interface RemindersSectionProps {
  payments: Payment[];
  guests: Guest[];
  rooms: Room[];
  onQuickPay: (id: string) => void;
  onUpdatePayment?: (updated: Payment) => void;
}

export default function RemindersSection({
  payments,
  guests,
  rooms,
  onQuickPay,
  onUpdatePayment
}: RemindersSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Due Today' | 'Overdue' | 'Upcoming'>('All');
  const [selectedReminder, setSelectedReminder] = useState<Payment | null>(null);
  const [copied, setCopied] = useState(false);
  const [customTemplate, setCustomTemplate] = useState('standard'); // standard, formal, gentle

  const TODAY_STR = '2026-06-03'; // Guided by current system context (June 3, 2026)

  // Helper: Find phone of a guest
  const getGuestContact = (guestId: string) => {
    const g = guests.find(g => g.id === guestId);
    return g ? g.phone : '';
  };

  // Helper: Find email of a guest
  const getGuestEmail = (guestId: string) => {
    const g = guests.find(g => g.id === guestId);
    return g ? g.email : 'N/A';
  };

  // Process all unpaid payments
  const unpaidRentPayments = payments.filter(p => p.status !== 'Paid');

  // Filter based on due date relative to today's date "2526-06-03"
  const getStatusCategory = (payment: Payment) => {
    if (payment.dueDate === TODAY_STR) return 'Due Today';
    if (payment.dueDate < TODAY_STR) return 'Overdue';
    return 'Upcoming';
  };

  const processedPayments = unpaidRentPayments.map(p => ({
    ...p,
    category: getStatusCategory(p)
  }));

  // Filtering payments
  const filteredPayments = processedPayments.filter(p => {
    const matchesSearch = p.guestName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.roomNumber.includes(searchTerm);
    const matchesFilter = filterType === 'All' || p.category === filterType;
    return matchesSearch && matchesFilter;
  });

  // Calculate totals
  const totalUnpaidAmount = unpaidRentPayments.reduce((sum, p) => sum + p.amount, 0);
  const dueTodayPayments = processedPayments.filter(p => p.category === 'Due Today');
  const totalDueTodayAmount = dueTodayPayments.reduce((sum, p) => sum + p.amount, 0);
  const overduePayments = processedPayments.filter(p => p.category === 'Overdue');
  const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  // Generate reminder message text based on selected template
  const generateMessageText = (payment: Payment | null) => {
    if (!payment) return '';
    
    const dueDateText = payment.dueDate === TODAY_STR ? 'TODAY' : payment.dueDate;
    const daysLateText = getStatusCategory(payment) === 'Overdue' ? ' and is currently past due' : '';

    if (customTemplate === 'formal') {
      return `Dear ${payment.guestName},\n\nThis is a formal payment notice from the EasyStay PG Management. Your ${payment.type.toLowerCase()} payment of ₹${payment.amount} for the billing period ${payment.billingPeriod} is due on ${dueDateText}${daysLateText}.\n\nKindly clear this outstanding amount at your earliest convenience to avoid potential late fees.\n\nThank you for your cooperation.\nBest regards,\nPG Administrator`;
    } else if (customTemplate === 'gentle') {
      return `Hey ${payment.guestName}! 😊 Just a friendly ping that the payment for ${payment.billingPeriod} (${payment.type.toLowerCase()}) is due on ${dueDateText === 'TODAY' ? 'today' : dueDateText}. It comes to ₹${payment.amount}.\n\nNo rush, just wanted to let you know as you plan out your day. Have a magnificent day! 🌸`;
    }
    
    // Standard template
    return `Hi ${payment.guestName},\n\n This is a friendly reminder that your ${payment.type.toLowerCase()} payment for ${payment.billingPeriod} is due ${dueDateText === 'TODAY' ? 'TODAY' : 'on ' + dueDateText}.\n\n*Amount Due:* ₹${payment.amount}\n*Room Number:* ${payment.roomNumber}\n\nPlease transfer the amount to the PG account and share your payment screenshot. Thank you!`;
  };

  const handleOpenAlert = (payment: Payment) => {
    setSelectedReminder(payment);
    setCopied(false);
  };

  const handleCopyAlert = () => {
    const text = generateMessageText(selectedReminder);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 md:p-8 rounded-2xl text-white shadow-md relative overflow-hidden border border-indigo-950">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span>Automated Reminders Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Active Payment Reminders</h2>
            <p className="text-indigo-200/80 text-xs md:text-sm max-w-xl">
              Track pending tenants, filter those with rents due today, and coordinate instant WhatsApp collections.
            </p>
          </div>
          <div className="bg-white/10 px-4 py-2 text-xs font-mono font-bold rounded-lg border border-white/10">
            System Date: June 3, 2026
          </div>
        </div>
      </div>

      {/* Numerical Indicators Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rents Due Today Card */}
        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Immediate Collection
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Due Today</p>
            <h3 className="text-2xl font-black text-amber-800 mt-0.5">₹{totalDueTodayAmount}</h3>
            <p className="text-amber-700 text-xs mt-1.5 font-medium">
              {dueTodayPayments.length} tenants need to pay rent by tonight.
            </p>
          </div>
        </div>

        {/* Overdue Rent Balance */}
        <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Action Required
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Overdue Dues</p>
            <h3 className="text-2xl font-black text-rose-800 mt-0.5">₹{totalOverdueAmount}</h3>
            <p className="text-rose-700 text-xs mt-1.5 font-medium">
              {overduePayments.length} balance invoices are behind schedule.
            </p>
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="flex justify-between items-center">
            <div className="p-2.5 bg-slate-200 text-slate-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-655 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Consolidated Outstanding
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Pending Balance</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">₹{totalUnpaidAmount}</h3>
            <p className="text-slate-600 text-xs mt-1.5 font-medium">
              Across {unpaidRentPayments.length} active invoices this season.
            </p>
          </div>
        </div>
      </div>

      {/* Due Today Direct Notification Alert Banner */}
      {dueTodayPayments.length > 0 && (
        <div className="bg-amber-100/50 border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl mt-0.5 flex items-center justify-center h-10 w-10 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm md:text-base">Rent Alerts Due Today!</h4>
              <p className="text-amber-800 text-xs mt-0.5 max-w-2xl font-medium">
                {dueTodayPayments.map(p => p.guestName).join(' and ')} must pay accommodation rent today. Send them a WhatsApp message or record their receipt.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            {dueTodayPayments.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => handleOpenAlert(p)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Remind {p.guestName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Lists Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Controls and Search Bar Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {(['All', 'Due Today', 'Overdue', 'Upcoming'] as const).map((type) => {
              const count = type === 'All' 
                ? processedPayments.length 
                : processedPayments.filter(p => p.category === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filterType === type
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-100'
                      : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                  }`}
                >
                  <span>{type}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    filterType === type 
                      ? 'bg-indigo-700 text-indigo-100' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by tenant name, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Payments List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-450 tracking-wider bg-slate-50/50">
                <th className="py-4 px-6">Tenant & Room</th>
                <th className="py-4 px-4">Bill Type</th>
                <th className="py-4 px-4">Period</th>
                <th className="py-4 px-4">Due Date</th>
                <th className="py-4 px-4 text-right">Amount</th>
                <th className="py-4 px-4">Status Alert</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                      <h4 className="font-bold text-slate-800 text-sm">Perfect Ledger Match</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        No outstanding payments match the current filter criteria. Excellent record-keeping!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const phone = getGuestContact(p.guestId);
                  const guestObj = guests.find(g => g.id === p.guestId);
                  return (
                    <tr 
                      key={p.id} 
                      className={`border-b border-slate-100 transition duration-150 hover:bg-slate-50/50 ${
                        p.category === 'Due Today' ? 'bg-amber-50/20' : p.category === 'Overdue' ? 'bg-rose-50/10' : ''
                      }`}
                    >
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold leading-none shrink-0 border border-slate-100 ${
                            p.category === 'Due Today'
                              ? 'bg-amber-100 text-amber-800'
                              : p.category === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {guestObj?.photoUrl ? (
                              <img 
                                src={guestObj.photoUrl} 
                                alt={p.guestName} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              p.guestName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs.1 flex items-center gap-1.5">
                              <span>{p.guestName}</span>
                              {p.dueDate === TODAY_STR && (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md">
                                  Today
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-450 mt-0.5 flex items-center gap-1.5">
                              <span className="font-medium">Room {p.roomNumber}</span>
                              {phone && (
                                <>
                                  <span className="text-slate-350">•</span>
                                  <span className="font-mono">{phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.type === 'Rent' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/60' 
                            : 'bg-blue-50 text-blue-700 border border-blue-100/60'
                        }`}>
                          {p.type}
                        </span>
                      </td>

                      <td className="py-4.5 px-4 font-medium text-xs text-slate-600">
                        {p.billingPeriod}
                      </td>

                      <td className="py-4.5 px-4">
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.dueDate}</span>
                        </div>
                      </td>

                      <td className="py-4.5 px-4 text-right font-bold text-slate-800 text-xs">
                        ₹{p.amount.toLocaleString()}
                      </td>

                      <td className="py-4.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          p.category === 'Due Today'
                            ? 'bg-amber-100 text-amber-800'
                            : p.category === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            p.category === 'Due Today' ? 'bg-amber-500' : p.category === 'Overdue' ? 'bg-rose-500' : 'bg-slate-400'
                          }`}></span>
                          <span>{p.category}</span>
                        </span>
                      </td>

                      <td className="py-4.5 px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => onQuickPay(p.id)}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50/60 border border-slate-200 text-emerald-600 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Quick Pay"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Paid</span>
                          </button>
                          
                          <button
                            onClick={() => handleOpenAlert(p)}
                            className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Remind via channels"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Send Alert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Message Modulator Drawer/Modal */}
      {selectedReminder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600 animate-bounce" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm md:text-base">Custom Rent Alert Dispatch</h4>
                  <p className="text-[10px] text-slate-550">Configure messaging pattern before sending</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReminder(null)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-2xl font-semibold leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tenant context overview banner */}
              <div className="bg-slate-100/80 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Target Tenant</span>
                  <h5 className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{selectedReminder.guestName}</h5>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Room {selectedReminder.roomNumber} • {selectedReminder.type} accommodation invoice</p>
                </div>
                <div className="text-right sm:text-right flex flex-col justify-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Amount Due</span>
                  <div className="text-lg font-black text-rose-600 mt-0.5">₹{selectedReminder.amount.toLocaleString()}</div>
                </div>
              </div>

              {/* Select Tone Modulator */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reminder Tone Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'standard', label: 'Standard Alert ⚖️' },
                    { id: 'gentle', label: 'Gentle Ping 😊' },
                    { id: 'formal', label: 'Formal Notice 👔' },
                  ].map((temp) => (
                    <button
                      key={temp.id}
                      onClick={() => {
                        setCustomTemplate(temp.id);
                        setCopied(false);
                      }}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition cursor-pointer ${
                        customTemplate === temp.id
                          ? 'border-indigo-650 bg-indigo-50/50 text-indigo-750'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {temp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Text area */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Message Draft Preview</label>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md">Editable template output</span>
                </div>
                <textarea
                  value={generateMessageText(selectedReminder)}
                  onChange={(e) => {}} // calculated dynamically, reads only
                  readOnly
                  rows={6}
                  className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-0 select-all font-mono text-slate-705 leading-relaxed whitespace-pre-wrap select-all"
                />
              </div>

              {/* Dispatch Action buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopyAlert}
                  className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy Message Text</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://wa.me/${getGuestContact(selectedReminder.guestId).replace(/[^\d+]/g, '') || '919876543210'}?text=${encodeURIComponent(generateMessageText(selectedReminder))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition cursor-pointer md:py-2.5 md:text-xs md:gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </a>
              </div>

              {/* Extra Dispatch: Call direct line if available */}
              {getGuestContact(selectedReminder.guestId) && (
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-medium select-all">
                    <span>Active line:</span>
                    <strong className="text-slate-850">{getGuestContact(selectedReminder.guestId)}</strong>
                  </div>
                  <a 
                    href={`tel:${getGuestContact(selectedReminder.guestId)}`}
                    className="text-indigo-650 hover:text-indigo-750 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Tenant</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
