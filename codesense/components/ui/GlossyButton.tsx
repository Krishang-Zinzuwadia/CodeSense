'use client';

import React from 'react';

interface GlossyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const GlossyButton = React.forwardRef<HTMLButtonElement, GlossyButtonProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          relative overflow-hidden
          px-7 py-3.5
          rounded-2xl
          font-semibold text-base
          text-white
          cursor-pointer
          border-none
          transition-all duration-300
          hover:scale-105
          active:scale-95
          ${className}
        `}
        style={{
          background: 'radial-gradient(circle 80px at 80% -10%, #ffffff, #181b1b)',
          boxShadow: '0 0 20px #ffffff38',
        }}
        {...props}
      >
        {/* Blob 1 - Left gradient */}
        <div
          className="absolute bottom-0 left-0 rounded-2xl pointer-events-none"
          style={{
            width: '70px',
            height: '100%',
            background: 'radial-gradient(circle 60px at 0% 100%, #3fe9ff, #0000ff80, transparent)',
            boxShadow: '-10px 10px 30px #0051ff2d',
          }}
        />

        {/* Inner content with gradient */}
        <div
          className="relative z-10 px-6 py-3.5 rounded-2xl"
          style={{
            background: 'radial-gradient(circle 80px at 80% -50%, #777777, #0f1111)',
            boxShadow: 'inset 0 0 30px #00e1ff1a, inset 0 0 15px #0000ff11',
          }}
        >
          {children}
        </div>

        {/* Glossy overlay */}
        <div
          className="absolute top-0 right-0 rounded-2xl pointer-events-none"
          style={{
            width: '65%',
            height: '60%',
            borderRadius: '120px',
            boxShadow: '0 0 25px rgba(255, 255, 255, 0.22)',
          }}
        />
      </button>
    );
  }
);

GlossyButton.displayName = 'GlossyButton';
