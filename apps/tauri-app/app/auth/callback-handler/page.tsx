"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "../../../trpc/client";

function OAuthCallbackHandlerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [success, setSuccess] = useState(false);

  // Simple client-side check to see if we're running inside the Tauri native frame
  const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;

  const callbackMutation = trpc.CorsairGoogleIntegrateOAuth.oauthCallback.useMutation({
    onSuccess: () => {
      if (isTauri) {
        router.push("/main?connected=true");
      } else {
        setSuccess(true);
        setIsProcessing(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsProcessing(false);
    },
  });

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const plugin = searchParams.get("plugin")!;

    if (!code || !state) {
      setError("Missing authorization code or state");
      setIsProcessing(false);
      return;
    }

    // Call the tRPC mutation to complete the OAuth flow
    callbackMutation.mutate({
      plugin,
      code,
      state
    });
  }, [searchParams, callbackMutation]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Connection Failed</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">{error}</p>
        <a href="/main" className="text-blue-600 dark:text-blue-400 hover:underline">
          Go back
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Connection Successful!</h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-sm">
          Your account has been connected. You can now safely close this browser tab and return to the application.
        </p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-zinc-50 dark:bg-zinc-950">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Connecting account...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return null;
}

export default function OAuthCallbackHandler() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-zinc-50 dark:bg-zinc-950">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Connecting account...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    }>
      <OAuthCallbackHandlerContent />
    </Suspense>
  );
}
