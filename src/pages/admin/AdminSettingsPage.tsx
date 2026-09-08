import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import {
  useStoreSettings,
  StoreSettings,
  HomepageCms,
  ThemeConfig,
  FooterConfig,
  SystemAlert,
  AdminWorkspace,
  GatewaySettings
} from '../../context/StoreSettingsContext';

interface PromoCodeItem {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend: number;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: number;
  created_at: string;
}

interface StaffUserItem {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export const AdminSettingsPage: React.FC = () => {
  const { admin, adminToken, updateAdminProfile } = useAuth();
  const { refreshSettings, updateThemeColors } = useStoreSettings();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  // 4 Focused Tabs
  const [activeTab, setActiveTab] = useState<'storefront' | 'commerce' | 'gateways' | 'team'>('storefront');
  const [storefrontSubTab, setStorefrontSubTab] = useState<'hero' | 'theme' | 'footer' | 'alerts'>('hero');
  const [gatewaySubTab, setGatewaySubTab] = useState<'payment' | 'email' | 'sms'>('payment');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Store & Commerce State
  const [storeForm, setStoreForm] = useState<StoreSettings>({
    storeName: 'Macqrosa',
    tagline: 'Haute Parfumerie & Cosmétiques',
    contactEmail: 'support@macqrosa.com',
    contactPhone: '+33 1 42 60 00 00',
    currency: 'USD',
    timezone: 'America/New_York',
    address: '15 Place Vendôme',
    city: 'Paris',
    country: 'France',
    freeShippingThreshold: 150,
    standardShippingFee: 15,
    taxRate: 8.5,
    enableReviews: true,
    enableWishlist: true,
    enableGuestCheckout: false,
    maintenanceMode: false,
    lowStockThreshold: 10,
    orderPrefix: 'MQ',
  });

  // 2. Homepage CMS State
  const [cmsForm, setCmsForm] = useState<HomepageCms>({
    heroBadge: 'Harper’s Bazaar Luxury Icons Winner • Best Miracle Face Oil',
    heroTitle: 'L’Éclat d’Or:',
    heroSubtitle: 'The 24K Radiant Youth Infusion',
    heroDescription: 'Sculpted with rare French alpine bio-actives and pure 24-karat colloidal gold suspension. Engineered for an indelible, skin-whispered radiance that transcends time.',
    heroBannerImage: '/images/hero/hero_banner.jpg',
    primaryCtaText: 'Explore The Collection',
    primaryCtaLink: '/catalog',
    secondaryCtaText: 'Book Atelier Consultation',
    metric1Val: '99.4%',
    metric1Lbl: 'Cellular Luminosity',
    metric2Val: '24K',
    metric2Lbl: 'Colloidal Gold Core',
    metric3Val: 'Grasse',
    metric3Lbl: 'Harvest Extraction',
    brandStorySubtitle: 'Place Vendôme Laboratory',
    brandStoryTitle: 'Where Ancient Alchemy Meets French Phyto-Chemistry',
    brandStoryDescription: 'Founded in Paris, Macqrosa pioneers the fusion of cold-plasma botanical extracts with suspended 24-karat colloidal bio-gold. Our clean, clinical formulas are certified cruelty-free and engineered without synthetic parabens, phthalates, or microplastics.',
    brandStoryImage: 'https://lh3.googleusercontent.com/aida/AEtjO1VDjASZU-mDV00ion1vG2kC1WzPrAssBdNCXOoQH7xCWD2h9oRVIeeIul8cKcYv5qWzDF7CQ-yE6LkfYZckclPZK2a7IbBr1t-_QuW2lW_WMBGy9ejBnqlmtXN0bWF_JE-jAZGvQiwCkdvQhq5ny2Wl5JVc2fXwE59TCg43JEqGVp_uoYcrSkgyKNJxw9xRKRFwaODTxsSs-Xn4wXfQdQL9pW7BKfXaS1zJawzbKCiX1svmwMO1aA6rSjZI',
    brandStoryQuote: 'An indelible, candlelit radiance that awakens tired complexions from the very first application.',
    brandStoryQuoteAuthor: 'Verified Efficacy',
    services: [
      { title: 'White Glove Courier', desc: 'Complimentary climate-controlled transit', icon: 'local_shipping' },
      { title: 'Signature Gold Boxing', desc: 'Sealed with Place Vendôme wax emblem', icon: 'featured_seasonal_and_gifts' },
      { title: 'Deluxe Ritual Samples', desc: '3 tailored miniature flacons per order', icon: 'science' },
      { title: 'Bespoke Monogramming', desc: 'Diamond-point flacon engraving', icon: 'history_edu' }
    ]
  });

  // 3. Theme & Colors State
  const [themeForm, setThemeForm] = useState<ThemeConfig>({
    preset: 'champagne_gold',
    primaryColor: '#181615',
    secondaryColor: '#C5A059',
    accentGlow: '#FEF9E7',
    bannerBg: '#181615',
    bannerText: '#FFFFFF',
    announcementText: 'Free shipping on orders over $150 — Use code LUMIERE for 15% VIP Maison discount',
    fontHeading: 'Bodoni Moda',
    fontBody: 'Hanken Grotesk'
  });

  // 4. Footer & Concierge State
  const [footerForm, setFooterForm] = useState<FooterConfig>({
    email: 'concierge@macqrosa.com',
    phone: '+33 1 42 60 00 00',
    address: '15 Place Vendôme, 75001 Paris, France',
    hours: 'Mon–Sat: 10:00 – 19:00 CET',
    instagram: '@macqrosaparis',
    facebook: 'macqrosaparis',
    twitter: '@macqrosa'
  });

  // 5. Broadcast Alerts State
  const [alertForm, setAlertForm] = useState<SystemAlert>({
    enabled: false,
    type: 'info',
    message: 'Maison Announcement: Complimentary 24K Miniature with all orders over $200 today.',
    linkText: 'Explore Gifts',
    linkUrl: '/catalog'
  });

  // 6. Gateways Config State
  const [gatewaysForm, setGatewaysForm] = useState<GatewaySettings>({
    payment: {
      provider: 'paystack',
      paystackEnabled: true,
      paystackPublicKey: 'pk_test_sample_macqrosa_2026',
      paystackSecretKey: 'sk_test_sample_macqrosa_2026',
      paystackCurrency: 'USD',
      stripeEnabled: false,
      stripePublishableKey: '',
      stripeSecretKey: '',
      houseAccountEnabled: true
    },
    email: {
      provider: 'smtp',
      smtpHost: 'smtp.macqrosa.com',
      smtpPort: '587',
      smtpUser: 'concierge@macqrosa.com',
      smtpPass: '',
      senderEmail: 'concierge@macqrosa.com',
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

  // 7. Workspace State
  const [workspaceForm, setWorkspaceForm] = useState<AdminWorkspace>({
    tableDensity: 'relaxed',
    accentColor: '#C5A059',
    showKpiRevenue: true,
    showKpiOrders: true,
    showKpiAov: true,
    showKpiConversion: true
  });

  // Promos & Staff State
  const [promos, setPromos] = useState<PromoCodeItem[]>([]);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeItem | null>(null);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 15,
    min_spend: 0,
    expires_at: '',
    max_uses: '',
    is_active: true
  });

  const [staffUsers, setStaffUsers] = useState<StaffUserItem[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'store_manager'
  });

  // Admin Profile State
  const [adminProfileForm, setAdminProfileForm] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    currentPassword: '',
    newPassword: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    if (admin) {
      setAdminProfileForm(prev => ({
        ...prev,
        name: admin.name,
        email: admin.email
      }));
    }
  }, [admin]);

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage('');
    
    // Check if we are updating password or just details
    if (adminProfileForm.currentPassword || adminProfileForm.newPassword) {
      if (!adminProfileForm.currentPassword || !adminProfileForm.newPassword) {
        setProfileMessage('Both current and new password are required to change password.');
        setIsSavingProfile(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/admin/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            currentPassword: adminProfileForm.currentPassword,
            newPassword: adminProfileForm.newPassword
          })
        });
        const data = await res.json();
        if (res.ok) {
          setProfileMessage('Password updated successfully.');
          setAdminProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        } else {
          setProfileMessage(data.error || 'Failed to update password.');
          setIsSavingProfile(false);
          return;
        }
      } catch {
        setProfileMessage('Error updating password.');
        setIsSavingProfile(false);
        return;
      }
    }

    const { success, error } = await updateAdminProfile({
      name: adminProfileForm.name,
      email: adminProfileForm.email
    });
    
    if (!success) {
      setProfileMessage(prev => prev ? `${prev} | ${error}` : (error || 'Failed to update details.'));
    } else {
      setProfileMessage(prev => prev ? `${prev} | Profile details updated.` : 'Profile details updated successfully.');
    }
    
    setIsSavingProfile(false);
    setTimeout(() => setProfileMessage(''), 4000);
  };

  // Test Gateway Actions State
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const [testSmsPhone, setTestSmsPhone] = useState('');
  const [testSmsStatus, setTestSmsStatus] = useState('');
  const [isTestingSms, setIsTestingSms] = useState(false);

  // Load all live settings
  const loadLiveSettings = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/settings/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.store_settings) setStoreForm(data.store_settings);
        if (data.homepage_cms) setCmsForm(data.homepage_cms);
        if (data.theme_config) setThemeForm(data.theme_config);
        if (data.footer_config) setFooterForm(data.footer_config);
        if (data.system_alerts) setAlertForm(data.system_alerts);
        if (data.admin_workspace) setWorkspaceForm(data.admin_workspace);
        if (data.gateways_config) setGatewaysForm(data.gateways_config);
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
    }
  };

  const loadPromos = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/promos/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPromos(data);
      }
    } catch (err) {
      console.error('Error loading promos:', err);
    }
  };

  const loadStaff = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStaffUsers(data);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  };

  useEffect(() => {
    loadLiveSettings();
    loadPromos();
    loadStaff();
  }, [adminToken]);

  // Save current active tab settings to database
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

  // Theme Presets
  const themePresets = [
    {
      id: 'champagne_gold',
      name: 'Place Vendôme Gold',
      subtitle: 'Signature Champagne & Obsidian',
      primary: '#181615',
      secondary: '#C5A059',
      accent: '#FEF9E7',
      bannerBg: '#181615',
      bannerText: '#FFFFFF'
    },
    {
      id: 'rose_gold',
      name: 'Rose Gold Éclat',
      subtitle: 'Grasse Rose Petal & Bronze',
      primary: '#1C1517',
      secondary: '#B85C66',
      accent: '#FBF0F2',
      bannerBg: '#2D191E',
      bannerText: '#FCE7EA'
    },
    {
      id: 'royal_emerald',
      name: 'Royal Emerald Jardin',
      subtitle: 'Botanical Velvet & Gold Alchemy',
      primary: '#0D1A14',
      secondary: '#2E7D5D',
      accent: '#E8F5E9',
      bannerBg: '#0A1C14',
      bannerText: '#E6F4EA'
    },
    {
      id: 'noir_atelier',
      name: 'Obsidian Noir Minimal',
      subtitle: 'Ultra High-Contrast Editorial',
      primary: '#0A0A0A',
      secondary: '#D4AF37',
      accent: '#FFFFFF',
      bannerBg: '#000000',
      bannerText: '#D4AF37'
    }
  ];

  const applyPreset = (p: typeof themePresets[0]) => {
    const updated: ThemeConfig = {
      ...themeForm,
      preset: p.id,
      primaryColor: p.primary,
      secondaryColor: p.secondary,
      accentGlow: p.accent,
      bannerBg: p.bannerBg,
      bannerText: p.bannerText
    };
    setThemeForm(updated);
    updateThemeColors(p.primary, p.secondary);
  };

  // Promo Code handlers
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    try {
      const url = editingPromo ? `/api/promos/admin/${editingPromo.id}` : '/api/promos/admin';
      const method = editingPromo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...promoForm,
          max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
          expires_at: promoForm.expires_at || null
        })
      });

      if (res.ok) {
        setIsPromoModalOpen(false);
        setEditingPromo(null);
        await loadPromos();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save promo code.');
      }
    } catch {
      alert('Error saving promo.');
    }
  };

  const handleTogglePromo = async (promo: PromoCodeItem) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/promos/admin/${promo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ is_active: promo.is_active === 1 ? 0 : 1 })
      });
      if (res.ok) await loadPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePromo = async (id: number) => {
    if (!adminToken || !confirm('Delete this privilege code?')) return;
    try {
      const res = await fetch(`/api/promos/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) await loadPromos();
    } catch (err) {
      console.error(err);
    }
  };

  // Staff handlers
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(staffForm)
      });

      if (res.ok) {
        setIsStaffModalOpen(false);
        setStaffForm({ name: '', email: '', password: '', role: 'store_manager' });
        await loadStaff();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create staff account.');
      }
    } catch {
      alert('Error creating staff account.');
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!adminToken || !confirm('Revoke staff credentials?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) await loadStaff();
      else {
        const err = await res.json();
        alert(err.error || 'Cannot delete account.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export CSV
  const handleExport = (resource: string) => {
    if (!adminToken) return;
    fetch(`/api/settings/admin/export/${resource}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `macqrosa_${resource}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => alert('Export failed.'));
  };

  // The 4 Streamlined Tabs
  const mainTabs = [
    { id: 'storefront', label: 'Storefront & Experience', icon: 'palette', desc: 'Hero CMS, theme palettes, alerts & concierge' },
    { id: 'commerce', label: 'Commerce & Promotions', icon: 'storefront', desc: 'Taxes, shipping fees, currency & promo codes' },
    { id: 'gateways', label: 'Gateways & Integrations', icon: 'hub', desc: 'Payment processors, SMTP email & SMS dispatch' },
    { id: 'team', label: 'Team & Workspace', icon: 'badge', desc: 'Staff access, layout density, CSV exports & maintenance' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-72 transition-all duration-300">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          searchPlaceholder="Search atelier customization controls..."
        />

        <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-16 max-w-6xl mx-auto">
          {/* Main Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-6 border-b border-surface-container mb-8">
            <div>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 animate-fade-in">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Changes Deployed Live</span>
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

          {/* 4 Categorized Master Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {mainTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  activeTab === t.id
                    ? 'bg-primary text-secondary-gold border-secondary-gold shadow-md ring-1 ring-secondary-gold/40'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container-low border-surface-container'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                  <span className="font-serif text-sm font-semibold tracking-wide">
                    {t.label}
                  </span>
                </div>
                <p className={`text-[11px] font-light line-clamp-1 ${activeTab === t.id ? 'text-neutral-300' : 'text-on-surface-variant'}`}>
                  {t.desc}
                </p>
              </button>
            ))}
          </div>

          {/* =========================================================================
              CATEGORY 1: STOREFRONT & BRANDING
             ========================================================================= */}
          {activeTab === 'storefront' && (
            <div className="space-y-6 animate-fade-in">
              {/* Secondary Sub-Navigation Pill Bar */}
              <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-lg border border-surface-container w-fit">
                {[
                  { id: 'hero', label: 'Hero & Headlines', icon: 'auto_stories' },
                  { id: 'theme', label: 'Palettes & Colors', icon: 'palette' },
                  { id: 'alerts', label: 'Broadcast Alerts', icon: 'campaign' },
                  { id: 'footer', label: 'Concierge & Footer', icon: 'support_agent' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setStorefrontSubTab(sub.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      storefrontSubTab === sub.id
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{sub.icon}</span>
                    <span>{sub.label}</span>
                  </button>
                ))}
              </div>

              {/* Sub-tab: Hero & CMS */}
              {storefrontSubTab === 'hero' && (
                <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                    <div>
                      <h2 className="font-serif text-xl text-primary font-medium">Hero Stage &amp; Campaign Narratives</h2>
                      <p className="text-xs text-on-surface-variant font-light mt-0.5">Customize storefront homepage headlines, background image, and CTAs.</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('homepage_cms', cmsForm)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>{isSaving ? 'Saving...' : 'Save CMS Content'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Award Badge Text</label>
                    <input
                      type="text"
                      value={cmsForm.heroBadge}
                      onChange={e => setCmsForm(prev => ({ ...prev, heroBadge: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Hero Headline</label>
                      <input
                        type="text"
                        value={cmsForm.heroTitle}
                        onChange={e => setCmsForm(prev => ({ ...prev, heroTitle: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Hero Italic Subtitle</label>
                      <input
                        type="text"
                        value={cmsForm.heroSubtitle}
                        onChange={e => setCmsForm(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Narrative Description</label>
                    <textarea
                      rows={3}
                      value={cmsForm.heroDescription}
                      onChange={e => setCmsForm(prev => ({ ...prev, heroDescription: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Hero Background Image</label>
                      <input
                        type="text"
                        value={cmsForm.heroBannerImage}
                        onChange={e => setCmsForm(prev => ({ ...prev, heroBannerImage: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Primary CTA Button</label>
                      <input
                        type="text"
                        value={cmsForm.primaryCtaText}
                        onChange={e => setCmsForm(prev => ({ ...prev, primaryCtaText: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Secondary CTA Button</label>
                      <input
                        type="text"
                        value={cmsForm.secondaryCtaText}
                        onChange={e => setCmsForm(prev => ({ ...prev, secondaryCtaText: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>

                  {/* 3 Metrics */}
                  <div className="pt-4 border-t border-surface-container">
                    <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">3-Pillar Formulation Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { val: cmsForm.metric1Val, lbl: cmsForm.metric1Lbl, vKey: 'metric1Val', lKey: 'metric1Lbl' },
                        { val: cmsForm.metric2Val, lbl: cmsForm.metric2Lbl, vKey: 'metric2Val', lKey: 'metric2Lbl' },
                        { val: cmsForm.metric3Val, lbl: cmsForm.metric3Lbl, vKey: 'metric3Val', lKey: 'metric3Lbl' }
                      ].map((m, idx) => (
                        <div key={idx} className="p-3 bg-surface-container-low rounded-lg border border-surface-container">
                          <input
                            type="text"
                            value={m.val}
                            onChange={e => setCmsForm(prev => ({ ...prev, [m.vKey]: e.target.value }))}
                            className="w-full px-3 py-1.5 mb-2 bg-surface-container-lowest border border-surface-container rounded text-sm font-serif text-primary"
                          />
                          <input
                            type="text"
                            value={m.lbl}
                            onChange={e => setCmsForm(prev => ({ ...prev, [m.lKey]: e.target.value }))}
                            className="w-full px-3 py-1.5 bg-surface-container-lowest border border-surface-container rounded text-xs text-on-surface-variant"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brand Philosophy */}
                  <div className="pt-4 border-t border-surface-container">
                    <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Brand Story &amp; Atelier Laboratory</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Story Title</label>
                        <input
                          type="text"
                          value={cmsForm.brandStoryTitle}
                          onChange={e => setCmsForm(prev => ({ ...prev, brandStoryTitle: e.target.value }))}
                          className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary mb-3"
                        />
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Narrative Content</label>
                        <textarea
                          rows={3}
                          value={cmsForm.brandStoryDescription}
                          onChange={e => setCmsForm(prev => ({ ...prev, brandStoryDescription: e.target.value }))}
                          className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Atelier Image URL</label>
                        <input
                          type="text"
                          value={cmsForm.brandStoryImage}
                          onChange={e => setCmsForm(prev => ({ ...prev, brandStoryImage: e.target.value }))}
                          className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary mb-3"
                        />
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Verified Efficacy Quote</label>
                        <textarea
                          rows={2}
                          value={cmsForm.brandStoryQuote}
                          onChange={e => setCmsForm(prev => ({ ...prev, brandStoryQuote: e.target.value }))}
                          className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary mb-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: Theme & Colors */}
              {storefrontSubTab === 'theme' && (
                <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                    <div>
                      <h2 className="font-serif text-xl text-primary font-medium">Visual Branding &amp; Luxury Palettes</h2>
                      <p className="text-xs text-on-surface-variant font-light mt-0.5">Switch seasonal color palettes or specify custom brand hex codes.</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('theme_config', themeForm)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">palette</span>
                      <span>{isSaving ? 'Deploying...' : 'Deploy Theme'}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Curated Palettes</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {themePresets.map(p => (
                        <div
                          key={p.id}
                          onClick={() => applyPreset(p)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            themeForm.preset === p.id
                              ? 'border-secondary-gold bg-secondary-gold/5 shadow-gold-sm ring-1 ring-secondary-gold'
                              : 'border-surface-container bg-surface-container-low hover:border-secondary/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: p.primary }} />
                            <span className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: p.secondary }} />
                            <span className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: p.bannerBg }} />
                          </div>
                          <h4 className="font-serif text-sm font-semibold text-primary">{p.name}</h4>
                          <p className="text-[11px] text-on-surface-variant font-light mt-0.5">{p.subtitle}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-surface-container">
                    <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Custom Hex Codes</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Primary Obsidian', val: themeForm.primaryColor, key: 'primaryColor', sync: true },
                        { label: 'Secondary Gold', val: themeForm.secondaryColor, key: 'secondaryColor', sync: true },
                        { label: 'Banner Background', val: themeForm.bannerBg, key: 'bannerBg', sync: false },
                        { label: 'Banner Text', val: themeForm.bannerText, key: 'bannerText', sync: false }
                      ].map(c => (
                        <div key={c.key}>
                          <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1.5">{c.label}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={c.val}
                              onChange={e => {
                                setThemeForm(prev => ({ ...prev, [c.key]: e.target.value }));
                                if (c.sync) {
                                  if (c.key === 'primaryColor') updateThemeColors(e.target.value, themeForm.secondaryColor);
                                  else updateThemeColors(themeForm.primaryColor, e.target.value);
                                }
                              }}
                              className="w-9 h-9 rounded border border-surface-container p-0.5 cursor-pointer bg-transparent"
                            />
                            <input
                              type="text"
                              value={c.val}
                              onChange={e => {
                                setThemeForm(prev => ({ ...prev, [c.key]: e.target.value }));
                                if (c.sync) {
                                  if (c.key === 'primaryColor') updateThemeColors(e.target.value, themeForm.secondaryColor);
                                  else updateThemeColors(themeForm.primaryColor, e.target.value);
                                }
                              }}
                              className="w-24 px-3 py-1.5 bg-surface-container-low border border-surface-container rounded text-xs font-mono text-primary uppercase"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Top Announcement Marquee Message</label>
                      <input
                        type="text"
                        value={themeForm.announcementText}
                        onChange={e => setThemeForm(prev => ({ ...prev, announcementText: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: Broadcast Alerts */}
              {storefrontSubTab === 'alerts' && (
                <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                    <div>
                      <h2 className="font-serif text-xl text-primary font-medium">Broadcast Alert System</h2>
                      <p className="text-xs text-on-surface-variant font-light mt-0.5">Publish an emergency or high-priority announcement pinned to all visitor pages.</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('system_alerts', alertForm)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">campaign</span>
                      <span>{isSaving ? 'Broadcasting...' : 'Publish Broadcast Alert'}</span>
                    </button>
                  </div>

                  {/* Banner Live Preview */}
                  <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container">
                    <span className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider block mb-2">Live Alert Banner Preview</span>
                    <div
                      className={`py-2 px-4 rounded text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2 ${
                        alertForm.type === 'urgent'
                          ? 'bg-rose-900 text-rose-100 border border-rose-700'
                          : alertForm.type === 'warning'
                          ? 'bg-amber-900 text-amber-100 border border-amber-700'
                          : 'bg-secondary-gold text-primary font-semibold border border-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {alertForm.type === 'urgent' ? 'emergency' : alertForm.type === 'warning' ? 'warning' : 'campaign'}
                      </span>
                      <span>{alertForm.message}</span>
                      {alertForm.linkText && <span className="underline font-semibold ml-2">{alertForm.linkText}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-3 p-3 bg-surface-container-low rounded border border-surface-container cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={alertForm.enabled}
                          onChange={e => setAlertForm(prev => ({ ...prev, enabled: e.target.checked }))}
                          className="w-4 h-4 accent-secondary-gold rounded"
                        />
                        <span className="text-xs uppercase tracking-wider text-primary font-semibold">Broadcast Banner Active</span>
                      </label>

                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Urgency Level</label>
                      <select
                        value={alertForm.type}
                        onChange={e => setAlertForm(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      >
                        <option value="info">Gold Maison Announcement (Normal)</option>
                        <option value="warning">Amber Schedule / Notice (Medium)</option>
                        <option value="urgent">Rose Critical Notice (Urgent)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Banner Text</label>
                      <textarea
                        rows={2}
                        value={alertForm.message}
                        onChange={e => setAlertForm(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary mb-2"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="CTA Text (e.g. View Gifts)"
                          value={alertForm.linkText || ''}
                          onChange={e => setAlertForm(prev => ({ ...prev, linkText: e.target.value }))}
                          className="w-full px-3 py-1.5 bg-surface-container-low border border-surface-container rounded text-xs text-primary"
                        />
                        <input
                          type="text"
                          placeholder="Destination URL (/catalog)"
                          value={alertForm.linkUrl || ''}
                          onChange={e => setAlertForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                          className="w-full px-3 py-1.5 bg-surface-container-low border border-surface-container rounded text-xs text-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: Footer & Concierge */}
              {storefrontSubTab === 'footer' && (
                <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                    <div>
                      <h2 className="font-serif text-xl text-primary font-medium">Concierge Contact &amp; Boutique Details</h2>
                      <p className="text-xs text-on-surface-variant font-light mt-0.5">Edit customer care telephone, email, and Paris boutique address.</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('footer_config', footerForm)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>{isSaving ? 'Saving...' : 'Save Concierge Info'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Concierge Email</label>
                      <input
                        type="email"
                        value={footerForm.email}
                        onChange={e => setFooterForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Concierge Phone</label>
                      <input
                        type="text"
                        value={footerForm.phone}
                        onChange={e => setFooterForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Place Vendôme Address</label>
                      <input
                        type="text"
                        value={footerForm.address}
                        onChange={e => setFooterForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Operating Hours</label>
                      <input
                        type="text"
                        value={footerForm.hours}
                        onChange={e => setFooterForm(prev => ({ ...prev, hours: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Instagram</label>
                      <input
                        type="text"
                        value={footerForm.instagram}
                        onChange={e => setFooterForm(prev => ({ ...prev, instagram: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">X (Twitter)</label>
                      <input
                        type="text"
                        value={footerForm.twitter}
                        onChange={e => setFooterForm(prev => ({ ...prev, twitter: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              CATEGORY 2: COMMERCE & PROMOTIONS
             ========================================================================= */}
          {activeTab === 'commerce' && (
            <div className="space-y-8 animate-fade-in">
              {/* Commerce Settings Card */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
                  <div>
                    <h2 className="font-serif text-xl text-primary font-medium">Boutique Identity, Tax &amp; Shipping Rules</h2>
                    <p className="text-xs text-on-surface-variant font-light mt-0.5">Parameters enforced dynamically in the patron checkout pipeline.</p>
                  </div>
                  <button
                    onClick={() => handleSaveSection('store_settings', storeForm)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isSaving ? 'Saving...' : 'Save Commerce Rules'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Maison Name</label>
                    <input
                      type="text"
                      value={storeForm.storeName}
                      onChange={e => setStoreForm(prev => ({ ...prev, storeName: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Tagline</label>
                    <input
                      type="text"
                      value={storeForm.tagline}
                      onChange={e => setStoreForm(prev => ({ ...prev, tagline: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Currency</label>
                    <select
                      value={storeForm.currency}
                      onChange={e => setStoreForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    >
                      <option value="USD">USD ($) — US Dollar</option>
                      <option value="EUR">EUR (€) — Euro</option>
                      <option value="GBP">GBP (£) — British Pound</option>
                      <option value="GHS">GHS (₵) — Ghanaian Cedi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Free Shipping Threshold ($)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 text-xs text-on-surface-variant">$</span>
                      <input
                        type="number"
                        min="0"
                        value={storeForm.freeShippingThreshold}
                        onChange={e => setStoreForm(prev => ({ ...prev, freeShippingThreshold: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Standard Shipping Fee ($)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 text-xs text-on-surface-variant">$</span>
                      <input
                        type="number"
                        min="0"
                        value={storeForm.standardShippingFee}
                        onChange={e => setStoreForm(prev => ({ ...prev, standardShippingFee: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Sales Tax Rate (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={storeForm.taxRate}
                        onChange={e => setStoreForm(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                      <span className="absolute right-3.5 top-2 text-xs text-on-surface-variant">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promotions & Vouchers Table */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container">
                  <div>
                    <h2 className="font-serif text-xl text-primary font-medium">Privilege Codes &amp; Marketing Vouchers</h2>
                    <p className="text-xs text-on-surface-variant font-light mt-0.5">Database-validated discount coupons for customer bags.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPromo(null);
                      setPromoForm({
                        code: '',
                        discount_type: 'percentage',
                        discount_value: 15,
                        min_spend: 0,
                        expires_at: '',
                        max_uses: '',
                        is_active: true
                      });
                      setIsPromoModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary-gold text-primary font-semibold text-xs uppercase tracking-wider rounded shadow-gold-sm hover:bg-white transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Issue Privilege Code</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 font-semibold">Code</th>
                        <th className="py-3 px-4 font-semibold">Benefit</th>
                        <th className="py-3 px-4 font-semibold">Min Spend</th>
                        <th className="py-3 px-4 font-semibold">Redemptions</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {promos.map(p => (
                        <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-primary">
                            <span className="px-2.5 py-1 rounded bg-secondary-gold/15 border border-secondary-gold/30 text-primary font-semibold">
                              {p.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-primary">
                            {p.discount_type === 'percentage' ? `${p.discount_value}% Off` : `$${p.discount_value} Off`}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            {p.min_spend > 0 ? `$${p.min_spend.toFixed(2)}` : 'None'}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            {p.uses_count} {p.max_uses ? `/ ${p.max_uses}` : 'uses'}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleTogglePromo(p)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                                p.is_active === 1
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${p.is_active === 1 ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                              <span>{p.is_active === 1 ? 'Active' : 'Disabled'}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingPromo(p);
                                  setPromoForm({
                                    code: p.code,
                                    discount_type: p.discount_type,
                                    discount_value: p.discount_value,
                                    min_spend: p.min_spend,
                                    expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '',
                                    max_uses: p.max_uses ? p.max_uses.toString() : '',
                                    is_active: p.is_active === 1
                                  });
                                  setIsPromoModalOpen(true);
                                }}
                                className="p-1.5 text-on-surface-variant hover:text-primary rounded hover:bg-surface-container"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeletePromo(p.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              CATEGORY 3: GATEWAYS & INTEGRATIONS (NEW)
             ========================================================================= */}
          {activeTab === 'gateways' && (
            <div className="space-y-6 animate-fade-in">
              {/* Secondary Gateway Sub-Tab Pill Bar */}
              <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-lg border border-surface-container w-fit">
                {[
                  { id: 'payment', label: 'Payment Gateways', icon: 'credit_card' },
                  { id: 'email', label: 'Email Gateway (SMTP)', icon: 'mail' },
                  { id: 'sms', label: 'SMS Notification Gateway', icon: 'sms' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setGatewaySubTab(sub.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      gatewaySubTab === sub.id
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{sub.icon}</span>
                    <span>{sub.label}</span>
                  </button>
                ))}
              </div>

              {/* 3.1: PAYMENT GATEWAY */}
              {gatewaySubTab === 'payment' && (
                <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                    <div>
                      <h2 className="font-serif text-xl text-primary font-medium">Payment Gateway Configuration</h2>
                      <p className="text-xs text-on-surface-variant font-light mt-0.5">
                        Configure Paystack (Card, Mobile Money, Bank), Stripe, and Place Vendôme House Accounts.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('gateways_config', gatewaysForm)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>{isSaving ? 'Saving...' : 'Save Payment Gateways'}</span>
                    </button>
                  </div>

                  {/* Paystack Box */}
                  <div className="p-5 rounded-xl border border-secondary/20 bg-surface-container-low space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#00C3F7]/10 flex items-center justify-center text-[#00C3F7] font-bold text-sm">
                          P
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-primary">Paystack Gateway</h3>
                          <p className="text-[11px] text-on-surface-variant font-light">
                            Accepts Visa, Mastercard, Apple Pay, and West African Mobile Money (MTN, Telecel, AirtelTigo).
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gatewaysForm.payment.paystackEnabled}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paystackEnabled: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">
                          Paystack Public Key
                        </label>
                        <input
                          type="text"
                          value={gatewaysForm.payment.paystackPublicKey}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paystackPublicKey: e.target.value }
                          }))}
                          placeholder="pk_test_..."
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-container rounded text-xs font-mono text-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">
                          Paystack Secret Key
                        </label>
                        <input
                          type="password"
                          value={gatewaysForm.payment.paystackSecretKey}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paystackSecretKey: e.target.value }
                          }))}
                          placeholder="sk_test_..."
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-container rounded text-xs font-mono text-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">
                          Processing Currency
                        </label>
                        <select
                          value={gatewaysForm.payment.paystackCurrency}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paystackCurrency: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-container rounded text-xs text-primary"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="GHS">GHS (₵)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Box */}
                  <div className="p-5 rounded-xl border border-surface-container bg-surface-container-low space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#635BFF]/10 flex items-center justify-center text-[#635BFF] font-bold text-sm">
                          S
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-primary">Stripe Payments</h3>
                          <p className="text-[11px] text-on-surface-variant font-light">Global card processing, Google Pay, and European direct debit.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gatewaysForm.payment.stripeEnabled}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, stripeEnabled: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">
                          Stripe Publishable Key
                        </label>
                        <input
                          type="text"
                          value={gatewaysForm.payment.stripePublishableKey}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, stripePublishableKey: e.target.value }
                          }))}
                          placeholder="pk_live_..."
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-container rounded text-xs font-mono text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">
                          Stripe Secret Key
                        </label>
                        <input
                          type="password"
                          value={gatewaysForm.payment.stripeSecretKey}
                          onChange={e => setGatewaysForm(prev => ({
                            ...prev,
                            payment: { ...prev.payment, stripeSecretKey: e.target.value }
                          }))}
                          placeholder="sk_live_..."
                          className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-container rounded text-xs font-mono text-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* House Account */}
                  <div className="p-4 rounded-xl border border-surface-container bg-surface-container-low flex items-center justify-between">
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-primary font-semibold">Place Vendôme House Account</h4>
                      <p className="text-[11px] text-on-surface-variant font-light">Allow Circle Privé patrons to order with VIP atelier billing upon invoice.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gatewaysForm.payment.houseAccountEnabled}
                        onChange={e => setGatewaysForm(prev => ({
                          ...prev,
                          payment: { ...prev.payment, houseAccountEnabled: e.target.checked }
                        }))}
                        className="w-4 h-4 accent-secondary-gold rounded"
                      />
                      <span className="text-xs font-medium text-primary">Enabled</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 3.2: EMAIL GATEWAY */}
              {gatewaySubTab === 'email' && (
                <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                    <div>
                      <h2 className="font-serif text-xl text-primary font-medium">Transactional Email &amp; SMTP Gateway</h2>
                      <p className="text-xs text-on-surface-variant font-light mt-0.5">
                        Configure outbound dispatch for order confirmations, digital receipts, and VIP invitation gazettes.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('gateways_config', gatewaysForm)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>{isSaving ? 'Saving...' : 'Save Email Gateway'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* 3.3: SMS NOTIFICATION GATEWAY */}
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
          )}

          {/* =========================================================================
              CATEGORY 4: TEAM & WORKSPACE
             ========================================================================= */}
          {activeTab === 'team' && (
            <div className="space-y-8 animate-fade-in">
              {/* Administrator Profile */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container">
                  <div>
                    <h2 className="font-serif text-xl text-primary font-medium">Your Administrator Profile</h2>
                    <p className="text-xs text-on-surface-variant font-light mt-0.5">Manage your personal credentials and contact details.</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateAdminProfile} className="space-y-6">
                  {profileMessage && (
                    <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container text-xs text-primary font-medium">
                      {profileMessage}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xs uppercase tracking-wider text-primary font-semibold border-b border-surface-container pb-2">Profile Details</h3>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Full Name</label>
                        <input
                          type="text"
                          value={adminProfileForm.name}
                          onChange={e => setAdminProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Email Address</label>
                        <input
                          type="email"
                          value={adminProfileForm.email}
                          onChange={e => setAdminProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs uppercase tracking-wider text-primary font-semibold border-b border-surface-container pb-2">Security (Optional)</h3>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Current Password</label>
                        <input
                          type="password"
                          placeholder="Leave blank if not changing"
                          value={adminProfileForm.currentPassword}
                          onChange={e => setAdminProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">New Password</label>
                        <input
                          type="password"
                          placeholder="Minimum 6 characters"
                          value={adminProfileForm.newPassword}
                          onChange={e => setAdminProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-surface-container">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>{isSavingProfile ? 'Saving...' : 'Update Profile'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Staff Directory */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container">
                  <div>
                    <h2 className="font-serif text-xl text-primary font-medium">Place Vendôme Staff Directory</h2>
                    <p className="text-xs text-on-surface-variant font-light mt-0.5">Manage backoffice users, roles, and administrative permissions.</p>
                  </div>
                  <button
                    onClick={() => setIsStaffModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold font-semibold text-xs uppercase tracking-wider rounded shadow-sm hover:bg-black transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Induct Staff Member</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 font-semibold">Staff Member</th>
                        <th className="py-3 px-4 font-semibold">Work Email</th>
                        <th className="py-3 px-4 font-semibold">Assigned Role</th>
                        <th className="py-3 px-4 font-semibold">Induction Date</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {staffUsers.map(u => (
                        <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-4 font-medium text-primary">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-secondary-gold/20 flex items-center justify-center text-primary font-serif font-bold text-xs">
                                {u.name.charAt(0)}
                              </div>
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant font-mono">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-secondary/15 text-secondary-fixed border border-secondary/30">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4 text-right">
                            {admin?.id !== u.id && (
                              <button
                                onClick={() => handleDeleteStaff(u.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                              >
                                <span className="material-symbols-outlined text-[18px]">person_remove</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Workspace Density, Exports & Maintenance */}
              <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
                  <div>
                    <h2 className="font-serif text-xl text-primary font-medium">Workspace Density &amp; Data Audits</h2>
                    <p className="text-xs text-on-surface-variant font-light mt-0.5">Control operational spacing and execute one-click CSV ledger downloads.</p>
                  </div>
                  <button
                    onClick={() => handleSaveSection('admin_workspace', workspaceForm)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isSaving ? 'Saving...' : 'Save Workspace'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Table Information Density</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setWorkspaceForm(prev => ({ ...prev, tableDensity: 'relaxed' }))}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          workspaceForm.tableDensity === 'relaxed'
                            ? 'border-secondary-gold bg-secondary-gold/5 ring-1 ring-secondary-gold'
                            : 'border-surface-container bg-surface-container-low'
                        }`}
                      >
                        <span className="material-symbols-outlined text-secondary text-[22px] mb-1 block">view_comfortable</span>
                        <h4 className="font-semibold text-xs text-primary">Relaxed Density</h4>
                        <p className="text-[10px] text-on-surface-variant font-light">Spacious editorial tables</p>
                      </div>

                      <div
                        onClick={() => setWorkspaceForm(prev => ({ ...prev, tableDensity: 'compact' }))}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          workspaceForm.tableDensity === 'compact'
                            ? 'border-secondary-gold bg-secondary-gold/5 ring-1 ring-secondary-gold'
                            : 'border-surface-container bg-surface-container-low'
                        }`}
                      >
                        <span className="material-symbols-outlined text-secondary text-[22px] mb-1 block">density_small</span>
                        <h4 className="font-semibold text-xs text-primary">Compact Density</h4>
                        <p className="text-[10px] text-on-surface-variant font-light">High efficiency data rows</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Instant CSV Exports</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => handleExport('orders')}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container hover:border-secondary text-primary font-medium text-xs text-left"
                      >
                        <span className="material-symbols-outlined text-secondary text-[18px]">download</span>
                        <span>Orders Ledger</span>
                      </button>
                      <button
                        onClick={() => handleExport('products')}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container hover:border-secondary text-primary font-medium text-xs text-left"
                      >
                        <span className="material-symbols-outlined text-secondary text-[18px]">download</span>
                        <span>Product Catalog</span>
                      </button>
                      <button
                        onClick={() => handleExport('inventory')}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container hover:border-secondary text-primary font-medium text-xs text-left"
                      >
                        <span className="material-symbols-outlined text-secondary text-[18px]">download</span>
                        <span>Inventory Reserves</span>
                      </button>
                      <button
                        onClick={() => handleExport('customers')}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container hover:border-secondary text-primary font-medium text-xs text-left"
                      >
                        <span className="material-symbols-outlined text-secondary text-[18px]">download</span>
                        <span>Patron Directory</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-container">
                  <label className="flex items-center gap-3 p-3 bg-surface-container-low rounded border border-surface-container cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storeForm.maintenanceMode}
                      onChange={e => {
                        const updated = { ...storeForm, maintenanceMode: e.target.checked };
                        setStoreForm(updated);
                        handleSaveSection('store_settings', updated);
                      }}
                      className="w-4 h-4 accent-secondary-gold rounded"
                    />
                    <div>
                      <span className="text-xs uppercase tracking-wider text-primary font-semibold block">Storefront Maintenance Shield</span>
                      <span className="text-[11px] text-on-surface-variant font-light">
                        Temporarily display a private refurbishment notice to storefront visitors.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Create/Edit Promo Code */}
          {isPromoModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-secondary/30 shadow-gold-xl animate-fade-in">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
                  <h3 className="font-serif text-xl text-primary font-medium">
                    {editingPromo ? 'Edit Privilege Code' : 'Issue New Privilege Code'}
                  </h3>
                  <button onClick={() => setIsPromoModalOpen(false)} className="p-1 text-on-surface-variant hover:text-primary rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleSavePromo} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Privilege Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VENDOME20"
                      value={promoForm.code}
                      onChange={e => setPromoForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm font-mono text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Discount Type</label>
                      <select
                        value={promoForm.discount_type}
                        onChange={e => setPromoForm(prev => ({ ...prev, discount_type: e.target.value as any }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Deduction ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Value</label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        required
                        value={promoForm.discount_value}
                        onChange={e => setPromoForm(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Minimum Spend ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={promoForm.min_spend}
                        onChange={e => setPromoForm(prev => ({ ...prev, min_spend: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Max Redemptions</label>
                      <input
                        type="number"
                        placeholder="Unlimited"
                        value={promoForm.max_uses}
                        onChange={e => setPromoForm(prev => ({ ...prev, max_uses: e.target.value }))}
                        className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container mt-6">
                    <button type="button" onClick={() => setIsPromoModalOpen(false)} className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-primary">
                      Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded shadow-sm hover:bg-black transition-all">
                      Save Privilege Code
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Add Staff Member */}
          {isStaffModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 sm:p-8 border border-secondary/30 shadow-gold-xl animate-fade-in">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
                  <h3 className="font-serif text-xl text-primary font-medium">Induct Staff Member</h3>
                  <button onClick={() => setIsStaffModalOpen(false)} className="p-1 text-on-surface-variant hover:text-primary rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Full Staff Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jacqueline Moreau"
                      value={staffForm.name}
                      onChange={e => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Official Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="jacqueline@macqrosa.com"
                      value={staffForm.email}
                      onChange={e => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 8 characters"
                      value={staffForm.password}
                      onChange={e => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Assigned Role</label>
                    <select
                      value={staffForm.role}
                      onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    >
                      <option value="store_manager">Store Manager (Products, Orders, Reserves)</option>
                      <option value="concierge">Luxury Concierge (Orders, Customer Care)</option>
                      <option value="super_admin">Super Admin (Full Maison Access)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container mt-6">
                    <button type="button" onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-primary">
                      Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded shadow-sm hover:bg-black transition-all">
                      Induct Staff
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
