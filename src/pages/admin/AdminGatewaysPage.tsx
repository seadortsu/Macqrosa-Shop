import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useStoreSettings, GatewaySettings } from '../../context/StoreSettingsContext';

export const AdminGatewaysPage: React.FC = () => {
  const { adminToken } = useAuth();
  const { refreshSettings } = useStoreSettings();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gatewaySubTab, setGatewaySubTab] = useState<'payment' | 'email' | 'sms'>('payment');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Gateways Config State
  const [gatewaysForm, setGatewaysForm] = useState<GatewaySettings>({
    payment: {
      provider: 'paystack',
      paystackEnabled: true,
      paystackPublicKey: '',
      paystackSecretKey: '',
      paystackCurrency: 'USD',
      stripeEnabled: false,
      stripePublishableKey: '',
      stripeSecretKey: '',
      houseAccountEnabled: true
    },
    email: {
      provider: 'smtp',
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPass: '',
      senderEmail: '',
      senderName: 'Macqrosa Luxury Atelier',
      enableOrderConfirmation: true,
      enableShippingNotification: true
    },
    sms: {
      provider: 'arkesel',
      apiKey: '',
      senderId: 'MACQROSA',
      enabled: false,
      notifyOnOrder: true,
      notifyOnDispatch: true
    }
  });

  // Test Gateway Actions State
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const [testSmsPhone, setTestSmsPhone] = useState('');
  const [testSmsStatus, setTestSmsStatus] = useState('');
  const [isTestingSms, setIsTestingSms] = useState(false);

  const loadLiveSettings = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/settings/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.gateways_config) setGatewaysForm(data.gateways_config);
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
    }
  };

  useEffect(() => {
    loadLiveSettings();
  }, [adminToken]);

  const handleSaveSection = async (sectionKey: string, payloadData: any) => {
    if (!adminToken) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          section: sectionKey,
          data: payloadData
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        await refreshSettings();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save settings.');
      }
    } catch (err) {
      setErrorMessage('Network error while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Test Email Gateway
  const handleTestEmail = async () => {
    if (!adminToken) return;
    setIsTestingEmail(true);
    setTestEmailStatus('');
    try {
      const res = await fetch('/api/settings/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          recipient: testEmailRecipient,
          smtpHost: gatewaysForm.email.smtpHost,
          smtpPort: gatewaysForm.email.smtpPort,
          smtpUser: gatewaysForm.email.smtpUser,
          smtpPass: gatewaysForm.email.smtpPass,
          senderEmail: gatewaysForm.email.senderEmail,
          senderName: gatewaysForm.email.senderName
        })
      });
      const data = await res.json();
      setTestEmailStatus(data.message || (res.ok ? 'Verification complete.' : 'Test failed.'));
    } catch (err) {
      setTestEmailStatus('Network request failed.');
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Test SMS Gateway
  const handleTestSms = async () => {
    if (!adminToken || !testSmsPhone) {
      alert('Please enter a test phone number.');
      return;
    }
    setIsTestingSms(true);
    setTestSmsStatus('');
    try {
      const res = await fetch('/api/settings/admin/test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          provider: gatewaysForm.sms.provider,
          apiKey: gatewaysForm.sms.apiKey,
          senderId: gatewaysForm.sms.senderId,
          recipientPhone: testSmsPhone
        })
      });
      const data = await res.json();
      setTestSmsStatus(data.message || 'SMS test triggered.');
    } catch {
      setTestSmsStatus('Failed to send test SMS.');
    } finally {
      setIsTestingSms(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : ''}`}>
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6 pt-24 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-6 border-b border-surface-container mb-8">
            <div>
              <h1 className="text-2xl font-serif text-primary">System Gateways</h1>
              <p className="text-sm text-on-surface-variant mt-1">Configure payment processors, SMTP email, and SMS notifications.</p>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 animate-fade-in">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Configuration Saved</span>
                </div>
              )}
              {errorMessage && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                  <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex flex-wrap items-center gap-2 mb-8 bg-surface-container-lowest p-1.5 rounded-xl border border-surface-container shadow-sm">
            <button
              onClick={() => setGatewaySubTab('payment')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                gatewaySubTab === 'payment'
                  ? 'bg-primary text-secondary-gold shadow-md'
                  : 'text-on-surface hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
              <span className="hidden sm:inline">Payment Routing</span>
            </button>
            <button
              onClick={() => setGatewaySubTab('email')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                gatewaySubTab === 'email'
                  ? 'bg-primary text-secondary-gold shadow-md'
                  : 'text-on-surface hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span className="hidden sm:inline">SMTP Dispatch</span>
            </button>
            <button
              onClick={() => setGatewaySubTab('sms')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                gatewaySubTab === 'sms'
                  ? 'bg-primary text-secondary-gold shadow-md'
                  : 'text-on-surface hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">sms</span>
              <span className="hidden sm:inline">SMS Network</span>
            </button>
          </div>

          <div className="animate-fade-in space-y-8">
            {/* 1: PAYMENT GATEWAYS */}
            {gatewaySubTab === 'payment' && (
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-8">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                  <div>
                    <h2 className="font-serif text-xl text-primary font-medium">Payment Infrastructure</h2>
                    <p className="text-xs text-on-surface-variant font-light mt-0.5">
                      Configure active payment processors and regional settlement currencies.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSaveSection('gateways_config', gatewaysForm)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isSaving ? 'Saving...' : 'Save Payment Config'}</span>
                  </button>
                </div>

                {/* Primary Provider */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-2">Primary Global Processor</label>
                  <select
                    value={gatewaysForm.payment.provider}
                    onChange={e => setGatewaysForm(prev => ({
                      ...prev,
                      payment: { ...prev.payment, provider: e.target.value as 'paystack' | 'stripe' }
                    }))}
                    className="w-full sm:w-96 px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-lg text-sm text-primary font-medium focus:ring-1 focus:ring-secondary-gold focus:outline-none"
                  >
                    <option value="paystack">Paystack (Africa &amp; Global)</option>
                    <option value="stripe">Stripe (US &amp; Europe)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Paystack Panel */}
                  <div className={`p-5 rounded-xl border transition-all ${
                    gatewaysForm.payment.provider === 'paystack' 
                      ? 'border-secondary-gold bg-secondary-gold/5 ring-1 ring-secondary-gold/50' 
                      : 'border-surface-container bg-surface-container-lowest opacity-75 grayscale'
                  }`}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm uppercase tracking-wider text-primary font-bold">Paystack Credentials</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gatewaysForm.payment.paystackEnabled}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paystackEnabled: e.target.checked }
                          }))}
                          className="w-4 h-4 accent-secondary-gold rounded"
                        />
                        <span className="text-xs font-semibold text-primary">Active</span>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Public Key</label>
                        <input
                          type="text"
                          value={gatewaysForm.payment.paystackPublicKey}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paystackPublicKey: e.target.value }
                          }))}
                          placeholder="pk_test_..."
                          className="w-full px-3 py-2 bg-background border border-surface-container rounded text-sm font-mono text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Secret Key</label>
                        <input
                          type="password"
                          value={gatewaysForm.payment.paystackSecretKey}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paystackSecretKey: e.target.value }
                          }))}
                          placeholder="sk_test_..."
                          className="w-full px-3 py-2 bg-background border border-surface-container rounded text-sm font-mono text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Settlement Currency</label>
                        <select
                          value={gatewaysForm.payment.paystackCurrency}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paystackCurrency: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-background border border-surface-container rounded text-sm text-primary"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="GHS">GHS - Ghana Cedi</option>
                          <option value="NGN">NGN - Nigerian Naira</option>
                          <option value="ZAR">ZAR - South African Rand</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Panel */}
                  <div className={`p-5 rounded-xl border transition-all ${
                    gatewaysForm.payment.provider === 'stripe' 
                      ? 'border-secondary-gold bg-secondary-gold/5 ring-1 ring-secondary-gold/50' 
                      : 'border-surface-container bg-surface-container-lowest opacity-75 grayscale'
                  }`}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm uppercase tracking-wider text-primary font-bold">Stripe Credentials</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gatewaysForm.payment.stripeEnabled}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, stripeEnabled: e.target.checked }
                          }))}
                          className="w-4 h-4 accent-secondary-gold rounded"
                        />
                        <span className="text-xs font-semibold text-primary">Active</span>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Publishable Key</label>
                        <input
                          type="text"
                          value={gatewaysForm.payment.stripePublishableKey}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, stripePublishableKey: e.target.value }
                          }))}
                          placeholder="pk_test_..."
                          className="w-full px-3 py-2 bg-background border border-surface-container rounded text-sm font-mono text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Secret Key</label>
                        <input
                          type="password"
                          value={gatewaysForm.payment.stripeSecretKey}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, stripeSecretKey: e.target.value }
                          }))}
                          placeholder="sk_test_..."
                          className="w-full px-3 py-2 bg-background border border-surface-container rounded text-sm font-mono text-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Payment Methods */}
                <div className="pt-6 border-t border-surface-container">
                  <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-4">Alternative Tenders</h3>
                  <label className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-surface-container cursor-pointer hover:border-secondary transition-colors">
                    <div>
                      <span className="text-sm font-semibold text-primary block">House Account / VIP Credit</span>
                      <span className="text-xs text-on-surface-variant font-light">Allow approved VIP clients to checkout using their house credit ledger.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={gatewaysForm.payment.houseAccountEnabled}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        payment: { ...prev.payment, houseAccountEnabled: e.target.checked }
                      }))}
                      className="w-5 h-5 accent-secondary-gold rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 2: EMAIL / SMTP GATEWAY */}
            {gatewaySubTab === 'email' && (
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                  <div>
                    <h2 className="font-serif text-xl text-primary font-medium">SMTP Mailing Infrastructure</h2>
                    <p className="text-xs text-on-surface-variant font-light mt-0.5">
                      Configure outgoing server for automated transactional receipts, tracking, and atelier correspondence.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSaveSection('gateways_config', gatewaysForm)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isSaving ? 'Saving...' : 'Save SMTP Config'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-surface-container-low rounded border border-surface-container cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gatewaysForm.email.enableOrderConfirmation}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        email: { ...prev.email, enableOrderConfirmation: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-secondary-gold rounded"
                    />
                    <span className="text-xs font-medium text-primary">Dispatch Order Receipts</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-surface-container-low rounded border border-surface-container cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gatewaysForm.email.enableShippingNotification}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        email: { ...prev.email, enableShippingNotification: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-secondary-gold rounded"
                    />
                    <span className="text-xs font-medium text-primary">Dispatch Tracking/Courier Updates</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">SMTP Host Server</label>
                    <input
                      type="text"
                      value={gatewaysForm.email.smtpHost}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        email: { ...prev.email, smtpHost: e.target.value }
                      }))}
                      placeholder="smtp.example.com"
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">SMTP Port</label>
                    <input
                      type="text"
                      value={gatewaysForm.email.smtpPort}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        email: { ...prev.email, smtpPort: e.target.value }
                      }))}
                      placeholder="587 or 465"
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">SMTP Username / Auth User</label>
                    <input
                      type="text"
                      value={gatewaysForm.email.smtpUser}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        email: { ...prev.email, smtpUser: e.target.value }
                      }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">SMTP Password / API Key</label>
                    <input
                      type="password"
                      value={gatewaysForm.email.smtpPass}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        email: { ...prev.email, smtpPass: e.target.value }
                      }))}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Sender Display Name</label>
                    <input
                      type="text"
                      value={gatewaysForm.email.senderName}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        email: { ...prev.email, senderName: e.target.value }
                      }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">From Email Address</label>
                    <input
                      type="email"
                      value={gatewaysForm.email.senderEmail}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        email: { ...prev.email, senderEmail: e.target.value }
                      }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                </div>

                {/* Test Dispatch Box */}
                <div className="p-4 rounded-xl border border-secondary/20 bg-surface-container-low">
                  <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Test Gateway Connection</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Enter recipient email address..."
                      value={testEmailRecipient}
                      onChange={e => setTestEmailRecipient(e.target.value)}
                      className="flex-1 px-4 py-2 bg-surface-container-lowest border border-surface-container rounded text-sm text-primary"
                    />
                    <button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={isTestingEmail}
                      className="px-5 py-2 bg-secondary-gold text-primary font-semibold text-xs uppercase tracking-wider rounded shadow-sm hover:bg-white transition-all disabled:opacity-50"
                    >
                      {isTestingEmail ? 'Verifying...' : 'Send Test Email'}
                    </button>
                  </div>
                  {testEmailStatus && (
                    <p className="text-xs mt-2 text-primary font-medium">{testEmailStatus}</p>
                  )}
                </div>
              </div>
            )}

            {/* 3: SMS NOTIFICATION GATEWAY */}
            {gatewaySubTab === 'sms' && (
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                  <div>
                    <h2 className="font-serif text-xl text-primary font-medium">SMS Notification Gateway</h2>
                    <p className="text-xs text-on-surface-variant font-light mt-0.5">
                      Configure instant SMS dispatch for order tracking, courier alerts, and VIP concierge invitations.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSaveSection('gateways_config', gatewaysForm)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isSaving ? 'Saving...' : 'Save SMS Gateway'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">SMS Provider</label>
                    <select
                      value={gatewaysForm.sms.provider}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        sms: { ...prev.sms, provider: e.target.value }
                      }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    >
                      <option value="arkesel">Arkesel (Africa / Fast Delivery)</option>
                      <option value="twilio">Twilio (Global Telecom)</option>
                      <option value="termii">Termii (West Africa Verification)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Sender ID (Max 11 Chars)</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={gatewaysForm.sms.senderId}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        sms: { ...prev.sms, senderId: e.target.value }
                      }))}
                      placeholder="MACQROSA"
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">SMS Status</label>
                    <label className="flex items-center gap-2 p-2 bg-surface-container-low rounded border border-surface-container cursor-pointer mt-0.5">
                      <input
                        type="checkbox"
                        checked={gatewaysForm.sms.enabled}
                        onChange={e => setGatewaysForm(prev => ({
                          ...prev,
                          sms: { ...prev.sms, enabled: e.target.checked }
                        }))}
                        className="w-4 h-4 accent-secondary-gold rounded"
                      />
                      <span className="text-xs font-semibold text-primary">SMS Gateway Active</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">API Key / Secret Token</label>
                  <input
                    type="password"
                    value={gatewaysForm.sms.apiKey}
                    onChange={e => setGatewaysForm(prev => ({
                      ...prev,
                      sms: { ...prev.sms, apiKey: e.target.value }
                    }))}
                    placeholder="Enter provider API secret key..."
                    className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-surface-container-low rounded border border-surface-container cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gatewaysForm.sms.notifyOnOrder}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        sms: { ...prev.sms, notifyOnOrder: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-secondary-gold rounded"
                    />
                    <span className="text-xs font-medium text-primary">Send Order Placement Receipt via SMS</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-surface-container-low rounded border border-surface-container cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gatewaysForm.sms.notifyOnDispatch}
                      onChange={e => setGatewaysForm(prev => ({
                        ...prev,
                        sms: { ...prev.sms, notifyOnDispatch: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-secondary-gold rounded"
                    />
                    <span className="text-xs font-medium text-primary">Send Courier Tracking &amp; Dispatch SMS</span>
                  </label>
                </div>

                {/* Test SMS */}
                <div className="p-4 rounded-xl border border-secondary/20 bg-surface-container-low">
                  <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Test SMS Dispatch</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="tel"
                      placeholder="e.g. +233551234567 or +15551234567"
                      value={testSmsPhone}
                      onChange={e => setTestSmsPhone(e.target.value)}
                      className="flex-1 px-4 py-2 bg-surface-container-lowest border border-surface-container rounded text-sm text-primary"
                    />
                    <button
                      type="button"
                      onClick={handleTestSms}
                      disabled={isTestingSms}
                      className="px-5 py-2 bg-secondary-gold text-primary font-semibold text-xs uppercase tracking-wider rounded shadow-sm hover:bg-white transition-all disabled:opacity-50"
                    >
                      {isTestingSms ? 'Sending...' : 'Send Test SMS'}
                    </button>
                  </div>
                  {testSmsStatus && (
                    <p className="text-xs mt-2 text-primary font-medium">{testSmsStatus}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
