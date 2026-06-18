"use client";

import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  PlugZap,
  Bot,
  ShoppingCart,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  Command,
  User,
  LogOut,
  X,
  Plug,
  Package,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "../../../src/lib/utils";
import { trpc } from "../../../trpc/client";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";

import { DashboardView } from "./components/DashbaordView/DashboardView";
import { MarketplaceView } from "./components/MarketPlaceView/MarketplaceView";
import { AiToolView } from "./components/AiToolView/AiToolView";
import { ConnectView } from "./components/ConnectView/ConnectView";
import { StarryNight } from "../../../src/components/background-night";
import { BrushedBackground } from "../../../src/components/background-light";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
});

type View =
  | "dashboard"
  | "connect"
  | "marketplace"
  | "ai-tool";

// --- ONBOARDING STEPS ---
const ONBOARDING_STEPS = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Your command center. View email stats, calendar events, and get a bird's-eye view of everything that matters.",
    accent: "from-blue-400 to-sky-500",
  },
  {
    icon: PlugZap,
    title: "Connect Layers",
    description: "Link your Google account to unlock Gmail, Calendar, and other integrations. One-click OAuth — your data stays yours.",
    accent: "from-amber-500 to-orange-500",
  },
  {
    icon: Bot,
    title: "AI Core Tools",
    description: "Your purchased AI tools live here. Chat with AI assistants that can send emails, manage calendars, and more — all with your approval.",
    accent: "from-blue-500 to-sky-400",
  },
  {
    icon: ShoppingCart,
    title: "Marketplace",
    description: "Browse and install integrations and AI-powered plugins. Free and premium options to supercharge your workflow.",
    accent: "from-emerald-500 to-teal-500",
  },
];

export default function MainPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAiTools, setShowAiTools] = useState(false);
  const [showMobileAiTools, setShowMobileAiTools] = useState(false);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // --- NIGHT MODE STATE ---
  const [isNightMode, setIsNightMode] = useState(false);

  // --- ONBOARDING STATE ---
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem("svachalan_onboarding_dismissed");
    if (!dismissed) {
      // small delay so sidebar renders first
      setTimeout(() => setShowOnboarding(true), 400);
    }
  }, []);

  // Position tooltip next to the current step's sidebar button
  useEffect(() => {
    if (!showOnboarding) return;
    const el = document.querySelector(`[data-onboarding-step="${onboardingStep}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 16,
      });
    }
  }, [showOnboarding, onboardingStep]);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    if (dontShowAgain) {
      localStorage.setItem("svachalan_onboarding_dismissed", "true");
    }
  };

  // --- GSAP Arrow Animation ---
  const onboardingArrowRef = useRef<SVGSVGElement>(null);
  const arrowShaftRef = useRef<SVGPathElement>(null);
  const arrowHeadRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!showOnboarding || !onboardingArrowRef.current || !arrowShaftRef.current || !arrowHeadRef.current) return;

    const shaft = arrowShaftRef.current;
    const head = arrowHeadRef.current;

    // Reset previous tweens
    gsap.killTweensOf([onboardingArrowRef.current, shaft, head]);

    const shaftLength = shaft.getTotalLength() || 20;
    const headLength = head.getTotalLength() || 17;

    // Set initial values
    gsap.set(shaft, { strokeDasharray: shaftLength, strokeDashoffset: shaftLength });
    gsap.set(head, { strokeDasharray: headLength, strokeDashoffset: headLength });
    gsap.set(onboardingArrowRef.current, { x: 16, opacity: 0 });

    const tl = gsap.timeline();

    // 1. Fade in and draw shaft line from card edge
    tl.to(onboardingArrowRef.current, {
      opacity: 1,
      duration: 0.15,
    })
    .to(shaft, {
      strokeDashoffset: 0,
      duration: 0.35,
      ease: "power2.out",
    })
    // 2. Draw arrowhead pointing at tab
    .to(head, {
      strokeDashoffset: 0,
      duration: 0.25,
      ease: "power2.out",
    })
    // 3. Initiate pointing bounce/yoyo effect
    .to(onboardingArrowRef.current, {
      x: -6,
      duration: 0.75,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, [showOnboarding, onboardingStep]);

  // --- PROFILE CARD STATE ---
  const [showProfile, setShowProfile] = useState(false);
  const profileBtnRef = useRef<HTMLDivElement>(null);
  const profileCardRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // --- SIMPLE VERTICAL INDEX TRACKER ONLY ---
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Close profile card on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        profileCardRef.current && !profileCardRef.current.contains(target) &&
        profileBtnRef.current && !profileBtnRef.current.contains(target)
      ) {
        setShowProfile(false);
      }
    };
    if (showProfile) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfile]);

  // Map active views to a fixed vertical row index for fallback positioning
  const getViewIndex = (view: View): number => {
    switch (view) {
      case "dashboard": return 0;
      case "connect": return 1;
      case "ai-tool": return 2;
      case "marketplace": return 3;
      default: return 0;
    }
  };

  const activeIndex = hoveredIndex ?? getViewIndex(activeView);

  // Fetch user's purchased products from the backend
  const { data: userProducts } = trpc.marketplace.myProducts.useQuery();

  // Fetch user profile
  const { data: me } = trpc.auth.getMe.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Fetch connected integrations
  const { data: integrations } = trpc.CorsairGoogleIntegrateOAuth.checkAllIntegratedToolStatus.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Logout mutation
  const { mutateAsync: logout, isPending: isLoggingOut } = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("authentication_token");
      router.push("/");
    },
  });

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "connect":
        return <ConnectView />;
      case "marketplace":
        return <MarketplaceView />;
      case "ai-tool":
        return <AiToolView toolKey={activeTool ?? ""} toolName={userProducts?.find(p => p.toolKey === activeTool)?.name ?? "AI Tool"} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "relative h-screen overflow-hidden transition-colors duration-500 md:flex antialiased selection:bg-blue-400/30",
        playfair.className,
        isNightMode ? "dark bg-zinc-950 text-zinc-50" : "bg-[#F8F4EE] text-zinc-900"
      )}
    >
      {/* 🌌 ANIMATED BACKGROUND */}
      {isNightMode
        ? <StarryNight className="fixed inset-0 z-0 pointer-events-none opacity-70" />
        : <BrushedBackground className="fixed inset-0 z-0 pointer-events-none" />
      }

      {/* Mobile Header */}
      <div
        className={cn(
          "sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6 transition-all duration-300 md:hidden",
          isNightMode
            ? "border-zinc-800/60 bg-zinc-950/60 backdrop-blur-2xl"
            : "border-zinc-200/50 bg-white/60 backdrop-blur-2xl shadow-sm"
        )}
      >
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg transition hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Menu size={20} className={isNightMode ? "text-zinc-200" : "text-zinc-800"} />
        </button>

        <div className="flex items-center gap-2 font-semibold text-sm tracking-tight">
          <Command className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          <span>Workspace Hub</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm md:hidden transition-all"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "group hidden h-screen sticky top-0 w-20 flex-col border-r transition-all duration-300 ease-in-out hover:w-64 md:flex relative z-20 shrink-0 overflow-hidden",
          isNightMode
            ? "border-zinc-800/60 bg-zinc-950/40 backdrop-blur-2xl"
            : "border-white/50 bg-white/40 backdrop-blur-2xl shadow-[1px_0_10px_rgba(0,0,0,0.02)]"
        )}
      >
        {/* Workspace Brand Header Badge */}
        <div className="flex h-16 items-center px-5 border-b border-dashed border-zinc-500/10 dark:border-zinc-400/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-blue-400 text-white shadow-md shadow-blue-400/20">
              <Command className="h-5 w-5" />
            </div>
            <span className="hidden whitespace-nowrap font-semibold tracking-tight text-base opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:block">
              <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-blue-400 bg-clip-text text-transparent">
                स्वचालन
              </span>
            </span>
          </div>
        </div>

        {/* Navigation Section Container */}
        <div className="flex flex-1 flex-col py-4 px-3 group-hover:px-4 justify-between relative transition-all duration-300">
          <div
            className="relative flex flex-col gap-y-1.5"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* 🛠️ PURE GEOMETRIC CAPSULE BACKDROP PILL */}
            <div
              className={cn(
                "absolute h-11 rounded-xl pointer-events-none z-0",
                "left-1.5 group-hover:left-0 w-11 group-hover:w-full transition-all duration-300 ease-out",
                isNightMode
                  ? "bg-blue-500/20 border border-blue-400/30 text-blue-400"
                  : "bg-blue-400/10 text-blue-500 shadow-sm border border-blue-400/20"
              )}
              style={{
                // 44px (height) + 6px (gap-y-1.5 layout padding) = 50px fixed step increments
                transform: `translateY(${activeIndex * 50}px)`,
                transitionProperty: "transform, left, width, background-color"
              }}
            />

            {/* Dashboard Link */}
            <button
              data-onboarding-step="0"
              onClick={() => setActiveView("dashboard")}
              onMouseEnter={() => setHoveredIndex(0)}
              className={cn(
                "relative z-10 flex h-11 w-full items-center px-3 transition-colors duration-200 justify-start rounded-xl",
                activeView === "dashboard"
                  ? "text-blue-500 dark:text-blue-400 font-semibold"
                  : isNightMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900",
                showOnboarding && onboardingStep === 0 && "ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent"
              )}
            >
              <LayoutDashboard size={18} className="shrink-0 mx-auto group-hover:mx-0 transition-all duration-300" />
              <span className="hidden whitespace-nowrap text-[14px] font-medium group-hover:block ml-3">
                Dashboard
              </span>
            </button>

            {/* Connect Link */}
            <button
              data-onboarding-step="1"
              onClick={() => setActiveView("connect")}
              onMouseEnter={() => setHoveredIndex(1)}
              className={cn(
                "relative z-10 flex h-11 w-full items-center px-3 transition-colors duration-200 justify-start rounded-xl",
                activeView === "connect"
                  ? "text-blue-500 dark:text-blue-400 font-semibold"
                  : isNightMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900",
                showOnboarding && onboardingStep === 1 && "ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent"
              )}
            >
              <PlugZap size={18} className="shrink-0 mx-auto group-hover:mx-0 transition-all duration-300" />
              <span className="hidden whitespace-nowrap text-[14px] font-medium group-hover:block ml-3">
                Connect Layers
              </span>
            </button>

            {/* AI Tools Accordion Component */}
            <div
              className="relative z-10 w-full"
              onMouseEnter={() => setHoveredIndex(2)}
            >
              <button
                data-onboarding-step="2"
                onClick={() => setShowAiTools(!showAiTools)}
                className={cn(
                  "flex h-11 w-full items-center px-3 transition-colors duration-200 justify-start rounded-xl",
                  activeView === "ai-tool"
                    ? "text-blue-500 dark:text-blue-400 font-semibold"
                    : isNightMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900",
                  showOnboarding && onboardingStep === 2 && "ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent"
                )}
              >
                <Bot size={18} className="shrink-0 mx-auto group-hover:mx-0 transition-all duration-300" />
                <span className="hidden whitespace-nowrap text-[14px] font-medium group-hover:block ml-3">
                  AI Core Tools
                </span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "ml-auto hidden transition-transform duration-300 group-hover:block text-zinc-400",
                    showAiTools ? "rotate-180" : ""
                  )}
                />
              </button>

              {showAiTools && (
                <div className="mt-1 space-y-1 pl-4 hidden group-hover:block transition-all relative z-20">
                  {(userProducts ?? []).length === 0 && (
                    <div className="px-3 py-2 text-[11px] text-zinc-400 dark:text-zinc-500 italic">
                      No products added yet
                    </div>
                  )}
                  {(userProducts ?? []).map((product) => (
                    <button
                      key={product.toolKey}
                      onClick={() => {
                        setActiveTool(product.toolKey);
                        setActiveView("ai-tool");
                      }}
                      className={cn(
                        "block w-full rounded-lg px-3 py-2 text-left text-xs transition-all relative",
                        activeView === "ai-tool" && activeTool === product.toolKey
                          ? "text-blue-500 dark:text-blue-400 font-bold"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      )}
                    >
                      {activeView === "ai-tool" && activeTool === product.toolKey && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full bg-blue-400" />
                      )}
                      {product.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Marketplace Link */}
            <button
              data-onboarding-step="3"
              onClick={() => setActiveView("marketplace")}
              onMouseEnter={() => setHoveredIndex(3)}
              className={cn(
                "relative z-10 flex h-11 w-full items-center px-3 transition-colors duration-200 justify-start rounded-xl",
                activeView === "marketplace"
                  ? "text-blue-500 dark:text-blue-400 font-semibold"
                  : isNightMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900",
                showOnboarding && onboardingStep === 3 && "ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent"
              )}
            >
              <ShoppingCart size={18} className="shrink-0 mx-auto group-hover:mx-0 transition-all duration-300" />
              <span className="hidden whitespace-nowrap text-[14px] font-medium group-hover:block ml-3">
                Marketplace
              </span>
            </button>
          </div>

          {/* Bottom Actions — Theme + Profile */}
          <div className="flex flex-col gap-1.5 mb-4">
            {/* NIGHT MODE TOGGLE */}
            <button
              onClick={() => setIsNightMode(!isNightMode)}
              className={cn(
                "relative z-10 flex h-11 w-full items-center transition-all duration-300 rounded-xl border",
                isNightMode
                  ? "text-blue-400 bg-blue-400/5 border-blue-400/10 hover:text-blue-300 hover:bg-blue-400/10"
                  : "text-zinc-800 bg-zinc-200/50 border-zinc-300/20 hover:bg-zinc-200/80"
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 shadow-sm mx-auto group-hover:mx-0 group-hover:ml-1",
                  isNightMode ? "bg-blue-500 text-blue-50" : "bg-zinc-900 text-zinc-50"
                )}
              >
                {isNightMode ? (
                  <Sun size={15} className="shrink-0" />
                ) : (
                  <Moon size={15} className="shrink-0" />
                )}
              </div>
              <span className="hidden whitespace-nowrap text-[13px] font-semibold group-hover:block ml-3">
                {isNightMode ? "Light Core" : "Night Canvas"}
              </span>
            </button>

            {/* USER PROFILE BUTTON */}
            <div className="relative" ref={profileBtnRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={cn(
                  "relative z-10 flex h-11 w-full items-center transition-all duration-300 rounded-xl",
                  isNightMode
                    ? "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 mx-auto group-hover:mx-0 group-hover:ml-1",
                    isNightMode ? "bg-blue-400/15 text-blue-400" : "bg-blue-400/10 text-blue-500"
                  )}
                >
                  <User size={15} className="shrink-0" />
                </div>
                <span className="hidden whitespace-nowrap text-[13px] font-semibold group-hover:block ml-3 truncate">
                  {me?.fullName ?? "Profile"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Profile Popover Card — rendered outside sidebar to avoid overflow clipping */}
      {showProfile && (
        <div
          ref={profileCardRef}
          className={cn(
            "fixed z-[100] w-72 rounded-2xl p-5 space-y-4",
            isNightMode
              ? "bg-zinc-900 text-zinc-100 shadow-xl shadow-black/40"
              : "bg-white text-zinc-900 shadow-xl shadow-black/10"
          )}
          style={{
            bottom: 24,
            left: 88,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-10 rounded-full flex items-center justify-center text-sm font-bold",
                isNightMode ? "bg-blue-400/20 text-blue-400" : "bg-blue-400/10 text-blue-500"
              )}>
                {me?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{me?.fullName ?? "User"}</p>
                <p className={cn("text-[11px] truncate", isNightMode ? "text-zinc-500" : "text-zinc-400")}>{me?.email ?? ""}</p>
              </div>
            </div>
            <button onClick={() => setShowProfile(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
              <X size={14} className="text-zinc-400" />
            </button>
          </div>

          {/* Integrations */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Plug size={12} className={isNightMode ? "text-zinc-500" : "text-zinc-400"} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", isNightMode ? "text-zinc-500" : "text-zinc-400")}>Integrations</span>
            </div>
            {integrations && Object.keys(integrations).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(integrations).map(([key, connected]) => (
                  <div key={key} className="flex items-center justify-between text-xs py-1">
                    <span className="capitalize font-medium">{key.replace(/_/g, " ")}</span>
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      connected
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : isNightMode ? "bg-zinc-800 text-zinc-500" : "bg-zinc-100 text-zinc-400"
                    )}>
                      {connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={cn("text-[11px] italic", isNightMode ? "text-zinc-600" : "text-zinc-400")}>No integrations yet</p>
            )}
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Package size={12} className={isNightMode ? "text-zinc-500" : "text-zinc-400"} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", isNightMode ? "text-zinc-500" : "text-zinc-400")}>Products</span>
            </div>
            {(userProducts ?? []).length > 0 ? (
              <div className="space-y-1">
                {(userProducts ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1">
                    <span className="font-medium truncate">{p.name}</span>
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize",
                      isNightMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                    )}>
                      {p.planType}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={cn("text-[11px] italic", isNightMode ? "text-zinc-600" : "text-zinc-400")}>No products added</p>
            )}
          </div>

          {/* Divider + Logout */}
          <div className={cn("border-t pt-3", isNightMode ? "border-zinc-800" : "border-zinc-100")}>
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className={cn(
                "flex items-center gap-2 w-full text-xs font-semibold py-2 px-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50",
                isNightMode
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-red-600 hover:bg-red-50"
              )}
            >
              <LogOut size={14} />
              <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Frame overlay */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-68 p-5 border-r transition-transform duration-300 ease-out md:hidden flex flex-col justify-between shadow-2xl",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isNightMode
            ? "border-zinc-800 bg-zinc-950/95 backdrop-blur-xl text-zinc-200"
            : "border-white/60 bg-[#F8F4EE]/95 backdrop-blur-xl text-zinc-900"
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-3 py-2 border-b border-zinc-500/10">
            <Command className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            <span className="font-bold tracking-tight text-base">स्वचालन Core</span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveView("dashboard");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-xl px-4 transition text-[14px] font-medium",
                activeView === "dashboard" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-md" : "opacity-70"
              )}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveView("connect");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-xl px-4 transition text-[14px] font-medium",
                activeView === "connect" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-md" : "opacity-70"
              )}
            >
              <PlugZap size={18} />
              <span>Connect Layers</span>
            </button>

            <div>
              <button
                onClick={() => setShowMobileAiTools(!showMobileAiTools)}
                className="flex h-11 w-full items-center gap-3 rounded-xl px-4 transition text-[14px] font-medium opacity-70"
              >
                <Bot size={18} />
                <span>AI Core Tools</span>
                <ChevronDown
                  size={14}
                  className={cn("ml-auto transition-transform duration-200", showMobileAiTools ? "rotate-180" : "")}
                />
              </button>

              {showMobileAiTools && (
                <div className="mt-1 space-y-1 pl-9 border-l border-zinc-500/10 ml-6">
                  {(userProducts ?? []).length === 0 && (
                    <div className="px-3 py-2 text-[11px] text-zinc-400 italic">
                      No products added yet
                    </div>
                  )}
                  {(userProducts ?? []).map((product) => (
                    <button
                      key={product.toolKey}
                      onClick={() => {
                        setActiveTool(product.toolKey);
                        setActiveView("ai-tool");
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "block w-full rounded-lg px-3 py-2 text-left text-xs transition",
                        activeView === "ai-tool" && activeTool === product.toolKey
                          ? "text-blue-500 dark:text-blue-400 font-bold"
                          : isNightMode
                            ? "text-zinc-500 hover:bg-zinc-900"
                            : "text-zinc-500 hover:bg-zinc-200/50"
                      )}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setActiveView("marketplace");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "flex h-11 w-full items-center gap-3 rounded-xl px-4 transition text-[14px] font-medium",
                activeView === "marketplace" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-md" : "opacity-70"
              )}
            >
              <ShoppingCart size={18} />
              <span>Marketplace</span>
            </button>
          </div>
        </div>

        {/* NIGHT MODE TOGGLE (MOBILE SYSTEM BLOCK) */}
        <button
          onClick={() => setIsNightMode(!isNightMode)}
          className={cn(
            "flex h-11 w-full items-center gap-3 rounded-xl px-4 transition text-[13px] font-semibold border border-transparent",
            isNightMode
              ? "text-blue-400 bg-blue-400/5 border-blue-400/10"
              : "text-zinc-600 bg-zinc-200/50 hover:bg-zinc-200"
          )}
        >
          {isNightMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isNightMode ? "Light Core" : "Night Canvas"}</span>
        </button>

        {/* MOBILE USER PROFILE SECTION */}
        <div className={cn("border-t pt-4 mt-3 space-y-3", isNightMode ? "border-zinc-800" : "border-zinc-200/50")}>
          <div className="flex items-center gap-3 px-2">
            <div className={cn(
              "size-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
              isNightMode ? "bg-blue-400/20 text-blue-400" : "bg-blue-400/10 text-blue-500"
            )}>
              {me?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{me?.fullName ?? "User"}</p>
              <p className={cn("text-[11px] truncate", isNightMode ? "text-zinc-500" : "text-zinc-400")}>{me?.email ?? ""}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            className={cn(
              "flex items-center gap-2 w-full text-xs font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50",
              isNightMode
                ? "text-red-400 hover:bg-red-500/10"
                : "text-red-600 hover:bg-red-50"
            )}
          >
            <LogOut size={14} />
            <span>{isLoggingOut ? "Logging out…" : "Log out"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto md:p-6 lg:p-8 transition-all">
        <div className="h-full w-full">
          {renderContent()}
        </div>
      </main>

      {/* ── ONBOARDING OVERLAY ── */}
      {showOnboarding && tooltipPos && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          {/* Subtle dark backdrop to keep focus, clickable to dismiss */}
          <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px] pointer-events-auto" onClick={dismissOnboarding} />

          <div
            className={cn(
              "absolute z-[210] w-full max-w-sm rounded-3xl p-6 space-y-5 transition-all duration-300 pointer-events-auto shadow-2xl",
              isNightMode
                ? "bg-zinc-900 text-zinc-100 shadow-black/60 border border-zinc-800/80"
                : "bg-white text-zinc-900 shadow-black/15 border border-zinc-200/50"
            )}
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: "translateY(-50%)",
            }}
          >
            {/* Animated pointing arrow */}
            <svg
              ref={onboardingArrowRef}
              width="24"
              height="16"
              viewBox="0 0 24 16"
              fill="none"
              className={cn(
                "absolute left-[-28px] top-1/2 -translate-y-1/2 z-[220] pointer-events-none origin-right",
                isNightMode ? "text-blue-400" : "text-blue-500"
              )}
            >
              {/* Shaft path (drawn from right to left) */}
              <path
                ref={arrowShaftRef}
                d="M22 8H2"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Head path (drawn starting from endpoint) */}
              <path
                ref={arrowHeadRef}
                d="M8 2L2 8L8 14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-tr from-blue-500 to-blue-400 text-white flex items-center justify-center shadow-md shadow-blue-400/10">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">
                  Welcome to <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-blue-400 bg-clip-text text-transparent">स्वचालन</span>
                </h2>
                <p className={cn("text-[10px] font-medium", isNightMode ? "text-zinc-500" : "text-zinc-400")}>
                  Let&apos;s tour the sidebar tabs
                </p>
              </div>
            </div>

            {/* Current Step */}
            {(() => {
              const step = ONBOARDING_STEPS[onboardingStep];
              const Icon = step.icon;
              return (
                <div className={cn(
                  "rounded-2xl p-4 space-y-2.5 transition-all duration-300",
                  isNightMode ? "bg-zinc-800/50" : "bg-zinc-50"
                )}>
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br shadow-sm",
                      step.accent
                    )}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold">{step.title}</h3>
                      <span className={cn("text-[9px] font-semibold uppercase tracking-wider",
                        isNightMode ? "text-zinc-500" : "text-zinc-400"
                      )}>
                        Step {onboardingStep + 1} of {ONBOARDING_STEPS.length}
                      </span>
                    </div>
                  </div>
                  <p className={cn("text-xs leading-relaxed",
                    isNightMode ? "text-zinc-400" : "text-zinc-600"
                  )}>
                    {step.description}
                  </p>
                </div>
              );
            })()}

            {/* Step dots */}
            <div className="flex justify-center gap-1">
              {ONBOARDING_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setOnboardingStep(i)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === onboardingStep
                      ? "w-4 bg-blue-400"
                      : cn("w-1", isNightMode ? "bg-zinc-700" : "bg-zinc-300")
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              {/* Don't show again */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="size-3 rounded border-zinc-300 dark:border-zinc-700 text-blue-500 focus:ring-blue-400 cursor-pointer accent-blue-500"
                />
                <span className={cn("text-[10px] font-medium",
                  isNightMode ? "text-zinc-500" : "text-zinc-400"
                )}>
                  Don&apos;t show again
                </span>
              </label>

              {/* Nav buttons */}
              <div className="flex items-center gap-1.5">
                {onboardingStep > 0 && (
                  <button
                    onClick={() => setOnboardingStep(s => s - 1)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors",
                      isNightMode
                        ? "text-zinc-400 hover:bg-zinc-800"
                        : "text-zinc-500 hover:bg-zinc-100"
                    )}
                  >
                    Back
                  </button>
                )}
                {onboardingStep < ONBOARDING_STEPS.length - 1 ? (
                  <button
                    onClick={() => setOnboardingStep(s => s + 1)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold bg-blue-500 text-white hover:bg-blue-400 transition-colors shadow-sm"
                  >
                    Next <ArrowRight size={10} />
                  </button>
                ) : (
                  <button
                    onClick={dismissOnboarding}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold bg-blue-500 text-white hover:bg-blue-400 transition-colors shadow-sm"
                  >
                    Get Started <Sparkles size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Skip button */}
            <button
              onClick={dismissOnboarding}
              className={cn(
                "absolute top-4 right-4 p-1 rounded-lg transition-colors",
                isNightMode ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-zinc-100 text-zinc-400"
              )}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}