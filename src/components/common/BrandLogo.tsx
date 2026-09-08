import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  variant = 'dark',
  size = 'md'
}) => {
  const isLight = variant === 'light';
  const primaryColor = isLight ? '#FFFFFF' : '#181615';
  const goldColor = '#C5A059';

  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-11'
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2 group ${className}`}>
      {/* Handcrafted Luxury Emblem */}
      <svg
        viewBox="0 0 40 40"
        className={`${sizeClasses[size]} w-auto aspect-square shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="19" stroke={goldColor} strokeWidth="1.2" opacity="0.85" />
        <circle cx="20" cy="20" r="15" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="2 3" />
        <path
          d="M14 27L20 13L26 27M16 23H24"
          stroke={primaryColor}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="10" r="1.5" fill="#D4AF37" />
      </svg>

      {/* Brand Wordmark */}
      <div className="flex flex-col">
        <span
          className={`font-serif font-semibold tracking-[0.28em] uppercase leading-none transition-colors ${
            isLight ? 'text-white' : 'text-primary'
          } ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'}`}
        >
          MACQROSA
        </span>
        <span
          className="font-sans text-[7px] font-medium tracking-[0.38em] uppercase text-secondary mt-0.5"
        >
          HAUTE COSMÉTIQUES
        </span>
      </div>
    </Link>
  );
};
