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

const defaultThemeConfig: ThemeConfig = {
  preset: 'champagne_gold',
  primaryColor: '#181615',
  secondaryColor: '#C5A059',
  accentGlow: '#FEF9E7',
  bannerBg: '#181615',
  bannerText: '#FFFFFF',
  announcementText: 'Free shipping on orders over $150 — Complimentary Place Vendôme Gift Packaging',
  fontHeading: 'Bodoni Moda',
  fontBody: 'Hanken Grotesk'
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
  const [isLoading, setIsLoading] = useState(true);

  const applyThemeColors = useCallback((primary: string, secondary: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--color-primary', primary);
      document.documentElement.style.setProperty('--color-secondary', secondary);
      document.documentElement.style.setProperty('--color-secondary-gold', secondary);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.storeSettings && Object.keys(data.storeSettings).length > 0) {
          setStoreSettings(prev => ({ ...prev, ...data.storeSettings }));
        }
        if (data.homepageCms && Object.keys(data.homepageCms).length > 0) {
          setHomepageCms(prev => ({ ...prev, ...data.homepageCms }));
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
