"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Star,
  Plus,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  Key,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { trpc } from "../../../../../trpc/client";
import { cn } from "../../../../../src/lib/utils";

// ─── Helpers ────────────────────────────────────────────────
function formatPrice(priceInPaise: number): string {
  if (priceInPaise === 0) return "Free";
  return `₹${(priceInPaise / 100).toFixed(0)}`;
}

function planLabel(planType: string): string {
  const map: Record<string, string> = {
    free: "Free",
    monthly: "Monthly",
    yearly: "Yearly",
    lifetime: "Lifetime",
  };
  return map[planType] ?? planType;
}

// ─── Component ──────────────────────────────────────────────
export function MarketplaceView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"for-you" | "top-charts">("for-you");

  // Detail sheet
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Clipboard feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Data from backend ─────────────────────────────────────
  const utils = trpc.useUtils();

  const { data: products, isLoading, refetch } = trpc.marketplace.list.useQuery();

  const { mutateAsync: addProduct, isPending: isAdding } =
    trpc.marketplace.issue.useMutation();

  // ── Derived ───────────────────────────────────────────────
  const selectedProduct = useMemo(
    () => products?.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.toolKey.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  // Featured = first product in the list
  const featured = filtered[0] ?? null;

  // ── Actions ───────────────────────────────────────────────
  const handleAdd = async (productId: string) => {
    try {
      setError(null);
      await addProduct({ productId });
      await refetch();
      await utils.marketplace.myProducts.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
    }
  };

  const handleCopy = async (key: string, id: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard blocked in some contexts */
    }
  };

  // ── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-600" />
          <Sparkles className="absolute h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
          Loading marketplace…
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen text-zinc-900 dark:text-zinc-50 p-4 sm:p-6 md:p-8 transition-colors">
      <div className="max-w-[1100px] mx-auto">

        {/* ─── Search Bar ─────────────────────────────────── */}
        <div className="relative flex items-center w-full h-12 bg-white/70 dark:bg-zinc-900 rounded-full px-4 gap-3 mb-6 transition-all">
          <Search className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search integrations & apps"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
          />
          <div className="size-7 rounded-full bg-emerald-600/15 flex items-center justify-center font-bold text-[10px] text-emerald-700 dark:text-emerald-400 select-none shrink-0">
            SV
          </div>
        </div>

        {/* ─── Nav Tabs ───────────────────────────────────── */}
        <div className="flex border-b border-zinc-900/10 dark:border-white/10 mb-8 gap-6">
          {(["for-you", "top-charts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm font-semibold transition-colors capitalize",
                activeTab === tab
                  ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200",
              )}
            >
              {tab === "for-you" ? "For you" : "Top charts"}
            </button>
          ))}
        </div>

        {/* ─── Error Banner ───────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-100/60 dark:bg-red-900/10 p-4 text-sm font-medium text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Featured Hero Banner ───────────────────────── */}
        {activeTab === "for-you" && !searchQuery && featured && (
          <div
            onClick={() => setSelectedProductId(featured.id)}
            className="group relative w-full h-[200px] sm:h-[260px] rounded-3xl overflow-hidden cursor-pointer bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:shadow-lg transition-all duration-300 mb-10"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
            <div className="absolute -right-10 -bottom-10 size-56 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />

            <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between text-white z-10">
              <span className="bg-white/20 border border-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase w-fit">
                Featured
              </span>

              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
                  {featured.name}
                </h2>
                <p className="text-white/80 text-xs sm:text-sm max-w-lg line-clamp-2">
                  {featured.description}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-white/90">
                <span className="capitalize">{planLabel(featured.planType)}</span>
                <span className="opacity-50">•</span>
                <span>{formatPrice(featured.priceInPaise)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Product Cards Grid ─────────────────────────── */}
        <div>
          {activeTab === "for-you" && (
            <h2 className="text-base font-bold mb-4 flex items-center gap-1.5">
              Recommended for you
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </h2>
          )}
          {activeTab === "top-charts" && (
            <h2 className="text-base font-bold mb-4">All Products</h2>
          )}

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 text-sm">
              No products found.
            </div>
          ) : activeTab === "for-you" ? (
            /* ── Grid view (Play Store card layout) ─── */
            <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className="group flex flex-col cursor-pointer hover:bg-white/60 dark:hover:bg-zinc-800/60 p-3 rounded-2xl transition-all"
                >
                  {/* Squircle Icon */}
                  <div className="relative aspect-square w-full bg-white/80 dark:bg-zinc-900 rounded-[1.25rem] flex items-center justify-center transition-all mb-3 overflow-hidden">
                    <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Sparkles size={28} />
                    </div>

                    {product.purchased && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                    {product.toolKey}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    <span className="capitalize">{planLabel(product.planType)}</span>
                    <span className="opacity-40">•</span>
                    <span>{formatPrice(product.priceInPaise)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── List view (Top Charts ranking) ─── */
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((product, i) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className="flex items-center cursor-pointer hover:bg-white/60 dark:hover:bg-zinc-800/60 p-3 rounded-2xl transition-all gap-4"
                >
                  <span className="w-5 text-center font-bold text-sm text-zinc-400 dark:text-zinc-600">
                    {i + 1}
                  </span>
                  <div className="size-14 bg-white/80 dark:bg-zinc-900 rounded-[1rem] flex items-center justify-center shrink-0 relative overflow-hidden">
                    <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    {product.purchased && (
                      <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5">
                        <Check className="h-2 w-2 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                      {product.toolKey}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      <span className="capitalize">{planLabel(product.planType)}</span>
                      <span className="opacity-40">•</span>
                      <span>{formatPrice(product.priceInPaise)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Product Detail Side-Sheet ────────────────────── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProductId(null);
          }}
        >
          <div className="w-full max-w-[580px] h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 z-20">
              <button
                onClick={() => setSelectedProductId(null)}
                className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Details
              </div>
              <div className="w-9" />
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-8 flex-1">

              {/* App header row */}
              <div className="flex gap-5 items-start">
                <div className="size-20 sm:size-24 bg-zinc-50 dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200/80 dark:border-zinc-800/80 shadow-md flex items-center justify-center shrink-0">
                  <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Sparkles size={36} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                    {selectedProduct.name}
                  </h1>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold mt-1">
                    {selectedProduct.toolKey}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    <span className="capitalize">{planLabel(selectedProduct.planType)}</span>
                    <span className="opacity-40">•</span>
                    <span>{formatPrice(selectedProduct.priceInPaise)}</span>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 divide-x divide-zinc-900/10 dark:divide-white/10 text-center py-3 border-y border-zinc-900/10 dark:border-white/10">
                <div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 capitalize">
                    {planLabel(selectedProduct.planType)}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase mt-0.5">
                    Plan
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    {formatPrice(selectedProduct.priceInPaise)}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase mt-0.5">
                    Price
                  </div>
                </div>
              </div>

              {/* Add / Active CTA */}
              <div>
                {selectedProduct.purchased ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center h-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-sm border border-emerald-500/20 gap-2">
                      <Check className="h-4 w-4 stroke-[2.5]" />
                      <span>Added to your products</span>
                    </div>

                    {/* License key card */}
                    {selectedProduct.licenseKey && (
                      <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Key className="h-3.5 w-3.5" />
                            License Key
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-800">
                          <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[320px]">
                            {selectedProduct.licenseKey}
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(selectedProduct.licenseKey!, selectedProduct.id)
                            }
                            className={cn(
                              "p-1.5 rounded-lg transition-all border shrink-0",
                              copiedId === selectedProduct.id
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 border-transparent",
                            )}
                          >
                            {copiedId === selectedProduct.id ? (
                              <Check size={14} className="stroke-[2.5]" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleAdd(selectedProduct.id)}
                    disabled={isAdding}
                    className="w-full h-11 rounded-lg bg-[#01875f] hover:bg-[#00704e] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAdding ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Adding…</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Add to My Products</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* About this product */}
              <div className="space-y-3">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200">
                  About this integration
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {selectedProduct.description ?? "No description available."}
                </p>
              </div>

              {/* Product metadata */}
              <div className="space-y-3 pt-4 border-t border-zinc-900/10 dark:border-white/10">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                  Product info
                </h3>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500">Tool Key</span>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300 mt-0.5 font-mono">
                      {selectedProduct.toolKey}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500">Status</span>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                      {selectedProduct.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500">Plan</span>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300 mt-0.5 capitalize">
                      {planLabel(selectedProduct.planType)}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500">License</span>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                      {selectedProduct.purchased
                        ? selectedProduct.licenseActive
                          ? "Active"
                          : "Expired"
                        : "Not issued"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}