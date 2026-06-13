/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Briefcase, 
  MapPin, 
  PhoneCall, 
  QrCode, 
  Check, 
  Save, 
  Building, 
  CreditCard,
  FileText,
  BadgeAlert,
  ClipboardCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BusinessConfig } from '../types';
import { SubscriptionMonthRecord } from './PlatformAdmin';

interface BusinessHubProps {
  config: BusinessConfig;
  onSaveConfig: (updated: BusinessConfig) => void;
  subscriptionLedger?: SubscriptionMonthRecord[];
  subscriptionStatus?: 'active' | 'suspended' | 'unpaid';
}

export default function BusinessHub({
  config,
  onSaveConfig,
  subscriptionLedger = [],
  subscriptionStatus = 'active'
}: BusinessHubProps) {
  // Local state for the config form
  const [businessName, setBusinessName] = useState(config.businessName);
  const [landlordName, setLandlordName] = useState(config.landlordName);
  const [phone, setPhone] = useState(config.phone);
  const [upiId, setUpiId] = useState(config.upiId);
  const [gstin, setGstin] = useState(config.gstin || '');
  const [address, setAddress] = useState(config.address || '');
  const [terms, setTerms] = useState(config.termsAndConditions || '');
  
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      businessName: businessName.trim(),
      landlordName: landlordName.trim(),
      phone: phone.trim(),
      upiId: upiId.trim(),
      gstin: gstin.trim() || undefined,
      address: address.trim() || undefined,
      termsAndConditions: terms.trim() || undefined,
      currencySymbol: '₹', // lock to Rupee as requested/seeded
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Build real UPI Deep Link URL for the QR code
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(landlordName)}&tn=PG-Rent-&-Utilities&cu=INR`;
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="space-y-6" id="business-hub-section">
      {/* Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span>Landlord Business Settings Hub</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your Paying Guest business, set up custom rent payment terms, and generate automated UPI scan-to-pay QR Codes.
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-650" />
          <div>
            <p>Business Profile Saved Successfully!</p>
            <p className="font-normal text-[11px] text-emerald-600 mt-0.5">
              Updates have been saved and applied to your custom printable payment receipts and automated payment messages.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Profile Settings Form panel – Left column */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-205 shadow-3xs lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-sm">Rent Business Configuration Form</h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PG Business Brand Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">PG Business Name *</label>
              <input 
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Shanmugam PG Premium Home"
                className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Landlord Admin Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Primary Owner / Landlord *</label>
                <input 
                  type="text"
                  required
                  value={landlordName}
                  onChange={(e) => setLandlordName(e.target.value)}
                  placeholder="e.g. M. Shanmugam"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-semibold text-slate-850"
                />
              </div>

              {/* Owner contact phone */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Contact Phone / WhatsApp *</label>
                <input 
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9443210123"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Landlord UPI ID */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Landlord UPI Address *</span>
                </label>
                <input 
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. shanmugam@upi"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-semibold font-mono text-indigo-700"
                />
              </div>

              {/* Business GSTIN Tax Code */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Business GSTIN (Optional)</label>
                <input 
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 36AAAAA1111A1Z1"
                  className="w-full px-3 py-2 border border-slate-205 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
                />
              </div>
            </div>

            {/* Premise Address */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Premise Address / Hostel Location</label>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Lane 4, Behind Cyber Towers, Madhapur, Hyderabad, Telangana - 500081"
                rows={2}
                className="w-full px-3.5 py-2 border border-slate-205 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-sans text-slate-700 resize-none"
              />
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Tenant Rules & Rent Policies</span>
              </label>
              <textarea 
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Enter rules separate by lines. e.g. Dues must be settled before 5th of monthly."
                rows={3}
                className="w-full px-3.5 py-2 border border-slate-205 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-sans text-slate-705 resize-none leading-relaxed"
              />
            </div>

            {/* Form Save Button */}
            <div className="pt-2 border-t border-slate-100">
              <button 
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
              >
                <Save className="w-4 h-4" />
                <span>Save Business Profile Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Business Preview Panel – Right column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Scannable Real-time UPI QR code widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex flex-col items-center justify-center text-center space-y-3.5">
            <div className="w-full pb-2 border-b border-dashed border-slate-150 flex items-center justify-center gap-1.5 text-slate-700 font-black text-xs uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-indigo-620 animate-pulse-subtle" />
              <span>Real-time Active UPI QR Code</span>
            </div>

            <div className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-xs">
              <img 
                src={qrCodeImgSrc} 
                alt="Payment QR Code Link" 
                referrerPolicy="no-referrer"
                className="w-40 h-40 object-contain rounded-md"
              />
            </div>

            <div className="space-y-1">
              <h5 className="font-extrabold text-slate-800 text-xs truncate max-w-[200px]" title={businessName}>
                {businessName || 'Business Name Pending'}
              </h5>
              <div className="text-[10px] text-slate-400 font-mono select-all hover:text-indigo-600 transition leading-none">
                {upiId || 'waiting-for-address@upi'}
              </div>
            </div>

            <p className="text-[9px] text-slate-500 bg-linear-to-b from-indigo-50/20 to-indigo-50/40 border border-indigo-100 px-3 py-2 rounded-xl max-w-xs leading-normal">
              🛡️ **Direct Instant Transfers**: Guests can scan this QR code using any UPI app (GPay, PhonePe, Paytm) to instantly transfer directly to your designated bank account with zero middle commissions!
            </p>
          </div>

          {/* EasyStay App Subscription and month-by-month billing logs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-3xs space-y-4">
            <div className="w-full pb-2 border-b border-dashed border-slate-150 flex items-center justify-between text-slate-700 font-bold text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-620" />
                <span>My EasyStay App License</span>
              </span>
              {subscriptionStatus === 'active' && !subscriptionLedger.some(item => item.status === 'Pending') ? (
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-250 uppercase">
                  Active
                </span>
              ) : subscriptionStatus === 'suspended' ? (
                <span className="bg-rose-50 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded border border-rose-250 uppercase animate-pulse">
                  Suspended
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded border border-amber-250 uppercase animate-pulse">
                  Dues Pending
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Smartphone className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-slate-800">Month-by-Month App Hosting Status</p>
                  <p className="text-slate-500 leading-normal text-[11px]">
                    Your subscription billing history is logged here in real-time. For monthly renewals, complete your transfers directly to the admin.
                  </p>
                </div>
              </div>

              {/* Lists of billing cycles passed down from Admin */}
              <div className="space-y-2">
                {subscriptionLedger.length === 0 ? (
                  <div className="text-center py-5 text-[11px] text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-150">
                    No subscription cycles logged by Admin yet. Enjoy standard registration.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                    {subscriptionLedger.map((record) => (
                      <div key={record.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-slate-800 truncate text-[11px]">{record.monthKey}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SaaS Charge: ₹{record.amountBilled}</p>
                          {record.notes && (
                            <p className="text-[9px] text-slate-400 italic font-medium leading-none">"{record.notes}"</p>
                          )}
                        </div>
                        {record.status === 'Paid' ? (
                          <span className="shrink-0 flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                            <Check className="w-2.5 h-2.5" /> Paid
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-100">
                            <AlertCircle className="w-2.5 h-2.5" /> Pending
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing support reminder info block */}
              <div className="text-[10.5px] bg-indigo-50/50 border border-indigo-100/55 text-indigo-900 rounded-xl p-3 space-y-1">
                <p className="font-extrabold flex items-center gap-1 text-[11px]">
                  💬 Monthly SaaS Renewal Support
                </p>
                <p className="text-indigo-850 text-[10px] leading-relaxed">
                  Dues are directly transferred to your platform provider. Once verified, the Admin dashboard logs your receipts as <strong>PAID</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Quick SaaS Startup Checklist advice for business */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-3xs space-y-3">
            <div className="flex items-center gap-1.5">
              <BadgeAlert className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Landlord Business Strategy</span>
            </div>
            
            <h5 className="font-bold text-xs">How to make business with this app:</h5>
            
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex gap-2 items-start">
                <span className="p-0.5 bg-indigo-500/20 text-indigo-300 rounded-md font-mono font-bold leading-none shrink-0">1</span>
                <span>Customize this business profile page with your custom local PG Brand title and individual business UPI ID.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="p-0.5 bg-indigo-500/20 text-indigo-300 rounded-md font-mono font-bold leading-none shrink-0">2</span>
                <span>Share legal payment receipts directly with your friends via WhatsApp using the print-ready generator.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="p-0.5 bg-indigo-500/20 text-indigo-300 rounded-md font-mono font-bold leading-none shrink-0">3</span>
                <span>Collect 100% commissions-free rentals through fast direct-scans of the built-in UPI payment QR Code!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
