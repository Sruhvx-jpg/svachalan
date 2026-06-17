"use client";

import { useState } from "react";
import { Mail, Calendar, Loader2, LinkIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../src/components/ui/select";
import { trpc } from "../../../../../trpc/client";
import { cn } from "../../../../../src/lib/utils";

import { GmailView } from "./gmail-view";
import { CalendarView } from "./calender-view";

// ==========================================
// Connect Prompt Card
// ==========================================
function ConnectPromptCard({
  service,
  icon: Icon,
  accent,
}: {
  service: "Gmail" | "Google Calendar";
  icon: React.ElementType;
  accent: { gradient: string; iconBg: string; iconText: string; border: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div
        className={cn(
          "relative w-full max-w-md rounded-3xl border p-8 sm:p-10 text-center",
          "bg-white/60 dark:bg-zinc-950/50 backdrop-blur-2xl shadow-xl",
          accent.border
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "mx-auto flex size-16 items-center justify-center rounded-2xl mb-6",
            accent.iconBg
          )}
        >
          <Icon size={28} className={accent.iconText} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Connect {service}
        </h2>

        {/* Description */}
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
          Link your {service} account to unlock the full dashboard experience —
          view stats, browse messages, and manage everything in one place.
        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <LinkIcon size={12} />
            <span>
              Head over to the <span className="font-semibold text-zinc-600 dark:text-zinc-300">Connect Layers</span> page to get started.
            </span>
          </div>
        </div>

        {/* Decorative gradient blur */}
        <div
          className={cn(
            "absolute -z-10 inset-0 rounded-3xl opacity-20 blur-3xl",
            accent.gradient
          )}
        />
      </div>
    </div>
  );
}

// ==========================================
// Main Dashboard View
// ==========================================
export function DashboardView() {
  const [feature, setFeature] = useState("gmail");

  const { data: statuses, isLoading: statusLoading } =
    trpc.CorsairGoogleIntegrateOAuth.checkAllIntegratedToolStatus.useQuery(undefined, {
      refetchOnWindowFocus: false,
    });

  const isGmailConnected = !!statuses?.["gmail"];
  const isCalendarConnected = !!statuses?.["googlecalendar"];

  // While checking connection status, show a subtle loader
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  const renderContent = () => {
    if (feature === "gmail") {
      if (!isGmailConnected) {
        return (
          <ConnectPromptCard
            service="Gmail"
            icon={Mail}
            accent={{
              gradient: "bg-gradient-to-br from-indigo-500 to-sky-400",
              iconBg: "bg-indigo-500/10",
              iconText: "text-indigo-600 dark:text-indigo-400",
              border: "border-indigo-200/40 dark:border-indigo-500/10",
            }}
          />
        );
      }
      return <GmailView />;
    }

    // Calendar
    if (!isCalendarConnected) {
      return (
        <ConnectPromptCard
          service="Google Calendar"
          icon={Calendar}
          accent={{
            gradient: "bg-gradient-to-br from-violet-500 to-fuchsia-400",
            iconBg: "bg-violet-500/10",
            iconText: "text-violet-600 dark:text-violet-400",
            border: "border-violet-200/40 dark:border-violet-500/10",
          }}
        />
      );
    }
    return <CalendarView />;
  };

  return (
    <div className="w-full h-full">
      <div className="mb-8 flex justify-end">
        <Select value={feature} onValueChange={setFeature}>
          <SelectTrigger className="w-45">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="gmail">Gmail</SelectItem>
            <SelectItem value="calendar">Calendar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <main className="h-full">{renderContent()}</main>
    </div>
  );
}