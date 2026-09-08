import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';

export const AccountPage: React.FC = () => {
  const { customer, customerToken, logoutCustomer, isCustomerLoading, updateCustomerProfile } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'wishlist' | 'concierge'>('orders');
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '', lastName: '', email: '', phone: ''
  });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password Edit State
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: ''
  });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (customer) {
      setProfileForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || ''
      });
    }
  }, [customer]);

  useEffect(() => {
    if (!isCustomerLoading && !customer) {
      navigate('/auth');
      return;
    }

    if (customerToken) {
      fetch('/api/orders/customer/history', {
        headers: { Authorization: `Bearer ${customerToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOrders(data);
          setLoadingOrders(false);
        })
        .catch(err => {
          console.error('Failed to load customer orders:', err);
          setLoadingOrders(false);
        });
    }
  }, [customer, customerToken, isCustomerLoading, navigate]);

  const handleLogout = () => {
    logoutCustomer();
    navigate('/');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ text: 'Updating...', type: 'info' });
    const res = await updateCustomerProfile(profileForm);
    if (res.success) {
      setProfileMsg({ text: 'Profile updated successfully.', type: 'success' });
      setIsEditingProfile(false);
    } else {
      setProfileMsg({ text: res.error || 'Failed to update profile', type: 'error' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ text: 'Updating...', type: 'info' });
    try {
      const res = await fetch('/api/auth/customer/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`
        },
        body: JSON.stringify(passwordForm)
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ text: 'Password updated successfully.', type: 'success' });
        setIsEditingPassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '' });
      } else {
        setPasswordMsg({ text: data.error || 'Failed to update password', type: 'error' });
      }
    } catch (err) {
      setPasswordMsg({ text: 'Network error.', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'shipped':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-800';
      case 'processing':
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 border-red-300 dark:border-red-800';
      case 'pending':
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
    }
  };

  if (isCustomerLoading || !customer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-serif text-lg text-on-surface-variant dark:text-dark-on-surface-variant">
        Authenticating Circle Privé credentials...
      </div>
    );
  }

  const currentPoints = customer.points || 2840;
  const targetPoints = 3500;
  const progressPercent = Math.min(100, Math.round((currentPoints / targetPoints) * 100));

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
      {/* Top Asymmetric Patron Header: Privilege Gauge + Atelier Liaison Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        {/* Left: Patron Identity & Tier Gauge */}
        <div className="lg:col-span-8 bg-surface-container-lowest dark:bg-dark-surface-container border border-secondary/20 dark:border-dark-outline-variant rounded-2xl p-6 sm:p-8 shadow-gold-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-serif text-2xl font-medium border-2 border-secondary/40 shadow-sm shrink-0">
                  {customer.firstName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-secondary-fixed text-primary text-[10px] uppercase tracking-wider font-bold rounded-full">
                      {customer.tier || 'Circle Privé'}
                    </span>
                    <span className="text-[11px] text-outline dark:text-dark-outline-variant">• Member since 2024</span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl text-primary dark:text-dark-on-surface font-normal">
                    Madame / Monsieur {customer.firstName} {customer.lastName}
                  </h1>
                  <p className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant font-light">{customer.email}</p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase tracking-wider text-on-surface dark:text-dark-on-surface block font-semibold">
                  Immediately Eligible
                </span>
                <span className="text-xs text-secondary font-serif italic">
                  $140 Atelier Credit or Harvest Miniature Flacon
                </span>
              </div>
            </div>

            {/* Loyalty Gauge towards Diamond Circle */}
            <div className="space-y-2 mt-6 pt-6 border-t border-surface-container dark:border-dark-outline-variant">
              <div className="flex justify-between text-[11px] uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant font-medium">
                <span className="text-secondary font-semibold">
                  Current: {currentPoints.toLocaleString()} Pts ({customer.tier})
                </span>
                <span>Objective: Diamond Circle ({targetPoints.toLocaleString()} Pts)</span>
              </div>
              <div className="w-full h-2.5 bg-surface-container dark:bg-dark-surface-container-high rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-secondary-fixed via-secondary-gold to-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-on-surface-variant dark:text-dark-on-surface-variant pt-1 font-light">
                <span>{targetPoints - currentPoints} pts remaining until private gala invitation Place Vendôme</span>
                <span className="text-secondary font-medium uppercase tracking-wider text-[10px]">
                  {progressPercent}% Complete
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-surface-container dark:border-dark-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-outline dark:text-dark-outline block">Orders Completed</span>
                <span className="font-serif text-lg font-bold text-primary dark:text-dark-on-surface">{orders.length}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-outline dark:text-dark-outline block">Lifetime Spend</span>
                <span className="font-serif text-lg font-bold text-primary dark:text-dark-on-surface">
                  ${customer.totalSpent ? customer.totalSpent.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-outline dark:text-dark-outline hover:text-primary dark:hover:text-secondary-gold transition-colors flex items-center gap-1 uppercase tracking-wider font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right: Personal Atelier Liaison Card */}
        <div className="lg:col-span-4 bg-surface-container-lowest dark:bg-dark-surface-container border border-secondary/20 dark:border-dark-outline-variant rounded-2xl p-6 sm:p-8 shadow-gold-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/20 dark:bg-secondary-gold/10 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">
                Maison Concierge
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-surface-container dark:bg-dark-surface-container-high px-2 py-0.5 rounded text-on-surface dark:text-dark-on-surface font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Salon
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy-Wa4ZZDyPoeHJheHR5cwbFjYz0jlFN4Tv8LNjncSuVXb5iF69BUrJVg0MYt0Zeer72RHTTvs9MnJuYAnzJrsWqcHsoU2LpG3IUOazZY_qALPZMQevE3kOdacptndeyQDCKoc-OlqRfJU4uj0MJcEmSaGAElf8DEYxK9cQ6S9RZ_fx3sBBChVDxzJndrCr1Ed1Ad7pyEWKBoA-6l4jzUE9kOvb2fl0PzSyBQ2g-F5cNFBkSYJD_fRfQ"
                  alt="Sophie de Valencourt"
                  className="w-14 h-14 rounded-full object-cover shadow-sm border border-secondary/30"
                />
                <span className="absolute bottom-0 right-0 bg-primary dark:bg-dark-surface-container-highest text-on-primary w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow">
                  <span className="material-symbols-outlined text-[11px] dark:text-secondary-gold">verified</span>
                </span>
              </div>
              <div>
                <h3 className="font-serif text-lg text-primary dark:text-dark-on-surface font-medium">Sophie de Valencourt</h3>
                <p className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant font-light">Dedicated Liaison • Salon Place Vendôme</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant font-light leading-relaxed mb-6 italic">
              "Dear Patron, your bespoke formulations have been prepared with freshly distilled Grasse May rose petals. I remain at your complete disposal for your seasonal adjustments."
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              className="w-full py-2.5 px-4 bg-primary dark:bg-secondary-gold text-on-primary dark:text-primary text-xs uppercase tracking-widest font-semibold rounded hover:bg-neutral-800 dark:hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">event_note</span>
              <span>Book Salon Appointment</span>
            </button>
            <button
              type="button"
              className="w-full py-2.5 px-4 bg-surface-container-low dark:bg-dark-surface-container-high text-primary dark:text-dark-on-surface text-xs uppercase tracking-widest font-medium rounded hover:bg-surface-container dark:hover:bg-dark-surface-container-highest transition-colors flex items-center justify-center gap-2 border border-secondary/15 dark:border-dark-outline-variant"
            >
              <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
              <span>Direct Message Concierge</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Navigation Tabs */}
      <div className="bg-surface-container-lowest/90 dark:bg-dark-surface-container/90 backdrop-blur-xl p-1.5 rounded-xl shadow-sm border border-secondary/15 dark:border-dark-outline-variant flex items-center gap-2 overflow-x-auto scrollbar-none mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-primary dark:bg-secondary-gold text-white dark:text-primary shadow-sm'
              : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-secondary-gold hover:bg-surface-container-low dark:hover:bg-dark-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">local_shipping</span>
          <span>Orders &amp; Dispatches ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-primary dark:bg-secondary-gold text-white dark:text-primary shadow-sm'
              : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-secondary-gold hover:bg-surface-container-low dark:hover:bg-dark-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">spa</span>
          <span>Profile &amp; Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wishlist')}
          className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'wishlist'
              ? 'bg-primary dark:bg-secondary-gold text-white dark:text-primary shadow-sm'
              : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-secondary-gold hover:bg-surface-container-low dark:hover:bg-dark-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">favorite_border</span>
          <span>Saved Formulations &amp; Wishlist</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('concierge')}
          className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'concierge'
              ? 'bg-primary dark:bg-secondary-gold text-white dark:text-primary shadow-sm'
              : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-secondary-gold hover:bg-surface-container-low dark:hover:bg-dark-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">pin_drop</span>
          <span>Delivery &amp; Concierge Notes</span>
        </button>
      </div>

      {/* Tab 1: Orders & Dispatches */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-primary dark:text-dark-on-surface font-normal">Artisanal Orders History</h2>
            <Link
              to="/catalog"
              className="text-xs uppercase tracking-wider text-secondary dark:text-secondary-gold font-semibold hover:underline flex items-center gap-1"
            >
              <span>Explore Latest Releases</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {loadingOrders ? (
            <div className="py-20 text-center text-on-surface-variant dark:text-dark-on-surface-variant font-serif">
              Retrieving archival receipts...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-surface-container-lowest dark:bg-dark-surface-container p-12 rounded-xl text-center border border-secondary/15 dark:border-dark-outline-variant">
              <span className="material-symbols-outlined text-secondary dark:text-secondary-gold text-[40px] mb-2">shopping_bag</span>
              <h3 className="font-serif text-xl text-primary dark:text-dark-on-surface mb-1">No Orders Recorded Yet</h3>
              <p className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant mb-6">
                Your inaugural acquisition awaits in the Place Vendôme collection.
              </p>
              <Link to="/catalog" className="btn-gold-luxury px-6 py-2.5 rounded text-xs uppercase tracking-widest font-semibold">
                Explore The Atelier
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="bg-surface-container-lowest dark:bg-dark-surface-container border border-secondary/15 dark:border-dark-outline-variant rounded-xl p-6 shadow-sm hover:shadow-gold-md transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-surface-container dark:border-dark-outline-variant">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-lg font-bold text-primary dark:text-dark-on-surface">
                          #{order.order_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-outline dark:text-dark-outline mt-0.5">
                        Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-outline dark:text-dark-outline block">Sacred Total</span>
                      <span className="font-serif text-xl font-bold text-primary dark:text-dark-on-surface">
                        ${order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Line items preview */}
                  <div className="py-4 space-y-3">
                    {order.items &&
                      order.items.map(item => (
                        <div key={item.id || item.product_id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.product_title}
                                className="w-12 h-12 rounded object-cover border border-secondary/15 dark:border-dark-outline-variant shrink-0"
                              />
                            )}
                            <div>
                              <p className="font-medium text-primary dark:text-dark-on-surface">{item.product_title}</p>
                              <p className="text-outline dark:text-dark-outline">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          <span className="font-serif font-medium text-primary dark:text-dark-on-surface">
                            ${(item.product_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Tracking and destination */}
                  <div className="pt-4 border-t border-surface-container dark:border-dark-outline-variant flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-on-surface-variant dark:text-dark-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-secondary dark:text-secondary-gold">local_shipping</span>
                      <span>
                        Destination: {order.shipping_address?.city}, {order.shipping_address?.country}
                      </span>
                      {order.tracking_number && (
                        <span className="font-mono bg-surface-container dark:bg-dark-surface-container-high px-2 py-0.5 rounded text-[11px] text-primary dark:text-dark-on-surface">
                          Track: {order.tracking_number}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/order-confirmation/${order.order_number}`}
                      className="text-secondary dark:text-secondary-gold font-semibold hover:underline uppercase tracking-wider text-[11px]"
                    >
                      View Receipt Dossier →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Profile & Settings */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest dark:bg-dark-surface-container p-8 rounded-xl border border-secondary/15 dark:border-dark-outline-variant shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-primary dark:text-dark-on-surface font-normal">Personal Details</h2>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-xs uppercase tracking-wider text-secondary dark:text-secondary-gold font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {profileMsg.text && (
              <div className={`p-3 text-sm rounded-lg ${profileMsg.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                {profileMsg.text}
              </div>
            )}

            {!isEditingProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-outline dark:text-dark-outline block mb-1">First Name</span>
                  <p className="font-medium text-primary dark:text-dark-on-surface">{customer.firstName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-outline dark:text-dark-outline block mb-1">Last Name</span>
                  <p className="font-medium text-primary dark:text-dark-on-surface">{customer.lastName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-outline dark:text-dark-outline block mb-1">Email Address</span>
                  <p className="font-medium text-primary dark:text-dark-on-surface">{customer.email}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-outline dark:text-dark-outline block mb-1">Phone Number</span>
                  <p className="font-medium text-primary dark:text-dark-on-surface">{customer.phone || '—'}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">First Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                      className="w-full bg-surface-container-low dark:bg-dark-surface border border-secondary/20 dark:border-dark-outline-variant rounded-lg px-4 py-2.5 text-sm text-primary dark:text-dark-on-surface focus:outline-none focus:border-secondary-gold transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Last Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(p => ({ ...p, lastName: e.target.value }))}
                      className="w-full bg-surface-container-low dark:bg-dark-surface border border-secondary/20 dark:border-dark-outline-variant rounded-lg px-4 py-2.5 text-sm text-primary dark:text-dark-on-surface focus:outline-none focus:border-secondary-gold transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Email</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-surface-container-low dark:bg-dark-surface border border-secondary/20 dark:border-dark-outline-variant rounded-lg px-4 py-2.5 text-sm text-primary dark:text-dark-on-surface focus:outline-none focus:border-secondary-gold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-surface-container-low dark:bg-dark-surface border border-secondary/20 dark:border-dark-outline-variant rounded-lg px-4 py-2.5 text-sm text-primary dark:text-dark-on-surface focus:outline-none focus:border-secondary-gold transition-colors"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-gold-luxury px-6 py-2 rounded text-xs uppercase tracking-widest font-semibold">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2 rounded text-xs uppercase tracking-widest font-semibold text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-low dark:hover:bg-dark-surface-container-high transition-colors border border-transparent">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-surface-container-lowest dark:bg-dark-surface-container p-8 rounded-xl border border-secondary/15 dark:border-dark-outline-variant shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-primary dark:text-dark-on-surface font-normal">Security</h2>
              {!isEditingPassword && (
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="text-xs uppercase tracking-wider text-secondary dark:text-secondary-gold font-semibold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                  <span>Change Password</span>
                </button>
              )}
            </div>

            {passwordMsg.text && (
              <div className={`p-3 text-sm rounded-lg ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                {passwordMsg.text}
              </div>
            )}

            {!isEditingPassword ? (
              <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant max-w-md">
                Ensure your account is using a long, complex password to protect your personal information.
              </p>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                    className="w-full bg-surface-container-low dark:bg-dark-surface border border-secondary/20 dark:border-dark-outline-variant rounded-lg px-4 py-2.5 text-sm text-primary dark:text-dark-on-surface focus:outline-none focus:border-secondary-gold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                    className="w-full bg-surface-container-low dark:bg-dark-surface border border-secondary/20 dark:border-dark-outline-variant rounded-lg px-4 py-2.5 text-sm text-primary dark:text-dark-on-surface focus:outline-none focus:border-secondary-gold transition-colors"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-gold-luxury px-6 py-2 rounded text-xs uppercase tracking-widest font-semibold">
                    Update Password
                  </button>
                  <button type="button" onClick={() => setIsEditingPassword(false)} className="px-6 py-2 rounded text-xs uppercase tracking-widest font-semibold text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-low dark:hover:bg-dark-surface-container-high transition-colors border border-transparent">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="bg-surface-container-lowest dark:bg-dark-surface-container p-8 rounded-xl border border-secondary/15 dark:border-dark-outline-variant shadow-sm text-center">
          <span className="material-symbols-outlined text-secondary dark:text-secondary-gold text-[40px] mb-2">favorite</span>
          <h3 className="font-serif text-xl text-primary dark:text-dark-on-surface mb-1">Your Curated Wishlist</h3>
          <p className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant max-w-md mx-auto mb-4 font-light">
            Formulations you have saved for future atelier allocations and seasonal harvests.
          </p>
          <Link to="/catalog" className="btn-gold-luxury px-6 py-2.5 rounded text-xs uppercase tracking-widest font-semibold inline-block">
            Browse Formulations
          </Link>
        </div>
      )}

      {/* Tab 4: Delivery & Concierge Notes */}
      {activeTab === 'concierge' && (
        <div className="bg-surface-container-lowest dark:bg-dark-surface-container p-8 rounded-xl border border-secondary/15 dark:border-dark-outline-variant shadow-sm space-y-4">
          <h2 className="font-serif text-2xl text-primary dark:text-dark-on-surface font-normal">White Glove Courier Instructions</h2>
          <div className="p-4 rounded-lg bg-surface-container-low dark:bg-dark-surface-container-high text-xs space-y-2">
            <p className="font-medium text-primary dark:text-dark-on-surface">Saved Dispatch Address:</p>
            <p className="text-on-surface-variant dark:text-dark-on-surface-variant font-light">
              {customer.addresses?.[0]?.address_line1 || '14 Place Vendôme'}, {customer.addresses?.[0]?.city || 'Paris'}, {customer.addresses?.[0]?.country || 'France'}
            </p>
            <p className="text-[11px] text-secondary dark:text-secondary-gold font-serif italic">
              "Climate-controlled packaging requested. Direct delivery to concierge."
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
