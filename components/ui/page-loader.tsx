"use client"

import { Loader } from "@/components/ui/loader"
import { cn } from "@/lib/utils"

export function PageLoader({
  label = "Loading data",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-[420px] w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white",
        className
      )}
    >
      <Loader size="lg" label={label} />
    </div>
  )
}
