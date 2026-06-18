"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, Calendar, Loader2, Check } from "lucide-react"; 
import { trpc } from "../../../../../trpc/client";
import { cn } from "../../../../../src/lib/utils";

interface GooeyWordLoopProps {
  words: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
}

// ==========================================
// 1. ANIMATED GOOEY WORD LOOP ENGINE
// ==========================================
function GooeyWordLoop({
  words,
  morphTime = 1, 
  cooldownTime = 2.5, 
  className,
}: GooeyWordLoopProps) {
  const word1Ref = useRef<HTMLSpanElement>(null);
  const word2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!words || words.length === 0) return;

    let animationFrameId: number;
    let wordIndex = words.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;

    const setMorph = (fraction: number) => {
      if (word1Ref.current && word2Ref.current) {
        word2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        word2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

        const invFraction = 1 - fraction;
        word1Ref.current.style.filter = `blur(${Math.min(8 / invFraction - 8, 100)}px)`;
        word1Ref.current.style.opacity = `${Math.pow(invFraction, 0.4) * 100}%`;
      }
    };

    const doCooldown = () => {
      morph = 0;
      if (word1Ref.current && word2Ref.current) {
        word2Ref.current.style.filter = "";
        word2Ref.current.style.opacity = "100%";
        word1Ref.current.style.filter = "";
        word1Ref.current.style.opacity = "0%";
      }
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);
    };

    if (word1Ref.current && word2Ref.current) {
      word1Ref.current.textContent = words[wordIndex % words.length];
      word2Ref.current.textContent = words[(wordIndex + 1) % words.length];
    }

    function animate() {
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          wordIndex = (wordIndex + 1) % words.length;

          if (word1Ref.current && word2Ref.current) {
            word1Ref.current.textContent = words[wordIndex % words.length];
            word2Ref.current.textContent = words[(wordIndex + 1) % words.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [words, morphTime, cooldownTime]);

  return (
    <span className={cn("inline-flex relative items-center justify-start min-w-[200px] md:min-w-[320px] h-[1.4em] select-none vertical-middle translate-y-[4px]", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="gooey-threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -100" 
            />
          </filter>
        </defs>
      </svg>

      <span
        className="flex items-center justify-start w-full h-full"
        style={{ filter: "url(#gooey-threshold)" }}
      >
        <span ref={word1Ref} className="absolute inline-block text-left font-black font-inherit" />
        <span ref={word2Ref} className="absolute inline-block text-left font-black font-inherit" />
      </span>
    </span>
  );
}

// ==========================================
// 2. MAIN CONNECT VIEW INTERFACE (ENHANCED)
// ==========================================
export function ConnectView() {
  const [error, setError] = useState<string | null>(null);
  const [activePlugin, setActivePlugin] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [waitingForPlugin, setWaitingForPlugin] = useState<string | null>(null);

  const supportedIntegrations = ["Gmail", "Calendar"];

  // Polling query: refetch every 1.5s when we have opened the OAuth URL in system browser
  const { data: fetchedStatuses } = trpc.CorsairGoogleIntegrateOAuth.checkAllIntegratedToolStatus.useQuery(
    undefined,
    {
      refetchInterval: waitingForPlugin ? 1500 : false,
    }
  );

  const { mutateAsync: connectAsync, isPending } =
    trpc.CorsairGoogleIntegrateOAuth.connectEmail.useMutation();

  // Sync with LocalStorage and State
  useEffect(() => {
    const cached = localStorage.getItem("integration_status");
    if (cached) {
      try {
        setStatuses(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached integration status", e);
      }
    }
  }, []);

  useEffect(() => {
    if (fetchedStatuses) {
      setStatuses(fetchedStatuses);
      localStorage.setItem("integration_status", JSON.stringify(fetchedStatuses));
    }
  }, [fetchedStatuses]);

  // If a plugin status becomes true while we are waiting, stop polling/waiting
  useEffect(() => {
    if (fetchedStatuses && waitingForPlugin) {
      const isConnected =
        waitingForPlugin === "gmail"
          ? !!fetchedStatuses["gmail"]
          : !!fetchedStatuses["googlecalendar"];
      if (isConnected) {
        setWaitingForPlugin(null);
      }
    }
  }, [fetchedStatuses, waitingForPlugin]);

  const handleConnect = async (plugin: string) => {
    try {
      setError(null);
      setActivePlugin(plugin);

      const result = await connectAsync({ plugin });
      if (result?.url) {
        const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;
        if (isTauri) {
          setWaitingForPlugin(plugin);
          const { open } = await import("@tauri-apps/plugin-opener");
          await open(result.url);
        } else {
          window.location.href = result.url;
        }
      }
    } catch (err) {
      setError("Failed to configure cloud integration layers");
      setActivePlugin(null);
      setWaitingForPlugin(null);
    }
  };

  const isGmailConnected = !!statuses["gmail"];
  const isCalendarConnected = !!statuses["googlecalendar"];

  const isGmailWaiting = waitingForPlugin === "gmail";
  const isCalendarWaiting = waitingForPlugin === "googlecalendar";

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-4 sm:p-6 md:p-8">
      
      {/* PAGE TITLE DISPLAY */}
      <div className="mb-10 text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight flex items-center flex-row flex-wrap whitespace-nowrap text-zinc-900 dark:text-zinc-50">
          <span className="font-light text-zinc-500 dark:text-zinc-400">Connect</span>
          <span className="tracking-tight">&nbsp;</span>
          <GooeyWordLoop 
            words={supportedIntegrations}
            className="text-blue-500 dark:text-blue-400 font-black tracking-tight" 
          />
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
          Securely authenticate data nodes to activate global automation layers across{" "}
          <span className="font-bold text-blue-500 dark:text-blue-400 inline-block px-0.5">
            स्वचालन
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-8 rounded-2xl border border-red-200 dark:border-red-800/30 bg-red-100/80 dark:bg-red-900/20 p-4 text-sm font-medium text-red-700 dark:text-red-300 backdrop-blur-md">
          {error}
        </div>
      )}

      {/* CORE INTEGRATIONS LAYOUT SYSTEM */}
      <div className="grid gap-6 sm:grid-cols-2 max-w-[900px] items-start">
        
        {/* GMAIL CARD */}
        <div className="group rounded-[2rem] border border-white/40 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/40 p-6 sm:p-8 shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-400/10 text-blue-500 dark:text-blue-400 mb-5 group-hover:scale-105 transition-transform duration-300">
            <Mail size={24} className="opacity-90" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Gmail Engine</h2>
          <p className="mt-1.5 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">Link your enterprise accounts to monitor and orchestrate email events safely.</p>

          <button
            onClick={() => handleConnect("gmail")}
            disabled={isPending || isGmailConnected || isGmailWaiting}
            className={cn(
              "relative mt-8 h-11 w-full sm:w-36 overflow-hidden rounded-xl font-semibold text-[14px] transition-all flex items-center justify-center gap-2 shadow-sm",
              isGmailConnected 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default font-medium" 
                : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 hover:shadow-md",
              (isPending || isGmailWaiting) && activePlugin === "gmail" && "opacity-60 cursor-not-allowed pointer-events-none"
            )}
          >
            {(isPending || isGmailWaiting) && activePlugin === "gmail" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span>Configuring...</span>
              </>
            ) : isGmailConnected ? (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>Active Node</span>
              </>
            ) : (
              <span>Deploy Link</span>
            )}
          </button>
        </div>

        {/* CALENDAR CARD */}
        <div className="group rounded-[2rem] border border-white/40 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/40 p-6 sm:p-8 shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-400/10 text-blue-500 dark:text-blue-400 mb-5 group-hover:scale-105 transition-transform duration-300">
            <Calendar size={24} className="opacity-90" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Google Calendar</h2>
          <p className="mt-1.5 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">Sync structural calendar matrix pipelines, events, and scheduling hooks.</p>

          <button
            onClick={() => handleConnect("googlecalendar")}
            disabled={isPending || isCalendarConnected || isCalendarWaiting}
            className={cn(
              "relative mt-8 h-11 w-full sm:w-36 overflow-hidden rounded-xl font-semibold text-[14px] transition-all flex items-center justify-center gap-2 shadow-sm",
              isCalendarConnected 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default font-medium" 
                : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 hover:shadow-md",
              (isPending || isCalendarWaiting) && activePlugin === "googlecalendar" && "opacity-60 cursor-not-allowed pointer-events-none"
            )}
          >
            {(isPending || isCalendarWaiting) && activePlugin === "googlecalendar" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span>Configuring...</span>
              </>
            ) : isCalendarConnected ? (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>Active Node</span>
              </>
            ) : (
              <span>Deploy Link</span>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}