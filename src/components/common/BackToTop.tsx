import React, { useEffect, useState } from 'react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;

      if (totalScrollable > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / totalScrollable) * 100));
        setScrollProgress(progress);
      }

      // Show when scrolled down more than 320px
      setIsVisible(scrollY > 320);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // SVG circular progress parameters
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top of page"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-primary/90 hover:bg-secondary text-secondary-fixed hover:text-primary backdrop-blur-md border border-secondary/40 hover:border-secondary shadow-gold-md hover:shadow-gold-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-secondary/50"
      >
        {/* Circular Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 44 44"
        >
          {/* Background track */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="opacity-15 text-secondary"
          />
          {/* Active progress */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-150 text-secondary group-hover:text-primary"
          />
        </svg>

        {/* Upward Arrow Icon */}
        <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:-translate-y-0.5">
          arrow_upward
        </span>

        {/* Elegant Tooltip on Hover */}
        <span className="absolute right-full mr-3 px-2.5 py-1 rounded bg-primary/95 text-secondary-fixed text-[10px] uppercase tracking-widest font-sans font-medium whitespace-nowrap shadow-md border border-secondary/30 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none hidden sm:inline-block">
          Haut de page
        </span>
      </button>
    </div>
  );
};
