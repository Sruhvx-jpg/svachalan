"use client";

import { useState } from "react";
import { trpc } from "../../../../trpc/client";

export default function MainPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const connectEmailMutation = trpc.Email.connectEmail.useMutation({
    onSuccess: (data) => {
      // Redirect to OAuth URL
      window.location.href = data.url;
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  })

  const handleConnectEmail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await connectEmailMutation.mutateAsync({
        plugin: "gmail",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect email");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">Email Dashboard</h1>
      
      <div className="flex items-center gap-4">
        <button
          onClick={handleConnectEmail}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Connecting..." : "Connect Gmail Account"}
        </button>
        
        {error && (
          <div className="text-red-600">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
