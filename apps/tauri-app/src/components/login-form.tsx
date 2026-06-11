"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Eye,
  EyeOff,
  GalleryVerticalEndIcon,
} from "lucide-react";

import { useLogin } from "../../app/hooks/api/auth/useLogin";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    loginUserAsync,
    error,
    status,
  } = useLogin(() => {
    router.push("/main");
  });

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      await loginUserAsync({
        email,
        password,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur-xl shadow-2xl",
        className
      )}
      {...props}
    >
      <form onSubmit={handleSubmit}>
        <FieldGroup className="space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <GalleryVerticalEndIcon className="size-8 text-blue-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="text-blue-400">Welcome back to </span>
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  स्वचालन
                </span>
              </h1>

              <FieldDescription className="text-slate-400">
                Sign in to continue automating.
              </FieldDescription>
            </div>
          </div>

          <Field>
            <FieldLabel
              htmlFor="email"
              className="text-blue-400"
            >
              Email
            </FieldLabel>

            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="example@xyz.com"
              required
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel
                htmlFor="password"
                className="text-blue-400"
              >
                Password
              </FieldLabel>

              <a
                href="#"
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Forgot password?
              </a>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••••••"
                required
                className="h-11 border-white/10 bg-white/5 pr-12 text-white placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </Field>

          {error && (
            <p className="text-sm text-red-400">
              {error.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={status === "pending"}
            className="h-11 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
          >
            {status === "pending"
              ? "Signing In..."
              : "Sign In"}
          </Button>

          <div className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-blue-400 transition hover:text-blue-300"
            >
              Create one
            </a>
          </div>
        </FieldGroup>
      </form>

      <FieldDescription className="mt-6 text-center text-xs text-slate-500">
        By signing in, you agree to our{" "}
        <a
          href="#"
          className="transition hover:text-slate-300"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="#"
          className="transition hover:text-slate-300"
        >
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  );
}