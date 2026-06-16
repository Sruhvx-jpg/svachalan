"use client";

import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";

interface StarryNightProps {
  className?: string;
  starDensity?: number; // Higher number = fewer stars (represents area per star)
}

interface Star {
  x: number;
  y: number;
  size: number;
  phase: number;
  twinkleSpeed: number;
  color: string;
  isFlareStar: boolean;
}

export function StarryNight({ className, starDensity = 3000 }: StarryNightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];

    // --- INITIALIZATION & RESIZING ---
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.clientWidth : window.innerWidth;
      canvas.height = parent ? parent.clientHeight : window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const numStars = Math.floor((canvas.width * canvas.height) / starDensity);

      // Deep celestial cosmic color variations
      const starColors = [
        "rgba(255, 255, 255,",       // Crisp Pure White
        "rgba(220, 235, 255,",       // Pale Blue Giant
        "rgba(255, 245, 220,",       // Soft Amber Main Sequence
      ];

      for (let i = 0; i < numStars; i++) {
        const sizeRand = Math.random();
        
        // Only about 12% of stars get the beautiful cross flare shapes
        const isFlareStar = sizeRand > 0.88; 
        
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          // Pinpoint background stars are tiny (0.4-0.8px), flare foreground stars are larger (1.2-1.8px)
          size: isFlareStar ? Math.random() * 0.6 + 1.2 : Math.random() * 0.4 + 0.4,
          phase: Math.random() * Math.PI * 2, // Varied starting offset for smooth sine looping
          twinkleSpeed: Math.random() * 0.015 + 0.005, // SIGNIFICANTLY SLOWED DOWN (was 0.02+)
          color: starColors[Math.floor(Math.random() * starColors.length)],
          isFlareStar,
        });
      }
    };

    // --- ANIMATION LOOP ---
    const render = () => {
      // Draw smooth solid space void
      ctx.fillStyle = "#020205";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        // Increment phase step over time
        star.phase += star.twinkleSpeed;
        
        // Sine calculation generates a continuous rhythmic breathing wave rather than jerky twitching
        const brightness = 0.2 + (Math.sin(star.phase) + 1) * 0.4; 

        ctx.save();
        
        if (star.isFlareStar) {
          // --- DRAW REAL CORE FLARE STAR (+ SHAPE) ---
          ctx.translate(star.x, star.y);
          
          // Outer subtle lens glow halo
          const radialGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, star.size * 5);
          radialGlow.addColorStop(0, `${star.color}${brightness})`);
          radialGlow.addColorStop(0.3, `${star.color}${brightness * 0.4})`);
          radialGlow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = radialGlow;
          ctx.beginPath();
          ctx.arc(0, 0, star.size * 5, 0, Math.PI * 2);
          ctx.fill();

          // Horizontal and Vertical Rays to form spikes
          ctx.strokeStyle = `${star.color}${brightness * 0.95})`;
          ctx.lineWidth = 0.75;
          
          // Horizontal Spike
          ctx.beginPath();
          ctx.moveTo(-star.size * 4, 0);
          ctx.lineTo(star.size * 4, 0);
          ctx.stroke();

          // Vertical Spike
          ctx.beginPath();
          ctx.moveTo(0, -star.size * 4);
          ctx.lineTo(0, star.size * 4);
          ctx.stroke();
          
          // Tiny absolute core nucleus
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
          ctx.beginPath();
          ctx.arc(0, 0, star.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- DRAW CRISP CRYSTAL BACKGROUND STAR POINT ---
          ctx.fillStyle = `${star.color}${brightness})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starDensity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "absolute inset-0 z-0 pointer-events-none",
        className
      )}
      aria-hidden="true"
    />
  );
}