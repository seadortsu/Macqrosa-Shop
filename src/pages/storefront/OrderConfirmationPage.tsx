import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Order } from '../../types';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    const paystackReference = searchParams.get('reference') || searchParams.get('trxref');
    const pendingOrderStr = sessionStorage.getItem('mq_pending_order');

    const verifyAndLoad = async () => {
      try {
        // If returning from Paystack with a reference, verify the payment first
        if (paystackReference && pendingOrderStr) {
          setVerifyingPayment(true);
          const pendingOrder = JSON.parse(pendingOrderStr);

          const token = localStorage.getItem('mq_customer_token');
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await fetch('/api/payments/verify', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              reference: paystackReference,
              orderId: pendingOrder.orderId,
            }),
          });

          sessionStorage.removeItem('mq_pending_order');
          setVerifyingPayment(false);

          // Load order details using stored order number
          const orderNum = pendingOrder.orderNumber || orderNumber;
          if (orderNum) {
            const res = await fetch(`/api/orders/${orderNum}`);
            const data = await res.json();
            setOrder(data);
          }
        } else if (orderNumber) {
          // Direct navigation — just load the order
          const res = await fetch(`/api/orders/${orderNumber}`);
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error('Order confirmation error:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoad();
  }, [orderNumber, searchParams]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-serif text-on-surface-variant">
        {verifyingPayment ? 'Verifying your payment with Paystack...' : 'Verifying Place Vendôme Dispatch Registry...'}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="font-serif text-2xl text-primary mb-2">Order Not Found</h2>
        <p className="text-xs text-on-surface-variant mb-6 font-light">
          We could not locate this order identification in our transmission archives.
        </p>
        <Link to="/" className="bg-primary text-on-primary px-6 py-2.5 rounded text-xs uppercase tracking-widest font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-12 animate-fade-in">
      {/* Success Badge */}
      <div className="bg-surface-container-lowest border border-secondary/30 rounded-2xl p-8 sm:p-12 text-center shadow-gold-md relative overflow-hidden mb-8">
        <div className="w-16 h-16 rounded-full bg-secondary-fixed/40 text-secondary flex items-center justify-center mx-auto mb-4 border border-secondary/30">
          <span className="material-symbols-outlined text-3xl">done_all</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-6 h-[1px] bg-secondary" />
          <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">
            Order Confirmed &amp; In Preparation
          </span>
          <span className="w-6 h-[1px] bg-secondary" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal mb-2">
          Merci Pour Votre Confiance
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant font-light max-w-md mx-auto mb-6">
          Your bespoke order has been entered into the Place Vendôme laboratory queue. Our cosmeticians are hand-assembling your gold wax-sealed coffret.
        </p>

        {/* Tracking & Order Details Box */}
        <div className="bg-surface-container-low/70 border border-secondary/20 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block mb-0.5 font-semibold">
              Order Reference
            </span>
            <span className="font-serif text-base font-bold text-primary">{order.order_number}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block mb-0.5 font-semibold">
              FedEx Tracking ID
            </span>
            <span className="font-mono text-xs font-semibold text-secondary block truncate">
              {order.tracking_number || 'Pending Generation'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block mb-0.5 font-semibold">
              Dispatch Protocol
            </span>
            <span className="text-emerald-700 font-semibold uppercase text-[11px] block">
              White-Glove Courier
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Receipt */}
      <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="font-serif text-lg text-primary font-medium pb-3 border-b border-surface-container">
          Dispatch Manifest
        </h3>

        <div className="divide-y divide-surface-container">
          {order.items && order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.product_title}
                    className="w-12 h-14 object-cover rounded bg-surface-container-low shrink-0"
                  />
                )}
                <div>
                  <h4 className="font-serif text-xs font-medium text-primary leading-tight">
                    {item.product_title}
                  </h4>
                  <span className="text-[10px] text-outline">
                    Qty: {item.quantity} • ${(item.product_price).toFixed(2)} each
                  </span>
                </div>
              </div>

              <span className="font-serif text-sm font-semibold text-primary">
                ${item.total_price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-4 border-t border-surface-container space-y-2 text-xs">
          <div className="flex justify-between text-on-surface-variant">
            <span>Subtotal</span>
            <span className="font-serif font-medium text-primary">${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>Courier Shipping</span>
            <span className="font-serif font-medium text-primary">
              {order.shipping_fee === 0 ? 'Complimentary' : `$${order.shipping_fee.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>Tax</span>
            <span className="font-serif font-medium text-primary">${order.tax.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-secondary/20 flex justify-between items-baseline">
            <span className="font-semibold text-primary uppercase tracking-wider text-xs">Amount Authorized</span>
            <span className="font-serif text-2xl font-bold text-primary">${order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Destination */}
        <div className="p-4 rounded-lg bg-surface-container-low border border-secondary/10 text-xs">
          <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block mb-1">
            Shipping Destination
          </span>
          <p className="font-medium text-primary">{order.customer_name}</p>
          <p className="text-on-surface-variant">{order.shipping_address.addressLine1} {order.shipping_address.addressLine2}</p>
          <p className="text-on-surface-variant">{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}</p>
          <p className="text-on-surface-variant">{order.shipping_address.country}</p>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Link
            to="/account"
            className="flex-1 bg-primary text-on-primary py-3 rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors text-center"
          >
            Track in Atelier Account
          </Link>
          <Link
            to="/catalog"
            className="border border-secondary/40 text-primary py-3 px-6 rounded text-xs uppercase tracking-widest font-semibold hover:bg-surface-container-low transition-colors text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};
