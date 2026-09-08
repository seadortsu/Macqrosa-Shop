import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ProductImage } from './ProductImage';

export const CartDrawer: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    discountAmount,
    promoCode,
    isCartOpen,
    setIsCartOpen
  } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const threshold = 150;
  const remainingForFreeShipping = Math.max(0, threshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / threshold) * 100);

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleViewFullCart = () => {
    setIsCartOpen(false);
    navigate('/cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      {/* Slide Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-container-lowest border-l border-secondary/20 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-surface-container flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">shopping_bag</span>
              <h2 className="font-serif text-lg text-primary uppercase tracking-wider font-medium">Your Shopping Bag</h2>
              <span className="text-xs text-on-surface-variant font-medium">
                ({items.reduce((s, i) => s + i.quantity, 0)})
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-outline hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Complimentary Shipping Progress */}
          <div className="px-6 py-3 bg-surface-container-low/60 border-b border-secondary/10">
            {remainingForFreeShipping > 0 ? (
              <p className="text-xs text-on-surface-variant font-light mb-1.5">
                Add <span className="font-semibold text-primary">${remainingForFreeShipping.toFixed(2)}</span> more to unlock complimentary White-Glove Courier.
              </p>
            ) : (
              <p className="text-xs text-secondary font-medium mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Complimentary White-Glove Courier unlocked!
              </p>
            )}
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-secondary via-secondary-gold to-secondary-fixed h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant py-12">
                <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-outline mb-4">
                  <span className="material-symbols-outlined text-3xl">shopping_bag</span>
                </div>
                <h3 className="font-serif text-base text-primary mb-1">Your bag is empty</h3>
                <p className="text-xs text-outline max-w-xs mb-6">
                  Explore our Place Vendôme formulations and invite cellular luminosity to your vanity.
                </p>
                <button
                  onClick={() => { setIsCartOpen(false); navigate('/catalog'); }}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded text-xs uppercase tracking-widest font-medium hover:bg-neutral-800 transition-all"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={`${item.product.id}-${item.selectedShade?.name || idx}`}
                  className="flex gap-4 p-3 rounded-lg border border-surface-container hover:border-secondary/30 transition-colors bg-white shadow-xs"
                >
                  <div className="w-20 h-24 rounded overflow-hidden bg-surface-container-low shrink-0 border border-secondary/15">
                    <ProductImage
                      src={item.product.image_url}
                      alt={item.product.title}
                      fallbackTitle={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif text-xs font-medium text-primary leading-tight line-clamp-2">
                          {item.product.title}
                        </h4>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedShade?.name)}
                          className="text-outline hover:text-error p-0.5"
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>

                      {item.selectedShade && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-on-surface-variant">
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: item.selectedShade.hex }}
                          />
                          <span>{item.selectedShade.name}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-outline mt-0.5">{item.product.volume}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container-low">
                      {/* Quantity selector */}
                      <div className="flex items-center border border-secondary/20 rounded">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedShade?.name)}
                          className="px-2 py-0.5 text-xs text-on-surface hover:bg-surface-container-low"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-medium text-primary">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedShade?.name)}
                          className="px-2 py-0.5 text-xs text-on-surface hover:bg-surface-container-low"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-serif text-sm font-semibold text-primary">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-6 bg-surface-container-lowest border-t border-surface-container shadow-lg space-y-4">
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-secondary font-medium">
                  <span>Maison Promo ({promoCode})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant uppercase tracking-wider text-xs">Subtotal</span>
                <span className="font-serif text-lg font-semibold text-primary">
                  ${(subtotal - discountAmount).toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleProceedCheckout}
                  className="w-full bg-primary text-on-primary py-3.5 rounded text-xs uppercase tracking-[0.18em] font-semibold hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed">lock</span>
                  <span>Secure Checkout</span>
                </button>

                <button
                  onClick={handleViewFullCart}
                  className="w-full border border-secondary/40 text-primary py-2.5 rounded text-xs uppercase tracking-[0.14em] font-medium hover:bg-surface-container-low transition-colors"
                >
                  Review Bag &amp; Gifting Options
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-400 uppercase tracking-widest pt-2">
                <span>🔒 256-Bit SSL Encrypted</span>
                <span>•</span>
                <span>White Glove Guarantee</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
