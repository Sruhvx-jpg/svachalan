"use client";

import { useState, useRef } from "react";
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
import gsap from "gsap";

import { useLogin } from "../../app/hooks/api/auth/useLogin";

import { Spline_Sans, Yatra_One } from "next/font/google";

const splineSans = Spline_Sans({
  subsets: ["latin"],
});

const yatraOne = Yatra_One({
  subsets: ["latin", "devanagari"],
  weight: "400",
});
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const sweepRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    gsap.fromTo(
      sweepRef.current,
      {
        x: "-250%",
      },
      {
        x: "500%",
        duration: 0.8,
        ease: "power2.out",
      }
    );
  };

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
        "w-full max-w-lg rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur-xl shadow-2xl",
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
              <h1 className="text-2xl tracking-tight">
                <span className={`${splineSans.className} font-semibold text-blue-400`}>
                  Welcome back to
                </span>{" "}
                <span
                  className={`${yatraOne.className} bg-linear-to-r text-3xl from-purple-300 to-purple-500 bg-clip-text text-transparent`}
                >
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
              className="text-blue-400 ">
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
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:blue-blue-300 focus-visible:ring-blue-300"
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
                className="h-11 border-white/10 bg-white/5 pr-12 text-white placeholder:text-slate-500 focus-visible:blue-blue-300 focus-visible:ring-blue-300"
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
            onMouseEnter={handleEnter}
            className="
    relative
    h-11
    w-full
    overflow-hidden
    border-0
    bg-gradient-to-r
    from-blue-500
    via-blue-600
    to-purple-600
    text-white
    transition-all
    duration-300
    hover:scale-[1.02]
    hover:shadow-lg
    hover:shadow-blue-500/25
  "
          >
            <div
              ref={sweepRef}
              className="
      absolute
      inset-y-0
      -left-32
      w-24
      -skew-x-[20deg]
      bg-white/10
      blur-md
      pointer-events-none
    "
              style={{
                transform: "translateX(-250%)",
              }}
            />

            <span className="relative z-10">
              {status === "pending"
                ? "Signing In..."
                : "Sign In"}
            </span>
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