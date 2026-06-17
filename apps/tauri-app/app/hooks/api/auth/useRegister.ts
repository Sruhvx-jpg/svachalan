import { trpc } from "../../../../trpc/client";
import { useCallback } from "react";

export const useSignup = (onSuccess?: () => void) => {
  const {
    mutateAsync: registerUserAsync,
    mutate: registerUser,
    isPending,
    isError,
    isSuccess,
    error,
    reset,
    status
  } = trpc.auth.registerUser.useMutation();

  const handleRegisterAsync = useCallback(async (data: any) => {
    const result = await registerUserAsync(data);
    if (result && result.accessToken) {
      localStorage.setItem("authentication_token", result.accessToken);
    }
    if (onSuccess) {
      onSuccess();
    }
    return result;
  }, [registerUserAsync, onSuccess]);

  return {
    registerUserAsync: handleRegisterAsync,
    registerUser,
    isPending,
    isError,
    isSuccess,
    error,
    reset,
    status
  };
};