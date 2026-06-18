"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  CalendarClock,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Clock,
  Video,
  X,
} from "lucide-react";
import { trpc } from "../../../../../trpc/client";
import { cn } from "../../../../../src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// 1. BENTO STAT CARD
// ==========================================
function BentoStat({
  label, value, icon: Icon, accent, isLoading,
}: {
  label: string; value: number | undefined; icon: React.ElementType;
  accent: string; isLoading: boolean;
}) {
  const accents: Record<string, { bg: string; text: string; glow: string }> = {
    violet: { bg: "bg-blue-400/10", text: "text-blue-550 dark:text-blue-400", glow: "shadow-blue-400/5" },
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
        c.glow
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
  isExpanded: boolean; onToggle: () => void; index: number;
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
          "group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer",
          "hover:bg-blue-400/[0.04] dark:hover:bg-blue-400/[0.06]",
          isExpanded && "bg-blue-400/[0.05] dark:bg-blue-400/[0.07]"
        )}
      >
        {/* Time badge */}
        <div className="mt-0.5 shrink-0 text-xs font-semibold text-blue-550 dark:text-blue-400 min-w-[52px] tabular-nums">
          {event.isAllDay ? "All day" : startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{event.summary}</p>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            {!event.isAllDay && (
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – {endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <MapPin size={9} /> {event.location}
              </span>
            )}
            {event.hangoutLink && (
              <span className="flex items-center gap-1 text-[11px] text-sky-500">
                <Video size={9} /> Meet
              </span>
            )}
          </div>
        </div>

        <ChevronDown size={14} className={cn("mt-1 shrink-0 text-zinc-400 transition-transform duration-300", isExpanded && "rotate-180 text-blue-400")} />
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
            <div className="mx-4 mb-3 mt-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md">
              <div className="px-4 py-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    <span className="ml-2.5 text-sm text-zinc-500">Loading event…</span>
                  </div>
                ) : detail ? (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{detail.summary}</h3>
                    <div className="flex flex-col gap-1.5 text-sm">
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
                      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 px-3 py-2">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{detail.description}</p>
                      </div>
                    )}
                    {detail.attendees.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">Attendees ({detail.attendees.length})</p>
                        <div className="flex flex-wrap gap-1">
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
              <div className="border-t border-zinc-100 dark:border-zinc-800/50 px-4 py-2 flex justify-end">
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
// 3. CALENDAR GRID HELPERS
// ==========================================
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; isCurrentMonth: boolean; dateKey: string }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day: d, isCurrentMonth: false, dateKey: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true, dateKey: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  // Next month leading days (fill to complete row)
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      cells.push({ day: d, isCurrentMonth: false, dateKey: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }
  }

  return cells;
}

function toDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTodayKey(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

// ==========================================
// 4. MAIN CALENDAR VIEW
// ==========================================
export function CalendarView() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayKey());
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // --- Data ---
  const { data: stats, isLoading: statsLoading } = trpc.Calendar.getDashboardStats.useQuery();
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = trpc.Calendar.listEvents.useQuery({ maxResults: 250 });
  const { refetch: syncEvents, isFetching: isSyncing } = trpc.Calendar.syncEvents.useQuery(undefined, { enabled: false });

  const allEvents = eventsData?.events ?? [];
  const todayKey = getTodayKey();

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof allEvents>();
    allEvents.forEach((e) => {
      const key = toDateKey(e.startDateTime);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    // Sort events within each day by time
    map.forEach((events) => {
      events.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    });
    return map;
  }, [allEvents]);

  const gridCells = useMemo(() => getDaysGrid(currentYear, currentMonth), [currentYear, currentMonth]);
  const selectedDayEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  // --- Navigation ---
  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDate(null);
    setExpandedEventId(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDate(null);
    setExpandedEventId(null);
  };

  const goToToday = () => {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(getTodayKey());
    setExpandedEventId(null);
  };

  const handleSync = async () => {
    await syncEvents();
    refetchEvents();
  };

  // Event color palette for dots
  const dotColors = ["bg-blue-450", "bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500"];

  return (
    <section className="flex min-h-[80vh] flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            <span className="font-light text-zinc-500 dark:text-zinc-400">Calendar</span>{" "}
            <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-blue-400 bg-clip-text text-transparent">Dashboard</span>
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
        <BentoStat label="Total Events" value={stats?.totalEvents} icon={CalendarDays} accent="violet" isLoading={statsLoading} />
        <BentoStat label="Today" value={stats?.todayCount} icon={CalendarClock} accent="sky" isLoading={statsLoading} />
        <BentoStat label="This Week" value={stats?.thisWeekCount} icon={CalendarCheck} accent="amber" isLoading={statsLoading} />
        <BentoStat label="Upcoming" value={stats?.upcomingCount} icon={TrendingUp} accent="emerald" isLoading={statsLoading} />
      </div>

      {/* ── CALENDAR GRID ── */}
      <div className={cn(
        "rounded-2xl border border-white/40 dark:border-zinc-800/60",
        "bg-white/50 dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm overflow-hidden"
      )}>
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button onClick={goToToday}
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-400/10 text-blue-500 dark:text-blue-400 hover:bg-blue-400/20 transition-colors">
              Today
            </button>
          </div>
          <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {eventsLoading ? (
          <>
            {/* Skeleton weekday headers */}
            <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800/60">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {day}
                </div>
              ))}
            </div>
            {/* Skeleton day cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 py-2.5 min-h-[72px] border-b border-r border-zinc-100/60 dark:border-zinc-800/30 animate-pulse">
                  <div className="size-7 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60" />
                  <div className="flex gap-0.5">
                    {i % 3 === 0 && <div className="size-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />}
                    {i % 5 === 0 && <div className="size-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800/60">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {gridCells.map((cell, idx) => {
                const events = eventsByDate.get(cell.dateKey) ?? [];
                const isToday = cell.dateKey === todayKey;
                const isSelected = cell.dateKey === selectedDate;
                const hasEvents = events.length > 0;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(cell.dateKey);
                      setExpandedEventId(null);
                    }}
                    className={cn(
                      "relative flex flex-col items-center gap-1 py-2.5 min-h-[72px] border-b border-r border-zinc-100/60 dark:border-zinc-800/30 transition-all duration-200",
                      !cell.isCurrentMonth && "opacity-30",
                      cell.isCurrentMonth && "hover:bg-blue-500/[0.04] dark:hover:bg-blue-500/[0.06]",
                      isSelected && cell.isCurrentMonth && "bg-blue-500/[0.08] dark:bg-blue-500/[0.1]",
                    )}
                  >
                    {/* Day number */}
                    <span className={cn(
                      "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                      isToday && cell.isCurrentMonth
                        ? "bg-blue-500 text-white shadow-sm shadow-blue-400/30"
                        : isSelected && cell.isCurrentMonth
                          ? "text-blue-550 dark:text-blue-400 font-bold"
                          : "text-zinc-700 dark:text-zinc-300"
                    )}>
                      {cell.day}
                    </span>

                    {/* Event dots */}
                    {hasEvents && cell.isCurrentMonth && (
                      <div className="flex items-center gap-0.5">
                        {events.slice(0, 3).map((_, i) => (
                          <div key={i} className={cn("size-1.5 rounded-full", dotColors[i % dotColors.length])} />
                        ))}
                        {events.length > 3 && (
                          <span className="text-[8px] font-bold text-zinc-400 ml-0.5">+{events.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── SELECTED DAY EVENTS ── */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "rounded-2xl border border-white/40 dark:border-zinc-800/60",
              "bg-white/50 dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm overflow-hidden"
            )}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {(() => {
                  const [y, m, d] = selectedDate.split("-").map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
                })()}
              </h2>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {selectedDayEvents.length} event{selectedDayEvents.length !== 1 && "s"}
              </span>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                  <CalendarDays size={22} className="text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No events this day</p>
                <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Enjoy the free time!</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {selectedDayEvents.map((event, i) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isExpanded={expandedEventId === event.id}
                    onToggle={() => setExpandedEventId(p => (p === event.id ? null : event.id))}
                    index={i}
                  />
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}