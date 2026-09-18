"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function SignInIllustration() {
  return (
    <svg
      viewBox="0 0 420 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-full max-w-[420px]"
      aria-hidden
    >
      <defs>
        <linearGradient id="signinGlow" x1="40" y1="30" x2="380" y2="330" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" stopOpacity="0.4" />
          <stop offset="1" stopColor="#0f766e" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="signinPanel" x1="90" y1="70" x2="300" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecfdf5" />
          <stop offset="1" stopColor="#99f6e4" />
        </linearGradient>
        <linearGradient id="signinLock" x1="250" y1="70" x2="360" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7ed" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
      </defs>

      <circle cx="210" cy="180" r="148" fill="url(#signinGlow)" />
      <circle cx="70" cy="84" r="8" fill="#5eead4" fillOpacity="0.65" />
      <circle cx="348" cy="280" r="7" fill="#fb923c" fillOpacity="0.55" />

      <g className="origin-center animate-[auth-float_5s_ease-in-out_infinite]">
        <rect
          x="72"
          y="88"
          width="230"
          height="176"
          rx="22"
          fill="url(#signinPanel)"
          stroke="#99f6e4"
          strokeWidth="3"
        />
        <rect x="94" y="112" width="120" height="14" rx="7" fill="#0f766e" fillOpacity="0.35" />
        <rect x="94" y="140" width="184" height="10" rx="5" fill="#0f766e" fillOpacity="0.18" />
        <rect x="94" y="162" width="160" height="10" rx="5" fill="#0f766e" fillOpacity="0.12" />

        <rect x="94" y="196" width="72" height="42" rx="12" fill="#0f766e" />
        <path
          d="M118 214 H142 M130 202 V226"
          stroke="none"
        />
        <path
          d="M112 217 L122 227 L148 203"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect x="178" y="196" width="72" height="42" rx="12" fill="#ea580c" fillOpacity="0.9" />
        <path
          d="M196 210 H232 M196 224 H220"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      <g className="origin-center animate-[auth-drift_4.8s_ease-in-out_infinite]">
        <rect
          x="268"
          y="96"
          width="96"
          height="108"
          rx="20"
          fill="url(#signinLock)"
          stroke="#ea580c"
          strokeWidth="3"
        />
        <path
          d="M292 96 V78 C292 62 304 50 316 50 C328 50 340 62 340 78 V96"
          stroke="#ea580c"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="316" cy="142" r="12" fill="#c2410c" />
        <rect x="310" y="142" width="12" height="28" rx="6" fill="#c2410c" />
      </g>

      <g transform="translate(78 286)">
        <circle cx="20" cy="18" r="16" fill="#0f766e" />
        <path
          d="M20 10 C24 10 27 13 27 17 C27 21 24 24 20 24 C16 24 13 21 13 17 C13 13 16 10 20 10Z"
          fill="white"
        />
        <path
          d="M10 32 C10 27 14 24 20 24 C26 24 30 27 30 32"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="48" y="8" width="150" height="8" rx="4" fill="#ffffff" fillOpacity="0.28" />
        <rect x="48" y="22" width="104" height="8" rx="4" fill="#ffffff" fillOpacity="0.16" />
      </g>
    </svg>
  )
}

function SignUpIllustration() {
  return (
    <svg
      viewBox="0 0 420 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-full max-w-[420px]"
      aria-hidden
    >
      <defs>
        <linearGradient id="signupGlow" x1="50" y1="20" x2="370" y2="340" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#5eead4" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id="signupCard" x1="70" y1="90" x2="250" y2="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7ed" />
          <stop offset="1" stopColor="#fed7aa" />
        </linearGradient>
        <linearGradient id="signupPlane" x1="220" y1="40" x2="390" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecfdf5" />
          <stop offset="1" stopColor="#5eead4" />
        </linearGradient>
      </defs>

      <circle cx="210" cy="180" r="148" fill="url(#signupGlow)" />
      <circle cx="86" cy="70" r="9" fill="#fb923c" fillOpacity="0.7" />
      <circle cx="340" cy="268" r="8" fill="#5eead4" fillOpacity="0.7" />

      <g className="origin-center animate-[auth-float_4.6s_ease-in-out_infinite]">
        <rect
          x="64"
          y="102"
          width="198"
          height="168"
          rx="22"
          fill="url(#signupCard)"
          stroke="#fdba74"
          strokeWidth="3"
        />
        <circle cx="163" cy="158" r="28" fill="#ea580c" />
        <path
          d="M163 144 C170 144 175 149 175 156 C175 163 170 168 163 168 C156 168 151 163 151 156 C151 149 156 144 163 144Z"
          fill="white"
        />
        <path
          d="M145 186 C145 176 153 170 163 170 C173 170 181 176 181 186"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="198" cy="140" r="16" fill="#0f766e" />
        <path
          d="M198 132 V148 M190 140 H206"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <rect x="92" y="210" width="142" height="12" rx="6" fill="#c2410c" fillOpacity="0.35" />
        <rect x="92" y="232" width="108" height="10" rx="5" fill="#c2410c" fillOpacity="0.2" />
      </g>

      <g className="origin-center animate-[auth-drift_4.2s_ease-in-out_infinite]">
        <path
          d="M248 70 L380 118 L292 146 L276 188 L248 70Z"
          fill="url(#signupPlane)"
          stroke="#0f766e"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M248 70 L292 146 L322 128"
          stroke="#0f766e"
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M230 170 C262 146 308 132 356 138"
          stroke="#99f6e4"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 8"
          opacity="0.9"
        />
      </g>

      <g transform="translate(286 214)">
        <rect width="92" height="64" rx="16" fill="#0f766e" />
        <rect x="16" y="16" width="40" height="8" rx="4" fill="white" fillOpacity="0.85" />
        <rect x="16" y="30" width="60" height="6" rx="3" fill="white" fillOpacity="0.35" />
        <rect x="16" y="42" width="48" height="6" rx="3" fill="white" fillOpacity="0.25" />
      </g>

      <g transform="translate(54 286)">
        <circle cx="18" cy="18" r="16" fill="#ea580c" />
        <circle cx="48" cy="18" r="16" fill="#0f766e" />
        <circle cx="78" cy="18" r="16" fill="#14b8a6" />
        <circle cx="108" cy="18" r="16" fill="#fb923c" stroke="#fff7ed" strokeWidth="3" />
        <path
          d="M108 10 V26 M100 18 H116"
          stroke="#fff7ed"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="138" y="8" width="120" height="8" rx="4" fill="#ffffff" fillOpacity="0.28" />
        <rect x="138" y="22" width="86" height="8" rx="4" fill="#ffffff" fillOpacity="0.16" />
      </g>
    </svg>
  )
}

function EmailCampaignIllustration({
  variant = "login",
}: {
  variant?: "login" | "signup"
}) {
  return variant === "signup" ? <SignUpIllustration /> : <SignInIllustration />
}

export function AuthPageShell({
  brandTitle = "Email Campaign Hub",
  mode = "login",
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  brandTitle?: string
  mode?: "login" | "signup"
}) {
  const headline =
    mode === "signup"
      ? "Launch campaigns that land in every inbox"
      : "Welcome back to your campaign workspace"
  const supporting =
    mode === "signup"
      ? "Create an account to design templates, build segments, and send at scale."
      : "Sign in to manage templates, segments, and outbound email campaigns."
  const chips =
    mode === "signup"
      ? ["Create account", "Build audience", "Go live"]
      : ["Secure access", "Resume campaigns", "Send again"]

  return (
    <div
      className={cn(
        "relative min-h-svh overflow-hidden bg-[#f4f7f8]",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,#99f6e455,transparent_42%),radial-gradient(circle_at_bottom_right,#fdba7440,transparent_40%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(#0f766e22 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-3xl border border-teal-900/10 bg-white/80 shadow-[0_30px_80px_-40px_rgba(15,118,110,0.55)] backdrop-blur-sm lg:grid-cols-[1.05fr_0.95fr]">
          <aside
            className={cn(
              "relative flex flex-col justify-between overflow-hidden px-8 py-10 text-white sm:px-10 lg:min-h-[640px]",
              mode === "signup"
                ? "bg-gradient-to-br from-[#7c2d12] via-[#0f766e] to-[#0b3b3a]"
                : "bg-gradient-to-br from-[#0b3b3a] via-[#0f766e] to-[#c2410c]"
            )}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-orange-400/20 blur-3xl" />

            <div className="relative space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100/90">
                Email Campaign Hub
              </p>
              <h1 className="max-w-md text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {brandTitle}
              </h1>
              <p className="max-w-sm text-sm leading-relaxed text-teal-50/90 sm:text-base">
                {headline}
              </p>
              <p className="max-w-sm text-sm text-teal-100/75">{supporting}</p>
            </div>

            <div className="relative mt-10 flex flex-1 items-center justify-center py-4">
              <EmailCampaignIllustration variant={mode} />
            </div>

            <div className="relative mt-6 flex flex-wrap gap-3 text-xs font-medium text-teal-50/90">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </aside>

          <section className="flex items-center bg-[#f8fbfb] px-5 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto w-full max-w-md">{children}</div>
          </section>
        </div>
      </div>
    </div>
  )
}
