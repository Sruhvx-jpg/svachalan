import { trpc } from "../../../../trpc/client";
import { useCallback } from "react";

export const useLogin = (onSuccess?: () => void) => {
  const {
    mutateAsync: loginUserAsync,
    isPending,
    isError,
    isSuccess,
    error,
    reset,
    status
  } = trpc.auth.loginUser.useMutation();

  const handleLoginAsync = useCallback(async (data: any) => {
    const result = await loginUserAsync(data);
    if (result && result.accessToken) {
      localStorage.setItem("authentication_token", result.accessToken);
    }
    if (onSuccess) {
      onSuccess();
    }
    return result;
  }, [loginUserAsync, onSuccess]);

  return {
    loginUserAsync: handleLoginAsync,
    isPending,
    isError,
    isSuccess,
    error,
    reset,
    status
  };
};
