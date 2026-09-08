import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';

export const CartPage: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    promoCode,
    discountAmount,
    applyPromoCode,
    removePromoCode
  } = useCart();
  const { storeSettings } = useStoreSettings();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [giftBoxEnabled, setGiftBoxEnabled] = useState(true);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setIsApplyingPromo(true);
    const res = await applyPromoCode(inputCode);
    setPromoMessage(res.message);
    setIsApplyingPromo(false);
  };

  const freeThreshold = storeSettings?.freeShippingThreshold || 150;
  const standardFee = storeSettings?.standardShippingFee || 15;
  const taxPercent = (storeSettings?.taxRate || 8.5) / 100;

  const shippingFee = (subtotal - discountAmount) >= freeThreshold ? 0 : standardFee;
  const tax = parseFloat(((subtotal - discountAmount) * taxPercent).toFixed(2));
  const finalTotal = parseFloat((subtotal - discountAmount + shippingFee + tax).toFixed(2));

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
      {/* Title */}
      <div className="mb-8 pb-6 border-b border-secondary/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-[1px] bg-secondary" />
          <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">
            Curated Bag
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal">
          Your Shopping Bag &amp; Ritual Selection
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-surface-container-lowest border border-secondary/15 rounded-xl p-16 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-outline mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">shopping_bag</span>
          </div>
          <h2 className="font-serif text-2xl text-primary mb-2">Your Bag is Empty</h2>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mb-8 font-light">
            You have not yet invited any Place Vendôme botanical elixirs or golden infusive treatments to your ritual.
          </p>
          <Link
            to="/catalog"
            className="bg-primary text-on-primary px-8 py-3.5 rounded text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-all shadow-md inline-block"
          >
            Discover Haute Formulations
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-container-lowest border border-secondary/15 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-surface-container-low/40 border-b border-surface-container grid grid-cols-12 text-[10px] uppercase tracking-wider text-outline font-semibold">
                <span className="col-span-6">Formulation</span>
                <span className="col-span-2 text-center">Unit Price</span>
                <span className="col-span-2 text-center">Quantity</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              <div className="divide-y divide-surface-container">
                {items.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.selectedShade?.name || idx}`}
                    className="p-4 sm:p-6 grid grid-cols-12 gap-4 items-center"
                  >
                    {/* Item info */}
                    <div className="col-span-12 sm:col-span-6 flex gap-4 items-center">
                      <img
                        src={item.product.image_url}
                        alt={item.product.title}
                        className="w-20 h-24 object-cover rounded bg-surface-container-low shrink-0"
                      />
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block mb-0.5">
                          {item.product.category}
                        </span>
                        <Link
                          to={`/product/${item.product.id}`}
                          className="font-serif text-sm text-primary font-medium hover:text-secondary leading-snug line-clamp-2"
                        >
                          {item.product.title}
                        </Link>
                        {item.selectedShade && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-on-surface-variant">
                            <span
                              className="w-3 h-3 rounded-full border border-black/10"
                              style={{ backgroundColor: item.selectedShade.hex }}
                            />
                            <span>{item.selectedShade.name}</span>
                          </div>
                        )}
                        <span className="text-[11px] text-outline block mt-0.5">{item.product.volume}</span>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-4 sm:col-span-2 text-left sm:text-center">
                      <span className="font-serif text-sm text-primary">
                        ${item.product.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="col-span-4 sm:col-span-2 flex items-center justify-center">
                      <div className="flex items-center border border-secondary/30 rounded bg-white">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedShade?.name)}
                          className="px-2.5 py-1 text-xs text-primary hover:bg-surface-container-low"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-semibold text-primary">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedShade?.name)}
                          className="px-2.5 py-1 text-xs text-primary hover:bg-surface-container-low"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Line total & remove */}
                    <div className="col-span-4 sm:col-span-2 text-right">
                      <span className="font-serif text-base font-semibold text-primary block">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.product.id, item.selectedShade?.name)}
                        className="text-[10px] text-outline hover:text-error uppercase tracking-wider underline mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gift Wrap Notice */}
            <div className="p-4 bg-surface-container-lowest border border-secondary/20 rounded-xl flex items-start gap-4 shadow-sm">
              <span className="material-symbols-outlined text-secondary text-2xl">featured_seasonal_and_gifts</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-medium text-primary">
                    Signature Place Vendôme Wax-Sealed Gifting Box
                  </h4>
                  <input
                    type="checkbox"
                    checked={giftBoxEnabled}
                    onChange={e => setGiftBoxEnabled(e.target.checked)}
                    className="accent-secondary h-4 w-4"
                  />
                </div>
                <p className="text-xs text-on-surface-variant font-light mt-1">
                  Enclosed in gold-threaded ivory paper with hand-poured burgundy sealing wax and 3 tailored miniature samples. Complimentary for our patrons.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl p-6 shadow-gold-sm space-y-4">
              <h3 className="font-serif text-lg text-primary font-medium pb-3 border-b border-surface-container">
                Order Summary
              </h3>

              {/* Promo Code Box */}
              <form onSubmit={handleApplyPromo} className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-outline font-semibold">
                  Promotional or Concierge Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. LUMIERE"
                    value={inputCode}
                    onChange={e => setInputCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                  />
                  <button
                    type="submit"
                    className="bg-primary text-on-primary px-4 py-2 rounded text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p className="text-[10px] text-secondary font-medium">{promoMessage}</p>
                )}
              </form>

              {/* Calculation lines */}
              <div className="space-y-2.5 pt-2 border-t border-surface-container text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Bag Subtotal</span>
                  <span className="font-serif font-medium text-primary">${subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-secondary font-semibold">
                    <span>Maison Privilege ({promoCode})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-on-surface-variant">
                  <span>White-Glove Courier</span>
                  <span className="font-serif font-medium text-primary">
                    {shippingFee === 0 ? 'Complimentary' : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-on-surface-variant">
                  <span>Estimated Sales Tax</span>
                  <span className="font-serif font-medium text-primary">${tax.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-secondary/20 flex justify-between items-baseline text-base">
                  <span className="font-serif uppercase tracking-wider text-xs font-semibold text-primary">
                    Total Due
                  </span>
                  <span className="font-serif text-2xl font-bold text-primary">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary text-on-primary py-4 rounded text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center gap-2 mt-4"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">lock</span>
                <span>Proceed to Checkout</span>
              </button>

              <div className="flex items-center justify-center gap-3 text-[10px] text-outline uppercase tracking-wider pt-2">
                <span>Secure SSL Gateway</span>
                <span>•</span>
                <span>White Glove Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
