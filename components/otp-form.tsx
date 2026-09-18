"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  AuthPanel,
  authLinkClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-panel"

export interface OTPFormProps extends React.ComponentProps<"div"> {
  email: string
  group?: string
  onVerify: (payload: {
    email: string
    code: string
    group?: string
  }) => Promise<{ status: "success"; message?: string } | { status: "error"; message: string }>
  onResend: (payload: {
    email: string
  }) => Promise<{ status: "success"; message?: string } | { status: "error"; message: string }>
  onSuccess?: () => void
}

export function OTPForm({
  email,
  group,
  onVerify,
  onResend,
  onSuccess,
  className,
  ...props
}: OTPFormProps) {
  const [otp, setOtp] = React.useState<string[]>(new Array(6).fill(""))
  const [loading, setLoading] = React.useState(false)
  const [resending, setResending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const digits = e.clipboardData
      .getData("text")
      .trim()
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("")
    if (digits.length === 0) return
    const next = [...otp]
    digits.forEach((digit, i) => {
      if (i < 6) next[i] = digit
    })
    setOtp(next)
    inputsRef.current[Math.min(digits.length, 5)]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const code = otp.join("")
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit code.")
      setLoading(false)
      return
    }
    try {
      const result = await onVerify({ email, code, group })
      if (result.status === "error") {
        setError(result.message)
      } else {
        setSuccess(result.message ?? "Your email has been verified successfully!")
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await onResend({ email })
      if (result.status === "error") {
        setError(result.message)
      } else {
        setSuccess(result.message ?? "A new verification code has been sent.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code")
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthPanel
      title="Enter Verification Code"
      subtitle={
        <>
          We sent a 6-digit code to{" "}
          <span className="font-medium text-white">{email}</span>
        </>
      }
      className={cn("max-w-md", className)}
      {...props}
    >
      <div className="space-y-6">
      <p className="text-sm text-slate-600">
        <span className="font-medium text-slate-700">Note:</span> A verification
        code has been sent to your inbox. If you do not receive it, please check
        your Spam or Junk folder.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="otp-input-0"
              className="block text-sm font-medium text-slate-700 mb-4 text-center"
            >
              Verification Code
            </label>
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  id={index === 0 ? "otp-input-0" : undefined}
                  ref={(el) => {
                    inputsRef.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={cn(
                    "w-14 h-14 text-center text-2xl font-semibold border-teal-300 focus-visible:border-teal-500 focus-visible:ring-teal-500/50 hover:border-teal-400 transition-colors",
                    digit && "border-teal-500 bg-teal-50/50"
                  )}
                  aria-label={`Digit ${index + 1} of verification code`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Enter the 6-digit code sent to your email.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-600 text-sm text-center">{success}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className={authPrimaryButtonClassName}
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              disabled={resending}
              className={authLinkClassName}
              onClick={handleResend}
            >
              {resending ? "Resending..." : "Resend"}
            </button>
          </div>
        </div>
      </form>
      </div>
    </AuthPanel>
  )
}
