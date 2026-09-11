import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ProductImage } from '../../components/common/ProductImage';
import { useStoreSettings } from '../../context/StoreSettingsContext';

export const ProductDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedShade, setSelectedShade] = useState<{ name: string; hex: string } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string>('clinical');
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddedAnimation, setIsAddedAnimation] = useState(false);

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const { addItem } = useCart();
  const { customer } = useAuth();
  const { productpageCms } = useStoreSettings();

  const fetchProduct = () => {
    if (!idOrSlug) return;
    setLoading(true);
    fetch(`/api/products/${idOrSlug}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setSelectedImage(data.image_url);
        if (data.shades && data.shades.length > 0) {
          setSelectedShade(data.shades[0]);
        }
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load product detail:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [idOrSlug]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity, selectedShade || undefined);
      setIsAddedAnimation(true);
      setTimeout(() => setIsAddedAnimation(false), 2000);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setReviewSubmitting(true);

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customer ? { Authorization: `Bearer ${localStorage.getItem('mq_customer_token')}` } : {})
        },
        body: JSON.stringify({
          customerName: reviewerName || (customer ? `${customer.firstName} ${customer.lastName}` : 'Anonymous Patron'),
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment
        })
      });

      if (res.ok) {
        setReviewSuccess(true);
        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewSuccess(false);
          setReviewTitle('');
          setReviewComment('');
          fetchProduct();
        }, 1500);
      }
    } catch (err) {
      console.error('Review submit error:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-serif text-lg text-on-surface-variant">
        Accessing Place Vendôme Formulation Archive...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-serif text-2xl text-primary mb-2">Formulation Dossier Not Found</h2>
        <p className="text-sm text-on-surface-variant mb-6">The requested formulation archive may have been retired or restricted.</p>
        <Link to="/catalog" className="btn-gold-luxury px-6 py-2.5 rounded text-xs uppercase tracking-widest">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const galleryList = product.gallery && product.gallery.length > 0
    ? [product.image_url, ...product.gallery]
    : [product.image_url];

  const klarnaInstallment = ((selectedVariant ? product.price + selectedVariant.price_modifier : product.price) / 4).toFixed(2);
  const displayPrice = selectedVariant ? product.price + selectedVariant.price_modifier : product.price;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Maison</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-primary transition-colors">Catalog</Link>
        <span>/</span>
        <Link to={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:text-primary transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-primary font-medium truncate">{product.title}</span>
      </nav>

      {/* Main 2-Column Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
        {/* LEFT COLUMN: Gallery with Thumbnail Strip & Sensorial Foot Ribbon */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnail Strip */}
          {galleryList.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-20 shrink-0">
              {galleryList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all shrink-0 ${
                    selectedImage === img
                      ? 'ring-2 ring-secondary-gold ring-offset-2 scale-95 shadow-sm'
                      : 'border border-secondary/20 opacity-70 hover:opacity-100'
                  }`}
                >
                  <ProductImage src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Stage Image Canvas */}
          <div className="relative flex-1 bg-surface-container-low rounded-xl overflow-hidden group shadow-md border border-secondary/15">
            {/* Award Badge Ribbon */}
            {productpageCms?.trustBadgeText && (
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 items-start pointer-events-none">
                <div className="bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-secondary/20">
                  <span className="material-symbols-outlined text-[16px]" style={{ color: productpageCms.highlightColor }}>award_star</span>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface font-semibold">
                    {productpageCms.trustBadgeText}
                  </span>
                </div>
              </div>
            )}

            {/* Wishlist Icon */}
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              aria-label="Save formulation to wishlist"
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-on-surface flex items-center justify-center hover:bg-surface-container-lowest transition-colors shadow-sm"
            >
              <span
                className={`material-symbols-outlined text-[19px] ${
                  isWishlisted ? 'text-red-500 material-symbols-filled' : 'text-on-surface-variant'
                }`}
              >
                favorite
              </span>
            </button>

            {/* Main Image Viewport */}
            <div className="relative w-full aspect-[4/5] overflow-hidden bg-surface-container-low flex items-center justify-center">
              <ProductImage
                src={selectedImage}
                alt={product.title}
                fallbackTitle={product.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>

            {/* Sensorial Ribbon on Image Foot */}
            <div className="absolute bottom-4 inset-x-4 bg-surface-container-lowest/90 backdrop-blur-xl p-3 rounded-lg shadow-sm flex flex-wrap items-center justify-between text-on-surface text-xs border border-secondary/15">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">spa</span>
                <span className="text-[10px] uppercase tracking-wider font-medium">
                  Texture: {product.sensorial_texture || 'Cashmere Nectar'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">view_in_ar_new</span>
                <span className="text-[10px] uppercase tracking-wider font-medium">
                  Notes: {product.sensorial_fragrance || 'Wild Camellia • Neroli'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-secondary">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                  Certified Pure
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Haute Skincare Dossier */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Brand Line & Editorial Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">
                HIGH PERFORMANCE BIO-TECH • PARIS ATELIER
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal tracking-tight mb-2">
              {product.title}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant font-light leading-relaxed">
              {product.subtitle || 'Bio-Fermented 24K Gold & Alpine Camellia Radiance Elixir'}
            </p>
          </div>

          {/* Social Proof & Stock Metric Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-secondary">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <span className="text-xs font-semibold text-primary">{product.rating}</span>
              <a
                href="#client-reviews"
                className="text-xs text-on-surface-variant hover:text-secondary underline underline-offset-4 transition-colors"
              >
                ({product.reviews_count} Verified Patron Reviews)
              </a>
            </div>

            {/* In Stock Pulse Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface text-[10px] tracking-wider uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>In-Stock • Ready for Dispatch</span>
            </div>
          </div>

          {/* Price & Split-Pay Module */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-secondary/15 space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-normal text-primary">
                  ${displayPrice.toFixed(2)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">USD</span>
                {product.compare_at_price && (
                  <span className="text-xs line-through text-outline ml-1">
                    ${product.compare_at_price.toFixed(2)}
                  </span>
                )}
              </div>
              {productpageCms?.shippingText && (
                <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded" style={{ backgroundColor: `${productpageCms.highlightColor}20`, color: productpageCms.highlightColor }}>
                  {productpageCms.shippingText}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 font-light">
              <span>Or 4 interest-free payments of</span>
              <span className="font-medium text-on-surface">${klarnaInstallment}</span>
              <span>with</span>
              <span className="font-medium tracking-wide text-primary">Klarna</span>
              <span>or</span>
              <span className="font-medium tracking-wide text-primary">Afterpay</span>
            </p>
          </div>

          {/* Formulation Virtue Chips */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded bg-surface-container text-on-surface text-[10.5px] uppercase tracking-wider font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-secondary">eco</span> 100% Vegan
            </span>
            <span className="px-3 py-1 rounded bg-surface-container text-on-surface text-[10.5px] uppercase tracking-wider font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-secondary">clean_hands</span> Clean Luxury
            </span>
            <span className="px-3 py-1 rounded bg-surface-container text-on-surface text-[10.5px] uppercase tracking-wider font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-secondary">block</span> Paraben-Free
            </span>
            <span className="px-3 py-1 rounded bg-surface-container text-on-surface text-[10.5px] uppercase tracking-wider font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-secondary">medical_services</span> Dermatologist Verified
            </span>
          </div>

          {product.variants && product.variants.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-widest font-semibold text-primary">Formulation Size / Variant</span>
                <span className="text-secondary font-serif italic text-xs">Standard Salon Measure</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`py-2.5 px-3 rounded text-xs uppercase tracking-wider font-medium transition-all text-center border flex flex-col items-center justify-center gap-1 ${
                      selectedVariant?.id === v.id
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface border-secondary/15 hover:border-secondary/40'
                    }`}
                  >
                    <span>{v.variant_label}</span>
                    {v.price_modifier > 0 && <span className="text-[9px] opacity-80">+${v.price_modifier.toFixed(2)}</span>}
                    {v.price_modifier < 0 && <span className="text-[9px] opacity-80">-${Math.abs(v.price_modifier).toFixed(2)}</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-widest font-semibold text-primary">Volume Allocation</span>
                <span className="text-secondary font-serif italic text-xs">Standard Salon Measure</span>
              </div>
              <div className="py-2.5 px-3 rounded text-xs uppercase tracking-wider font-medium text-center border bg-primary text-white border-primary shadow-sm">
                {product.volume || '50ml Master Flacon'}
              </div>
            </div>
          )}

          {/* Shade Selector if present */}
          {product.shades && product.shades.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-widest font-semibold text-primary">
                  Selected Shade: <span className="font-normal text-secondary">{selectedShade?.name}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {product.shades.map((shade, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedShade(shade)}
                    className={`w-7 h-7 rounded-full transition-all flex items-center justify-center border border-black/15 shadow-xs ${
                      selectedShade?.name === shade.name
                        ? 'ring-2 ring-secondary-gold ring-offset-2 scale-110 shadow-sm'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: shade.hex }}
                    title={shade.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Acquire Add to Bag Button */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center border border-secondary/25 rounded bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-3 text-on-surface hover:text-secondary transition-colors"
              >
                -
              </button>
              <span className="w-10 text-center text-xs font-semibold text-primary">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3.5 py-3 text-on-surface hover:text-secondary transition-colors"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 py-4 px-6 rounded text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-gold-md ${
                isAddedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-primary text-on-primary hover:bg-neutral-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isAddedAnimation ? 'check_circle' : 'shopping_bag'}
              </span>
              <span>
                {isAddedAnimation ? 'Added to Sacred Bag' : `Acquire Formulation • $${(displayPrice * quantity).toFixed(2)}`}
              </span>
            </button>
          </div>

          {/* Collapsible Dossier Accordions */}
          <div className="pt-4 border-t border-surface-container space-y-3">
            {/* Accordion 1: Clinical Efficacy */}
            <div className="border border-secondary/15 rounded-lg overflow-hidden bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'clinical' ? '' : 'clinical')}
                className="w-full p-4 flex items-center justify-between text-left font-serif text-sm font-medium text-primary hover:text-secondary transition-colors"
              >
                <span>Clinical Efficacy &amp; Bio-Metrics</span>
                <span className="material-symbols-outlined text-[18px]">
                  {activeAccordion === 'clinical' ? 'remove' : 'add'}
                </span>
              </button>
              {activeAccordion === 'clinical' && (
                <div className="p-4 pt-0 text-xs text-on-surface-variant font-light leading-relaxed border-t border-surface-container/50 space-y-2">
                  <p>
                    {product.benefits ||
                      'Tested across 140 women over 28 days. Measured +99.4% increase in cellular luminosity and deep tissue hydration with immediate trans-epidermal moisture retention.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 rounded bg-surface-container-low">
                      <span className="block font-serif text-lg text-primary font-medium">99.4%</span>
                      <span className="text-[10px] uppercase text-outline">Cellular Luminosity</span>
                    </div>
                    <div className="p-2.5 rounded bg-surface-container-low">
                      <span className="block font-serif text-lg text-primary font-medium">24h</span>
                      <span className="text-[10px] uppercase text-outline">Continuous Hydration</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Phyto-Botanical Ingredients */}
            <div className="border border-secondary/15 rounded-lg overflow-hidden bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'ingredients' ? '' : 'ingredients')}
                className="w-full p-4 flex items-center justify-between text-left font-serif text-sm font-medium text-primary hover:text-secondary transition-colors"
              >
                <span>Rare Botanical Ingredients &amp; Colloidal Gold</span>
                <span className="material-symbols-outlined text-[18px]">
                  {activeAccordion === 'ingredients' ? 'remove' : 'add'}
                </span>
              </button>
              {activeAccordion === 'ingredients' && (
                <div className="p-4 pt-0 text-xs text-on-surface-variant font-light leading-relaxed border-t border-surface-container/50">
                  <p className="font-mono text-[11px] leading-relaxed">
                    {product.ingredients ||
                      'Aqua (Water), 24K Gold Suspension (Aurum Colloidal), Camellia Japonica Seed Oil, Squalane, Rosa Damascena Flower Extract, Niacinamide, Palmitoyl Tripeptide-5, Hyaluronic Acid, Tocopherol.'}
                  </p>
                </div>
              )}
            </div>

            {/* Accordion 3: Ritual Application */}
            <div className="border border-secondary/15 rounded-lg overflow-hidden bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'ritual' ? '' : 'ritual')}
                className="w-full p-4 flex items-center justify-between text-left font-serif text-sm font-medium text-primary hover:text-secondary transition-colors"
              >
                <span>Atelier Application Ritual</span>
                <span className="material-symbols-outlined text-[18px]">
                  {activeAccordion === 'ritual' ? 'remove' : 'add'}
                </span>
              </button>
              {activeAccordion === 'ritual' && (
                <div className="p-4 pt-0 text-xs text-on-surface-variant font-light leading-relaxed border-t border-surface-container/50 space-y-1.5">
                  <p>1. Warm 3 to 4 drops between palms to activate colloidal gold suspension.</p>
                  <p>2. Gently press onto cleansed décolletage, neck, and complexion.</p>
                  <p>3. Massage in upward sweeping strokes to stimulate micro-circulation.</p>
                </div>
              )}
            </div>

            {/* Accordion 4: Guarantee */}
            {(productpageCms?.guaranteeText || productpageCms?.returnPolicyText) && (
              <div className="border border-secondary/15 rounded-lg overflow-hidden bg-surface-container-lowest">
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'guarantee' ? '' : 'guarantee')}
                  className="w-full p-4 flex items-center justify-between text-left font-serif text-sm font-medium text-primary hover:text-secondary transition-colors"
                >
                  <span>Maison Guarantee</span>
                  <span className="material-symbols-outlined text-[18px]">
                    {activeAccordion === 'guarantee' ? 'remove' : 'add'}
                  </span>
                </button>
                {activeAccordion === 'guarantee' && (
                  <div className="p-4 pt-0 text-xs text-on-surface-variant font-light leading-relaxed border-t border-surface-container/50 space-y-1.5">
                    {productpageCms.guaranteeText && <p className="font-semibold">{productpageCms.guaranteeText}</p>}
                    {productpageCms.returnPolicyText && <p>{productpageCms.returnPolicyText}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Reviews Section */}
      <section id="client-reviews" className="mt-24 pt-12 border-t border-secondary/20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold block mb-1">
              Patron Testimonials
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-primary font-normal">
              Verified Client Reviews ({product.reviews_count})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="mt-3 md:mt-0 px-5 py-2.5 bg-secondary text-on-secondary rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
          >
            Submit Salon Review
          </button>
        </div>

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map(rev => (
              <div
                key={rev.id}
                className="bg-surface-container-lowest p-6 rounded-xl border border-secondary/15 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-secondary">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: i < rev.rating ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-outline">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-serif text-base text-primary font-medium">{rev.title}</h4>
                <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                  "{rev.comment}"
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-outline border-t border-surface-container/60">
                  <span className="font-medium text-primary">{rev.customer_name}</span>
                  <span>•</span>
                  <span className="text-secondary font-semibold uppercase tracking-wider text-[10px]">
                    {rev.customer_tier || 'Circle Privé'}
                  </span>
                  <span className="inline-flex items-center text-emerald-600 ml-auto gap-0.5 text-[10px]">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Verified Purchase
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-12 text-center text-on-surface-variant font-serif text-base">
              Be the first patron to review this masterwork formulation.
            </div>
          )}
        </div>
      </section>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl border border-secondary/30 p-6 sm:p-8 w-full max-w-lg shadow-gold-lg animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Salon Experience</span>
                <h3 className="font-serif text-xl text-primary font-medium">Review {product.title}</h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-2">
                <span className="material-symbols-outlined text-emerald-600 text-[40px]">check_circle</span>
                <h4 className="font-serif text-lg text-primary">Merci Beaucoup</h4>
                <p className="text-xs text-on-surface-variant">Your salon review has been appended to the formulation archive.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-primary mb-1">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1 text-amber-500 cursor-pointer">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1"
                      >
                        <span
                          className="material-symbols-outlined text-[24px]"
                          style={{ fontVariationSettings: star <= reviewRating ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-primary mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Madame / Monsieur"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-primary mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unrivalled radiance and delicate texture"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-primary mb-1">
                    Your Impression &amp; Sensorial Experience
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe the application, immediate skin feel, and longevity..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-4 py-2 rounded text-xs uppercase tracking-wider text-outline hover:text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="bg-primary text-on-primary px-6 py-2.5 rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    {reviewSubmitting ? 'Archiving...' : 'Publish Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
