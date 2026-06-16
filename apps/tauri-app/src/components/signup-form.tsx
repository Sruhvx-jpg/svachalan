"use client";

import { useEffect, useRef, useState } from "react";
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
  Check,
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import gsap from "gsap";

import { useSignup } from "../../app/hooks/api/auth/useRegister";
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const formContainerRef = useRef<HTMLDivElement>(null);
  const slideImageRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const { registerUserAsync, error, isSuccess, status } = useSignup(() => {
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

  // Smooth crossfade state-sync loop
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
      await registerUserAsync({ fullName, email, password });
    } catch (err) {
      console.error(err);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-black/10 dark:bg-white/10", text: "text-zinc-500" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1: return { score: 25, label: "Weak", color: "bg-red-500", text: "text-red-500" };
      case 2: return { score: 50, label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
      case 3: return { score: 75, label: "Good", color: "bg-indigo-500", text: "text-indigo-500" };
      case 4: return { score: 100, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
      default: return { score: 0, label: "Empty", color: "bg-black/10 dark:bg-white/10", text: "text-zinc-500" };
    }
  };

  const strength = getPasswordStrength(password);

  return (
    /* OUTER WRAPPER: Centers the content beautifully with padding layout safety blocks */
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
        {/* LEFT SIDE: CONTAINER (56% layout width perfectly balanced, padding dictates native roomy depth) */}
        <div className="w-full md:w-[56%] py-12 px-6 sm:px-12 lg:p-16 flex flex-col items-center justify-center relative z-10">
          <div className="w-full max-w-[400px] mx-auto" ref={formContainerRef}>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Header Title */}
              <div className="form-item-animate space-y-2.5 opacity-0 pb-1">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
                  <Command className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className={splineSans.className}>Console Control Center</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 pt-1 leading-none">
                  Create account on{" "}
                  <span className={`${yatraOne.className} text-indigo-600 dark:text-indigo-400 block sm:inline`}>
                    स्वचालन
                  </span>
                </h1>
                <FieldDescription className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Deploy workflow layers and automate actions globally.
                </FieldDescription>
              </div>

              <FieldGroup className="space-y-5">
                {/* Full Name Input */}
                <Field className="form-item-animate opacity-0 space-y-1.5">
                  <FieldLabel htmlFor="fullName" className="text-zinc-800 dark:text-zinc-200 font-medium text-[13px] px-0.5">
                    Full Name
                  </FieldLabel>
                  <div className="relative w-full flex items-center">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none z-10" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dron Manish Rane"
                      required
                      className="h-12 pl-12 pr-4 border-white/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-sm focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 transition-all rounded-xl shadow-sm w-full block relative z-0"
                    />
                  </div>
                </Field>

                {/* Email Input */}
                <Field className="form-item-animate opacity-0 space-y-1.5">
                  <FieldLabel htmlFor="email" className="text-zinc-800 dark:text-zinc-200 font-medium text-[13px] px-0.5">
                    Email Address
                  </FieldLabel>
                  <div className="relative w-full flex items-center">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none z-10" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="h-12 pl-12 pr-4 border-white/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-sm focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 transition-all rounded-xl shadow-sm w-full block relative z-0"
                    />
                  </div>
                </Field>

                {/* Password Input */}
                <Field className="form-item-animate opacity-0 space-y-1.5">
                  <FieldLabel htmlFor="password" className="text-zinc-800 dark:text-zinc-200 font-medium text-[13px] px-0.5">
                    Password
                  </FieldLabel>
                  <div className="relative w-full flex items-center">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none z-10" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-12 pl-12 pr-12 border-white/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-sm focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 transition-all rounded-xl shadow-sm w-full block relative z-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 outline-none transition-all z-10"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Strength UI Accordion Expansion */}
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      password ? "grid-rows-[1fr] opacity-100 pt-2" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden min-h-0 space-y-2.5">
                      <div className="flex gap-1.5 h-1.5 w-full">
                        {[25, 50, 75, 100].map((step) => (
                          <div
                            key={step}
                            className={cn(
                              "h-full w-full rounded-full transition-all duration-500",
                              strength.score >= step ? strength.color : "bg-black/10 dark:bg-white/10"
                            )}
                          />
                        ))}
                      </div>

                      <ul className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1 text-[12px] text-zinc-600 dark:text-zinc-400">
                        {[
                          { cond: password.length >= 8, text: "8+ characters" },
                          { cond: /[A-Z]/.test(password), text: "Capital letter" },
                          { cond: /[0-9]/.test(password), text: "Number" },
                          { cond: /[^A-Za-z0-9]/.test(password), text: "Special symbol" },
                        ].map((req, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-full border transition-colors shrink-0",
                                req.cond
                                  ? "border-indigo-500/30 bg-indigo-500 text-white dark:text-indigo-100 shadow-sm"
                                  : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-transparent"
                              )}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span className={req.cond ? "text-zinc-900 dark:text-zinc-100 font-medium" : ""}>{req.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Field>
              </FieldGroup>

              {/* Error Feedback Block */}
              <div
                className={cn(
                  "transition-all duration-300 overflow-hidden",
                  error ? "max-h-32 opacity-100 mb-4" : "max-h-0 opacity-0"
                )}
              >
                <div className="flex items-start gap-3 bg-red-100/80 dark:bg-red-900/30 backdrop-blur-md border border-red-200 dark:border-red-800/50 rounded-xl p-3.5">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium leading-normal">
                    {error?.message}
                  </p>
                </div>
              </div>

              {/* Success Feedback Block */}
              {isSuccess && (
                <div className="form-item-animate opacity-0 flex items-start gap-3 bg-emerald-100/80 dark:bg-emerald-900/30 backdrop-blur-md border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium leading-normal">Workspace configured successfully.</p>
                </div>
              )}

              {/* Form Action Button */}
              <div className="form-item-animate opacity-0 pt-2">
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
                    whitespace-nowrap
                  "
                >
                  {status === "pending" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Deploying instance...
                    </>
                  ) : (
                    <>
                      Continue setup
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Footer Redirect Option */}
              <div className="form-item-animate opacity-0 text-center text-sm text-zinc-600 dark:text-zinc-400 pt-1">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 transition hover:underline underline-offset-4"
                >
                  Sign In
                </a>
              </div>

            </form>
          </div>
        </div>

        {/* RIGHT SIDE: IMAGE LAYER (Adapts naturally to layout context boundaries) */}
        <div className="hidden md:block w-[44%] relative bg-zinc-950 overflow-hidden m-3 rounded-[2rem]">
          <div
            ref={slideImageRef}
            className="absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-out"
            style={{ backgroundImage: `url(${SLIDES[currentSlide].image})` }}
          />

          {/* Ambient bottom backdrop layer to protect indicator points */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          {/* Floating Slide Indicator Points */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 bg-black/30 backdrop-blur-xl px-4 py-3 rounded-full border border-white/20 shadow-2xl">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
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