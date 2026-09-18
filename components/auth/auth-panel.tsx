"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function AuthPanel({
  title,
  subtitle,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  title: string
  subtitle?: React.ReactNode
}) {
  return (
    <div className={cn("flex w-full flex-col", className)} {...props}>
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-teal-900/10 bg-white shadow-[0_18px_50px_-28px_rgba(15,118,110,0.45)]">
        <div className="relative z-10 border-b border-teal-100 bg-gradient-to-r from-[#0b3b3a] via-[#0f766e] to-[#ea580c] px-7 py-5">
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            {title}
          </h2>
          {subtitle ? (
            <div className="mt-1 text-sm text-teal-50/90">{subtitle}</div>
          ) : null}
        </div>
        <div className="relative z-10 p-7 sm:p-8">{children}</div>
      </div>
    </div>
  )
}

export const authInputClassName =
  "w-full border-teal-300 focus-visible:border-teal-500 focus-visible:ring-teal-500/50 hover:border-teal-400 transition-colors"

export const authLabelClassName =
  "block text-sm font-medium text-slate-700 mb-2"

export const authPrimaryButtonClassName =
  "w-full text-white font-medium py-2.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"

export const authLinkClassName =
  "font-medium text-teal-700 hover:text-teal-600 hover:underline transition-colors"
