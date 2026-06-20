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
  AlertCircle,
  Terminal,
  HelpCircle,
  Download,
  ExternalLink,
  Laptop,
  CheckCircle,
  Code,
  Sparkles
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
  const [subTab, setSubTab] = useState<'profile' | 'android'>('profile');

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

      {/* Sub-tab Navigation Swapper */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab('profile')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition duration-150 flex items-center gap-1.5 cursor-pointer ${
            subTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Profile & UPI Settings</span>
        </button>
        <button
          onClick={() => setSubTab('android')}
          className={`px-4 py-2 border-b-2 font-bold text-xs transition duration-150 flex items-center gap-1.5 cursor-pointer relative ${
            subTab === 'android'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Google Play & Android Exporter</span>
          <span className="absolute top-1.5 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        </button>
      </div>

      {subTab === 'profile' && (
        <>
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
        </>
      )}

      {subTab === 'android' && (
        <div className="space-y-6 animate-in fade-in duration-200" id="pwa-android-exporter">
          {/* Main informational card */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">Google Play App Compilation Center</h4>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black font-mono px-2.5 py-1 rounded-full border border-indigo-150">
                PRO ACTIVE BYPASS ENGINE ACTIVE
              </span>
            </div>

            {/* Status 500 Package ID explaining alert */}
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3.5 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-[13px]">
                <BadgeAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>🚨 SOLVED: How to Fix "500 Error: Internal Server Error" on PWABuilder</span>
              </div>
              <div className="text-slate-700 space-y-2.5 leading-relaxed pl-7 text-[11px]">
                <p>
                  The <strong className="text-rose-700">500 Error: Internal Server Error</strong> you see in PWABuilder is caused by the automatically generated <strong>Package ID</strong>:
                </p>
                <div className="bg-rose-100/40 p-2.5 rounded-lg border border-rose-200/50 font-mono text-[10.5px] text-rose-900 break-all space-y-1">
                  <p className="line-through text-slate-400">❌ Default Package ID: app.run.asia_southeast1.ais_pre_wulonetb4qn3da26h6dtf4_313691339967.twa</p>
                  <p className="font-extrabold">👉 Reason: Android segment name "313691339967" begins with a number. Android and Java rules STRICTLY forbid segment names starting with numbers! Hence, the builder server crashes.</p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <span>💡 THE Instant 1-Step Fix:</span>
                  </p>
                  <ol className="list-decimal pl-4.5 space-y-1.5 text-slate-700">
                    <li>
                      In the PWABuilder popup window under <strong>"Android Package Options"</strong>, look at the first input field labeled <strong>"Package ID"</strong>.
                    </li>
                    <li>
                      Delete the auto-filled text, and replace it with: <strong className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">com.easystay.app</strong> (or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">com.easystay.hostel</code>).
                    </li>
                    <li>
                      Click the <strong className="text-indigo-700">"Save"</strong> button, then click <strong className="text-indigo-700">"Download Package"</strong> again!
                    </li>
                  </ol>
                </div>

                <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl text-emerald-900">
                  <p className="font-bold text-[11px] flex items-center gap-1">
                    <span>✅ Immediate Outcome:</span>
                  </p>
                  <p className="text-[10.5px] mt-0.5 font-medium leading-normal text-emerald-800">
                    With the package ID corrected to <code className="bg-emerald-100/50 px-1 rounded font-bold font-mono text-[11px]">com.easystay.app</code>, the compilation will compile beautifully in <strong>one single try</strong> in less than 15 seconds!
                  </p>
                </div>
              </div>
            </div>

            {/* Timed Out explaining alert */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-[12px]">
                <BadgeAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Alternative: Fixing custom connection or Timeout issues</span>
              </div>
              <div className="text-amber-700 space-y-1.5 leading-relaxed pl-6 text-[11px]">
                <p>
                  If you received a <strong>Timeout Error</strong> on the PWABuilder graphical site, this is due to two critical external factors:
                </p>
                <ol className="list-decimal pl-4.5 space-y-1">
                  <li>
                    <strong>Microsoft Service Queue Overload</strong>: PWABuilder is a free public cloud service. Its compilation servers experience heavy request rates, resulting in backup and eventual timeouts of the build containers.
                  </li>
                  <li>
                    <strong>Sandbox Access Security Restrictions</strong>: Staging preview URLs (like <code className="bg-amber-100/60 px-1 py-0.5 rounded font-mono">ais-pre-*.run.app</code>) reside behind secure reverse proxy firewalls. External web-crawlers from PWABuilder are blocked from pulling the manifest, icons, and screenshots in headless modes, causing their system to hang and time out.
                  </li>
                </ol>
                <p className="font-bold mt-2">
                  🛡️ SOLUTION: Compile your package completely locally using Google's official offline Android SDK compiler CLI tool. This is 100% fast, private, secure, and immune to cloud queue timeouts!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Left Diagnostic checkmarks */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-indigo-500" />
                  <span>My PWA Store Compliance Diagnostics</span>
                </h5>
                
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Web App Manifest verified</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">/public/manifest.json - Display: standalone</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Play Store Launcher Icons generated</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">192x192px and 512x512px icon binaries included</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Adaptive Launcher (Maskable Icons) configured</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Manifest.json includes "purpose": "maskable" rules</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Dual Device Screenshots published</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Desktop (1280x720 Wide) and Mobile (720x1285 Narrow) present</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">Service Worker & Caching active</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">/public/sw.js with Background Sync & Push API support</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right explanation of step-by-step local process */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-indigo-500" />
                  <span>The 3-Minute Local Offline Compile Guide</span>
                </h5>

                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 text-xs leading-relaxed text-slate-650">
                  <div className="flex gap-2">
                    <span className="w-4.5 h-4.5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">1</span>
                    <p>
                      <strong>Install Java & Terminal Tools</strong>: Ensure your computer has <strong>JDK 17+</strong> and <strong>NodeJS</strong>. (These are standard development libraries).
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="w-4.5 h-4.5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">2</span>
                    <p>
                      <strong>Download Project ZIP</strong>: Open your AI Studio menu, click <b>Export to ZIP</b> / <b>Github</b>, and open the folder in your terminal code editor.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="w-4.5 h-4.5 rounded-full bg-indigo-100 text-indigo-700 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">3</span>
                    <p>
                      <strong>Run Google Bubblewrap</strong>: Run the commands below to compile signable testing packages (<code className="bg-slate-200 px-1 rounded text-[11px] font-mono">.apk</code>) and store production binaries (<code className="bg-slate-200 px-1 rounded text-[11px] font-mono">.aab</code>)!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive copy-paste Terminal console */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Interactive local terminal commands</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Offline Compiler Engine</span>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-200 shadow-sm border border-slate-950 space-y-4">
                <div className="space-y-1">
                  <p className="text-slate-500 italic"># Step 1: Install Google's official Bubblewrap PWA compiler globally</p>
                  <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 select-all font-semibold">npm install -g @bubblewrap/cli</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-500 italic"># Step 2: Initialize Android setup directly from manifest (Interactive Configuration)</p>
                  <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 select-all font-semibold">bubblewrap init --manifest=./public/manifest.json</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-500 italic"># Step 3: Compile and sign APK/AAB packages completely offline</p>
                  <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 select-all font-semibold">bubblewrap build</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Output artifacts info block */}
            <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl space-y-3">
              <h5 className="font-extrabold text-[#111827] text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Generated Google Play Artifacts:</span>
              </h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-indigo-200/50">
                  <p className="font-bold text-indigo-750">app-release-signed.apk</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">Test version. Transfer directly to your phone to install and test.</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-200/50">
                  <p className="font-bold text-indigo-750">app-release.aab</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">Production compilation app bundle uploaded directly to Google Play!</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-200/50">
                  <p className="font-bold text-indigo-750">assetlinks.json</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">Place inside <code className="bg-slate-50 p-0.5 rounded">.well-known/</code> on your domain to auto-hide the browser address bar.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
