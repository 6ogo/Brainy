import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioData?: Uint8Array | number[];
  isActive?: boolean;
  height?: number;
  barWidth?: number;
  gap?: number;
  barColor?: string;
  inactiveColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData = [],
  isActive = false,
  height = 40,
  barWidth = 3,
  gap = 2,
  barColor = '#3B82F6', // primary-500
  inactiveColor = '#D1D5DB' // gray-300
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions with device pixel ratio for high-resolution rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale all drawing operations by dpr for high-resolution
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);
    
    // If no data or inactive, draw placeholder bars
    if (!isActive || audioData.length === 0) {
      const totalBars = Math.floor(rect.width / (barWidth + gap));
      const color = inactiveColor;
      
      for (let i = 0; i < totalBars; i++) {
        const x = i * (barWidth + gap);
        const barHeight = Math.random() * 5 + 3; // Random height between 3-8px
        
        // Use rounded rectangles for smoother appearance
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth, barHeight, [1, 1, 0, 0]);
        ctx.fill();
      }
      return;
    }
    
    // Draw visualization based on audio data
    const color = barColor;
    const dataLength = audioData.length;
    const step = Math.ceil(dataLength / Math.floor(rect.width / (barWidth + gap)));
    
    let barIndex = 0;
    for (let i = 0; i < dataLength; i += step) {
      // Get average of this segment
      let sum = 0;
      let count = 0;
      
      for (let j = 0; j < step && i + j < dataLength; j++) {
        sum += audioData[i + j];
        count++;
      }
      
      const average = sum / count;
      const barHeight = Math.max(3, (average / 255) * height);
      const x = barIndex * (barWidth + gap);
      
      // Use rounded rectangles and add shadow for depth
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.roundRect(x, height - barHeight, barWidth, barHeight, [1, 1, 0, 0]);
      ctx.fill();
      
      // Reset shadow for next bar
      ctx.shadowBlur = 0;
      
      barIndex++;
    }
  }, [audioData, isActive, height, barWidth, gap, barColor, inactiveColor]);
  
  return (
    <canvas 
      ref={canvasRef}
      width={300}
      height={height}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
};

export default AudioVisualizer;