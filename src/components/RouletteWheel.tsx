import React, { useEffect, useRef } from 'react';
import { soundManager } from '../utils/audio';

interface RouletteWheelProps {
  items: string[];
  colors: string[];
  rotation: number;
  isSpinning: boolean;
  onSpinEnd: () => void;
  spinDuration?: number; // in ms, default 4000
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  items,
  colors,
  rotation,
  isSpinning,
  onSpinEnd,
  spinDuration = 4000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTickSliceRef = useRef<number>(-1);
  const animFrameRef = useRef<number | null>(null);

  // Draw the wheel onto the high-resolution canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use high resolution for retina displays
    const size = 600;
    canvas.width = size;
    canvas.height = size;

    const numSlices = items.length;
    if (numSlices === 0) return;

    const sliceAngle = (2 * Math.PI) / numSlices;
    const radius = size / 2;
    const centerX = radius;
    const centerY = radius;

    // Start angle offset: -Math.PI / 2 (-90°) so that index 0 starts at 12 o'clock and extends clockwise
    const startOffset = -Math.PI / 2;

    ctx.clearRect(0, 0, size, size);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = startOffset + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // 1. Draw pie slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      // Divider line
      ctx.lineWidth = numSlices > 8 ? 2 : 4;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // 2. Draw text along radius
      ctx.save();
      ctx.translate(centerX, centerY);

      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';

      if (numSlices <= 4) {
        ctx.font = 'bold 36px "Jua", "Pretendard", sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.fillText(items[i], radius - 45, 0);
      } else if (numSlices <= 8) {
        ctx.font = 'bold 24px "Pretendard", sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.fillText(items[i], radius - 38, 0);
      } else {
        // 9-16+ items
        ctx.font = 'bold 16px "Pretendard", sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;
        ctx.fillText(items[i], radius - 26, 0);
      }

      ctx.restore();
    }
  }, [items, colors]);

  // Audio tick synchronization while spinning
  useEffect(() => {
    if (!isSpinning) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    const numSlices = items.length;
    const sliceDeg = 360 / numSlices;
    let startTime: number | null = null;
    const initialRot = rotation - 360 * 5; // approx
    let prevAngle = initialRot;

    const checkTick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Cubic-bezier(0.15, 0.9, 0.2, 1) approximation
      // easing curve for realistic tick rate
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentDeg = initialRot + (rotation - initialRot) * ease;

      const currentSlice = Math.floor((currentDeg % 360) / sliceDeg);
      if (currentSlice !== lastTickSliceRef.current && Math.abs(currentDeg - prevAngle) > 4) {
        lastTickSliceRef.current = currentSlice;
        // Pitch slightly increases then settles
        const pitch = 500 + (1 - progress) * 250;
        soundManager.playTick(pitch);
      }
      prevAngle = currentDeg;

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(checkTick);
      }
    };

    animFrameRef.current = requestAnimationFrame(checkTick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isSpinning, rotation, items.length, spinDuration]);

  return (
    <div className="relative w-[320px] h-[320px] max-w-[85vw] max-h-[85vw] mx-auto my-2 flex items-center justify-center select-none">
      {/* Top Fixed Red Pin Pointer */}
      <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 z-20 drop-shadow-md pointer-events-none">
        <svg
          viewBox="0 0 32 42"
          className="w-8 h-[42px] transition-transform duration-150"
          style={{
            transform: isSpinning ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {/* Teardrop pointer pin body */}
          <path
            d="M16 42 L2 14 C-1 9 1 2 8 0 L24 0 C31 2 33 9 30 14 Z"
            fill="#D90429"
          />
          {/* Inner highlight circle */}
          <circle cx="16" cy="10" r="5" fill="#FFFFFF" fillOpacity="0.95" />
        </svg>
      </div>

      {/* Outer Border Ring */}
      <div className="w-full h-full rounded-full p-2.5 bg-gradient-to-br from-[#FFF1E6] via-[#FFEADB] to-[#FFE2CF] shadow-[0_10px_24px_rgba(0,0,0,0.12),inset_0_2px_8px_rgba(255,255,255,0.9)] flex items-center justify-center relative">
        {/* Canvas container with rotation transition */}
        <div className="w-full h-full rounded-full relative overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.15)] bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-full block rounded-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? `transform ${spinDuration}ms cubic-bezier(0.15, 0.9, 0.2, 1)`
                : 'none',
              transformOrigin: '50% 50%',
            }}
            onTransitionEnd={() => {
              if (isSpinning) {
                onSpinEnd();
              }
            }}
          />
        </div>

        {/* Center Hub Piece */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[58px] h-[58px] bg-gradient-to-br from-white via-[#FFF9F5] to-[#FFECE2] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.22),inset_0_1px_3px_rgba(255,255,255,1)] border-4 border-[#FFECE2] z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#FF7A59] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]" />
        </div>
      </div>
    </div>
  );
};
