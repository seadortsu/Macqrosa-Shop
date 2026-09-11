import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface StoreSettings {
  storeName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  timezone: string;
  address: string;
  city: string;
  country: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  taxRate: number;
  enableReviews: boolean;
  enableWishlist: boolean;
  enableGuestCheckout: boolean;
  maintenanceMode: boolean;
  lowStockThreshold: number;
  orderPrefix: string;
}

export interface ServiceItem {
  title: string;
  desc: string;
  icon: string;
}

export interface HomepageCms {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBannerImage: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  metric1Val: string;
  metric1Lbl: string;
  metric2Val: string;
  metric2Lbl: string;
  metric3Val: string;
  metric3Lbl: string;
  brandStorySubtitle: string;
  brandStoryTitle: string;
  brandStoryDescription: string;
  brandStoryImage: string;
  brandStoryQuote: string;
  brandStoryQuoteAuthor: string;
  services: ServiceItem[];
}

export interface StorepageCms {
  topBadge: string;
  title: string;
  description: string;
  promotionalText: string;
  bannerImage: string;
}

export interface ProductpageCms {
  trustBadgeText: string;
  shippingText: string;
  guaranteeText: string;
  returnPolicyText: string;
  highlightColor: string;
}

export interface ThemeConfig {
  preset: string;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  bannerBg: string;
  bannerText: string;
  announcementText: string;
  fontHeading: string;
  fontBody: string;
  darkPrimaryColor: string;
  darkSecondaryColor: string;
  darkBackgroundColor: string;
  darkTextColor: string;
}

export interface FooterConfig {
  email: string;
  phone: string;
  address: string;
  hours: string;
  instagram: string;
  facebook: string;
  twitter: string;
}

export interface SystemAlert {
  enabled: boolean;
  type: 'info' | 'warning' | 'urgent';
  message: string;
  linkText?: string;
  linkUrl?: string;
}

export interface AdminWorkspace {
  tableDensity: 'compact' | 'relaxed';
  accentColor: string;
  showKpiRevenue: boolean;
  showKpiOrders: boolean;
  showKpiAov: boolean;
  showKpiConversion: boolean;
}

export interface GatewaySettings {
  payment: {
    provider: string;
    paystackEnabled: boolean;
    paystackPublicKey: string;
    paystackSecretKey: string;
    paystackCurrency: string;
    stripeEnabled: boolean;
    stripePublishableKey: string;
    stripeSecretKey: string;
    houseAccountEnabled: boolean;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
    senderEmail: string;
    senderName: string;
    enableOrderConfirmation: boolean;
    enableShippingNotification: boolean;
  };
  sms: {
    provider: string;
    apiKey: string;
    senderId: string;
    enabled: boolean;
    notifyOnOrder: boolean;
    notifyOnDispatch: boolean;
  };
}

interface StoreSettingsContextType {
  storeSettings: StoreSettings;
  homepageCms: HomepageCms;
  themeConfig: ThemeConfig;
  footerConfig: FooterConfig;
  systemAlerts: SystemAlert;
  adminWorkspace: AdminWorkspace;
  gatewaysConfig: GatewaySettings;
  storepageCms: StorepageCms;
  productpageCms: ProductpageCms;
  menus: any;
  pages: any[];
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateThemeColors: (primary: string, secondary: string) => void;
}

const defaultStoreSettings: StoreSettings = {
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
};

const defaultHomepageCms: HomepageCms = {
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
};

const defaultStorepageCms: StorepageCms = {
  topBadge: 'The Catalog • Haute Parfumerie & Cosmétiques',
  title: 'Curated Formulations',
  description: 'Explore our master-crafted collection of skin-whispered radiance and ancient botanical alchemy.',
  promotionalText: 'Complimentary shipping on orders over $150.',
  bannerImage: ''
};

const defaultProductpageCms: ProductpageCms = {
  trustBadgeText: 'Certified Authentic by Place Vendôme',
  shippingText: 'Ships in 1-2 business days with climate-controlled transit.',
  guaranteeText: '30-Day Elegance Guarantee',
  returnPolicyText: 'Complimentary returns via White Glove Courier.',
  highlightColor: '#C5A059'
};

const defaultThemeConfig: ThemeConfig = {
  preset: 'champagne_gold',
  primaryColor: '#181615',
  secondaryColor: '#C5A059',
  accentGlow: '#FEF9E7',
  bannerBg: '#181615',
  bannerText: '#FFFFFF',
  announcementText: 'Free shipping on orders over $150 — Complimentary Place Vendôme Gift Packaging',
  fontHeading: 'Bodoni Moda',
  fontBody: 'Hanken Grotesk',
  darkPrimaryColor: '#FFFFFF',
  darkSecondaryColor: '#D4AF37',
  darkBackgroundColor: '#121212',
  darkTextColor: '#E0E0E0'
};

const defaultFooterConfig: FooterConfig = {
  email: 'concierge@macqrosa.com',
  phone: '+33 1 42 60 00 00',
  address: '15 Place Vendôme, 75001 Paris, France',
  hours: 'Mon–Sat: 10:00 – 19:00 CET',
  instagram: '@macqrosaparis',
  facebook: 'macqrosaparis',
  twitter: '@macqrosa'
};

const defaultSystemAlerts: SystemAlert = {
  enabled: false,
  type: 'info',
  message: 'Maison Announcement: Complimentary 24K Miniature with all orders over $200 today.',
  linkText: 'Explore Gifts',
  linkUrl: '/catalog'
};

const defaultAdminWorkspace: AdminWorkspace = {
  tableDensity: 'relaxed',
  accentColor: '#C5A059',
  showKpiRevenue: true,
  showKpiOrders: true,
  showKpiAov: true,
  showKpiConversion: true
};

const defaultGatewaySettings: GatewaySettings = {
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
};

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const StoreSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [homepageCms, setHomepageCms] = useState<HomepageCms>(defaultHomepageCms);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultThemeConfig);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(defaultFooterConfig);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert>(defaultSystemAlerts);
  const [adminWorkspace, setAdminWorkspace] = useState<AdminWorkspace>(defaultAdminWorkspace);
  const [gatewaysConfig, setGatewaysConfig] = useState<GatewaySettings>(defaultGatewaySettings);
  const [storepageCms, setStorepageCms] = useState<StorepageCms>(defaultStorepageCms);
  const [productpageCms, setProductpageCms] = useState<ProductpageCms>(defaultProductpageCms);
  const [menus, setMenus] = useState<any>({});
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live Preview Support via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production, verify event.origin here
      const { type, payload } = event.data;
      if (type === 'LIVE_PREVIEW_UPDATE') {
        const { section, data } = payload;
        if (section === 'homepage_cms') setHomepageCms(prev => ({ ...prev, ...data }));
        if (section === 'storepage_cms') setStorepageCms(prev => ({ ...prev, ...data }));
        if (section === 'productpage_cms') setProductpageCms(prev => ({ ...prev, ...data }));
        if (section === 'theme_config') {
          setThemeConfig(prev => ({ ...prev, ...data }));
          applyThemeColors(data.primaryColor, data.secondaryColor);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const applyThemeColors = useCallback((primary: string, secondary: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--color-primary', primary);
      document.documentElement.style.setProperty('--color-secondary', secondary);
      document.documentElement.style.setProperty('--color-secondary-gold', secondary);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const [settingsRes, menusRes, pagesRes] = await Promise.allSettled([
        fetch('/api/settings'),
        fetch('/api/menus'),
        fetch('/api/pages')
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
        const data = await settingsRes.value.json();
        if (data.storeSettings && Object.keys(data.storeSettings).length > 0) {
          setStoreSettings(prev => ({ ...prev, ...data.storeSettings }));
        }
        if (data.homepageCms && Object.keys(data.homepageCms).length > 0) {
          setHomepageCms(prev => ({ ...prev, ...data.homepageCms }));
        }
        if (data.storepageCms && Object.keys(data.storepageCms).length > 0) {
          setStorepageCms(prev => ({ ...prev, ...data.storepageCms }));
        }
        if (data.productpageCms && Object.keys(data.productpageCms).length > 0) {
          setProductpageCms(prev => ({ ...prev, ...data.productpageCms }));
        }
        if (data.themeConfig && Object.keys(data.themeConfig).length > 0) {
          setThemeConfig(prev => ({ ...prev, ...data.themeConfig }));
          applyThemeColors(
            data.themeConfig.primaryColor || defaultThemeConfig.primaryColor,
            data.themeConfig.secondaryColor || defaultThemeConfig.secondaryColor
          );
        }
        if (data.footerConfig && Object.keys(data.footerConfig).length > 0) {
          setFooterConfig(prev => ({ ...prev, ...data.footerConfig }));
        }
        if (data.systemAlerts) {
          setSystemAlerts(prev => ({ ...prev, ...data.systemAlerts }));
        }
        if (data.gatewaysConfig) {
          setGatewaysConfig(prev => ({ ...prev, ...data.gatewaysConfig }));
        }
      }

      if (menusRes.status === 'fulfilled' && menusRes.value.ok) {
        const menusList = await menusRes.value.json();
        const menusObj: any = {};
        for (const m of menusList) {
           const mDetailsRes = await fetch(`/api/menus/${m.handle}`);
           if (mDetailsRes.ok) {
             menusObj[m.handle] = await mDetailsRes.json();
           }
        }
        setMenus(menusObj);
      }

      if (pagesRes.status === 'fulfilled' && pagesRes.value.ok) {
        setPages(await pagesRes.value.json());
      }

    } catch (err) {
      console.warn('Could not fetch store settings, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applyThemeColors]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateThemeColors = (primary: string, secondary: string) => {
    setThemeConfig(prev => ({ ...prev, primaryColor: primary, secondaryColor: secondary }));
    applyThemeColors(primary, secondary);
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        storeSettings,
        homepageCms,
        themeConfig,
        footerConfig,
        systemAlerts,
        adminWorkspace,
        gatewaysConfig,
        storepageCms,
        productpageCms,
        menus,
        pages,
        isLoading,
        refreshSettings,
        updateThemeColors
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};
