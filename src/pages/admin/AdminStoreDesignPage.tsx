import React, { useState, useEffect, useRef } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import {
  useStoreSettings,
  HomepageCms,
  StorepageCms,
  ProductpageCms,
  ThemeConfig,
  FooterConfig,
  SystemAlert
} from '../../context/StoreSettingsContext';

export const AdminStoreDesignPage: React.FC = () => {
  const { adminToken } = useAuth();
  const { refreshSettings } = useStoreSettings();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [storefrontSubTab, setStorefrontSubTab] = useState<string>('home');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [pages, setPages] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // States
  const [cmsForm, setCmsForm] = useState<HomepageCms>({} as any);
  const [storeForm, setStoreForm] = useState<StorepageCms>({} as any);
  const [productForm, setProductForm] = useState<ProductpageCms>({} as any);
  const [themeForm, setThemeForm] = useState<ThemeConfig>({} as any);
  const [footerForm, setFooterForm] = useState<FooterConfig>({} as any);
  const [alertForm, setAlertForm] = useState<SystemAlert>({} as any);

  const loadLiveSettings = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/settings/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.homepage_cms) setCmsForm(data.homepage_cms);
        if (data.storepage_cms) setStoreForm(data.storepage_cms);
        if (data.productpage_cms) setProductForm(data.productpage_cms);
        if (data.theme_config) setThemeForm(data.theme_config);
        if (data.footer_config) setFooterForm(data.footer_config);
        if (data.system_alerts) setAlertForm(data.system_alerts);
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
    }
  };

  const loadPages = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/pages', { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.ok) setPages(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLiveSettings();
    loadPages();
  }, [adminToken]);

  // Live Preview Broadcaster
  const broadcastPreview = (section: string, data: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'LIVE_PREVIEW_UPDATE',
        payload: { section, data }
      }, '*');
    }
  };

  // Broadcast when forms change
  useEffect(() => { broadcastPreview('homepage_cms', cmsForm); }, [cmsForm]);
  useEffect(() => { broadcastPreview('storepage_cms', storeForm); }, [storeForm]);
  useEffect(() => { broadcastPreview('productpage_cms', productForm); }, [productForm]);
  useEffect(() => { broadcastPreview('theme_config', themeForm); }, [themeForm]);

  const handleSaveSection = async (sectionKey: string, payloadData: any) => {
    if (!adminToken) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ section: sectionKey, data: payloadData })
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

  const getPreviewUrl = () => {
    if (storefrontSubTab.startsWith('page_')) {
      const pId = parseInt(storefrontSubTab.split('_')[1]);
      const p = pages.find(x => x.id === pId);
      if (p) return `/pages/${p.slug}`;
    }
    switch(storefrontSubTab) {
      case 'home': return '/';
      case 'store': return '/catalog';
      case 'product': return '/catalog'; // Can point to a specific product if known, but catalog is safe
      default: return '/';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
      <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 pt-16 overflow-hidden">
        <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Editor Split Screen */}
        <div className={`flex flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : ''}`}>
          
          {/* Left Pane - Controls */}
          <div className="w-[450px] bg-surface-container-lowest border-r border-surface-container overflow-y-auto flex flex-col relative z-10 shadow-xl">
            <div className="p-5 border-b border-surface-container sticky top-0 bg-surface-container-lowest/90 backdrop-blur-md z-20">
              <h1 className="text-xl font-serif text-primary">Visual Editor</h1>
              <p className="text-xs text-on-surface-variant mt-1">Live preview &amp; customize storefront pages.</p>
              
              <div className="flex flex-wrap gap-1.5 mt-4">
                {[
                  { id: 'home', label: 'Home Page', icon: 'home' },
                  { id: 'store', label: 'Store Page', icon: 'storefront' },
                  { id: 'product', label: 'Product Page', icon: 'inventory_2' },
                  { id: 'theme', label: 'Colors', icon: 'palette' },
                  { id: 'alerts', label: 'Alerts', icon: 'campaign' },
                  { id: 'footer', label: 'Footer', icon: 'support_agent' },
                  ...pages.map(p => ({ id: `page_${p.id}`, label: p.title, icon: 'description' }))
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setStorefrontSubTab(sub.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                      storefrontSubTab === sub.id
                        ? 'bg-primary text-secondary-gold shadow-sm font-semibold'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-primary border border-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{sub.icon}</span>
                    <span>{sub.label}</span>
                  </button>
                ))}
              </div>

              {saveSuccess && (
                <div className="mt-3 inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Published Live</span>
                </div>
              )}
            </div>

            <div className="p-5 flex-1 space-y-6 pb-24">
              
              {/* Home Page Controls */}
              {storefrontSubTab === 'home' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Hero Section</h3>
                    <button onClick={() => handleSaveSection('homepage_cms', cmsForm)} disabled={isSaving} className="text-xs font-semibold bg-secondary-gold text-primary px-3 py-1 rounded">Save</button>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Badge Text</label>
                    <input type="text" value={cmsForm.heroBadge || ''} onChange={e => setCmsForm(prev => ({ ...prev, heroBadge: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Headline</label>
                    <input type="text" value={cmsForm.heroTitle || ''} onChange={e => setCmsForm(prev => ({ ...prev, heroTitle: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Subtitle</label>
                    <input type="text" value={cmsForm.heroSubtitle || ''} onChange={e => setCmsForm(prev => ({ ...prev, heroSubtitle: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Description</label>
                    <textarea rows={3} value={cmsForm.heroDescription || ''} onChange={e => setCmsForm(prev => ({ ...prev, heroDescription: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Background Image URL</label>
                    <input type="text" value={cmsForm.heroBannerImage || ''} onChange={e => setCmsForm(prev => ({ ...prev, heroBannerImage: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                </div>
              )}

              {/* Store Page Controls */}
              {storefrontSubTab === 'store' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Catalog Header</h3>
                    <button onClick={() => handleSaveSection('storepage_cms', storeForm)} disabled={isSaving} className="text-xs font-semibold bg-secondary-gold text-primary px-3 py-1 rounded">Save</button>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Top Small Badge</label>
                    <input type="text" value={storeForm.topBadge || ''} onChange={e => setStoreForm(prev => ({ ...prev, topBadge: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Catalog Title</label>
                    <input type="text" value={storeForm.title || ''} onChange={e => setStoreForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Catalog Description</label>
                    <textarea rows={3} value={storeForm.description || ''} onChange={e => setStoreForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Promotional Text (Banner)</label>
                    <input type="text" value={storeForm.promotionalText || ''} onChange={e => setStoreForm(prev => ({ ...prev, promotionalText: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                </div>
              )}

              {/* Product Page Controls */}
              {storefrontSubTab === 'product' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Product Info Blocks</h3>
                    <button onClick={() => handleSaveSection('productpage_cms', productForm)} disabled={isSaving} className="text-xs font-semibold bg-secondary-gold text-primary px-3 py-1 rounded">Save</button>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Trust Badge Text</label>
                    <input type="text" value={productForm.trustBadgeText || ''} onChange={e => setProductForm(prev => ({ ...prev, trustBadgeText: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Shipping Policy Text</label>
                    <textarea rows={2} value={productForm.shippingText || ''} onChange={e => setProductForm(prev => ({ ...prev, shippingText: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Guarantee Text</label>
                    <input type="text" value={productForm.guaranteeText || ''} onChange={e => setProductForm(prev => ({ ...prev, guaranteeText: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Return Policy Text</label>
                    <input type="text" value={productForm.returnPolicyText || ''} onChange={e => setProductForm(prev => ({ ...prev, returnPolicyText: e.target.value }))} className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Highlight Color (Hex)</label>
                    <div className="flex gap-2">
                      <input type="color" value={productForm.highlightColor || '#C5A059'} onChange={e => setProductForm(prev => ({ ...prev, highlightColor: e.target.value }))} className="w-10 h-10 p-0 border-0 rounded cursor-pointer" />
                      <input type="text" value={productForm.highlightColor || ''} onChange={e => setProductForm(prev => ({ ...prev, highlightColor: e.target.value }))} className="flex-1 px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                    </div>
                  </div>
                </div>
              )}

              {/* Theme Colors Controls */}
              {storefrontSubTab === 'theme' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-primary text-sm uppercase tracking-wider">Global Colors</h3>
                    <button onClick={() => handleSaveSection('theme_config', themeForm)} disabled={isSaving} className="text-xs font-semibold bg-secondary-gold text-primary px-3 py-1 rounded">Save</button>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Primary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={themeForm.primaryColor || '#181615'} onChange={e => setThemeForm(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-10 h-10 p-0 rounded cursor-pointer" />
                      <input type="text" value={themeForm.primaryColor || ''} onChange={e => setThemeForm(prev => ({ ...prev, primaryColor: e.target.value }))} className="flex-1 px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-primary font-semibold mb-1">Secondary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={themeForm.secondaryColor || '#C5A059'} onChange={e => setThemeForm(prev => ({ ...prev, secondaryColor: e.target.value }))} className="w-10 h-10 p-0 rounded cursor-pointer" />
                      <input type="text" value={themeForm.secondaryColor || ''} onChange={e => setThemeForm(prev => ({ ...prev, secondaryColor: e.target.value }))} className="flex-1 px-3 py-2 bg-surface-container-low border border-surface-container rounded text-xs text-primary" />
                    </div>
                  </div>
                </div>
              )}

              {/* Alerts & Footer omitted for brevity, logic identical to before... */}
              {(storefrontSubTab === 'alerts' || storefrontSubTab === 'footer') && (
                <div className="p-4 border border-surface-container rounded text-sm text-on-surface-variant bg-surface-container-low">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold uppercase tracking-wider text-primary text-xs">Manage {storefrontSubTab}</span>
                    <button 
                      onClick={() => handleSaveSection(storefrontSubTab === 'alerts' ? 'system_alerts' : 'footer_config', storefrontSubTab === 'alerts' ? alertForm : footerForm)} 
                      className="text-xs font-semibold bg-secondary-gold text-primary px-3 py-1 rounded"
                    >Save</button>
                  </div>
                  {storefrontSubTab === 'alerts' ? (
                     <div className="space-y-3">
                       <label className="flex items-center gap-2"><input type="checkbox" checked={alertForm.enabled || false} onChange={e => setAlertForm(prev => ({ ...prev, enabled: e.target.checked }))} /> Enable Banner</label>
                       <input type="text" value={alertForm.message || ''} onChange={e => setAlertForm(prev => ({ ...prev, message: e.target.value }))} placeholder="Message" className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-container rounded text-xs text-primary" />
                     </div>
                  ) : (
                     <div className="space-y-3">
                       <input type="email" value={footerForm.email || ''} onChange={e => setFooterForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-container rounded text-xs text-primary" />
                       <input type="text" value={footerForm.phone || ''} onChange={e => setFooterForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-container rounded text-xs text-primary" />
                     </div>
                  )}
                </div>
              )}

              {/* Custom Page Placeholder */}
              {storefrontSubTab.startsWith('page_') && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-surface-container-low rounded border border-surface-container">
                    <h3 className="font-semibold text-primary text-sm mb-2">Edit Custom Page</h3>
                    <p className="text-xs text-on-surface-variant mb-4">To edit the content of this page, please visit the Pages section.</p>
                    <a href="/admin/pages" className="text-xs font-semibold bg-primary text-white px-3 py-2 rounded inline-block">Go to Pages Builder</a>
                  </div>
                </div>
              )}

            </div>
          </div>
          
          {/* Right Pane - Live Preview Iframe */}
          <div className="flex-1 bg-surface-container-high overflow-hidden flex flex-col relative">
            <div className="h-10 bg-surface-container-lowest border-b border-surface-container flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">lock</span>
                <span className="text-[11px] text-on-surface-variant font-mono tracking-wider">Preview: localhost:5173{getPreviewUrl()}</span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container rounded p-0.5">
                <button onClick={() => setViewport('desktop')} className={`p-1 rounded flex ${viewport === 'desktop' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}><span className="material-symbols-outlined text-[16px]">desktop_windows</span></button>
                <button onClick={() => setViewport('tablet')} className={`p-1 rounded flex ${viewport === 'tablet' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}><span className="material-symbols-outlined text-[16px]">tablet_mac</span></button>
                <button onClick={() => setViewport('mobile')} className={`p-1 rounded flex ${viewport === 'mobile' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}><span className="material-symbols-outlined text-[16px]">phone_iphone</span></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-[#e5e5e5] dark:bg-[#121212] flex items-center justify-center p-4">
              <iframe 
                ref={iframeRef}
                src={`http://localhost:5173${getPreviewUrl()}`} 
                className={`bg-background transition-all duration-300 ease-in-out shadow-2xl rounded-sm ${viewport === 'desktop' ? 'w-full h-full' : viewport === 'tablet' ? 'w-[768px] h-[1024px]' : 'w-[375px] h-[812px]'}`}
                title="Storefront Preview"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
