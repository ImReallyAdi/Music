import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface WaveformProps {
  isPlaying: boolean;
  color?: string;
  barCount?: number;
}

interface BarConfig {
  duration: number;
  delay: number;
  maxHeight: number;
}

const Waveform: React.FC<WaveformProps> = React.memo(({ 
  isPlaying, 
  color = '#FFFFFF', 
  barCount = 24
}) => {
  // Memoize bar configurations to prevent regeneration on every render
  const barConfigs = useMemo<BarConfig[]>(() => 
    Array.from({ length: barCount }, () => ({
      duration: 0.4 + Math.random() * 0.4, // 0.4s to 0.8s
      delay: Math.random() * 0.2,
      maxHeight: 20 + Math.random() * 80, // 20% to 100%
    })),
    [barCount]
  );

  return (
    <div 
      className="flex items-center justify-center gap-[3px] h-12"
      role="img"
      aria-label={isPlaying ? "Audio visualizer - playing" : "Audio visualizer - paused"}
    >
      {barConfigs.map((config, i) => (
        <Bar 
          key={i} 
          config={config}
          isPlaying={isPlaying} 
          color={color} 
        />
      ))}
    </div>
  );
});

Waveform.displayName = 'Waveform';

interface BarProps {
  config: BarConfig;
  isPlaying: boolean;
  color: string;
}

const Bar: React.FC<BarProps> = React.memo(({ 
  config,
  isPlaying, 
  color 
}) => {
  const { duration, delay, maxHeight } = config;

  return (
    <motion.div
      initial={{ height: "10%" }}
      animate={{
        height: isPlaying ? ["10%", `${maxHeight}%`, "10%"] : "10%",
        opacity: isPlaying ? 1 : 0.4,
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "reverse",
        delay,
        ease: "easeInOut",
      }}
      style={{ backgroundColor: color }}
      className="w-1.5 rounded-full"
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if playing state or color changes
  // Config is stable due to useMemo in parent
  return prevProps.isPlaying === nextProps.isPlaying && 
         prevProps.color === nextProps.color;
});

Bar.displayName = 'Bar';

export default Waveform;
