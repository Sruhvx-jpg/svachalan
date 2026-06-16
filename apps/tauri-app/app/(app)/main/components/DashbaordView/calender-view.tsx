"use client";

import { useState } from "react";
import {
  CalendarDays,
  CalendarClock,
  CalendarCheck,
  TrendingUp,
  Search,
  RefreshCw,
  Loader2,
  ChevronDown,
  MapPin,
  Users,
  Clock,
  Video,
  X,
  Filter,
} from "lucide-react";
import { trpc } from "../../../../../trpc/client";
import { cn } from "../../../../../src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// 1. BENTO STAT CARD
// ==========================================
function BentoStat({
  label,
  value,
  icon: Icon,
  accent,
  span,
  isLoading,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  accent: string;
  span?: string;
  isLoading: boolean;
}) {
  const accents: Record<string, { bg: string; text: string; glow: string }> = {
    violet: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", glow: "shadow-violet-500/5" },
    sky: { bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400", glow: "shadow-sky-500/5" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", glow: "shadow-amber-500/5" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", glow: "shadow-emerald-500/5" },
  };
  const c = accents[accent] ?? accents.violet;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "group relative rounded-2xl border border-white/40 dark:border-zinc-800/60",
        "bg-white/50 dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        c.glow, span
      )}
    >
      <div className="flex h-full flex-col justify-between p-5">
        <div className={cn("flex size-10 items-center justify-center rounded-xl mb-3 transition-transform duration-300 group-hover:scale-110", c.bg)}>
          <Icon size={20} className={c.text} />
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isLoading ? <span className="inline-block h-8 w-14 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" /> : (value ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 2. EVENT ROW (expandable)
// ==========================================
function EventRow({ event, isExpanded, onToggle, index }: {
  event: { id: string; summary: string; description: string; location: string; startDateTime: string; endDateTime: string; isAllDay: boolean; status: string; organizer: string; attendeeCount: number; hangoutLink: string };
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const { data: detail, isLoading } = trpc.Calendar.getEventById.useQuery(
    { eventId: event.id },
    { enabled: isExpanded }
  );

  const startDate = new Date(event.startDateTime);
  const endDate = new Date(event.endDateTime);

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="overflow-hidden"
    >
      <button
        onClick={onToggle}
        className={cn(
          "group flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors duration-200 cursor-pointer",
          "hover:bg-violet-500/[0.04] dark:hover:bg-violet-500/[0.06]",
          isExpanded && "bg-violet-500/[0.05] dark:bg-violet-500/[0.07]"
        )}
      >
        {/* Date badge */}
        <div className="mt-0.5 flex shrink-0 flex-col items-center rounded-xl bg-violet-500/10 dark:bg-violet-500/15 px-2.5 py-1.5 min-w-[48px]">
          <span className="text-[10px] font-semibold uppercase text-violet-600 dark:text-violet-400">
            {startDate.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="text-lg font-bold leading-tight text-violet-700 dark:text-violet-300">
            {startDate.getDate()}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{event.summary}</p>
            <span className="shrink-0 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
              {event.isAllDay ? "All day" : `${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-3 flex-wrap">
            {event.location && (
              <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <MapPin size={10} /> {event.location}
              </span>
            )}
            {event.attendeeCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <Users size={10} /> {event.attendeeCount}
              </span>
            )}
            {event.hangoutLink && (
              <span className="flex items-center gap-1 text-xs text-sky-500">
                <Video size={10} /> Meet
              </span>
            )}
          </div>

          {!isExpanded && event.description && (
            <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-600">{event.description}</p>
          )}
        </div>

        <div className="mt-1 shrink-0">
          <ChevronDown size={16} className={cn("text-zinc-400 transition-transform duration-300", isExpanded && "rotate-180 text-violet-500")} />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-4 mt-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md">
              <div className="px-5 py-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                    <span className="ml-2.5 text-sm text-zinc-500">Loading event…</span>
                  </div>
                ) : detail ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{detail.summary}</h3>

                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="shrink-0 text-zinc-400" />
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {new Date(detail.startDateTime).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          {" – "}
                          {new Date(detail.endDateTime).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>

                      {detail.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="shrink-0 text-zinc-400" />
                          <span className="text-zinc-600 dark:text-zinc-400">{detail.location}</span>
                        </div>
                      )}

                      {detail.hangoutLink && (
                        <div className="flex items-center gap-2">
                          <Video size={13} className="shrink-0 text-sky-500" />
                          <a href={detail.hangoutLink} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline decoration-sky-500/30 underline-offset-2 hover:decoration-sky-500/60 text-sm">
                            Join Google Meet
                          </a>
                        </div>
                      )}
                    </div>

                    {detail.description && (
                      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 px-4 py-3">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{detail.description}</p>
                      </div>
                    )}

                    {detail.attendees.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Attendees ({detail.attendees.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.attendees.map((a, i) => (
                            <span key={i} className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                              a.responseStatus === "accepted" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20" :
                              a.responseStatus === "declined" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20" :
                              "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 ring-zinc-200 dark:ring-zinc-700"
                            )}>
                              {a.displayName || a.email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic py-4 text-center">No event details available</p>
                )}
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800/50 px-5 py-2 flex justify-end">
                <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-1">
                  <X size={12} /> Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ==========================================
// 3. MAIN CALENDAR VIEW
// ==========================================
type EventFilter = "all" | "today" | "week";

export function CalendarView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<EventFilter>("all");

  const { data: stats, isLoading: statsLoading } = trpc.Calendar.getDashboardStats.useQuery();

  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = trpc.Calendar.listEvents.useQuery({ maxResults: 100 });

  const { data: searchResults, isLoading: searchLoading } = trpc.Calendar.searchEvents.useQuery(
    { query: activeSearch, maxResults: 50 },
    { enabled: activeSearch.length > 0 }
  );

  const { refetch: syncEvents, isFetching: isSyncing } = trpc.Calendar.syncEvents.useQuery(undefined, { enabled: false });

  const isSearching = activeSearch.length > 0;
  const rawEvents = isSearching ? searchResults?.events ?? [] : eventsData?.events ?? [];

  // Client-side filter
  const displayedEvents = rawEvents.filter((e) => {
    if (activeFilter === "all") return true;
    const d = new Date(e.startDateTime);
    const now = new Date();
    if (activeFilter === "today") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }
    if (activeFilter === "week") {
      const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
      return d >= now && d <= weekEnd;
    }
    return true;
  });

  const isLoadingEvents = isSearching ? searchLoading : eventsLoading;

  const filterCounts = {
    all: rawEvents.length,
    today: rawEvents.filter((e) => { const d = new Date(e.startDateTime); const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); }).length,
    week: rawEvents.filter((e) => { const d = new Date(e.startDateTime); const n = new Date(); const w = new Date(n); w.setDate(w.getDate() + 7); return d >= n && d <= w; }).length,
  };

  const handleSearch = () => { const t = searchQuery.trim(); if (t) { setActiveSearch(t); setExpandedEventId(null); setActiveFilter("all"); } };
  const handleClearSearch = () => { setSearchQuery(""); setActiveSearch(""); setExpandedEventId(null); setActiveFilter("all"); };
  const handleSync = async () => { await syncEvents(); refetchEvents(); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") handleClearSearch(); };

  return (
    <section className="flex min-h-[80vh] flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            <span className="font-light text-zinc-500 dark:text-zinc-400">Calendar</span>{" "}
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Your upcoming events at a glance</p>
        </div>
        <button onClick={handleSync} disabled={isSyncing}
          className={cn("flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-all duration-300 shadow-sm",
            "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
            isSyncing && "opacity-60 cursor-not-allowed")}>
          <RefreshCw size={15} className={cn(isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing…" : "Sync Calendar"}
        </button>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[120px]">
        <BentoStat label="Total Events" value={stats?.totalEvents} icon={CalendarDays} accent="violet" span="col-span-1 lg:row-span-1" isLoading={statsLoading} />
        <BentoStat label="Today" value={stats?.todayCount} icon={CalendarClock} accent="sky" span="col-span-1 lg:row-span-1" isLoading={statsLoading} />
        <BentoStat label="This Week" value={stats?.thisWeekCount} icon={CalendarCheck} accent="amber" span="col-span-1 lg:row-span-1" isLoading={statsLoading} />
        <BentoStat label="Upcoming" value={stats?.upcomingCount} icon={TrendingUp} accent="emerald" span="col-span-1 lg:row-span-1" isLoading={statsLoading} />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className={cn("relative flex flex-1 items-center rounded-xl border transition-all duration-300",
          "border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm",
          "focus-within:border-violet-500/40 focus-within:ring-2 focus-within:ring-violet-500/10")}>
          <Search size={16} className="ml-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search events by title or keyword…"
            className="h-11 w-full bg-transparent px-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none" />
          {activeSearch && <button onClick={handleClearSearch} className="mr-2 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Clear</button>}
        </div>
        <button onClick={handleSearch} disabled={!searchQuery.trim()}
          className={cn("flex h-11 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold transition-all duration-300 shadow-sm",
            "bg-violet-600 text-white hover:bg-violet-500", !searchQuery.trim() && "opacity-50 cursor-not-allowed")}>
          <Search size={14} /> Search
        </button>
      </div>

      {/* Search indicator */}
      <AnimatePresence>
        {isSearching && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
            <Search size={13} />
            <span>Results for <span className="font-semibold">&ldquo;{activeSearch}&rdquo;</span></span>
            <span className="text-zinc-400">·</span>
            <button onClick={handleClearSearch} className="font-medium underline decoration-violet-500/30 underline-offset-2 hover:decoration-violet-500/60 transition-colors">Show all</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
        {([{ key: "all", label: "All", icon: CalendarDays }, { key: "today", label: "Today", icon: CalendarClock }, { key: "week", label: "This Week", icon: CalendarCheck }] as const).map(({ key, label, icon: FIcon }) => (
          <button key={key} onClick={() => { setActiveFilter(key); setExpandedEventId(null); }}
            className={cn("relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
              activeFilter === key
                ? "bg-violet-600 text-white shadow-sm shadow-violet-500/20"
                : "bg-white/60 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50 hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400")}>
            <FIcon size={12} /> {label}
            <span className={cn("ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none",
              activeFilter === key ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400")}>
              {filterCounts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className={cn("rounded-2xl border border-white/40 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm overflow-hidden")}>
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{isSearching ? "Search Results" : "Upcoming Events"}</h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{displayedEvents.length} event{displayedEvents.length !== 1 && "s"}</span>
        </div>

        {isLoadingEvents && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            <span className="ml-3 text-sm text-zinc-500">Loading events…</span>
          </div>
        )}

        {!isLoadingEvents && displayedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
              <CalendarDays size={24} className="text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{isSearching ? "No events match your search" : "No upcoming events"}</p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{isSearching ? "Try a different keyword" : "Try syncing your calendar"}</p>
          </div>
        )}

        {!isLoadingEvents && displayedEvents.length > 0 && (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {displayedEvents.map((event, i) => (
              <EventRow key={event.id} event={event} isExpanded={expandedEventId === event.id} onToggle={() => setExpandedEventId((p) => (p === event.id ? null : event.id))} index={i} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}