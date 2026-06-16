"use client";

import { useState, useRef, useEffect } from "react";
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
  Command,
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

const SLIDES = [
  { id: 1, image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop" },
  { id: 2, image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop" },
  { id: 3, image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop" },
];

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const slideImageRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { loginUserAsync, error, status } = useLogin(() => {
    router.push("/main");
  });

  // Entrance Animation
  useEffect(() => {
    if (formContainerRef.current) {
      const elements = formContainerRef.current.querySelectorAll(".form-item-animate");
      gsap.fromTo(
        elements,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: "power2.out",
        }
      );
    }
  }, []);

  // Smooth crossfade loop for visual side panel
  useEffect(() => {
    const timer = setInterval(() => {
      const nextSlide = (currentSlide + 1) % SLIDES.length;
      const tl = gsap.timeline();

      tl.to(slideImageRef.current, {
        opacity: 0.1,
        scale: 1.02,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => setCurrentSlide(nextSlide),
      });

      tl.to(slideImageRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await loginUserAsync({ email, password });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    /* OUTER WRAPPER: Matches perfect centering safety canvas */
    <div className="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-16 box-border">
      <div
        className={cn(
          "relative flex flex-col md:flex-row w-full max-w-[1200px] md:min-w-[950px]",
          "rounded-[2.5rem] border border-white/40 bg-white/50 backdrop-blur-2xl shadow-2xl dark:border-zinc-800/60 dark:bg-zinc-950/40",
          "overflow-hidden text-zinc-900 dark:text-zinc-50",
          className
        )}
        {...props}
      >
        {/* LEFT SIDE: MATCHING SIGNUP FORM THEMING AND PADDING */}
        <div className="w-full md:w-[56%] py-12 px-6 sm:px-12 lg:p-16 flex flex-col items-center justify-center relative z-10">
          <div className="w-full max-w-[400px] mx-auto" ref={formContainerRef}>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="space-y-6">
                
                {/* Header Title Layer */}
                <div className="form-item-animate space-y-2.5 opacity-0 pb-1 text-left w-full">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
                    <Command className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className={splineSans.className}>Console Control Center</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 pt-1 leading-none">
                    Welcome back to{" "}
                    <span className={`${yatraOne.className} text-indigo-600 dark:text-indigo-400 block sm:inline`}>
                      स्वचालन
                    </span>
                  </h1>
                  <FieldDescription className="text-zinc-600 dark:text-zinc-400 text-sm">
                    Sign in to continue deploying workflow layers.
                  </FieldDescription>
                </div>

                {/* Email Input Field */}
                <Field className="form-item-animate opacity-0 space-y-1.5">
                  <FieldLabel
                    htmlFor="email"
                    className="text-zinc-800 dark:text-zinc-200 font-medium text-[13px] px-0.5"
                  >
                    Email Address
                  </FieldLabel>

                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="h-12 px-4 border-white/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-sm focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 transition-all rounded-xl shadow-sm w-full block relative z-0 text-zinc-900 dark:text-white"
                  />
                </Field>

                {/* Password Input Field */}
                <Field className="form-item-animate opacity-0 space-y-1.5">
                  <div className="flex items-center justify-between mb-1 px-0.5">
                    <FieldLabel
                      htmlFor="password"
                      className="text-zinc-800 dark:text-zinc-200 font-medium text-[13px]"
                    >
                      Password
                    </FieldLabel>

                    <a
                      href="#"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition hover:underline underline-offset-2"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-12 pl-4 pr-12 border-white/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-sm focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 transition-all rounded-xl shadow-sm w-full block relative z-0 text-zinc-900 dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 outline-none transition-all z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </Field>

                {/* Error Block layout match */}
                {error && (
                  <p className="form-item-animate text-sm text-red-700 dark:text-red-300 font-medium bg-red-100/80 dark:bg-red-900/30 backdrop-blur-md border border-red-200 dark:border-red-800/50 rounded-xl p-3.5">
                    {error.message}
                  </p>
                )}

                {/* Submit button without shine effect */}
                <div className="form-item-animate pt-1">
                  <Button
                    type="submit"
                    disabled={status === "pending"}
                    className="
                      h-12
                      w-full
                      bg-zinc-900
                      hover:bg-zinc-800
                      dark:bg-zinc-100
                      dark:hover:bg-white
                      text-white
                      dark:text-zinc-900
                      font-semibold
                      text-[15px]
                      transition-all
                      duration-200
                      rounded-xl
                      shadow-lg
                      flex items-center justify-center gap-2
                    "
                  >
                    <span>
                      {status === "pending" ? "Accessing hub..." : "Sign In"}
                    </span>
                  </Button>
                </div>

                {/* Footer Link */}
                <div className="form-item-animate text-center text-sm text-zinc-600 dark:text-zinc-400 pt-1">
                  Don't have an account?{" "}
                  <a
                    href="/signup"
                    className="font-semibold text-indigo-600 dark:text-indigo-400 transition hover:underline underline-offset-4"
                  >
                    Create one
                  </a>
                </div>
              </FieldGroup>
            </form>

            <FieldDescription className="form-item-animate mt-6 text-center text-xs text-zinc-500">
              By signing in, you agree to our{" "}
              <a
                href="#"
                className="transition hover:text-zinc-700 dark:hover:text-zinc-300 underline-offset-2 hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="transition hover:text-zinc-700 dark:hover:text-zinc-300 underline-offset-2 hover:underline"
              >
                Privacy Policy
              </a>
              .
            </FieldDescription>
          </div>
        </div>

        {/* RIGHT SIDE: EDGE-TO-EDGE SYNCHRONIZED IMMERSIVE MEDIA SLIDER CONTAINER */}
        <div className="hidden md:block w-[44%] relative bg-zinc-950 overflow-hidden m-3 rounded-[2rem]">
          <div 
            ref={slideImageRef}
            className="absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-out"
            style={{ backgroundImage: `url(${SLIDES[currentSlide].image})` }}
          />
          
          {/* Bottom vignette gradient shroud */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          {/* Slider Point Nodes */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 bg-black/30 backdrop-blur-xl px-4 py-3 rounded-full border border-white/20 shadow-2xl">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-400",
                  currentSlide === idx 
                    ? "w-8 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" 
                    : "w-2 bg-white/40 hover:bg-white/80"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}