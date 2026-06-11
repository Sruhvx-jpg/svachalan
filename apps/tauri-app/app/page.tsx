"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetMe } from "../app/hooks/api/auth/useGetme";

export default function Home() {
  const router = useRouter();

  const {
    isLoading,
    isSuccess,
    isError,
  } = useGetMe();

  useEffect(() => {
    if (isSuccess) {
      router.replace("./signup");
    }

    if (isError) {
      router.replace("/signup");
    }
  }, [isSuccess, isError, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <p className="text-sm text-slate-400">
        {isLoading ? "Checking authentication..." : "Redirecting..."}
      </p>
    </main>
  );
}