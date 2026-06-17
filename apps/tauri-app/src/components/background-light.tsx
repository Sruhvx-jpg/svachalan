"use client";

import { useEffect, useRef } from "react";
import { cn } from "../lib/utils";

interface IconBackgroundProps {
    className?: string;
    iconGridSpacing?: number; // Lower = much higher icon frequency density
}

interface TechIcon {
    x: number;
    y: number;
    type: "mail" | "calendar" | "terminal" | "branch" | "gear";
    size: number;
    rotation: number;
}

export function BrushedBackground({
    className,
    iconGridSpacing = 55, // Tight spacing for maximum icon frequency
}: IconBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let icons: TechIcon[] = [];

        const initIcons = () => {
            icons = [];
            const types: TechIcon["type"][] = ["mail", "calendar", "terminal", "branch", "gear"];

            const cols = Math.ceil(canvas.width / iconGridSpacing) + 1;
            const rows = Math.ceil(canvas.height / iconGridSpacing) + 1;

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    // Subtle variance so the crowded density still feels natural and organic
                    const offsetX = (Math.random() - 0.5) * (iconGridSpacing * 0.5);
                    const offsetY = (Math.random() - 0.5) * (iconGridSpacing * 0.5);

                    icons.push({
                        x: c * iconGridSpacing + offsetX,
                        y: r * iconGridSpacing + offsetY,
                        type: types[Math.floor(Math.random() * types.length)],
                        size: Math.random() * 2.5 + 9, // Slightly smaller (9px-11.5px) so high density looks ultra-crisp
                        rotation: (Math.random() - 0.5) * 0.25,
                    });
                }
            }
        };

        const drawMicroIcon = (pCtx: CanvasRenderingContext2D, icon: TechIcon) => {
            pCtx.save();
            pCtx.translate(icon.x, icon.y);
            pCtx.rotate(icon.rotation);

            const s = icon.size;

            switch (icon.type) {
                case "mail": // Gmail Envelope
                    pCtx.strokeRect(-s / 2, -s / 3, s, s * 0.66);
                    pCtx.beginPath();
                    pCtx.moveTo(-s / 2, -s / 3);
                    pCtx.lineTo(0, s * 0.05);
                    pCtx.lineTo(s / 2, -s / 3);
                    pCtx.stroke();
                    break;

                case "calendar": // Google Calendar
                    pCtx.strokeRect(-s / 2, -s / 2, s, s);
                    pCtx.beginPath();
                    pCtx.moveTo(-s / 2, -s / 6);
                    pCtx.lineTo(s / 2, -s / 6);
                    pCtx.moveTo(-s / 4, -s / 2); pCtx.lineTo(-s / 4, -s / 2 - 1.5);
                    pCtx.moveTo(s / 4, -s / 2); pCtx.lineTo(s / 4, -s / 2 - 1.5);
                    pCtx.stroke();
                    break;

                case "terminal": // Dev Prompt CLI
                    pCtx.beginPath();
                    pCtx.moveTo(-s / 2, -s / 3);
                    pCtx.lineTo(-s / 6, 0);
                    pCtx.lineTo(-s / 2, s / 3);
                    pCtx.moveTo(-s / 12, s / 3);
                    pCtx.lineTo(s / 3, s / 3);
                    pCtx.stroke();
                    break;

                case "branch": // GitHub Git-Branch Node
                    pCtx.beginPath();
                    pCtx.moveTo(-s / 4, -s / 2);
                    pCtx.lineTo(-s / 4, s / 2);
                    pCtx.moveTo(-s / 4, -s / 8);
                    pCtx.quadraticCurveTo(s / 4, -s / 8, s / 4, s / 3);
                    pCtx.stroke();
                    pCtx.beginPath(); pCtx.arc(-s / 4, -s / 2, 1.2, 0, Math.PI * 2); pCtx.fill();
                    pCtx.beginPath(); pCtx.arc(-s / 4, s / 2, 1.2, 0, Math.PI * 2); pCtx.fill();
                    pCtx.beginPath(); pCtx.arc(s / 4, s / 3, 1.2, 0, Math.PI * 2); pCtx.fill();
                    break;

                case "gear": // Configuration Cogs
                    pCtx.beginPath();
                    pCtx.arc(0, 0, s / 3, 0, Math.PI * 2);
                    pCtx.stroke();
                    pCtx.beginPath();
                    pCtx.arc(0, 0, s / 9, 0, Math.PI * 2);
                    pCtx.fill();
                    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                        pCtx.moveTo(Math.cos(a) * (s / 3), Math.sin(a) * (s / 3));
                        pCtx.lineTo(Math.cos(a) * (s / 2), Math.sin(a) * (s / 2));
                    }
                    pCtx.stroke();
                    break;
            }

            pCtx.restore();
        };

        const renderBackground = () => {
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = 1.0;

            // Solid Premium Light Cashmere Base Canvas Coat
            ctx.fillStyle = "#f5ece3";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Deep Taupe watermarks configured beautifully for Light Backgrounds
            ctx.strokeStyle = "rgba(50, 40, 35, 0.07)";
            ctx.fillStyle = "rgba(50, 40, 35, 0.07)";
            ctx.lineWidth = 1.1;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            icons.forEach((icon) => {
                drawMicroIcon(ctx, icon);
            });
        };

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            canvas.width = parent ? parent.clientWidth : window.innerWidth;
            canvas.height = parent ? parent.clientHeight : window.innerHeight;

            initIcons();
            renderBackground();
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
        };
    }, [iconGridSpacing]);

    return (
        <canvas
            ref={canvasRef}
            className={cn("absolute inset-0 z-0 pointer-events-none bg-[#f5ece3]", className)}
            aria-hidden="true"
        />
    );
}