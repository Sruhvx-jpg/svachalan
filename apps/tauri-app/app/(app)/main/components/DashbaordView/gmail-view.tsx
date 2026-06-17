"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mail,
  Inbox,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  MailOpen,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowRight,
  X,
  Filter,
} from "lucide-react";
import { trpc } from "../../../../../trpc/client";
import { cn } from "../../../../../src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// 1. STAT CARD COMPONENT
// ==========================================
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}) {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    indigo: {
      bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
      text: "text-indigo-600 dark:text-indigo-400",
      ring: "ring-indigo-500/20",
    },
    amber: {
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      text: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/20",
    },
    rose: {
      bg: "bg-rose-500/10 dark:bg-rose-500/15",
      text: "text-rose-600 dark:text-rose-400",
      ring: "ring-rose-500/20",
    },
    emerald: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/20",
    },
  };

  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "group relative rounded-2xl border border-white/40 dark:border-zinc-800/60",
        "bg-white/50 dark:bg-zinc-950/40 p-5 shadow-sm backdrop-blur-xl",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isLoading ? (
              <span className="inline-block h-7 w-12 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            ) : (
              (value ?? 0).toLocaleString()
            )}
          </p>
        </div>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            c.bg
          )}
        >
          <Icon size={20} className={c.text} />
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 2. EXPANDABLE EMAIL ROW
// ==========================================
function EmailRow({
  email,
  isExpanded,
  onToggle,
  index,
}: {
  email: {
    id: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
    isRead: boolean;
    isSpam: boolean;
  };
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  // Only fetch full content when expanded
  const { data: fullEmail, isLoading: detailLoading } =
    trpc.Email.getEmailById.useQuery(
      { emailId: email.id },
      { enabled: isExpanded }
    );

  const utils = trpc.useUtils();

  useEffect(() => {
    if (isExpanded && fullEmail && !email.isRead) {
      utils.Email.listEmails.invalidate();
      utils.Email.getDashboardStats.invalidate();
    }
  }, [isExpanded, fullEmail, email.isRead, utils]);

  return (
    <motion.li
      key={email.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      layout
      className="overflow-hidden"
    >
      {/* Clickable row header */}
      <button
        onClick={onToggle}
        className={cn(
          "group flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors duration-200 cursor-pointer",
          "hover:bg-indigo-500/[0.04] dark:hover:bg-indigo-500/[0.06]",
          isExpanded && "bg-indigo-500/[0.05] dark:bg-indigo-500/[0.07]",
          !email.isRead &&
          !isExpanded &&
          "bg-indigo-500/[0.02] dark:bg-indigo-500/[0.03]"
        )}
      >
        {/* Unread indicator */}
        <div className="mt-1.5 flex shrink-0 items-center">
          <div
            className={cn(
              "size-2 rounded-full transition-all duration-300",
              email.isRead
                ? "bg-transparent"
                : "bg-indigo-500 shadow-sm shadow-indigo-500/30"
            )}
          />
        </div>

        {/* Email preview content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p
              className={cn(
                "truncate text-sm",
                email.isRead
                  ? "text-zinc-600 dark:text-zinc-400 font-normal"
                  : "text-zinc-900 dark:text-zinc-100 font-semibold"
              )}
            >
              {email.from}
            </p>
            <span className="shrink-0 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
              {formatDate(email.date)}
            </span>
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-[13px]",
              email.isRead
                ? "text-zinc-500 dark:text-zinc-500"
                : "text-zinc-800 dark:text-zinc-200 font-medium"
            )}
          >
            {email.subject}
          </p>
          {!isExpanded && (
            <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-600 leading-relaxed">
              {email.snippet}
            </p>
          )}

          {/* Badges */}
          <div className="mt-1.5 flex items-center gap-1.5">
            {email.isSpam && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 ring-1 ring-inset ring-rose-500/20">
                <AlertTriangle size={10} />
                Spam
              </span>
            )}
            {!email.isRead && (
              <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                New
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <div className="mt-1 shrink-0">
          <ChevronDown
            size={16}
            className={cn(
              "text-zinc-400 transition-transform duration-300",
              isExpanded && "rotate-180 text-indigo-500"
            )}
          />
        </div>
      </button>

      {/* Expandable email body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden w-full max-w-full"
          >
            <div
              className={cn(
                "mx-5 mb-4 mt-1 rounded-xl border overflow-hidden max-w-full",
                "border-zinc-200/60 dark:border-zinc-800/50",
                "bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md"
              )}
            >
              {/* Email detail header */}
              <div className="border-b border-zinc-100 dark:border-zinc-800/50 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                      {fullEmail?.subject ?? email.subject}
                    </h3>
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={13} className="shrink-0 text-zinc-400" />
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {fullEmail?.from ?? email.from}
                        </span>
                      </div>
                      {fullEmail?.to && (
                        <div className="flex items-center gap-2 text-sm">
                          <ArrowRight
                            size={13}
                            className="shrink-0 text-zinc-400"
                          />
                          <span className="text-zinc-500 dark:text-zinc-400 truncate">
                            {fullEmail.to}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                        <Clock size={11} className="shrink-0" />
                        <span>
                          {formatDateFull(fullEmail?.date ?? email.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle();
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Email body content */}
              <div className="px-5 py-4 w-full max-w-full overflow-hidden">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                    <span className="ml-2.5 text-sm text-zinc-500">
                      Loading email content…
                    </span>
                  </div>
                ) : fullEmail?.body ? (
                  <div className="w-full max-w-full overflow-x-auto">
                    <style dangerouslySetInnerHTML={{
                      __html: `
                      .email-body-content table {
                        width: 100% !important;
                        max-width: 100% !important;
                        table-layout: fixed !important;
                      }
                      .email-body-content img {
                        max-width: 100% !important;
                        height: auto !important;
                      }
                      .email-body-content * {
                        max-width: 100% !important;
                        word-break: break-word !important;
                        box-sizing: border-box !important;
                      }
                    `}} />
                    <div
                      className="email-body-content prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 
                        prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-lg
                        w-full overflow-x-auto max-h-[500px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: fullEmail.body }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 italic py-4 text-center">
                    No email content available
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ==========================================
// 3. MAIN GMAIL VIEW
// ==========================================
type EmailFilter = "all" | "unread" | "spam" | "today";

export function GmailView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<EmailFilter>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // --- tRPC hooks ---
  const { data: stats, isLoading: statsLoading } =
    trpc.Email.getDashboardStats.useQuery();

  const {
    data: emailsData,
    isLoading: emailsLoading,
    refetch: refetchEmails,
  } = trpc.Email.listEmails.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const {
    data: searchResults,
    isLoading: searchLoading,
  } = trpc.Email.searchEmails.useQuery(
    { query: activeSearch, maxResults: 50 },
    { enabled: activeSearch.length > 0 }
  );

  const { refetch: syncEmails, isFetching: isSyncing } =
    trpc.Email.syncEmails.useQuery(undefined, { enabled: false });

  // --- derived state ---
  const isSearching = activeSearch.length > 0;
  const rawEmails = isSearching
    ? searchResults?.emails ?? []
    : emailsData?.emails ?? [];

  // Apply client-side filter
  const displayedEmails = rawEmails.filter((email) => {
    switch (activeFilter) {
      case "unread":
        return !email.isRead;
      case "spam":
        return email.isSpam;
      case "today": {
        const emailDate = new Date(email.date);
        const now = new Date();
        return (
          emailDate.getFullYear() === now.getFullYear() &&
          emailDate.getMonth() === now.getMonth() &&
          emailDate.getDate() === now.getDate()
        );
      }
      default:
        return true;
    }
  });

  const isLoadingEmails = isSearching ? searchLoading : emailsLoading;

  const filterCounts = {
    all: stats?.totalEmails ?? 0,
    unread: stats?.unreadCount ?? 0,
    spam: stats?.spamCount ?? 0,
    today: stats?.todayCount ?? 0,
  };

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setActiveSearch(trimmed);
      setExpandedEmailId(null);
      setActiveFilter("all");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    setExpandedEmailId(null);
    setActiveFilter("all");
  };

  const handleFilterChange = (filter: EmailFilter) => {
    setActiveFilter(filter);
    setExpandedEmailId(null);
  };

  const handleSync = async () => {
    await syncEmails();
    setPage(0);
    refetchEmails();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") handleClearSearch();
  };

  const toggleEmailExpand = (emailId: string) => {
    setExpandedEmailId((prev) => (prev === emailId ? null : emailId));
  };

  return (
    <section className="flex min-h-[80vh] flex-col gap-6">
      {/* ── HEADER ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            <span className="font-light text-zinc-500 dark:text-zinc-400">
              Mail
            </span>{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your email overview at a glance
          </p>
        </div>

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={cn(
            "flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-all duration-300 shadow-sm",
            "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
            isSyncing && "opacity-60 cursor-not-allowed"
          )}
        >
          <RefreshCw size={15} className={cn(isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing…" : "Sync Emails"}
        </button>
      </header>

      {/* ── BENTO STATS & CHARTS SECTION ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: 2x2 Grid of Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:col-span-1">
          <StatCard
            label="Total Emails"
            value={stats?.totalEmails}
            icon={Mail}
            color="indigo"
            isLoading={statsLoading}
          />
          <StatCard
            label="Unread"
            value={stats?.unreadCount}
            icon={Inbox}
            color="amber"
            isLoading={statsLoading}
          />
          <StatCard
            label="Spam"
            value={stats?.spamCount}
            icon={AlertTriangle}
            color="rose"
            isLoading={statsLoading}
          />
          <StatCard
            label="Today"
            value={stats?.todayCount}
            icon={Clock}
            color="emerald"
            isLoading={statsLoading}
          />
        </div>

        {/* Right: Bar Chart of Monthly Mails Received */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
            className={cn(
              "group relative rounded-2xl border border-white/40 dark:border-zinc-800/60",
              "bg-white/50 dark:bg-zinc-950/40 p-5 shadow-sm backdrop-blur-xl h-full flex flex-col justify-between"
            )}
          >
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                Mails Received
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Monthly distribution of emails synced in your inbox
              </p>
            </div>

            {/* Custom Bar Chart */}
            <div className="mt-6 flex items-end justify-between gap-3 h-32 px-2 pb-1">
              {statsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-zinc-400" size={20} />
                </div>
              ) : stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
                (() => {
                  const maxCount = Math.max(...stats.monthlyStats.map(s => s.count), 1);
                  return stats.monthlyStats.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1 group/bar">
                      {/* Bar and Tooltip container */}
                      <div className="relative w-full flex justify-center items-end h-24">
                        {/* Tooltip */}
                        <div className="absolute -top-7 scale-0 group-hover/bar:scale-100 transition-all duration-200 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none whitespace-nowrap">
                          {item.count} mails
                        </div>
                        {/* Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(item.count / maxCount) * 100}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.05 }}
                          className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-indigo-500 to-sky-400 dark:from-indigo-600 dark:to-sky-500 hover:from-indigo-600 hover:to-sky-500 cursor-pointer shadow-sm relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                      </div>
                      {/* Label */}
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2">
                        {item.label}
                      </span>
                    </div>
                  ));
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
                  No monthly statistics available
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative flex flex-1 items-center rounded-xl border transition-all duration-300",
            "border-zinc-200/60 dark:border-zinc-800/60",
            "bg-white/60 dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm",
            "focus-within:border-indigo-500/40 focus-within:ring-2 focus-within:ring-indigo-500/10"
          )}
        >
          <Search
            size={16}
            className="ml-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search emails by subject, sender, or keyword…"
            className={cn(
              "h-11 w-full bg-transparent px-3 text-sm text-zinc-900 dark:text-zinc-100",
              "placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
            )}
          />
          {activeSearch && (
            <button
              onClick={handleClearSearch}
              className="mr-2 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={!searchQuery.trim()}
          className={cn(
            "flex h-11 items-center gap-2 rounded-xl px-5 text-[13px] font-semibold transition-all duration-300 shadow-sm",
            "bg-indigo-600 text-white hover:bg-indigo-500",
            !searchQuery.trim() && "opacity-50 cursor-not-allowed"
          )}
        >
          <Search size={14} />
          Search
        </button>
      </div>

      {/* Active search indicator */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400"
          >
            <Search size={13} />
            <span>
              Showing results for{" "}
              <span className="font-semibold">
                &ldquo;{activeSearch}&rdquo;
              </span>
            </span>
            <span className="text-zinc-400">·</span>
            <button
              onClick={handleClearSearch}
              className="font-medium underline decoration-indigo-500/30 underline-offset-2 hover:decoration-indigo-500/60 transition-colors"
            >
              Show all
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTER CHIPS ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
        {(
          [
            { key: "all", label: "All", icon: Mail },
            { key: "unread", label: "Unread", icon: Inbox },
            { key: "spam", label: "Spam", icon: AlertTriangle },
            { key: "today", label: "Today", icon: Clock },
          ] as const
        ).map(({ key, label, icon: FilterIcon }) => {
          const isActive = activeFilter === key;
          const count = filterCounts[key];

          return (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                  : "bg-white/60 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400"
              )}
            >
              <FilterIcon size={12} />
              {label}
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── EMAIL LIST ── */}
      <div
        className={cn(
          "rounded-2xl border border-white/40 dark:border-zinc-800/60",
          "bg-white/50 dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm overflow-hidden"
        )}
      >
        {/* List header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {isSearching ? "Search Results" : "Inbox"}
          </h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {displayedEmails.length} email
            {displayedEmails.length !== 1 && "s"}
          </span>
        </div>

        {/* Skeleton loading state */}
        {isLoadingEmails && (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-3.5 animate-pulse">
                <div className="mt-1.5 size-2 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-3.5 w-32 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-12 rounded-md bg-zinc-100 dark:bg-zinc-800/60 shrink-0" />
                  </div>
                  <div className="h-3 w-48 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-2.5 w-64 rounded-md bg-zinc-100 dark:bg-zinc-800/40" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoadingEmails && displayedEmails.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
              <MailOpen size={24} className="text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {isSearching
                ? "No emails match your search"
                : "No emails found"}
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              {isSearching
                ? "Try a different keyword or clear search"
                : "Try syncing your emails"}
            </p>
          </div>
        )}

        {/* Email rows */}
        {!isLoadingEmails && displayedEmails.length > 0 && (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {displayedEmails.map((email, i) => (
              <EmailRow
                key={email.id}
                email={email}
                isExpanded={expandedEmailId === email.id}
                onToggle={() => toggleEmailExpand(email.id)}
                index={i}
              />
            ))}
          </ul>
        )}

        {/* Pagination - only for list view, not search */}
        {!isSearching && !isLoadingEmails && displayedEmails.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 px-5 py-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                page === 0
                  ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              )}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={displayedEmails.length < PAGE_SIZE}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                displayedEmails.length < PAGE_SIZE
                  ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              )}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// HELPERS
// ==========================================
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}