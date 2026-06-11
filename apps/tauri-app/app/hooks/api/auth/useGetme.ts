import { trpc } from "../../../../trpc/client";

export const useGetMe = () => {
  const {
    data: userData,
    isLoading,
    isError,
    isSuccess,
    error,
    refetch,
  } = trpc.auth.getMe.useQuery();

  return {
    userData,
    isLoading,
    isError,
    isSuccess,
    error,
    refetch,
  };
};