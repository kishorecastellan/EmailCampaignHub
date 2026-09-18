"use client"

import { cn } from "@/lib/utils"

export function Loader({
  className,
  label,
  size = "md",
}: {
  className?: string
  label?: string
  size?: "sm" | "md" | "lg"
}) {
  const dims =
    size === "sm" ? "size-5" : size === "lg" ? "size-12" : "size-8"
  const ring =
    size === "sm" ? "border-2" : size === "lg" ? "border-[3px]" : "border-2"

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className={cn("relative", dims)}>
        <div
          className={cn(
            "absolute inset-0 rounded-full border-slate-200/80",
            ring
          )}
        />
        <div
          className={cn(
            "absolute inset-0 animate-spin rounded-full border-transparent border-t-teal-600 border-r-orange-500/50",
            ring
          )}
        />
        <div className="absolute inset-[28%] animate-pulse rounded-full bg-teal-600/15" />
      </div>
      {label ? (
        <p className="text-xs font-medium tracking-wide text-slate-500">
          {label}
        </p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  )
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 animate-spin rounded-full border-2 border-teal-600/30 border-t-teal-600",
        className
      )}
    />
  )
}
