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
} from "lucide-react";
import { cn } from "../../../src/lib/utils";

import { DashboardView } from "./components/DashbaordView/DashboardView";
import { MarketplaceView } from "./components/MarketPlaceView/MarketplaceView";
import { AiToolView } from "./components/AiToolView/AiToolView";
import { ConnectView } from "./components/ConnectView/ConnectView";
import { StarryNight } from "../../../src/components/background-night";
import { Spline_Sans } from "next/font/google";

const splineSans = Spline_Sans({
  subsets: ["latin"],
});

type View =
  | "dashboard"
  | "connect"
  | "marketplace"
  | "ai-tool";

export default function MainPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAiTools, setShowAiTools] = useState(false);
  const [showMobileAiTools, setShowMobileAiTools] = useState(false);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // --- NIGHT MODE STATE ---
  const [isNightMode, setIsNightMode] = useState(false);

  // --- SIMPLE VERTICAL INDEX TRACKER ONLY ---
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const purchasedAiTools = [
    "Agent Builder",
    "Research Assistant",
    "Email Writer",
  ];

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "connect":
        return <ConnectView />;
      case "marketplace":
        return <MarketplaceView />;
      case "ai-tool":
        return <AiToolView toolName={activeTool ?? "AI Tool"} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "relative h-screen overflow-hidden transition-colors duration-500 md:flex antialiased selection:bg-indigo-500/30",
        splineSans.className,
        isNightMode ? "dark bg-zinc-950 text-zinc-50" : "bg-[#F8F4EE] text-zinc-900"
      )}
    >
      {/* 🌌 STARRY NIGHT BACKGROUND INJECTOR */}
      {isNightMode && <StarryNight className="fixed inset-0 z-0 pointer-events-none opacity-70" />}

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
          <Command className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
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
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20">
              <Command className="h-5 w-5" />
            </div>
            <span className="hidden whitespace-nowrap font-semibold tracking-tight text-base opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:block">
              <span className="bg-gradient-to-r from-indigo-500 via-sky-400 to-blue-500 bg-clip-text text-transparent">
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
                  ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-400"
                  : "bg-indigo-500/10 text-indigo-600 shadow-sm border border-indigo-500/20"
              )}
              style={{
                // 44px (height) + 6px (gap-y-1.5 layout padding) = 50px fixed step increments
                transform: `translateY(${activeIndex * 50}px)`,
                transitionProperty: "transform, left, width, background-color"
              }}
            />

            {/* Dashboard Link */}
            <button
              onClick={() => setActiveView("dashboard")}
              onMouseEnter={() => setHoveredIndex(0)}
              className={cn(
                "relative z-10 flex h-11 w-full items-center px-3 transition-colors duration-200 justify-start rounded-xl",
                activeView === "dashboard"
                  ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                  : isNightMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <LayoutDashboard size={18} className="shrink-0 mx-auto group-hover:mx-0 transition-all duration-300" />
              <span className="hidden whitespace-nowrap text-[14px] font-medium group-hover:block ml-3">
                Dashboard
              </span>
            </button>

            {/* Connect Link */}
            <button
              onClick={() => setActiveView("connect")}
              onMouseEnter={() => setHoveredIndex(1)}
              className={cn(
                "relative z-10 flex h-11 w-full items-center px-3 transition-colors duration-200 justify-start rounded-xl",
                activeView === "connect"
                  ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                  : isNightMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900"
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
                onClick={() => setShowAiTools(!showAiTools)}
                className={cn(
                  "flex h-11 w-full items-center px-3 transition-colors duration-200 justify-start rounded-xl",
                  activeView === "ai-tool"
                    ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                    : isNightMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900"
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
                  {purchasedAiTools.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => {
                        setActiveTool(tool);
                        setActiveView("ai-tool");
                      }}
                      className={cn(
                        "block w-full rounded-lg px-3 py-2 text-left text-xs transition-all relative",
                        activeView === "ai-tool" && activeTool === tool
                          ? "text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                      )}
                    >
                      {activeView === "ai-tool" && activeTool === tool && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full bg-indigo-500" />
                      )}
                      {tool}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Marketplace Link */}
            <button
              onClick={() => setActiveView("marketplace")}
              onMouseEnter={() => setHoveredIndex(3)}
              className={cn(
                "relative z-10 flex h-11 w-full items-center px-3 transition-colors duration-200 justify-start rounded-xl",
                activeView === "marketplace"
                  ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                  : isNightMode ? "text-zinc-400 hover:text-zinc-100" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <ShoppingCart size={18} className="shrink-0 mx-auto group-hover:mx-0 transition-all duration-300" />
              <span className="hidden whitespace-nowrap text-[14px] font-medium group-hover:block ml-3">
                Marketplace
              </span>
            </button>
          </div>

          {/* NIGHT MODE TOGGLE (SHIFTED UPWARDS WITH mb-6 TO PREVENT CLIPPING ENCOUNTERED IN image_65d6c6.png) */}
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className={cn(
              "relative z-10 flex h-11 w-full items-center transition-all duration-300 rounded-xl mt-auto mb-6 border",
              isNightMode
                ? "text-indigo-400 bg-indigo-500/5 border-indigo-500/10 hover:text-indigo-300 hover:bg-indigo-500/10"
                : "text-zinc-800 bg-zinc-200/50 border-zinc-300/20 hover:bg-zinc-200/80"
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 shadow-sm mx-auto group-hover:mx-0 group-hover:ml-1",
                isNightMode ? "bg-indigo-600 text-indigo-50" : "bg-zinc-900 text-zinc-50"
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
        </div>
      </aside>

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
            <Command className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
                  {purchasedAiTools.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => {
                        setActiveTool(tool);
                        setActiveView("ai-tool");
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "block w-full rounded-lg px-3 py-2 text-left text-xs transition",
                        activeView === "ai-tool" && activeTool === tool
                          ? "text-indigo-600 dark:text-indigo-400 font-bold"
                          : isNightMode
                            ? "text-zinc-500 hover:bg-zinc-900"
                            : "text-zinc-500 hover:bg-zinc-200/50"
                      )}
                    >
                      {tool}
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
              ? "text-indigo-400 bg-indigo-500/5 border-indigo-500/10"
              : "text-zinc-600 bg-zinc-200/50 hover:bg-zinc-200"
          )}
        >
          {isNightMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isNightMode ? "Light Core" : "Night Canvas"}</span>
        </button>
      </aside>

      {/* Main Content Area */}
<main className="relative z-10 flex-1 overflow-y-auto md:p-6 lg:p-8 transition-all">
  <div className="h-full w-full">
    {renderContent()}
  </div>
</main>
    </div>
  );
}