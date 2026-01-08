import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`backdrop-blur-xl bg-white/60 border border-white/50 shadow-sm shadow-indigo-100/50 rounded-3xl ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;