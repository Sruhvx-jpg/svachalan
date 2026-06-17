"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Bot,
  Plus,
  Trash2,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { trpc } from "../../../../../trpc/client";
import { cn } from "../../../../../src/lib/utils";
import { Component as AiLoader } from "../../../../../src/components/ui/ai-loader";



type Props = {
  toolKey: string;
  toolName: string;
};

interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "ai" | string;
  content: string | null;
  needsConfirmation?: boolean | null;
  confirmationDetails?: {
    action: "send" | "draft";
    to: string;
    subject: string;
    body: string;
    code: string;
  } | null | any;
  isConfirmed?: boolean | null;
  isDeclined?: boolean | null;
  createdAt: any;
}

// ─── Google AI Chat View ────────────────────────────────────
function GoogleAiChat({ toolName }: { toolName: string }) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [executingIndex, setExecutingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // tRPC queries & mutations
  const { data: sessions = [], refetch: refetchSessions } =
    trpc.GmailDotAi.getSessions.useQuery({}, {
      refetchOnWindowFocus: false,
    });

  const { data: dbMessages = [], isLoading: loadingMessages } =
    trpc.GmailDotAi.getMessages.useQuery(
      { sessionId: activeSessionId ?? "" },
      {
        enabled: !!activeSessionId,
        refetchOnWindowFocus: false,
      }
    );

  const { mutateAsync: sendChat, isPending } =
    trpc.GmailDotAi.chat.useMutation();

  const { mutateAsync: createSession } =
    trpc.GmailDotAi.createSession.useMutation();

  const { mutateAsync: deleteSession } =
    trpc.GmailDotAi.deleteSession.useMutation();

  const { mutateAsync: executeApprovedScript } =
    trpc.GmailDotAi.executeApprovedScript.useMutation();

  const { mutateAsync: updatePending } =
    trpc.GmailDotAi.updatePendingReview.useMutation();

  const { mutateAsync: discardPending } =
    trpc.GmailDotAi.discardPendingReview.useMutation();

  // Load existing pending review on mount to restore state
  const { data: pendingReview } =
    trpc.GmailDotAi.getPendingReview.useQuery({}, {
      refetchOnWindowFocus: false,
    });

  // Local message state to allow instant optimistic UI response
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Sync dbMessages to local messages state when active session changes
  useEffect(() => {
    if (activeSessionId) {
      setMessages(dbMessages as ChatMessage[]);
    } else {
      setMessages([]);
    }
  }, [dbMessages, activeSessionId]);

  // Set latest session active on initial load
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions]);

  // Handle restoring pending review state if any
  useEffect(() => {
    if (pendingReview && activeSessionId) {
      setMessages((prev) => {
        const hasPending = prev.some((m) => m.needsConfirmation && !m.isConfirmed && !m.isDeclined);
        if (!hasPending) {
          return [
            ...prev,
            {
              id: "pending-restore",
              sessionId: activeSessionId,
              role: "ai",
              content: null,
              needsConfirmation: true,
              confirmationDetails: pendingReview,
              createdAt: new Date(),
            },
          ];
        }
        return prev;
      });
    }
  }, [pendingReview, activeSessionId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFieldChange = async (
    index: number,
    field: "to" | "subject" | "body",
    value: string,
  ) => {
    setMessages((prev) => {
      const next = [...prev];
      if (next[index]?.confirmationDetails) {
        next[index].confirmationDetails = {
          ...next[index].confirmationDetails!,
          [field]: value,
        };
      }
      return next;
    });

    try {
      await updatePending({ [field]: value });
    } catch (err) {
      console.error("Failed to update pending review:", err);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await createSession({ title: "New Chat" });
      setActiveSessionId(newSession.id);
      setInput("");
      refetchSessions();
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteSession({ sessionId: id });
      refetchSessions();
      if (activeSessionId === id) {
        setActiveSessionId(null);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isPending) return;

    setInput("");

    // Add optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      sessionId: activeSessionId ?? "",
      role: "user",
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await sendChat({ message: text, sessionId: activeSessionId ?? undefined });

      // If server created a session on the fly (e.g. if list was empty)
      if (res.sessionId && res.sessionId !== activeSessionId) {
        setActiveSessionId(res.sessionId);
        refetchSessions();
      }

      if (res.needsConfirmation && res.confirmationDetails) {
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-ai-conf-${Date.now()}`,
            sessionId: res.sessionId || activeSessionId || "",
            role: "ai",
            content: null,
            needsConfirmation: true,
            confirmationDetails: res.confirmationDetails,
            createdAt: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => {
          const next = [...prev];
          if (res.isConfirmed || res.isDeclined) {
            const pendingIdx = next.findIndex((m) => m.needsConfirmation && !m.isConfirmed && !m.isDeclined);
            if (pendingIdx !== -1) {
              next[pendingIdx] = {
                ...next[pendingIdx],
                isConfirmed: res.isConfirmed,
                isDeclined: res.isDeclined,
                content: res.response ?? "",
              };
              return next;
            }
          }
          return [
            ...next,
            {
              id: `temp-ai-res-${Date.now()}`,
              sessionId: res.sessionId || activeSessionId || "",
              role: "ai",
              content: res.response ?? "",
              createdAt: new Date(),
            },
          ];
        });
      }

      utils.GmailDotAi.getMessages.invalidate({ sessionId: res.sessionId || activeSessionId || "" });
      refetchSessions();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-ai-err-${Date.now()}`,
          sessionId: activeSessionId || "",
          role: "ai",
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
          createdAt: new Date(),
        },
      ]);
    }
  };

  const handleConfirm = async (
    index: number,
    code: string | undefined,
    action: "send" | "draft",
  ) => {
    try {
      await executeApprovedScript({ code });
      setMessages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          isConfirmed: true,
          content:
            action === "send"
              ? "✓ Email sent successfully!"
              : "✓ Draft created successfully!",
        };
        return next;
      });
      if (activeSessionId) {
        utils.GmailDotAi.getMessages.invalidate({ sessionId: activeSessionId });
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        };
        return next;
      });
    }
  };

  const handleDecline = async (index: number) => {
    try {
      await discardPending({});
    } catch (e) {
      console.error(e);
    }
    setMessages((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        isDeclined: true,
        content: "✕ Intercepted action discarded.",
      };
      return next;
    });
    if (activeSessionId) {
      utils.GmailDotAi.getMessages.invalidate({ sessionId: activeSessionId });
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-white/5 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-2xl">

      {/* ─── Sidebar for Chat History ──────────────────────────── */}
      <div
        className={cn(
          "flex flex-col border-r border-zinc-200 dark:border-white/5 transition-all duration-300 shrink-0",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Previous Chats
          </span>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="Start new chat"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500 italic">
              No chat history yet.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-sm relative",
                  activeSessionId === session.id
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-4">
                  <MessageSquare size={14} className="shrink-0 opacity-60" />
                  <span className="truncate text-xs">{session.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-zinc-400 hover:text-red-500 transition cursor-pointer"
                  title="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Active Chat Window ──────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 cursor-pointer"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <Menu size={16} />
            </button>
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {toolName}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                AI-powered Gmail & Calendar assistant
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          {loadingMessages ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 size={24} className="animate-spin text-zinc-400" />
              <span className="text-xs text-zinc-400">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20">
              <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                  Start a conversation
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                  Ask me anything about your Gmail inbox, draft emails, or manage your Google Calendar events.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "",
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    msg.role === "user"
                      ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
                      : "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
                  )}
                >
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-indigo-600/95 text-white rounded-tr-md px-4 py-3 shadow-sm"
                      : "bg-white dark:bg-white/5 border border-zinc-200/80 dark:border-transparent text-zinc-800 dark:text-zinc-200 rounded-tl-md w-full max-w-lg shadow-sm",
                  )}
                >
                  {msg.needsConfirmation &&
                    msg.confirmationDetails &&
                    !msg.isConfirmed &&
                    !msg.isDeclined ? (
                    <div className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-xl text-zinc-800 dark:text-zinc-100">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                          Preview:{" "}
                          {msg.confirmationDetails.action === "send"
                            ? "Send Email"
                            : "Create Draft"}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          Needs Approval
                        </span>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400 w-16 shrink-0">
                            To:
                          </span>
                          <input
                            type="text"
                            value={msg.confirmationDetails.to}
                            onChange={(e) => handleFieldChange(i, "to", e.target.value)}
                            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400 w-16 shrink-0">
                            Subject:
                          </span>
                          <input
                            type="text"
                            value={msg.confirmationDetails.subject}
                            onChange={(e) => handleFieldChange(i, "subject", e.target.value)}
                            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">
                            Body:
                          </span>
                          <textarea
                            value={msg.confirmationDetails.body}
                            onChange={(e) => handleFieldChange(i, "body", e.target.value)}
                            rows={6}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 p-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs resize-y"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2 mt-1">
                        <button
                          onClick={() => handleDecline(i)}
                          disabled={executingIndex !== null}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-transparent rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Discard
                        </button>
                        <button
                          onClick={() => {
                            setExecutingIndex(i);
                            handleConfirm(
                              i,
                              undefined,
                              msg.confirmationDetails!.action,
                            ).finally(() => setExecutingIndex(null));
                          }}
                          disabled={executingIndex !== null}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {executingIndex === i && (
                            <Loader2 size={12} className="animate-spin" />
                          )}
                          {msg.confirmationDetails.action === "send"
                            ? "Send Email"
                            : "Create Draft"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(msg.role !== "user" && "px-4 py-3")}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isPending && (
            <div className="flex gap-3">
              <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Bot size={14} />
              </div>
              <div className="rounded-2xl rounded-tl-md bg-zinc-100 dark:bg-white/5 border border-zinc-200/40 dark:border-transparent px-4 py-3 flex items-center gap-1.5 shadow-sm">
                <div className="size-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="size-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="size-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

        </div>

        {/* Input Bar */}
        <div className="border-t border-zinc-200 dark:border-white/5 px-4 py-3">
          <div className="flex items-center gap-3 bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-transparent rounded-2xl pl-4 pr-2 py-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your emails, calendar..."
              disabled={isPending}
              className="flex-1 bg-transparent outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isPending || !input.trim()}
              className={cn(
                "size-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                input.trim() && !isPending
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed",
              )}
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main AiToolView Component ──────────────────────────────
export function AiToolView({ toolKey, toolName }: Props) {
  if (toolKey === "google-ai") {
    return <GoogleAiChat toolName={toolName} />;
  }

  // Placeholder for other tools
  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] p-8 gap-4 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-2xl rounded-2xl border border-zinc-200/50 dark:border-white/5">
      <div className="size-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 flex items-center justify-center">
        <Bot size={28} />
      </div>
      <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
        {toolName}
      </h2>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center max-w-sm">
        This tool is not yet available. Check back soon for updates.
      </p>
    </div>
  );
}