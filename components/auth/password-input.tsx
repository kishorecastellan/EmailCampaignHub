"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { authInputClassName } from "@/components/auth/auth-panel"

export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [show, setShow] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type={show ? "text" : "password"}
        className={cn("pr-10", authInputClassName, className)}
        {...props}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const next = !show
          setShow(next)
          if (inputRef.current) {
            inputRef.current.type = next ? "text" : "password"
          }
        }}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors focus:outline-none rounded-sm h-5 w-5"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
