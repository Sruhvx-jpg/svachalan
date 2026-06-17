"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  SiSlack, SiGmail, SiGooglecalendar, SiGithub, SiJira, SiTrello,
  SiDiscord, SiZoom, SiDropbox, SiNotion, SiFigma, SiAsana,
  SiSalesforce, SiHubspot, SiLinear, SiZendesk, SiStripe, SiShopify,
  SiIntercom, SiMailchimp, SiMiro, SiAirtable, SiCanva, SiWebflow,
  SiVercel, SiTwilio, SiGitlab, SiBitbucket, SiGooglecloud,
  SiOpenai, SiWhatsapp, SiSpotify, SiFramer, SiPatreon
} from "react-icons/si";

const ICONS = [
  SiSlack, SiGmail, SiGooglecalendar, SiGithub, SiJira, SiTrello,
  SiDiscord, SiZoom, SiDropbox, SiNotion, SiFigma, SiAsana,
  SiSalesforce, SiHubspot, SiLinear, SiZendesk, SiStripe, SiShopify,
  SiIntercom, SiMailchimp, SiMiro, SiAirtable, SiCanva, SiWebflow,
  SiVercel, SiTwilio, SiGitlab, SiBitbucket, SiGooglecloud,
  SiOpenai, SiWhatsapp, SiSpotify, SiFramer, SiPatreon
];

export function BackgroundIntegrations() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Define a pool of persistent balloon nodes to prevent DOM churn
  const totalBalloons = 45;
  const items = useMemo(() => {
    return Array.from({ length: totalBalloons }).map((_, i) => ({
      id: `balloon-${i}`,
      Icon: ICONS[i % ICONS.length],
    }));
  }, []);

  // Advanced GSAP Animation Engine Layout
  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    // Use gsap.context to ensure seamless cleanups under React 18 StrictMode
    const ctx = gsap.context(() => {
      const elements = containerRef.current?.querySelectorAll(".balloon-item");

      elements?.forEach((el) => {
        let floatTween: gsap.core.Tween | null = null;
        let wiggleTween: gsap.core.Tween | null = null;

        const resetAndFloat = (isInitialSpawn = false) => {
          if (floatTween) floatTween.kill();
          if (wiggleTween) wiggleTween.kill();

          const viewWidth = window.innerWidth;
          const viewHeight = window.innerHeight;

          // Randomized structural physics properties
          const startY = viewHeight + 80;
          const endY = -80;
          const randomX = Math.random() * viewWidth;
          const speed = 10 + Math.random() * 12; // Floating velocity range
          const depthScale = 0.5 + Math.random() * 0.7; // Simulates Z-depth
          const baseOpacity = 0.2 + Math.random() * 0.25; // Random variation matching design rules

          // 1. Position Initialization 
          gsap.set(el, {
            x: randomX,
            y: isInitialSpawn ? Math.random() * viewHeight : startY,
            scale: depthScale,
            opacity: baseOpacity,
            rotation: Math.random() * 40 - 20,
            pointerEvents: "auto",
          });

          // 2. Linear Vertical Ascent Animation
          floatTween = gsap.to(el, {
            y: endY,
            duration: speed,
            ease: "none",
            onUpdate: function () {
              // Mathematical Proximity Masking Layer for the center form card
              const currentX = gsap.getProperty(el, "x") as number;
              const currentY = gsap.getProperty(el, "y") as number;
              const cardCenterX = viewWidth / 2;
              const cardCenterY = viewHeight / 2;

              const distanceX = Math.abs(currentX - cardCenterX);
              const distanceY = Math.abs(currentY - cardCenterY);

              // Dynamically suppress alpha values if floating beneath central UI card
              if (distanceX < 220 && distanceY < 340) {
                gsap.set(el, { opacity: 0.04 });
              } else if (distanceX < 280 && distanceY < 400) {
                gsap.set(el, { opacity: 0.15 });
              } else {
                gsap.set(el, { opacity: baseOpacity });
              }
            },
            onComplete: () => {
              // Trigger explicit ceiling pop animation instead of disappearing silently
              triggerPop();
            },
          });

          // 3. Horizontal Sine-Wave Drifting (Wiggle Physics)
          const driftRadius = 25 + Math.random() * 45;
          wiggleTween = gsap.to(el, {
            x: `+=${driftRadius}`,
            duration: 2.5 + Math.random() * 2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        };

        //  Execution Timeline
        const triggerPop = () => {
          if (el.getAttribute("data-popping") === "true") return;
          el.setAttribute("data-popping", "true");
          

          if (floatTween) floatTween.kill();
          if (wiggleTween) wiggleTween.kill();

          const currentScale = gsap.getProperty(el, "scale") as number;

          const popTimeline = gsap.timeline({
            onComplete: () => {
              el.setAttribute("data-popping", "false");
              resetAndFloat(false); // Instantly recycle element back to spawn queue
            },
          });

          popTimeline
            // Phase A: Rapid pressurized balloon expansion
            .to(el, {
              scale: currentScale * 1.4,
              opacity: 0.9,
              rotation: "+=35",
              duration: 0.08,
              ease: "power2.out",
            })
            // Phase B: Complete molecular surface collapse burst
            .to(el, {
              scale: 0,
              opacity: 0,
              duration: 0.12,
              ease: "back.in(2.5)",
            });
        };

        // Bind internal method hooks onto native DOM interface for event accessibility
        (el as any).__gsapPopTrigger = triggerPop;

        // Kick off immediate system loops
        resetAndFloat(true);
      });
    });

    return () => ctx.revert();
  }, [isMounted]);

  if (!isMounted) {
    return <div className="absolute inset-0 bg-[#f4efe6]" />;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[#f4efe6]">
      {/* Dynamic Animated Node Layer */}
      {items.map((item) => {
        const Icon = item.Icon;
        return (
          <div
            key={item.id}
            className="balloon-item absolute will-change-transform cursor-pointer text-slate-700 hover:text-black transition-colors duration-200 z-0 select-none"
            style={{ top: 0, left: 0 }}
            onClick={(e) => {
              const currentTarget = e.currentTarget as any;
              if (currentTarget.__gsapPopTrigger) {
                currentTarget.__gsapPopTrigger();
              }
            }}
          >
            <Icon size={26} />
          </div>
        );
      })}

      {/* Lighting Depth Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-25 z-10"
        style={{
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.25) 100%)",
        }}
      />
    </div>
  );
}