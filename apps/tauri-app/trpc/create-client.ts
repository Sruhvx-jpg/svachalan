import { httpBatchStreamLink, httpLink } from "@repo/trpc/client";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

const getBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.svachalan.space";
  return apiUrl.replace(/\/$/, "");
};

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const link = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  return link({
    url: `${getBaseUrl()}/trpc`,
    fetch(url, options) {
      const token = typeof window !== "undefined" ? localStorage.getItem("authentication_token") : null;
      const headers = {
        ...options?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      return fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    },
  });
};
