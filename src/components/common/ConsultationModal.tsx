import React, { useState } from 'react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    concerns: 'Anti-Aging & Cellular Radiance',
    preferredDate: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-container-lowest border border-secondary/30 rounded-xl p-6 sm:p-8 w-full max-w-lg shadow-gold-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-outline hover:text-primary p-1"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <h3 className="font-serif text-xl text-primary">Consultation Confirmed</h3>
            <p className="text-xs text-on-surface-variant font-light max-w-sm mx-auto">
              Your Place Vendôme Beauty Concierge has received your request. A private calendar invitation with high-definition video link has been dispatched to your inbox.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-[1px] bg-secondary" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-semibold">
                Place Vendôme Private Salon
              </span>
            </div>
            <h3 className="font-serif text-2xl text-primary font-normal tracking-tight mb-2">
              Book Virtual Atelier Consultation
            </h3>
            <p className="text-xs text-on-surface-variant font-light mb-6">
              Connect 1-on-1 with a master French cosmetician for a bespoke skin analysis and personalized protocol prescription.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-outline mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Madame or Monsieur"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-outline mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-outline mb-1">Primary Discipline</label>
                  <select
                    value={formData.concerns}
                    onChange={e => setFormData({ ...formData, concerns: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                  >
                    <option>24K Gold Cellular Rejuvenation</option>
                    <option>Barrier Repair &amp; Sensitivity</option>
                    <option>Complexion Matching &amp; Veil</option>
                    <option>Haute Fragrance Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-outline mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-outline mb-1">Personal Skin Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Tell our cosmeticians about your current routine..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-on-surface outline-none focus:border-secondary"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-3 rounded text-xs uppercase tracking-[0.18em] font-semibold hover:bg-neutral-800 transition-all shadow-md mt-2"
              >
                Confirm Atelier Appointment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
