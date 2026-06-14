"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "../../../trpc/client";

export default function OAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const callbackMutation = trpc.Email.oauthCallback.useMutation({
    onSuccess: () => {
      router.push("/main?connected=true");
    },
    onError: (error) => {
      setError(error.message);
      setIsProcessing(false);
    },
  });

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const plugin = searchParams.get("plugin") || "gmail";

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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-red-600">Connection Failed</h1>
        <p className="text-gray-600">{error}</p>
        <a href="/main" className="text-blue-600 hover:underline">
          Go back
        </a>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Connecting your Gmail account...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return null;
}
