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
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If no data or inactive, draw placeholder bars
    if (!isActive || audioData.length === 0) {
      const totalBars = Math.floor(canvas.width / (barWidth + gap));
      const color = inactiveColor;
      
      for (let i = 0; i < totalBars; i++) {
        const x = i * (barWidth + gap);
        const barHeight = Math.random() * 5 + 3; // Random height between 3-8px
        
        ctx.fillStyle = color;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      }
      return;
    }
    
    // Draw visualization based on audio data
    const color = barColor;
    const dataLength = audioData.length;
    const step = Math.ceil(dataLength / Math.floor(canvas.width / (barWidth + gap)));
    
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
      
      ctx.fillStyle = color;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      barIndex++;
    }
  }, [audioData, isActive, height, barWidth, gap, barColor, inactiveColor]);
  
  return (
    <canvas 
      ref={canvasRef}
      width={300}
      height={height}
      className="w-full"
    />
  );
};

export default AudioVisualizer;