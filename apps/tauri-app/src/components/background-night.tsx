"use client";

import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";

interface StarryNightProps {
  className?: string;
  starDensity?: number; // Lower = more stars
  shootingStarFrequency?: number;
}

interface Star {
  x: number;
  y: number;
  size: number; // Represents the radius of the star points
  phase: number;
  twinkleSpeed: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  length: number;
  age: number;
  maxAge: number;
}

export function StarryNight({
  className,
  starDensity = 2000, // Slightly higher number since the custom stars are larger
  shootingStarFrequency = 0.006,
}: StarryNightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.clientWidth : window.innerWidth;
      canvas.height = parent ? parent.clientHeight : window.innerHeight;
      initSky();
    };

    const initSky = () => {
      stars = [];
      const totalStars = Math.floor((canvas.width * canvas.height) / starDensity);
      const colors = ["#ffffff", "#f0f9ff", "#fef3c7", "#e0e7ff"];

      for (let i = 0; i < totalStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          // Custom star shapes need to be slightly larger to look clear (2px to 5px spikes)
          size: Math.random() * 3 + 2,
          phase: Math.random() * Math.PI * 2,
          // Varied speeds so they don't blink in unison
          twinkleSpeed: Math.random() * 0.04 + 0.015,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const createShootingStar = () => {
      const angle = (Math.random() * 30 + 210) * (Math.PI / 180);
      const speed = Math.random() * 8 + 8;

      shootingStars.push({
        x: Math.random() * canvas.width * 1.1,
        y: -20,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        length: Math.random() * 80 + 50,
        age: 0,
        maxAge: 40,
      });
    };

    const render = () => {
      // Clear out the previous frame entirely with pure pitch black
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw 4-Point Blinking Stars
      ctx.globalCompositeOperation = "screen";
      stars.forEach((star) => {
        star.phase += star.twinkleSpeed;

        // Math.sin forces the alpha below 0 dynamically, causing the star to turn completely off 
        // for half its cycle—giving it a genuine, sharp "blinking" behavior.
        const rawAlpha = Math.sin(star.phase);
        if (rawAlpha <= 0) return; // Skip rendering if the star is currently "off"

        ctx.fillStyle = star.color;
        ctx.globalAlpha = rawAlpha;

        // Draw a realistic 4-pointed star flare using quadratic curves pinched toward the center
        ctx.beginPath();
        ctx.moveTo(star.x, star.y - star.size); // Top tip
        ctx.quadraticCurveTo(star.x, star.y, star.x + star.size, star.y); // Pinch to right tip
        ctx.quadraticCurveTo(star.x, star.y, star.x, star.y + star.size); // Pinch to bottom tip
        ctx.quadraticCurveTo(star.x, star.y, star.x - star.size, star.y); // Pinch to left tip
        ctx.quadraticCurveTo(star.x, star.y, star.x, star.y - star.size); // Pinch back to top
        ctx.closePath();
        ctx.fill();
      });

      ctx.globalAlpha = 1.0; // Reset alpha

      // 2. Draw Shooting Stars
      if (Math.random() < shootingStarFrequency) {
        createShootingStar();
      }

      ctx.globalCompositeOperation = "lighter";
      shootingStars = shootingStars.filter((s) => s.age < s.maxAge);
      shootingStars.forEach((s) => {
        s.age++;
        s.x += s.velocityX;
        s.y += s.velocityY;
        const fade = 1 - s.age / s.maxAge;

        const grad = ctx.createLinearGradient(
          s.x - s.velocityX * s.length * 0.4,
          s.y - s.velocityY * s.length * 0.4,
          s.x,
          s.y
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(1, `rgba(235, 245, 255, ${fade * 0.8})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x - s.velocityX * s.length * 0.4, s.y - s.velocityY * s.length * 0.4);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
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
  }, [starDensity, shootingStarFrequency]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 z-0 pointer-events-none bg-black", className)}
      aria-hidden="true"
    />
  );
}