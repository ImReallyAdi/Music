import React from 'react';
import { motion } from 'framer-motion';
import '@material/web/labs/card/elevated-card.js';
import '@material/web/ripple/ripple.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

interface LibraryCardProps {
  title: string;
  subtitle: string;
  image?: string;
  customImage?: React.ReactNode;
  fallbackIcon?: string;
  onPlay?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  actions?: React.ReactNode;
  active?: boolean;
  playing?: boolean;
  variant?: 'square' | 'circle';
}

export const LibraryCard: React.FC<LibraryCardProps> = ({
  title,
  subtitle,
  image,
  customImage,
  fallbackIcon = 'music_note',
  onPlay,
  onClick,
  actions,
  active = false,
  playing = false,
  variant = 'square',
}) => {
  const isCircle = variant === 'circle';
  const shape = isCircle ? '9999px' : '24px';

  return (
    <motion.div
      className="group relative h-full flex flex-col items-center"
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <md-elevated-card
        clickable
        class="w-full aspect-square flex flex-col p-0 overflow-hidden"
        style={{ '--md-elevated-card-container-shape': shape }}
      >
          {/* Image Container */}
          <div className={`relative w-full h-full bg-surface-container-highest overflow-hidden ${isCircle ? 'rounded-full' : ''}`}>
            <div className="absolute inset-0 bg-surface-container-highest z-0" />

            {customImage ? (
               customImage
            ) : image ? (
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 z-10 relative"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40 z-10 relative">
                <md-icon class="material-symbols-rounded" style={{ fontSize: '48px' }}>{fallbackIcon}</md-icon>
              </div>
            )}

            {/* Overlay / Play Button */}
            <div className={`absolute inset-0 bg-black/20 transition-opacity duration-200 flex items-center justify-center gap-2 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {onPlay && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPlay(e); }}
                  className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 cursor-pointer border-none outline-none z-10"
                >
                  <md-icon class="material-symbols-rounded" style={{ fontSize: '32px' }}>
                    {active && playing ? 'pause' : 'play_arrow'}
                  </md-icon>
                </button>
              )}
            </div>

            {/* Actions Overlay (Top Right) */}
            {actions && (
               <div
                 className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2"
                 onClick={(e) => e.stopPropagation()}
               >
                  {actions}
               </div>
            )}

            <md-ripple></md-ripple>
          </div>

          {/* Metadata */}
      </md-elevated-card>

      <div className={`flex flex-col gap-0.5 mt-3 w-full ${isCircle ? 'text-center items-center' : 'px-1'}`}>
        <h3 className={`text-title-medium font-bold truncate w-full ${active ? 'text-primary' : 'text-on-surface'}`}>
           {title}
        </h3>
        <p className="text-body-medium text-on-surface-variant truncate opacity-80 w-full">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
};
