"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ArtProps = {
  className?: string
}

export function HomeArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 420 260" className={cn("h-auto w-full", className)} aria-hidden>
      <circle cx="210" cy="130" r="108" fill="#ccfbf1" fillOpacity="0.55" />
      <rect x="68" y="52" width="180" height="128" rx="18" fill="#0f766e" />
      <rect x="82" y="66" width="152" height="88" rx="10" fill="#ecfdf5" />
      <rect x="98" y="84" width="88" height="10" rx="5" fill="#0f766e" fillOpacity="0.28" />
      <rect x="98" y="104" width="120" height="7" rx="3.5" fill="#0f766e" fillOpacity="0.14" />
      <path d="M250 58 L360 104 L278 128 L260 170 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="2.5" strokeLinejoin="round" />
      <g transform="translate(96 198)">
        <circle cx="14" cy="14" r="14" fill="#14b8a6" />
        <circle cx="42" cy="14" r="14" fill="#ea580c" />
        <circle cx="70" cy="14" r="14" fill="#0f766e" />
      </g>
    </svg>
  )
}

export function CampaignsArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 420 260" className={cn("h-auto w-full", className)} aria-hidden>
      <circle cx="210" cy="130" r="108" fill="#ffedd5" fillOpacity="0.65" />
      <path d="M96 150 L168 78 L262 150 Z" fill="#fb923c" />
      <rect x="112" y="150" width="136" height="28" rx="8" fill="#ea580c" />
      <circle cx="300" cy="92" r="34" fill="#0f766e" />
      <path d="M286 92 H314 M300 78 V106" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M250 70 C278 52 312 52 340 74" stroke="#fdba74" strokeWidth="3" strokeDasharray="6 7" fill="none" />
      <rect x="84" y="198" width="58" height="36" rx="10" fill="#99f6e4" />
      <rect x="152" y="198" width="58" height="36" rx="10" fill="#fed7aa" />
      <rect x="220" y="198" width="58" height="36" rx="10" fill="#99f6e4" />
    </svg>
  )
}

export function ContactsArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 420 260" className={cn("h-auto w-full", className)} aria-hidden>
      <circle cx="210" cy="130" r="108" fill="#cffafe" fillOpacity="0.55" />
      <circle cx="150" cy="104" r="34" fill="#0f766e" />
      <path d="M116 160c8-22 24-32 34-32s26 10 34 32" stroke="#0f766e" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="236" cy="98" r="24" fill="#14b8a6" />
      <circle cx="292" cy="98" r="24" fill="#ea580c" />
      <rect x="214" y="150" width="120" height="12" rx="6" fill="#99f6e4" />
      <rect x="214" y="174" width="88" height="10" rx="5" fill="#ccfbf1" />
      <rect x="96" y="198" width="220" height="28" rx="14" fill="white" stroke="#99f6e4" strokeWidth="2" />
    </svg>
  )
}

export function SegmentsArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 420 260" className={cn("h-auto w-full", className)} aria-hidden>
      <circle cx="210" cy="130" r="108" fill="#ccfbf1" fillOpacity="0.55" />
      <circle cx="168" cy="120" r="58" fill="#99f6e4" fillOpacity="0.75" />
      <circle cx="236" cy="120" r="58" fill="#fdba74" fillOpacity="0.5" />
      <path d="M186 92c16 12 24 30 16 52" stroke="#0f766e" strokeWidth="5" fill="none" />
      <rect x="286" y="84" width="56" height="76" rx="14" fill="#0f766e" />
      <path d="M300 108h28M300 128h20" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <rect x="110" y="198" width="70" height="18" rx="9" fill="#0f766e" fillOpacity="0.15" />
      <rect x="190" y="198" width="70" height="18" rx="9" fill="#ea580c" fillOpacity="0.18" />
    </svg>
  )
}

export function TemplatesArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 420 260" className={cn("h-auto w-full", className)} aria-hidden>
      <circle cx="210" cy="130" r="108" fill="#d1fae5" fillOpacity="0.55" />
      <rect x="100" y="58" width="140" height="150" rx="16" fill="white" stroke="#99f6e4" strokeWidth="3" />
      <path d="M100 88h140" stroke="#99f6e4" strokeWidth="3" />
      <path d="M100 88l70 46 70-46" stroke="#0f766e" strokeWidth="3.5" fill="none" />
      <rect x="120" y="150" width="72" height="8" rx="4" fill="#0f766e" fillOpacity="0.18" />
      <rect x="120" y="168" width="96" height="7" rx="3.5" fill="#0f766e" fillOpacity="0.12" />
      <rect x="270" y="84" width="70" height="96" rx="14" fill="#ea580c" />
      <rect x="284" y="104" width="42" height="7" rx="3.5" fill="white" fillOpacity="0.85" />
      <rect x="284" y="122" width="34" height="6" rx="3" fill="white" fillOpacity="0.4" />
      <rect x="284" y="138" width="28" height="6" rx="3" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export function ModuleMiniArt({
  variant,
  className,
}: {
  variant: "contacts" | "segments" | "templates" | "campaigns"
  className?: string
}) {
  if (variant === "contacts") {
    return (
      <svg viewBox="0 0 220 110" className={cn("h-full w-full", className)} aria-hidden>
        <rect width="220" height="110" rx="16" fill="#ecfeff" />
        <circle cx="58" cy="48" r="20" fill="#0f766e" />
        <path d="M40 78c4-12 12-18 18-18s14 6 18 18" stroke="#0f766e" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="116" cy="44" r="14" fill="#14b8a6" />
        <circle cx="152" cy="44" r="14" fill="#ea580c" />
        <rect x="100" y="74" width="84" height="8" rx="4" fill="#99f6e4" />
      </svg>
    )
  }
  if (variant === "segments") {
    return (
      <svg viewBox="0 0 220 110" className={cn("h-full w-full", className)} aria-hidden>
        <rect width="220" height="110" rx="16" fill="#f0fdfa" />
        <circle cx="78" cy="55" r="30" fill="#99f6e4" fillOpacity="0.8" />
        <circle cx="122" cy="55" r="30" fill="#fdba74" fillOpacity="0.55" />
        <rect x="162" y="30" width="36" height="50" rx="10" fill="#0f766e" />
        <path d="M172 48h16M172 60h12" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }
  if (variant === "templates") {
    return (
      <svg viewBox="0 0 220 110" className={cn("h-full w-full", className)} aria-hidden>
        <rect width="220" height="110" rx="16" fill="#ecfdf5" />
        <rect x="48" y="20" width="84" height="70" rx="10" fill="white" stroke="#99f6e4" strokeWidth="3" />
        <path d="M48 38h84" stroke="#99f6e4" strokeWidth="3" />
        <path d="M48 38l42 26 42-26" stroke="#0f766e" strokeWidth="3" fill="none" />
        <rect x="148" y="28" width="40" height="54" rx="8" fill="#ea580c" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 220 110" className={cn("h-full w-full", className)} aria-hidden>
      <rect width="220" height="110" rx="16" fill="#fff7ed" />
      <path d="M42 74 L86 36 L140 74 Z" fill="#fb923c" />
      <rect x="52" y="74" width="78" height="16" rx="4" fill="#ea580c" />
      <circle cx="168" cy="42" r="20" fill="#0f766e" />
      <path d="M158 42h20M168 32v20" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function PageHero({
  title,
  description,
  actions,
  art,
  tone = "teal",
}: {
  title: string
  description: string
  actions?: React.ReactNode
  art: React.ReactNode
  tone?: "teal" | "orange" | "cyan" | "emerald"
}) {
  const tones = {
    teal: "from-teal-50 via-white to-orange-50 border-teal-100",
    orange: "from-orange-50 via-white to-teal-50 border-orange-100",
    cyan: "from-cyan-50 via-white to-teal-50 border-cyan-100",
    emerald: "from-emerald-50 via-white to-teal-50 border-emerald-100",
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border bg-gradient-to-br shadow-sm",
        tones[tone]
      )}
    >
      <div className="grid items-center gap-4 px-5 py-5 sm:px-7 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              {description}
            </p>
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
        <div className="mx-auto w-full max-w-[320px] rounded-2xl bg-white/75 p-2 shadow-sm ring-1 ring-teal-100/70">
          {art}
        </div>
      </div>
    </section>
  )
}
