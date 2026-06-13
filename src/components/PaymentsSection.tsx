/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Printer, 
  Eye, 
  X,
  CreditCard,
  Building,
  Maximize2,
  Pencil
} from 'lucide-react';
import { Payment, Guest, Room, BusinessConfig } from '../types';

interface PaymentsSectionProps {
  payments: Payment[];
  guests: Guest[];
  rooms: Room[];
  onAddPayment: (payment: Payment) => void;
  onUpdatePayment: (payment: Payment) => void;
  onDeletePayment: (id: string) => void;
  businessConfig?: BusinessConfig;
}

export default function PaymentsSection({
  payments,
  guests,
  rooms,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  businessConfig
}: PaymentsSectionProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPeriod, setFilterPeriod] = useState<string>('All');

  // Modal Control
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Add Custom Bill Form states
  const [guestId, setGuestId] = useState('');
  const [pType, setPType] = useState<'Rent' | 'Utility'>('Rent');
  const [amount, setAmount] = useState(150);
  const [billingPeriod, setBillingPeriod] = useState('June 2026');
  const [dueDate, setDueDate] = useState('2026-06-05');
  const [description, setDescription] = useState('');

  // Edit/Receive Payment Modal states
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'Paid' | 'Unpaid' | 'Overdue'>('Unpaid');
  const [editBillingPeriod, setEditBillingPeriod] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPaidDate, setEditPaidDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const [partialAmountPaid, setPartialAmountPaid] = useState<number>(0);

  const handleStartEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount);
    setEditStatus(payment.status);
    setEditBillingPeriod(payment.billingPeriod);
    setEditDueDate(payment.dueDate);
    setEditPaidDate(payment.paidDate || new Date().toISOString().split('T')[0]);
    setEditDescription(payment.description || '');
    setIsPartial(false);
    setPartialAmountPaid(payment.amount);
  };

  // Gather unique periods to populate the period filter list
  const uniquePeriods = Array.from(new Set(payments.map(p => p.billingPeriod))).sort();

  // Reset form
  const resetForm = () => {
    setGuestId(guests.length > 0 ? guests[0].id : '');
    setPType('Rent');
    setAmount(150);
    setBillingPeriod('June 2026');
    setDueDate('2026-06-05');
    setDescription('');
  };

  const handleOpenAddBill = () => {
    resetForm();
    if (guests.length === 0) {
      alert('You must check in at least one guest before issuing custom invoices.');
      return;
    }
    setIsAddOpen(true);
  };

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestId) return;

    const guestObj = guests.find(g => g.id === guestId);
    if (!guestObj) return;

    const roomObj = rooms.find(r => r.id === guestObj.roomId);
    const roomNo = roomObj ? roomObj.roomNumber : 'Unassigned';

    const newPayment: Payment = {
      id: 'pay_' + Date.now(),
      guestId,
      guestName: guestObj.name,
      roomNumber: roomNo,
      type: pType,
      amount: Number(amount),
      billingPeriod,
      dueDate,
      status: 'Unpaid',
      description: description.trim() || `${pType} payment for ${billingPeriod}`
    };

    onAddPayment(newPayment);
    setIsAddOpen(false);
    resetForm();
  };

  const handleCompletePayment = (payment: Payment) => {
    const today = new Date().toISOString().split('T')[0];
    const updated: Payment = {
      ...payment,
      status: 'Paid',
      paidDate: today
    };
    onUpdatePayment(updated);
  };

  const handleSaveEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    const finalAmount = Number(editAmount);
    if (isNaN(finalAmount) || finalAmount < 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (isPartial && editStatus === 'Paid') {
      const paidAmt = Number(partialAmountPaid);
      if (isNaN(paidAmt) || paidAmt <= 0) {
        alert('Please enter a valid partial amount paid.');
        return;
      }
      if (paidAmt >= finalAmount) {
        // Full payment
        const updated: Payment = {
          ...editingPayment,
          amount: finalAmount,
          status: 'Paid',
          paidDate: editPaidDate || new Date().toISOString().split('T')[0],
          billingPeriod: editBillingPeriod,
          dueDate: editDueDate,
          description: editDescription.trim() || editingPayment.description
        };
        onUpdatePayment(updated);
      } else {
        // Partial Payment logic: mark current as Paid with paidAmt, and create remainder Unpaid
        const updatedCurrent: Payment = {
          ...editingPayment,
          amount: paidAmt,
          status: 'Paid',
          paidDate: editPaidDate || new Date().toISOString().split('T')[0],
          billingPeriod: editBillingPeriod,
          dueDate: editDueDate,
          description: `${editDescription.trim() || editingPayment.description} (Partial payment: ₹${paidAmt} of ₹${finalAmount})`.trim()
        };

        const remainder = finalAmount - paidAmt;
        const remainderBill: Payment = {
          id: 'pay_rem_' + Date.now(),
          guestId: editingPayment.guestId,
          guestName: editingPayment.guestName,
          roomNumber: editingPayment.roomNumber,
          type: editingPayment.type,
          amount: remainder,
          billingPeriod: editBillingPeriod,
          dueDate: editDueDate,
          status: 'Unpaid',
          description: `Remainder balance of ${editBillingPeriod} ${editingPayment.type} (Original ₹${finalAmount})`
        };

        onUpdatePayment(updatedCurrent);
        onAddPayment(remainderBill);
      }
    } else {
      // Normal full edit of payment parameters
      const updated: Payment = {
        ...editingPayment,
        amount: finalAmount,
        status: editStatus,
        paidDate: editStatus === 'Paid' ? (editPaidDate || new Date().toISOString().split('T')[0]) : undefined,
        billingPeriod: editBillingPeriod,
        dueDate: editDueDate,
        description: editDescription.trim()
      };
      onUpdatePayment(updated);
    }

    setEditingPayment(null);
  };

  const handleDeleteBill = (id: string, name: string, period: string) => {
    if (confirm(`Are you sure you want to delete the bill for ${name} [${period}]?`)) {
      onDeletePayment(id);
    }
  };

  // Find a guest's details for receipt rendering
  const getGuestInfoOfPayment = (p: Payment) => {
    return guests.find(g => g.id === p.guestId);
  };

  const getRoomNumber = (roomId: string) => {
    const r = rooms.find(room => room.id === roomId);
    return r ? r.roomNumber : 'Unassigned';
  };

  // Filtering calculations
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.guestName.toLowerCase().includes(search.toLowerCase()) || 
                          p.roomNumber.includes(search);
    const matchesType = filterType === 'All' || p.type === filterType;
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    const matchesPeriod = filterPeriod === 'All' || p.billingPeriod === filterPeriod;

    return matchesSearch && matchesType && matchesStatus && matchesPeriod;
  });

  // Sums for current filtered list
  const totalInvoiced = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = filteredPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = totalInvoiced - totalCollected;

  return (
    <div className="space-y-6">
      {/* Header section with cumulative stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Rent & Utilities Billing Ledger</h3>
          <p className="text-xs text-slate-500">Record payments, write custom manual bills, check transaction histories, and issue legal rent receipts.</p>
        </div>
        <button 
          id="btn-add-bill-trigger"
          onClick={handleOpenAddBill}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Manual Bill</span>
        </button>
      </div>

      {/* Numerical Quick Stats Widget for Ledger */}
      <div className="bg-white rounded-2xl border border-slate-205 p-4 md:p-5 grid grid-cols-3 gap-2 md:gap-4 divide-x divide-slate-150 shadow-sm animate-fade-in">
        <div className="text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Invoiced State</span>
          <span className="text-sm md:text-xl font-extrabold text-slate-800 block mt-1">₹{totalInvoiced}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed</span>
          <span className="text-sm md:text-xl font-extrabold text-emerald-600 block mt-1">₹{totalCollected}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Outstanding</span>
          <span className="text-sm md:text-xl font-extrabold text-rose-600 block mt-1">₹{totalPending}</span>
        </div>
      </div>

      {/* Filter and control options */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full xl:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search transactions by tenant name or room #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all font-medium text-slate-700"
          />
        </div>

        {/* dropdown grid */}
        <div className="grid grid-cols-3 gap-3 w-full xl:w-auto">
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 bg-slate-55 focus:outline-none focus:bg-white"
            >
              <option value="All">All Types</option>
              <option value="Rent">Rent Only</option>
              <option value="Utility">Utilities Only</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-655 bg-slate-55 focus:outline-none focus:bg-white"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Completed (Paid)</option>
              <option value="Unpaid">Pending (Unpaid)</option>
            </select>
          </div>

          <div>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-655 bg-slate-55 focus:outline-none focus:bg-white"
            >
              <option value="All">All Periods</option>
              {uniquePeriods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Desktop Table View & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
        {/* Table layout (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] text-slate-450 uppercase tracking-wider">
                <th className="py-3 px-5">Tenant (Room)</th>
                <th className="py-3 px-5">Billing Month</th>
                <th className="py-3 px-5">Fee Category</th>
                <th className="py-3 px-5">Invoice Description</th>
                <th className="py-3 px-5">Due Date</th>
                <th className="py-3 px-5 text-right">Invoice Amount</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPayments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    <div>{item.guestName}</div>
                    <span className="text-[10px] text-indigo-400 font-mono">Room {item.roomNumber}</span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-650 font-medium">{item.billingPeriod}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${item.type === 'Rent' ? 'bg-indigo-50 text-indigo-650 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 text-[11px] truncate max-w-[170px]" title={item.description}>
                    {item.description || '—'}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-500">{item.dueDate}</td>
                  <td className="py-3.5 px-5 text-right font-bold text-slate-900">₹{item.amount}</td>
                  <td className="py-3.5 px-5 text-center">
                    {item.status === 'Paid' ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-[9px] rounded-full border border-emerald-100">
                        Paid ({item.paidDate})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 font-semibold text-[9px] rounded-full border border-rose-100 animate-pulse-subtle">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex justify-end gap-2.5">
                      {item.status !== 'Paid' ? (
                        <button 
                          onClick={() => handleCompletePayment(item)}
                          className="p-1 hover:bg-emerald-50 rounded-md text-emerald-650 transition cursor-pointer"
                          title="Record fully Paid"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : null}
                      <button 
                        onClick={() => handleStartEdit(item)}
                        className="p-1 hover:bg-slate-100 rounded-md text-indigo-600 transition cursor-pointer"
                        title="Edit / Record Payment"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedReceipt(item)}
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-750 transition cursor-pointer"
                        title="View & Print Payment Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteBill(item.id, item.guestName, item.billingPeriod)}
                        className="p-1 hover:bg-red-50 text-rose-500 rounded-md transition cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Grid */}
        <div className="md:hidden p-4 space-y-3">
          {filteredPayments.map((item) => (
            <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3 hover:bg-slate-100/50 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-bold text-slate-800 text-xs">{item.guestName}</h5>
                  <p className="text-[10px] text-slate-450 font-mono mt-0.5">Room {item.roomNumber} • {item.billingPeriod}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.type === 'Rent' ? 'bg-indigo-50 text-indigo-650 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                  {item.type}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 italic">
                {item.description || '—'}
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                <span className="font-mono text-[10px] text-slate-400">Due: {item.dueDate}</span>
                <span className="font-bold text-slate-905">₹{item.amount}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                {item.status === 'Paid' ? (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                    Paid
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
                    Unpaid
                  </span>
                )}

                <div className="flex gap-2">
                  {item.status !== 'Paid' && (
                    <button 
                      onClick={() => handleCompletePayment(item)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium text-[10px] cursor-pointer"
                    >
                      Pay
                    </button>
                  )}
                  <button 
                    onClick={() => handleStartEdit(item)}
                    className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-lg cursor-pointer flex items-center justify-center w-7 h-7"
                    title="Edit / Record Payment"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setSelectedReceipt(item)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-650 font-medium text-[10px] rounded-lg cursor-pointer flex items-center gap-0.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteBill(item.id, item.guestName, item.billingPeriod)}
                    className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <div className="py-14 text-center flex flex-col items-center justify-center bg-white col-span-full">
            <div className="p-4 bg-slate-50 text-slate-450 rounded-full mb-3">
              <DollarSign className="w-8 h-8" />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">No recorded ledger items</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">There are no outstanding or historical bills matching active filters.</p>
          </div>
        )}
      </div>

      {/* Issuing Manual Bill Popup Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Plus className="text-indigo-600 w-5 h-5" />
                <h4 className="font-bold text-slate-800">Issue Manual Bill</h4>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePostPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-5050 mb-1.5">Select Guest Profile *</label>
                <select
                  value={guestId}
                  required
                  onChange={(e) => setGuestId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none"
                >
                  {guests.filter(g => g.status === 'Active').map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.name} (Room {getRoomNumber(guest.roomId)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Fee Category *</label>
                  <select
                    value={pType}
                    onChange={(e) => setPType(e.target.value as 'Rent' | 'Utility')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="Rent">Rent (Accommodation)</option>
                    <option value="Utility">Utility (WiFi, Gas, Water, etc.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Invoice Amount (₹) *</label>
                  <input 
                    type="number"
                    required
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Billing Period *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. July 2026"
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Payment Due Date *</label>
                  <input 
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-5050 mb-1.5">Description / Memo</label>
                <textarea 
                  placeholder="e.g. Divided Electricity Bill share / Special Internet package"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none resize-none font-sans text-slate-700"
                />
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
                  Post Bill to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/* Printable CSS Receipt Modal popup representation */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-8">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-slate-700">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold">Payment Receipt Drawer</span>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Print Section (printable block style) */}
            <div id="re-receipt-print-area" className="p-6 bg-white space-y-6 text-slate-800">
              {/* Header metadata logo */}
              <div className="flex justify-between items-start pb-4 border-b border-dashed border-slate-200">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-900">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span className="font-extrabold text-xs tracking-tight uppercase">
                      {businessConfig?.businessName || 'Paying Guest Accommodation'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">Official Business Rent Receipt</p>
                  {businessConfig?.address && (
                    <p className="text-[8px] text-slate-400 max-w-[220px] mt-0.5 leading-normal">{businessConfig.address}</p>
                  )}
                  {businessConfig?.gstin && (
                    <p className="text-[8px] text-indigo-600 font-bold font-mono mt-0.5">GSTIN: {businessConfig.gstin}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase ${
                    selectedReceipt.status === 'Paid' 
                      ? 'bg-emerald-50 text-emerald-750 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                  }`}>
                    {selectedReceipt.status === 'Paid' ? 'Receipt' : 'Invoice'}
                  </span>
                  <p className="text-[8px] font-mono mt-1.5 text-slate-400">#REC-{selectedReceipt.id.toUpperCase().substring(4, 9)}</p>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider">Tenant (Paid By)</span>
                  <strong className="text-slate-800 text-xs mt-0.5 block">{selectedReceipt.guestName}</strong>
                  {getGuestInfoOfPayment(selectedReceipt) && (
                    <span className="text-[8px] text-slate-450 font-mono block mt-0.5 font-medium">
                      {getGuestInfoOfPayment(selectedReceipt)?.phone}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider">Premise Units</span>
                  <strong className="text-slate-800 text-xs mt-0.5 block">Room {selectedReceipt.roomNumber}</strong>
                  <span className="text-[8px] text-slate-450 block mt-0.5 font-medium">Billing Period: {selectedReceipt.billingPeriod}</span>
                </div>
              </div>

              {/* Split calculation summary */}
              <div className="space-y-2 text-[10px] font-medium text-slate-600">
                <div className="flex justify-between pb-1.5 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-wide text-[8px]">
                  <span>Itemized Fee Categories</span>
                  <span className="text-right">Amount due</span>
                </div>

                <div className="flex justify-between text-slate-800 pt-1">
                  <div>
                    <span className="font-bold">{selectedReceipt.type} Charge</span>
                    <p className="text-[9px] text-slate-450 mt-0.5 font-normal leading-relaxed">
                      {selectedReceipt.description || `${selectedReceipt.type} dues for period ${selectedReceipt.billingPeriod}`}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-900">₹{selectedReceipt.amount}.00</span>
                </div>
              </div>

              {/* Aggregate block */}
              <div className="pt-4 border-t border-dashed border-slate-200 flex flex-col items-end space-y-1.5">
                <div className="flex justify-between w-full text-xs font-semibold text-slate-500">
                  <span>Invoiced Balance due:</span>
                  <span className="font-mono text-slate-700">₹{selectedReceipt.amount}.00</span>
                </div>

                <div className="flex justify-between w-full text-sm mt-1.5 pt-1.5 border-t border-slate-150">
                  <span className="font-extrabold text-slate-850">
                    {selectedReceipt.status === 'Paid' ? 'Total Paid Recieved:' : 'Total due:'}
                  </span>
                  <span className="font-mono font-black text-indigo-700 text-md">₹{selectedReceipt.amount}.00</span>
                </div>

                {/* QR scan code on bottom of print receipts for easy payments! */}
                {selectedReceipt.status !== 'Paid' ? (
                  <div className="w-full flex items-center justify-between p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100/60 mt-3">
                    <div className="space-y-0.5 max-w-[200px]">
                      <span className="text-[9px] font-bold text-indigo-900 tracking-tight flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Scan & Pay via UPI</span>
                      </span>
                      <p className="text-[8px] text-slate-5050 leading-relaxed">
                        Scan the QR code on the right with GPay, PhonePe or Paytm to settle instantly with landlord directly.
                      </p>
                    </div>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&margin=3&data=${encodeURIComponent(
                        `upi://pay?pa=${encodeURIComponent(businessConfig?.upiId || 'payingguest@upi')}&pn=${encodeURIComponent(businessConfig?.landlordName || 'PG Landlord')}&tn=${encodeURIComponent(`PG-Rent-${selectedReceipt.billingPeriod}`)}&am=${selectedReceipt.amount}&cu=INR`
                      )}`}
                      alt="UPI QR Code"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-contain bg-white p-1 border border-indigo-100 rounded-lg shrink-0 shadow-3xs"
                    />
                  </div>
                ) : (
                  <div className="mt-4 w-full flex items-center justify-between text-[9px] text-slate-400">
                    <span className="italic font-medium">Issued by: {businessConfig?.landlordName || 'Hostel Administrator'}</span>
                    <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-sm font-bold uppercase border border-emerald-100 flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Status: Paid
                    </span>
                  </div>
                )}
              </div>

              {/* Informational advice / customized terms stamp! */}
              {businessConfig?.termsAndConditions ? (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Accommodation Terms</span>
                  <p className="text-[8px] text-slate-400 leading-normal whitespace-pre-line">{businessConfig.termsAndConditions}</p>
                </div>
              ) : (
                <p className="text-[8px] text-center text-slate-400 pt-3 border-t border-slate-100">
                  Thank you for prompt payments. Contact landlord administration in case of discrepancies.
                </p>
              )}
            </div>

            {/* Print trigger footer controls */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex gap-3 text-xs font-semibold">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Record Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200 my-8">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Pencil className="text-indigo-600 w-5 h-5" />
                <h4 className="font-bold text-slate-800">Edit / Record Payment</h4>
              </div>
              <button 
                onClick={() => setEditingPayment(null)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditPayment} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tenant Profile</span>
                <strong className="text-slate-900 text-sm mt-1 block">{editingPayment.guestName}</strong>
                <span className="text-[10px] text-slate-500 font-mono">Room {editingPayment.roomNumber} ({editingPayment.type})</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Payment Status *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'Paid' | 'Unpaid' | 'Overdue')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none font-semibold"
                  >
                    <option value="Paid">Completed (Paid)</option>
                    <option value="Unpaid">Pending (Unpaid)</option>
                    <option value="Overdue">Overdue (Unpaid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Bill Amount (₹) *</label>
                  <input 
                    type="number"
                    required
                    min={0}
                    value={editAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditAmount(val);
                      if (!isPartial) {
                        setPartialAmountPaid(val);
                      }
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Partial Payment Option checkbox */}
              {editStatus === 'Paid' && (
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-indigo-900 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={isPartial}
                      onChange={(e) => {
                        setIsPartial(e.target.checked);
                        if (e.target.checked) {
                          setPartialAmountPaid(editAmount);
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Is this a partial payment?</span>
                  </label>

                  {isPartial && (
                    <div className="mt-2 animate-in slide-in-from-top-1 duration-150">
                      <div className="flex justify-between items-center text-[10px] text-indigo-600 font-semibold mb-1">
                        <span>How much did they pay? *</span>
                        <span>Total due: ₹{editAmount}</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                        <input 
                          type="number"
                          required
                          min={1}
                          max={editAmount}
                          value={partialAmountPaid}
                          onChange={(e) => setPartialAmountPaid(Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-1.5 border border-indigo-200 bg-white rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                        * Recording ₹{partialAmountPaid} paid will mark this invoice as Paid and **automatically generate a new pending Unpaid remainder invoice of ₹{Math.max(0, editAmount - partialAmountPaid)}** to update the tenant's outstanding balance correctly.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Billing Period *</label>
                  <input 
                    type="text"
                    required
                    value={editBillingPeriod}
                    onChange={(e) => setEditBillingPeriod(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Payment Due Date *</label>
                  <input 
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none text-slate-600"
                  />
                </div>
              </div>

              {editStatus === 'Paid' && (
                <div>
                  <label className="block text-xs font-medium text-slate-5050 mb-1.5">Actual Date Received *</label>
                  <input 
                    type="date"
                    required
                    value={editPaidDate}
                    onChange={(e) => setEditPaidDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none text-slate-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-5050 mb-1.5">Description / Memo</label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-xs focus:outline-none resize-none font-sans text-slate-700"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 rounded-xl text-xs font-semibold transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
