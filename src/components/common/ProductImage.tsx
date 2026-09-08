import React, { useState } from 'react';

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  fallbackTitle?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Macqrosa Formulation',
  className = 'w-full h-full object-cover',
  fallbackTitle,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fallback card when image fails or is missing
  if (!src || hasError) {
    return (
      <div className={`w-full h-full min-h-[160px] bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden border border-secondary/15 ${className}`}>
        {/* Subtle decorative gold emblem */}
        <div className="w-12 h-12 rounded-full border border-secondary-gold/40 flex items-center justify-center mb-3 bg-secondary-fixed/20 shadow-sm">
          <span className="material-symbols-outlined text-[24px] text-secondary-gold">auto_awesome</span>
        </div>
        <p className="font-serif text-xs text-primary font-medium tracking-wide line-clamp-2 px-2">
          {fallbackTitle || alt}
        </p>
        <span className="text-[9px] uppercase tracking-[0.2em] text-secondary font-semibold mt-1">
          Place Vendôme
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-surface-container-low">
      {/* Skeleton Shimmer */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-surface-container-high to-surface-container-low animate-pulse z-0" />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`${className} transition-opacity duration-500 ease-out ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};
