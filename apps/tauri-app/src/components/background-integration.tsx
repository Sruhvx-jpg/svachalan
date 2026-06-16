"use client";

import { useMemo, useState, useEffect } from "react";
import {
  SiSlack, SiGmail, SiGooglecalendar, SiGithub, SiJira, SiTrello,
  SiDiscord, SiZoom, SiDropbox, SiNotion, SiFigma, SiAsana,
  SiSalesforce, SiHubspot, SiLinear, SiZendesk, SiStripe, SiShopify,
  SiIntercom, SiMailchimp, SiMiro, SiAirtable, SiCanva, SiWebflow,
  SiVercel, SiTwilio, SiGitlab, SiBitbucket, SiGooglecloud,
  SiOpenai,  SiWhatsapp, SiSpotify, SiFramer, SiPatreon
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
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);

  // Safely capture window size only after mounting on the browser client
  useEffect(() => {
    setIsMounted(true);
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const items = useMemo(() => {
    const positions = [];
    let iconIndex = 0;

    // High density grid counts
    const cols = 22; 
    const rows = 11; 

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        // Evenly disperse coordinates horizontally and vertically across 100% of the viewport
        const x = (col / (cols - 1)) * 100;
        const y = (row / (rows - 1)) * 100 + (col % 2 !== 0 ? 4.5 : 0); // Stagger row placement for a beautiful mesh look

        positions.push({
          id: `node-${col}-${row}`,
          Icon: ICONS[iconIndex % ICONS.length],
          x,
          y,
        });
        iconIndex++;
      }
    }

    // Shuffle layout array once to keep icon dispersion clean and non-repeating
    return positions.sort(() => Math.random() - 0.5);
  }, []);

  // Return null or empty div during SSR step to completely avoid hydration bugs
  if (!isMounted) {
    return <div className="absolute inset-0 bg-[#f4efe6]" />;
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#f4efe6]"
      onMouseMove={(e) =>
        setMouse({
          x: e.clientX,
          y: e.clientY,
        })
      }
      onMouseLeave={() => setMouse({ x: -9999, y: -9999 })}
    >
      {/* Seamless Wall-to-Wall Grid Container */}
      {items.map((item) => {
        const Icon = item.Icon;

        let offsetX = 0;
        let offsetY = 0;
        let baseOpacity = 0.35; // Matches visibility setting from image_69053a.png

        const px = (windowSize.width * item.x) / 100;
        const py = (windowSize.height * item.y) / 100;

        // 1. Interactive Mouse Deflection Calculations
        const dx = px - mouse.x;
        const dy = py - mouse.y;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        const pushRadius = 120; // Radius distance determining when an icon moves away

        if (mouseDist < pushRadius && mouseDist > 0) {
          const strength = (pushRadius - mouseDist) / pushRadius;
          offsetX = (dx / mouseDist) * strength * 35; // Maximum pixel translation away from cursor
          offsetY = (dy / mouseDist) * strength * 35;
        }

        // 2. Proximity Masking Layer
        // Keeps the layout running everywhere, but lowers opacity beneath your card so login fields stay completely legible
        const cardCenterX = windowSize.width / 2;
        const cardCenterY = windowSize.height / 2;
        const cardDx = Math.abs(px - cardCenterX);
        const cardDy = Math.abs(py - cardCenterY);

        if (cardDx < 220 && cardDy < 340) {
          baseOpacity = 0.05; // Fade to whisper-thin visibility directly behind form inputs
        } else if (cardDx < 280 && cardDy < 400) {
          baseOpacity = 0.18; // Intermediate transition boundary step
        }

        return (
          <div
            key={item.id}
            className="absolute transition-all duration-300 ease-out text-slate-700 hover:text-black hover:scale-125 cursor-default z-0"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity: baseOpacity,
              transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
            }}
          >
            <Icon size={24} />
          </div>
        );
      })}

      {/* Lighting Depth Vignette */}
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