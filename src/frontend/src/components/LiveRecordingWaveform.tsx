import { useEffect, useRef } from 'react';

interface LiveRecordingWaveformProps {
  audioLevel: number;
}

export default function LiveRecordingWaveform({ audioLevel }: LiveRecordingWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const barsRef = useRef<number[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas dimensions
    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Reset transform before scaling to avoid cumulative scaling
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      return { width: rect.width, height: rect.height };
    };

    const { width, height } = setupCanvas();

    // Calculate bar count based on canvas width for full-width coverage
    const barWidth = 2;
    const barGap = 2;
    const barCount = Math.floor(width / (barWidth + barGap));
    
    // Initialize bars array only once
    if (!initializedRef.current) {
      barsRef.current = Array(barCount).fill(0);
      initializedRef.current = true;
    }

    // Ensure bars array matches current bar count
    if (barsRef.current.length !== barCount) {
      const diff = barCount - barsRef.current.length;
      if (diff > 0) {
        barsRef.current = [...barsRef.current, ...Array(diff).fill(0)];
      } else {
        barsRef.current = barsRef.current.slice(0, barCount);
      }
    }

    const maxBarHeight = height * 0.9; // Use 90% of canvas height to prevent clipping
    const minBarHeight = 4;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Update bars based on audio level
      const targetHeight = minBarHeight + (audioLevel * (maxBarHeight - minBarHeight));
      
      // Clamp height to prevent overflow
      const clampedHeight = Math.min(targetHeight, maxBarHeight);
      
      // Shift bars to the left and add new bar
      barsRef.current.shift();
      barsRef.current.push(clampedHeight);

      // Draw bars centered vertically
      barsRef.current.forEach((barHeight, i) => {
        const x = i * (barWidth + barGap);
        const y = (height - barHeight) / 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(x, y, barWidth, barHeight);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const { width: newWidth, height: newHeight } = setupCanvas();
      const newBarCount = Math.floor(newWidth / (barWidth + barGap));
      
      if (barsRef.current.length !== newBarCount) {
        const diff = newBarCount - barsRef.current.length;
        if (diff > 0) {
          barsRef.current = [...barsRef.current, ...Array(diff).fill(0)];
        } else {
          barsRef.current = barsRef.current.slice(0, newBarCount);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [audioLevel]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-12"
      style={{ width: '100%', height: '48px' }}
    />
  );
}
