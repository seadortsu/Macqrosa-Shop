import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { ConsultationModal } from '../../components/common/ConsultationModal';
import { ProductImage } from '../../components/common/ProductImage';
import { useStoreSettings } from '../../context/StoreSettingsContext';

interface ServiceModalData {
  title: string;
  desc: string;
  icon: string;
  details: string;
}

export const HomePage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceModalData | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(['All']);
  const { addItem } = useCart();
  const { homepageCms } = useStoreSettings();
  const navigate = useNavigate();

  // Carousel State for Curated Haute Collections
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Fetch all masterwork products
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setAllProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setLoading(false);
      });

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const catNames = data.map((c: any) => c.name);
          setDynamicCategories(['All', ...catNames]);
        }
      })
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  // Update carousel items per view on window resize
  const updateItemsPerView = useCallback(() => {
    const width = window.innerWidth;
    if (width < 640) {
      setItemsPerView(1);
    } else if (width < 1024) {
      setItemsPerView(2);
    } else if (width < 1280) {
      setItemsPerView(3);
    } else {
      setItemsPerView(4);
    }
  }, []);

  useEffect(() => {
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, [updateItemsPerView]);

  const toggleWishlist = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const disciplines = [
    {
      title: 'Haute Skincare',
      category: 'Skincare',
      tag: 'Cellular Renewal',
      startingPrice: '$165',
      desc: 'Stem-cell peptides, black orchid extracts, and 24K colloidal gold suspension.',
      image: '/images/products/leclat_dor.jpg'
    },
    {
      title: 'Luminous Complexion',
      category: 'Complexion',
      tag: '24K Light Suspension',
      startingPrice: '$120',
      desc: 'Liquid silk foundations and micro-milled finishing veils refracting candlelit luminescence.',
      image: '/images/products/teint_soyeux.jpg'
    },
    {
      title: 'Haute Parfumerie',
      category: 'Fragrance',
      tag: 'Artisanal Extracts',
      startingPrice: '$280',
      desc: 'Extraits de parfum crafted from Grasse May rose harvests and ancient bourbon resins.',
      image: '/images/products/soleil_dor.jpg'
    },
    {
      title: 'The Solar Ritual',
      category: 'Lips & Eyes',
      tag: 'Saturated Pigments',
      startingPrice: '$68',
      desc: 'Saturated pigment balms and haute couture satin lacquers encased in fluted brass.',
      image: '/images/products/rouge_imperial.jpg'
    },
    {
      title: 'Nocturne Alchemy',
      category: 'Skincare',
      tag: 'Circadian Repair',
      startingPrice: '$240',
      desc: 'Overnight restorative bio-gold balms that awaken skin with dawn luminosity.',
      image: '/images/products/masque_dor.jpg'
    },
    {
      title: 'Coffrets Impériaux',
      category: 'Gifting Atelier',
      tag: 'Numbered Vaults',
      startingPrice: '$495',
      desc: 'Limited production collector vanity cases sealed with personalized Place Vendôme crest.',
      image: '/images/products/coffret_imperial.jpg'
    }
  ];

  const maxCarouselIndex = Math.max(0, disciplines.length - itemsPerView);

  const nextSlide = () => {
    setCarouselIndex(prev => (prev >= maxCarouselIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCarouselIndex(prev => (prev <= 0 ? maxCarouselIndex : prev - 1));
  };

  // Auto-play carousel when not hovered
  useEffect(() => {
    if (isCarouselHovered) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev >= maxCarouselIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [isCarouselHovered, maxCarouselIndex]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const defaultServices = [
    {
      title: 'White Glove Courier',
      desc: 'Complimentary climate-controlled transit',
      icon: 'local_shipping',
      details: 'Dispatched in insulated protective vaults to preserve the fragile botanical actives and colloidal gold integrity during global flight transit.'
    },
    {
      title: 'Signature Gold Boxing',
      desc: 'Sealed with Place Vendôme wax emblem',
      icon: 'featured_seasonal_and_gifts',
      details: 'Hand-packed in gilded rigid cabinetry, wrapped in heavy Parisian tissue and stamped with our gold wax seal by our atelier artisans.'
    },
    {
      title: 'Deluxe Ritual Samples',
      desc: '3 tailored miniature flacons per order',
      icon: 'science',
      details: 'Select three deluxe 5ml miniature glass flacons at checkout to experience complimentary discoveries from our latest seasonal extractions.'
    },
    {
      title: 'Bespoke Monogramming',
      desc: 'Diamond-point flacon engraving',
      icon: 'history_edu',
      details: 'Complimentary laser or diamond-tip engraving of patron initials or meaningful dates onto flacon brass plates for an indelible personal heirloom.'
    }
  ];

  const serviceList = homepageCms?.services?.length ? homepageCms.services : defaultServices;

  // Filter products for Masterwork section
  const categories = dynamicCategories;
  const filteredProducts = selectedCategory === 'All'
    ? allProducts
    : allProducts.filter(p =>
        p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        p.discipline?.toLowerCase() === selectedCategory.toLowerCase()
      );

  return (
    <div className="w-full">
      {/* =========================================================================
          1. CENTERED IMMERSIVE EDITORIAL HERO
          ========================================================================= */}
      <section className="relative w-full overflow-hidden bg-primary text-on-primary">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center scale-105 transform transition-transform duration-1000 ease-out opacity-85"
            style={{
              backgroundImage: `url('${homepageCms?.heroBannerImage || '/images/hero/hero_banner.jpg'}')`
            }}
          />
          {/* Balanced cinematic luxury gradient overlays for centered readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/60 to-primary/95" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(197, 160, 89, 0.15) 0%, rgba(24, 22, 21, 0.4) 60%, rgba(24, 22, 21, 0.85) 100%)'
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-8 pt-36 pb-24 flex flex-col items-center justify-center text-center min-h-[860px]">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            {/* Award Badge Ribbon */}
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-secondary-gold/20 backdrop-blur-md mb-6 border border-secondary-gold/40 shadow-sm mx-auto">
              <span className="material-symbols-outlined text-[16px] text-secondary-fixed">auto_awesome</span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-secondary-fixed font-semibold">
                {homepageCms?.heroBadge || 'Harper’s Bazaar Luxury Icons Winner • Best Miracle Face Oil'}
              </span>
            </div>

            {/* Hero Headlines (Centered) */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl text-on-primary tracking-tight leading-[1.08] mb-6 drop-shadow-xl text-center">
              {homepageCms?.heroTitle || 'L’Éclat d’Or:'}<br />
              <span className="italic font-normal text-secondary-fixed block mt-1">
                {homepageCms?.heroSubtitle || 'The 24K Radiant Youth Infusion'}
              </span>
            </h1>

            {/* Description (Centered) */}
            <p className="text-base sm:text-lg font-light opacity-90 text-on-primary max-w-2xl mx-auto mb-10 leading-relaxed text-center">
              {homepageCms?.heroDescription || 'Sculpted with rare French alpine bio-actives and pure 24-karat colloidal gold suspension. Engineered for an indelible, skin-whispered radiance that transcends time.'}
            </p>

            {/* Hero CTA Actions (Centered) */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-14 mx-auto">
              <Link
                to={homepageCms?.primaryCtaLink || '/catalog'}
                className="group inline-flex items-center justify-center bg-secondary-gold text-primary font-sans text-xs uppercase tracking-[0.2em] font-semibold px-8 py-4 rounded shadow-gold-md hover:bg-white hover:text-primary transition-all duration-300"
              >
                <span>{homepageCms?.primaryCtaText || 'Explore The Collection'}</span>
                <span className="material-symbols-outlined text-[18px] ml-2 transform group-hover:translate-x-1.5 transition-transform">
                  arrow_forward
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsConsultationOpen(true)}
                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-on-primary font-sans text-xs uppercase tracking-[0.18em] font-medium px-6 py-4 rounded backdrop-blur-md border border-white/25 transition-all duration-300"
              >
                <span className="material-symbols-outlined text-[18px] mr-2 text-secondary-fixed">
                  video_camera_front
                </span>
                <span>{homepageCms?.secondaryCtaText || 'Book Atelier Consultation'}</span>
              </button>
            </div>

            {/* 3-Pillar Formulation Metric Accent Bar (Centered) */}
            <div className="grid grid-cols-3 gap-6 sm:gap-12 pt-8 border-t border-white/15 max-w-xl mx-auto w-full text-center">
              <div className="flex flex-col items-center">
                <span className="block font-serif text-2xl sm:text-3xl text-secondary-fixed font-medium">
                  {homepageCms?.metric1Val || '99.4%'}
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] opacity-80 text-on-primary font-medium mt-1 block">
                  {homepageCms?.metric1Lbl || 'Cellular Luminosity'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="block font-serif text-2xl sm:text-3xl text-secondary-fixed font-medium">
                  {homepageCms?.metric2Val || '24K'}
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] opacity-80 text-on-primary font-medium mt-1 block">
                  {homepageCms?.metric2Lbl || 'Colloidal Gold Core'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="block font-serif text-2xl sm:text-3xl text-secondary-fixed font-medium">
                  {homepageCms?.metric3Val || 'Grasse'}
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] opacity-80 text-on-primary font-medium mt-1 block">
                  {homepageCms?.metric3Lbl || 'Harvest Extraction'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. REACTIVE CURATED SERVICE MARQUEE (HOVER INTERACTIVE)
          ========================================================================= */}
      <section className="w-full bg-surface-container-lowest py-8 border-y border-secondary/15 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {serviceList.map((svc: any, idx: number) => (
            <div
              key={svc.title || idx}
              onClick={() => setSelectedService(svc.details ? svc : { ...svc, details: 'Handcrafted luxury service provided exclusively by the Macqrosa Place Vendôme Concierge team.' })}
              className="group relative flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-secondary/30 bg-surface-container-lowest hover:bg-surface-container-low/70 hover:shadow-gold-sm hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              title="Click to discover concierge protocol"
            >
              {/* Subtle gold accent edge glow */}
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Reactive Icon Container with Scale & Gold Shift */}
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-secondary shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary group-hover:text-primary group-hover:shadow-gold-sm">
                <span className="material-symbols-outlined text-[24px] transition-transform duration-300 group-hover:rotate-6">
                  {svc.icon || 'local_shipping'}
                </span>
              </div>

              {/* Reactive Typography */}
              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-primary font-semibold transition-colors duration-300 group-hover:text-secondary truncate">
                  {svc.title}
                </p>
                <p className="text-[11px] text-on-surface-variant font-light transition-colors duration-300 group-hover:text-primary mt-0.5 line-clamp-1">
                  {svc.desc}
                </p>
              </div>

              {/* Micro-Interaction Indicator Arrow */}
              <span className="material-symbols-outlined text-[16px] text-secondary/40 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0">
                arrow_forward_ios
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. CURATED HAUTE COLLECTIONS (CAROUSEL OF TILES)
          ========================================================================= */}
      <section
        className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-20 overflow-hidden"
        onMouseEnter={() => setIsCarouselHovered(true)}
        onMouseLeave={() => setIsCarouselHovered(false)}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-[1px] bg-secondary" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-secondary font-semibold">
                The Disciplines
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-primary font-normal">
              Curated Haute Collections
            </h2>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm hidden sm:block font-light">
              Swipe or navigate across our six artisanal discipline portfolios.
            </p>

            {/* Carousel Navigation Arrow Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous Collection"
                className="w-10 h-10 rounded-full border border-secondary/30 bg-surface-container-lowest text-primary hover:bg-secondary hover:text-primary hover:border-secondary flex items-center justify-center transition-all duration-300 shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>

              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next Collection"
                className="w-10 h-10 rounded-full border border-secondary/30 bg-surface-container-lowest text-primary hover:bg-secondary hover:text-primary hover:border-secondary flex items-center justify-center transition-all duration-300 shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Viewport Container */}
        <div
          className="relative w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translate3d(-${carouselIndex * (100 / itemsPerView)}%, 0, 0)`
            }}
          >
            {disciplines.map((d, idx) => (
              <div
                key={d.title || idx}
                className="shrink-0 px-2.5 sm:px-3"
                style={{ width: `${100 / itemsPerView}%` }}
              >
                <Link
                  to={`/catalog?category=${encodeURIComponent(d.category)}`}
                  className="group relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-md flex flex-col transition-all duration-500 hover:-translate-y-1.5 hover:shadow-gold-md border border-secondary/15 h-full"
                >
                  <div className="relative w-full aspect-[4/5] overflow-hidden bg-surface-container">
                    <div
                      className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                      style={{ backgroundImage: `url('${d.image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-transparent to-transparent opacity-60 group-hover:opacity-85 transition-opacity" />
                    <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-[10px] font-sans uppercase tracking-wider text-secondary font-semibold border border-secondary/20 shadow-xs">
                      {d.tag}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between bg-surface-container-lowest">
                    <div>
                      <h3 className="font-serif text-xl text-primary group-hover:text-secondary transition-colors font-medium">
                        {d.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1.5 font-light line-clamp-2 leading-relaxed">
                        {d.desc}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-surface-container flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-widest text-on-surface-variant font-medium">
                        From {d.startingPrice}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-secondary transform group-hover:translate-x-1.5 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: maxCarouselIndex + 1 }).map((_, dIdx) => (
            <button
              key={dIdx}
              type="button"
              onClick={() => setCarouselIndex(dIdx)}
              aria-label={`Go to slide ${dIdx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                carouselIndex === dIdx ? 'w-8 bg-secondary' : 'w-2 bg-secondary/30 hover:bg-secondary/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* =========================================================================
          4. MASTERWORK FORMULATIONS (EXPANDED PRODUCTS + SHOP CTA + RESPONSIVE)
          ========================================================================= */}
      <section className="w-full bg-surface-container-low py-20 border-t border-secondary/15">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-[1px] bg-secondary" />
                <span className="text-[11px] uppercase tracking-[0.24em] text-secondary font-semibold">
                  The Icons of the Salon
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-primary font-normal">
                Masterwork Formulations
              </h2>
            </div>

            <Link
              to="/catalog"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-secondary font-semibold hover:text-primary transition-colors mt-3 md:mt-0 group"
            >
              <span>View Full 2024 Atelier ({allProducts.length} Creations)</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-10 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-sans tracking-wider uppercase transition-all duration-300 shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-secondary text-primary font-semibold shadow-gold-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container border border-secondary/15'
                }`}
              >
                {cat === 'All' ? `All Masterworks (${allProducts.length})` : cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center text-on-surface-variant font-serif text-lg">
              Curating rare masterwork formulations...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, idx) => {
                const isWishlisted = wishlist.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="group bg-surface-container-lowest rounded-xl p-3.5 shadow-sm hover:shadow-gold-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-secondary/15"
                  >
                    {/* Image viewport with Wishlist & Slide-Up Quick Add */}
                    <div
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="relative w-full aspect-[4/5] bg-surface-container-low rounded-lg overflow-hidden mb-3.5 cursor-pointer"
                    >
                      <ProductImage
                        src={product.image_url}
                        alt={product.title}
                        fallbackTitle={product.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                      />

                      {/* Floating Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                        {product.is_bestseller === 1 && (
                          <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-sans text-[10px] uppercase tracking-wider font-semibold shadow-xs">
                            Cult Favorite
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-md text-primary font-sans text-[10px] uppercase tracking-wider font-medium">
                          Formula N°0{idx + 1}
                        </span>
                      </div>

                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => toggleWishlist(product.id, e)}
                        aria-label="Add to wishlist"
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/85 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:text-red-500 transition-colors shadow-sm z-10"
                      >
                        <span
                          className={`material-symbols-outlined text-[17px] ${
                            isWishlisted ? 'text-red-500 material-symbols-filled' : ''
                          }`}
                        >
                          favorite
                        </span>
                      </button>

                      {/* Signature Slide-Up "Acquire" Action Button */}
                      <div className="absolute inset-x-2.5 bottom-2.5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(product, 1);
                          }}
                          className="w-full bg-primary/95 backdrop-blur-md text-on-primary py-2.5 rounded font-sans text-[11px] uppercase tracking-widest hover:bg-secondary hover:text-primary transition-colors flex items-center justify-center gap-1.5 shadow-lg"
                        >
                          <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                          <span>Acquire • ${product.price.toFixed(0)}</span>
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Rating Stars */}
                        <div className="flex items-center gap-1 mb-1.5 text-secondary">
                          <span
                            className="material-symbols-outlined text-[15px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span
                            className="material-symbols-outlined text-[15px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span
                            className="material-symbols-outlined text-[15px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span
                            className="material-symbols-outlined text-[15px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span
                            className="material-symbols-outlined text-[15px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span className="text-[11px] text-on-surface-variant ml-1 font-medium">
                            {product.rating} ({product.reviews_count})
                          </span>
                        </div>

                        <h3
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="font-serif text-lg text-primary hover:text-secondary transition-colors cursor-pointer mb-1 leading-snug font-medium"
                        >
                          {product.title}
                        </h3>

                        <p className="text-xs text-on-surface-variant font-light line-clamp-2 mb-3 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      {/* Price & Volume/Finish */}
                      <div className="pt-2.5 border-t border-surface-container flex items-center justify-between">
                        <span className="font-serif text-xl font-medium text-primary">
                          ${product.price.toFixed(2)}
                        </span>

                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded font-medium">
                          {product.volume}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              SHOP CTA BANNER (Bottom of Masterworks Formulations)
              ========================================================================= */}
          <div className="mt-16 bg-gradient-to-r from-primary via-primary/95 to-primary text-on-primary rounded-2xl p-8 sm:p-14 border border-secondary/30 shadow-gold-lg relative overflow-hidden text-center flex flex-col items-center">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/40 text-[10px] uppercase tracking-[0.24em] text-secondary-fixed font-semibold mb-4">
              <span className="material-symbols-outlined text-[14px]">storefront</span>
              <span>Place Vendôme Flagship Boutique</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-4xl lg:text-5xl text-on-primary font-normal mb-4 max-w-3xl leading-tight">
              Explore the Complete Place Vendôme Salon Archive
            </h3>

            <p className="text-xs sm:text-base opacity-80 text-on-primary max-w-2xl mb-8 font-light leading-relaxed">
              Experience all 12 clinically validated French phyto-chemistry formulations, limited edition numbered coffrets, and bespoke collector flacons.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/catalog"
                className="group inline-flex items-center gap-2 bg-secondary-gold text-primary font-sans text-xs uppercase tracking-[0.2em] font-semibold px-9 py-4 rounded shadow-gold-md hover:bg-white hover:text-primary transition-all duration-300"
              >
                <span>Enter The Atelier Shop ({allProducts.length} Creations)</span>
                <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-1.5 transition-transform">
                  arrow_forward
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsConsultationOpen(true)}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-on-primary font-sans text-xs uppercase tracking-[0.18em] font-medium px-6 py-4 rounded border border-white/25 backdrop-blur-md transition-all duration-300"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                  support_agent
                </span>
                <span>Consult Atelier Specialist</span>
              </button>
            </div>

            <p className="text-[11px] opacity-70 text-on-primary mt-6 tracking-wide font-light">
              ✨ Complimentary White Glove Courier on orders over $150 • 3 Complimentary Miniature Flacons with Every Order
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BRAND PHILOSOPHY / FRENCH PHYTO-CHEMISTRY
          ========================================================================= */}
      <section className="w-full py-24 bg-primary text-on-primary relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.28em] text-secondary-fixed font-semibold mb-3 block">
              {homepageCms?.brandStorySubtitle || 'Place Vendôme Laboratory'}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal leading-tight mb-6">
              {homepageCms?.brandStoryTitle || 'Where Ancient Alchemy Meets French Phyto-Chemistry'}
            </h2>
            <p className="text-sm sm:text-base font-light opacity-80 text-on-primary leading-relaxed mb-6">
              {homepageCms?.brandStoryDescription || 'Founded in Paris, Macqrosa pioneers the fusion of cold-plasma botanical extracts with suspended 24-karat colloidal bio-gold. Our clean, clinical formulas are certified cruelty-free and engineered without synthetic parabens, phthalates, or microplastics.'}
            </p>
            <div className="space-y-4 text-xs sm:text-sm font-light opacity-80 text-on-primary border-l-2 border-secondary pl-4">
              <p>
                <strong className="text-on-primary font-medium">99.4% Bio-Availability:</strong> Cold-pressed micronization ensures deep epidermal cellular uptake.
              </p>
              <p>
                <strong className="text-on-primary font-medium">Sustainable Grasse Harvest:</strong> Every rose flacon supports biodynamic growers in the south of France.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-secondary/30 shadow-2xl">
              <img
                src={homepageCms?.brandStoryImage || 'https://lh3.googleusercontent.com/aida/AEtjO1VDjASZU-mDV00ion1vG2kC1WzPrAssBdNCXOoQH7xCWD2h9oRVIeeIul8cKcYv5qWzDF7CQ-yE6LkfYZckclPZK2a7IbBr1t-_QuW2lW_WMBGy9ejBnqlmtXN0bWF_JE-jAZGvQiwCkdvQhq5ny2Wl5JVc2fXwE59TCg43JEqGVp_uoYcrSkgyKNJxw9xRKRFwaODTxsSs-Xn4wXfQdQL9pW7BKfXaS1zJawzbKCiX1svmwMO1aA6rSjZI'}
                alt="Macqrosa Studio Beauty Portrait"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest p-6 rounded-lg shadow-gold-lg border border-secondary/20 max-w-xs text-primary hidden sm:block">
              <span className="text-[10px] uppercase tracking-widest text-secondary font-bold block mb-1">
                {homepageCms?.brandStoryQuoteAuthor || 'Verified Efficacy'}
              </span>
              <p className="text-xs font-serif italic text-primary">
                "{homepageCms?.brandStoryQuote || 'An indelible, candlelit radiance that awakens tired complexions from the very first application.'}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SERVICE PRIVILEGE DETAIL MODAL (REACTIVE CLICK INTERACTION)
          ========================================================================= */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-surface-container-lowest border border-secondary/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-gold-lg relative text-primary animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="w-14 h-14 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center text-secondary mb-5 shadow-gold-sm">
              <span className="material-symbols-outlined text-[28px]">{selectedService.icon}</span>
            </div>

            <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-semibold block mb-1">
              Place Vendôme Service Guarantee
            </span>

            <h3 className="font-serif text-2xl text-primary font-medium mb-3">
              {selectedService.title}
            </h3>

            <p className="text-xs sm:text-sm text-on-surface-variant font-light leading-relaxed mb-6">
              {selectedService.details}
            </p>

            <div className="flex items-center gap-3 pt-4 border-t border-surface-container">
              <button
                type="button"
                onClick={() => {
                  setSelectedService(null);
                  setIsConsultationOpen(true);
                }}
                className="flex-1 bg-secondary text-primary font-sans text-xs uppercase tracking-wider font-semibold py-3 rounded hover:bg-primary hover:text-on-primary transition-colors"
              >
                Inquire With Concierge
              </button>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="px-4 py-3 rounded bg-surface-container text-xs font-sans tracking-wider uppercase text-on-surface-variant hover:text-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Atelier Consultation Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      />
    </div>
  );
};
