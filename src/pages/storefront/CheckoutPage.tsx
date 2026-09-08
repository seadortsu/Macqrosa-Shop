import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, discountAmount, promoCode, clearCart } = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Identification
  const [email, setEmail] = useState(customer?.email || '');
  const [firstName, setFirstName] = useState(customer?.firstName || '');
  const [lastName, setLastName] = useState(customer?.lastName || '');
  const [phone, setPhone] = useState(customer?.phone || '');

  // Step 2: Delivery & Address
  const defaultAddr = customer?.addresses?.[0];
  const [addressLine1, setAddressLine1] = useState(defaultAddr?.address_line1 || '');
  const [addressLine2, setAddressLine2] = useState(defaultAddr?.address_line2 || '');
  const [city, setCity] = useState(defaultAddr?.city || 'New York');
  const [state, setState] = useState(defaultAddr?.state || 'NY');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postal_code || '10021');
  const [country, setCountry] = useState(defaultAddr?.country || 'United States');
  const [shippingSpeed, setShippingSpeed] = useState<'standard' | 'express'>('standard');

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (Place Vendôme Gateway)');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvc, setCardCvc] = useState('842');

  const { storeSettings } = useStoreSettings();
  const freeThreshold = storeSettings?.freeShippingThreshold || 150;
  const standardFee = storeSettings?.standardShippingFee || 15;
  const taxPercent = (storeSettings?.taxRate || 8.5) / 100;

  const baseShipping = (subtotal - discountAmount) >= freeThreshold ? 0 : standardFee;
  const shippingFee = shippingSpeed === 'express' ? baseShipping + 35 : baseShipping;
  const tax = parseFloat(((subtotal - discountAmount) * taxPercent).toFixed(2));
  const finalTotal = parseFloat((subtotal - discountAmount + shippingFee + tax).toFixed(2));

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setErrorMessage('');

    const payload = {
      items: items.map(it => ({
        productId: it.product.id,
        quantity: it.quantity,
        price: it.product.price,
        title: it.product.title,
        imageUrl: it.product.image_url
      })),
      customerInfo: {
        firstName,
        lastName,
        email,
        phone
      },
      shippingAddress: {
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country
      },
      paymentMethod: 'Paystack',
      promoCode
    };

    try {
      const token = localStorage.getItem('mq_customer_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Step 1: Create the order (payment_status = pending)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setErrorMessage(orderData.error || 'Failed to place order.');
        setSubmitting(false);
        return;
      }

      // Step 2: Initialize Paystack payment
      const payRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          amount: orderData.order.totalAmount,
          orderId: orderData.order.id,
          metadata: {
            orderNumber: orderData.order.orderNumber,
            customerName: `${firstName} ${lastName}`.trim(),
          }
        })
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        // Paystack not configured — fall back to direct confirmation
        clearCart();
        navigate(`/order-confirmation/${orderData.order.orderNumber}`);
        return;
      }

      // Step 3: Store order info for verification on return and redirect to Paystack
      sessionStorage.setItem('mq_pending_order', JSON.stringify({
        orderId: orderData.order.id,
        orderNumber: orderData.order.orderNumber,
        reference: payData.reference,
      }));
      clearCart();
      window.location.href = payData.authorizationUrl;
    } catch (err) {
      setErrorMessage('Network transmission failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="font-serif text-2xl text-primary mb-2">No Active Ritual Items</h2>
        <p className="text-xs text-on-surface-variant font-light mb-6">
          Your shopping bag contains no formulations to checkout.
        </p>
        <Link to="/catalog" className="bg-primary text-on-primary px-6 py-2.5 rounded text-xs uppercase tracking-widest font-semibold">
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-secondary/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-[1px] bg-secondary" />
          <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">
            Private Atelier Gateway
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal">
          White Glove Secure Checkout
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Checkout Steps Column */}
        <div className="lg:col-span-2 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded bg-error-container/80 border border-error text-error text-xs">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Customer Information */}
          <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl overflow-hidden shadow-sm">
            <div
              onClick={() => setCurrentStep(1)}
              className="p-5 bg-surface-container-low/40 border-b border-surface-container flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 1 ? 'bg-primary text-white' : 'bg-secondary-gold text-white'
                }`}>
                  1
                </span>
                <h3 className="font-serif text-base text-primary font-medium">
                  Client Identification
                </h3>
              </div>
              {currentStep > 1 && (
                <span className="text-xs text-secondary font-medium">Completed ✓</span>
              )}
            </div>

            {currentStep === 1 && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Claire"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Sinclair"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">Email (For Dispatch &amp; Tracking)</label>
                    <input
                      type="email"
                      required
                      placeholder="claire@vendome.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 839-2910"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={!email || !firstName || !lastName}
                    onClick={() => setCurrentStep(2)}
                    className="bg-primary text-on-primary px-8 py-3 rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                  >
                    Continue to Delivery →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Shipping & Delivery Address */}
          <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl overflow-hidden shadow-sm">
            <div
              onClick={() => setCurrentStep(2)}
              className="p-5 bg-surface-container-low/40 border-b border-surface-container flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 2 ? 'bg-primary text-white' : currentStep > 2 ? 'bg-secondary-gold text-white' : 'bg-surface-container text-outline'
                }`}>
                  2
                </span>
                <h3 className="font-serif text-base text-primary font-medium">
                  Delivery &amp; White-Glove Shipping
                </h3>
              </div>
              {currentStep > 2 && (
                <span className="text-xs text-secondary font-medium">Completed ✓</span>
              )}
            </div>

            {currentStep === 2 && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="740 Park Avenue"
                    value={addressLine1}
                    onChange={e => setAddressLine1(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">Apartment, Suite, Private Residence</label>
                  <input
                    type="text"
                    placeholder="Suite 12B"
                    value={addressLine2}
                    onChange={e => setAddressLine2(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">City</label>
                    <input
                      type="text"
                      required
                      placeholder="New York"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">State / Province</label>
                    <input
                      type="text"
                      required
                      placeholder="NY"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">Postal Code</label>
                    <input
                      type="text"
                      required
                      placeholder="10021"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                {/* Delivery Option Selection */}
                <div className="pt-3 border-t border-surface-container space-y-2">
                  <span className="block text-[10px] uppercase tracking-wider text-outline font-semibold">
                    Select Courier Protocol
                  </span>

                  <label
                    onClick={() => setShippingSpeed('standard')}
                    className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                      shippingSpeed === 'standard' ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={shippingSpeed === 'standard'}
                        onChange={() => setShippingSpeed('standard')}
                        className="accent-secondary"
                      />
                      <div>
                        <p className="text-xs font-medium text-primary">Standard White-Glove Courier (2-3 Business Days)</p>
                        <p className="text-[11px] text-on-surface-variant font-light">Climate-controlled ground courier with wax-sealed signature delivery.</p>
                      </div>
                    </div>
                    <span className="font-serif text-xs font-semibold text-secondary">
                      {baseShipping === 0 ? 'Complimentary' : '$25.00'}
                    </span>
                  </label>

                  <label
                    onClick={() => setShippingSpeed('express')}
                    className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                      shippingSpeed === 'express' ? 'border-secondary bg-secondary/5 shadow-sm' : 'border-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={shippingSpeed === 'express'}
                        onChange={() => setShippingSpeed('express')}
                        className="accent-secondary"
                      />
                      <div>
                        <p className="text-xs font-medium text-primary">Priority Transatlantic Air Courier (Next Morning 10:30 AM)</p>
                        <p className="text-[11px] text-on-surface-variant font-light">Direct charter air dispatch from Paris Charles de Gaulle with VIP priority.</p>
                      </div>
                    </div>
                    <span className="font-serif text-xs font-semibold text-primary">
                      +${(baseShipping + 35).toFixed(2)}
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-outline hover:text-primary underline"
                  >
                    ← Back to Identity
                  </button>
                  <button
                    type="button"
                    disabled={!addressLine1 || !city || !state || !postalCode}
                    onClick={() => setCurrentStep(3)}
                    className="bg-primary text-on-primary px-8 py-3 rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Payment */}
          <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl overflow-hidden shadow-sm">
            <div
              onClick={() => setCurrentStep(3)}
              className="p-5 bg-surface-container-low/40 border-b border-surface-container flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 3 ? 'bg-primary text-white' : currentStep > 3 ? 'bg-secondary-gold text-white' : 'bg-surface-container text-outline'
                }`}>
                  3
                </span>
                <h3 className="font-serif text-base text-primary font-medium">
                  Payment Protocol
                </h3>
              </div>
              {currentStep > 3 && (
                <span className="text-xs text-secondary font-medium">Completed ✓</span>
              )}
            </div>

            {currentStep === 3 && (
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label
                    onClick={() => setPaymentMethod('Credit Card (Place Vendôme Gateway)')}
                    className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer ${
                      paymentMethod.includes('Credit Card') ? 'border-secondary bg-secondary/5' : 'border-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod.includes('Credit Card')}
                        onChange={() => {}}
                        className="accent-secondary"
                      />
                      <span className="text-xs font-medium text-primary">Credit / Debit Card (Encrypted)</span>
                    </div>
                    <span className="text-xs text-secondary font-semibold">Visa, MC, Amex</span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('Place Vendôme House Account')}
                    className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer ${
                      paymentMethod.includes('House Account') ? 'border-secondary bg-secondary/5' : 'border-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod.includes('House Account')}
                        onChange={() => {}}
                        className="accent-secondary"
                      />
                      <span className="text-xs font-medium text-primary">Place Vendôme House Account (Invoice Upon Delivery)</span>
                    </div>
                    <span className="text-xs text-secondary-fixed font-semibold bg-primary px-2 py-0.5 rounded text-[10px]">
                      Maison VIP
                    </span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('Apple Pay')}
                    className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer ${
                      paymentMethod === 'Apple Pay' ? 'border-secondary bg-secondary/5' : 'border-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === 'Apple Pay'}
                        onChange={() => {}}
                        className="accent-secondary"
                      />
                      <span className="text-xs font-medium text-primary">Apple Pay Direct</span>
                    </div>
                    <span className="text-xs text-outline font-medium">TouchID</span>
                  </label>
                </div>

                {paymentMethod.includes('Credit Card') && (
                  <div className="p-4 rounded bg-surface-container-low border border-secondary/20 space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-secondary/20 rounded text-xs text-primary font-mono outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">Expiration</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-secondary/20 rounded text-xs text-primary font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-outline mb-1">Security Code (CVC)</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-secondary/20 rounded text-xs text-primary font-mono outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-outline hover:text-primary underline"
                  >
                    ← Back to Shipping
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="bg-primary text-on-primary px-8 py-3 rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    Review Order →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: Order Review & Confirmation */}
          <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl overflow-hidden shadow-sm">
            <div
              onClick={() => setCurrentStep(4)}
              className="p-5 bg-surface-container-low/40 border-b border-surface-container flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 4 ? 'bg-primary text-white' : 'bg-surface-container text-outline'
                }`}>
                  4
                </span>
                <h3 className="font-serif text-base text-primary font-medium">
                  Review &amp; Place Order
                </h3>
              </div>
            </div>

            {currentStep === 4 && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-lg bg-surface-container-low border border-secondary/15">
                    <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block mb-1">
                      Recipient &amp; Delivery Destination
                    </span>
                    <p className="font-semibold text-primary">{firstName} {lastName}</p>
                    <p className="text-on-surface-variant">{addressLine1} {addressLine2}</p>
                    <p className="text-on-surface-variant">{city}, {state} {postalCode}</p>
                    <p className="text-on-surface-variant">{country}</p>
                    <p className="text-outline text-[11px] mt-1">{email} • {phone}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-container-low border border-secondary/15">
                    <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block mb-1">
                      Selected Payment &amp; Courier
                    </span>
                    <p className="font-semibold text-primary">{paymentMethod}</p>
                    <p className="text-on-surface-variant">
                      Courier: {shippingSpeed === 'express' ? 'Priority Transatlantic Air' : 'Standard White-Glove'}
                    </p>
                    <p className="text-emerald-700 font-medium mt-1">✓ Signature Wax Seal Included</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-container">
                  <button
                    disabled={submitting}
                    onClick={handlePlaceOrder}
                    className="w-full bg-primary text-on-primary py-4 rounded text-xs uppercase tracking-[0.24em] font-semibold hover:bg-neutral-800 transition-all shadow-gold-md flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined text-secondary-fixed">auto_awesome</span>
                    <span>{submitting ? 'Transmitting to Place Vendôme...' : `Authorize & Place Order • $${finalTotal.toFixed(2)}`}</span>
                  </button>
                  <p className="text-center text-[10px] text-outline mt-2 font-light">
                    By confirming your order, you agree to our Terms of Haute Sale and white-glove transport protocol.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Order Summary */}
        <div>
          <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl p-6 shadow-gold-sm space-y-4 sticky top-28">
            <h3 className="font-serif text-base text-primary font-medium pb-3 border-b border-surface-container flex items-center justify-between">
              <span>Your Selection</span>
              <span className="text-xs text-secondary font-sans font-semibold">({items.reduce((s, i) => s + i.quantity, 0)} Items)</span>
            </h3>

            {/* Line Items */}
            <div className="max-h-64 overflow-y-auto divide-y divide-surface-container space-y-3 pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 pt-3 items-center first:pt-0">
                  <img
                    src={item.product.image_url}
                    alt={item.product.title}
                    className="w-12 h-14 object-cover rounded bg-surface-container-low shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-xs text-primary font-medium truncate leading-tight">
                      {item.product.title}
                    </p>
                    <p className="text-[10px] text-outline">
                      Qty: {item.quantity} • {item.product.volume}
                    </p>
                  </div>
                  <span className="font-serif text-xs font-semibold text-primary">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculation */}
            <div className="pt-3 border-t border-surface-container space-y-2 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-serif text-primary">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-secondary font-semibold">
                  <span>VIP Discount ({promoCode})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Shipping</span>
                <span className="font-serif text-primary">
                  {shippingFee === 0 ? 'Complimentary' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Estimated Tax</span>
                <span className="font-serif text-primary">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-secondary/20 flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider font-semibold text-primary">Total</span>
                <span className="font-serif text-2xl font-bold text-primary">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded text-[11px] text-on-surface-variant space-y-1">
              <div className="flex items-center gap-1.5 text-secondary font-semibold text-[10px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                <span>White-Glove Guarantee</span>
              </div>
              <p className="font-light text-[10px]">
                Complimentary returns within 30 days. Bottles delivered in climate-regulated shock-absorbing boxes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
