import React, { useRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// --- Types & Interfaces ---

interface PixelCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'flat';
  active?: boolean; // If true, renders "pressed"
}

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  active?: boolean;
  square?: boolean;
}

interface PixelSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (val: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  disabled?: boolean;
  color?: string; // Hex color for the fill
  height?: number;
}

// --- Components ---

/**
 * A container with a thick border and hard shadow.
 */
export const PixelCard = React.forwardRef<HTMLDivElement, PixelCardProps>(({
  children,
  className = '',
  variant = 'default',
  active = false,
  style,
  ...props
}, ref) => {
  const baseClasses = "relative bg-zinc-800 border-2 border-black transition-transform";

  let shadowClass = "shadow-[4px_4px_0_0_rgba(0,0,0,1)]";
  if (active) shadowClass = "translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_0_rgba(0,0,0,1)]";
  if (variant === 'flat') shadowClass = "";

  return (
    <motion.div
      ref={ref}
      className={`${baseClasses} ${shadowClass} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
});
PixelCard.displayName = "PixelCard";


/**
 * A chunky, pixelated button with press animation.
 */
export const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  active = false,
  square = false,
  disabled,
  ...props
}, ref) => {

  // Variants
  const variants = {
    primary: "bg-white text-black hover:bg-zinc-200",
    secondary: "bg-zinc-700 text-white hover:bg-zinc-600",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/10 border-transparent shadow-none",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  // Sizes
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2 aspect-square flex items-center justify-center",
  };

  const isGhost = variant === 'ghost';

  // Styles
  const baseStyle = "font-pixel font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed select-none relative active:top-[2px] active:left-[2px]";
  const borderStyle = isGhost ? "" : "border-2 border-black";
  const shadowStyle = isGhost ? "" : (active ? "shadow-none translate-x-[2px] translate-y-[2px]" : "shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:shadow-none");

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`
        ${baseStyle}
        ${borderStyle}
        ${shadowStyle}
        ${variants[variant]}
        ${sizes[size]}
        ${square ? 'aspect-square flex items-center justify-center px-0' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});
PixelButton.displayName = "PixelButton";

/**
 * A custom range slider styled like a retro volume/progress bar.
 */
export const PixelSlider: React.FC<PixelSliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onScrubStart,
  onScrubEnd,
  disabled = false,
  color = '#fff',
  height = 20 // Default height
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(Number(e.target.value));
  };

  return (
    <div className={`relative w-full select-none ${disabled ? 'opacity-50' : ''}`} style={{ height }}>
      {/* Track Background */}
      <div className="absolute inset-0 bg-zinc-900 border-2 border-black shadow-[2px_2px_0_0_rgba(255,255,255,0.1)]">
        {/* Fill */}
        <div
          className="h-full border-r-2 border-black relative"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        >
          {/* Pattern Overlay on Fill */}
          <div
             className="absolute inset-0 opacity-20 pointer-events-none"
             style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, #000 2px, #000 4px)` }}
          />
        </div>
      </div>

      {/* Thumb (Visual Only - driven by input) */}
      <div
        className="absolute top-0 bottom-0 w-4 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] pointer-events-none z-10"
        style={{ left: `calc(${percentage}% - 8px)` }}
      />

      {/* Hidden Input for Interaction */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        onPointerDown={onScrubStart}
        onPointerUp={onScrubEnd}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
      />
    </div>
  );
};

/**
 * A container for Album Art with a CRT scanline effect option? Or just a frame.
 */
export const PixelArtFrame: React.FC<{ src: string; alt?: string; className?: string }> = ({ src, alt, className = '' }) => {
  return (
    <div className={`relative bg-zinc-900 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.5)] ${className}`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover pixelated"
        />
        {/* Inner Border/Highlight */}
        <div className="absolute inset-0 border-2 border-white/10 pointer-events-none" />
    </div>
  );
}

/**
 * Badge for tags
 */
export const PixelBadge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = '#555' }) => {
    return (
        <span
          className="px-1.5 py-0.5 text-[10px] font-pixel font-bold uppercase border border-black shadow-[1px_1px_0_0_#000]"
          style={{ backgroundColor: color, color: '#fff' }}
        >
            {children}
        </span>
    )
}
