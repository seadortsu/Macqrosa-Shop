import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedShade?: { name: string; hex: string }) => void;
  removeItem: (productId: number, shadeName?: string) => void;
  updateQuantity: (productId: number, quantity: number, shadeName?: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  promoCode: string;
  discountAmount: number;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mq_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('LUMIERE');
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    localStorage.setItem('mq_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1, selectedShade?: { name: string; hex: string }) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(
        it => it.product.id === product.id && it.selectedShade?.name === selectedShade?.name
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, quantity, selectedShade }];
      }
    });
    setIsCartOpen(true);
  };

  const removeItem = (productId: number, shadeName?: string) => {
    setItems(prev =>
      prev.filter(
        it => !(it.product.id === productId && it.selectedShade?.name === shadeName)
      )
    );
  };

  const updateQuantity = (productId: number, quantity: number, shadeName?: string) => {
    if (quantity <= 0) {
      removeItem(productId, shadeName);
      return;
    }

    setItems(prev =>
      prev.map(it => {
        if (it.product.id === productId && it.selectedShade?.name === shadeName) {
          return { ...it, quantity };
        }
        return it;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);

  // Recalculate discount whenever subtotal or promoCode changes
  useEffect(() => {
    if (!promoCode || subtotal === 0) {
      setDiscountAmount(0);
      return;
    }

    fetch('/api/promos/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoCode, subtotal })
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.discountAmount !== undefined) {
          setDiscountAmount(data.discountAmount);
        } else if (promoCode.toUpperCase() === 'LUMIERE') {
          // Fallback if promo table not yet refreshed
          setDiscountAmount(Math.round(subtotal * 0.15 * 100) / 100);
        } else {
          setDiscountAmount(0);
        }
      })
      .catch(() => {
        if (promoCode.toUpperCase() === 'LUMIERE') {
          setDiscountAmount(Math.round(subtotal * 0.15 * 100) / 100);
        }
      });
  }, [promoCode, subtotal]);

  const applyPromoCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a voucher or promo code.' };
    }

    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, subtotal })
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setPromoCode(data.code);
        setDiscountAmount(data.discountAmount);
        const desc = data.discountType === 'percentage' ? `${data.discountValue}% off` : `$${data.discountValue} off`;
        return { success: true, message: `Privilege code "${data.code}" applied! (${desc})` };
      } else {
        return { success: false, message: data.error || 'Invalid or expired promo code.' };
      }
    } catch {
      // Fallback check
      if (cleanCode === 'LUMIERE') {
        setPromoCode('LUMIERE');
        setDiscountAmount(Math.round(subtotal * 0.15 * 100) / 100);
        return { success: true, message: 'Privilege code "LUMIERE" applied! (15% VIP discount)' };
      }
      return { success: false, message: 'Unable to validate code. Please try again.' };
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setDiscountAmount(0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        promoCode,
        discountAmount,
        applyPromoCode,
        removePromoCode,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
