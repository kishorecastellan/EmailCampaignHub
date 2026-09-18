"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"
import {
  AuthPanel,
  authInputClassName,
  authLabelClassName,
  authLinkClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-panel"
import { PasswordInput } from "@/components/auth/password-input"

export type LoginView = "login" | "forgot-password" | "reset-password"
export type MfaStep = "none" | "totp" | "sms"

export type SignInResult =
  | { status: "success" }
  | { status: "mfa"; method: "totp" | "sms" }
  | { status: "error"; message: string }

export interface LoginFormProps extends React.ComponentProps<"div"> {
  onSignIn: (payload: {
    email: string
    password: string
  }) => Promise<SignInResult> | SignInResult
  onVerifyMfa: (payload: {
    code: string
    method: "totp" | "sms"
  }) => Promise<{ status: "success" } | { status: "error"; message: string }>
  onForgotPassword: (payload: {
    email: string
  }) => Promise<{ status: "success"; message?: string } | { status: "error"; message: string }>
  onResetPassword: (payload: {
    email: string
    code: string
    newPassword: string
  }) => Promise<{ status: "success"; message?: string } | { status: "error"; message: string }>
  onSignUpClick?: () => void
  initialEmail?: string
  error?: string | null
  successMessage?: string | null
}

export function LoginForm({
  className,
  onSignIn,
  onVerifyMfa,
  onForgotPassword,
  onResetPassword,
  onSignUpClick,
  initialEmail = "",
  error: controlledError,
  successMessage: controlledSuccess,
  ...props
}: LoginFormProps) {
  const [view, setView] = React.useState<LoginView>("login")
  const [email, setEmail] = React.useState(initialEmail)
  const [password, setPassword] = React.useState("")
  const [resetCode, setResetCode] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [mfaLoading, setMfaLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [mfaStep, setMfaStep] = React.useState<MfaStep>("none")
  const [mfaCode, setMfaCode] = React.useState("")

  const displayError = controlledError ?? error
  const displaySuccess = controlledSuccess ?? successMessage

  const title =
    view === "login"
      ? "Sign In"
      : view === "forgot-password"
        ? "Forgot Password"
        : "Reset Password"

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (mfaStep !== "none") {
      setMfaLoading(true)
      try {
        const result = await onVerifyMfa({
          code: mfaCode.trim(),
          method: mfaStep === "totp" ? "totp" : "sms",
        })
        if (result.status === "error") setError(result.message)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed.")
      } finally {
        setMfaLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      const result = await onSignIn({ email, password })
      if (result.status === "mfa") {
        setMfaStep(result.method)
      } else if (result.status === "error") {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await onForgotPassword({ email })
      if (result.status === "error") {
        setError(result.message)
      } else {
        setSuccessMessage(result.message ?? "Reset code sent to your email.")
        setView("reset-password")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset code.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await onResetPassword({
        email,
        code: resetCode,
        newPassword,
      })
      if (result.status === "error") {
        setError(result.message)
      } else {
        setSuccessMessage(
          result.message ??
            "Password reset successfully. Please login with your new password."
        )
        setView("login")
        setPassword("")
        setResetCode("")
        setNewPassword("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPanel title={title} className={cn(className)} {...props}>
      {view === "login" && (
        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            {displaySuccess && (
              <div className="p-3 bg-green-100 border border-green-200 text-green-700 rounded-md text-sm text-center">
                {displaySuccess}
              </div>
            )}

            {mfaStep !== "none" ? (
              <>
                <p className="text-sm text-slate-600 text-center">
                  {mfaStep === "totp"
                    ? "Enter the 6-digit code from your authenticator app."
                    : "Enter the verification code sent to your phone."}
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={mfaCode} onChange={setMfaCode}>
                    <InputOTPGroup className="gap-1">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-600"
                  onClick={() => {
                    setMfaStep("none")
                    setMfaCode("")
                    setError(null)
                  }}
                >
                  Back to password
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="email" className={authLabelClassName}>
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={authInputClassName}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView("forgot-password")
                        setError(null)
                        setSuccessMessage(null)
                      }}
                      className="text-sm text-teal-700 hover:text-teal-600 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <PasswordInput
                    id="password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </>
            )}

            {displayError && (
              <p className="text-red-500 text-center text-sm">{displayError}</p>
            )}

            <Button
              type="submit"
              disabled={
                loading ||
                mfaLoading ||
                (mfaStep !== "none" && mfaCode.length !== 6)
              }
              className={authPrimaryButtonClassName}
            >
              {mfaLoading
                ? "Verifying..."
                : mfaStep !== "none"
                  ? "Verify"
                  : loading
                    ? "Logging in..."
                    : "Sign In"}
            </Button>

            {mfaStep === "none" && (
              <div className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                {onSignUpClick ? (
                  <button
                    type="button"
                    onClick={onSignUpClick}
                    className={authLinkClassName}
                  >
                    Sign Up
                  </button>
                ) : (
                  <span className={authLinkClassName}>Sign Up</span>
                )}
              </div>
            )}
          </div>
        </form>
      )}

      {view === "forgot-password" && (
        <form onSubmit={handleForgot}>
          <div className="space-y-6">
            <p className="text-sm text-slate-600 text-center">
              Enter your email address and we&apos;ll send you a code to reset
              your password.
            </p>
            <div>
              <label htmlFor="reset-email" className={authLabelClassName}>
                Email Address
              </label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClassName}
              />
            </div>
            {displayError && (
              <p className="text-red-500 text-center text-sm">{displayError}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className={authPrimaryButtonClassName}
            >
              {loading ? "Sending Code..." : "Send Reset Code"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setView("login")
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="text-sm text-teal-700 hover:text-teal-600 hover:underline transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </form>
      )}

      {view === "reset-password" && (
        <form onSubmit={handleReset}>
          <div className="space-y-6">
            {displaySuccess && (
              <div className="p-3 bg-green-100 border border-green-200 text-green-700 rounded-md text-sm text-center">
                {displaySuccess}
              </div>
            )}
            <p className="text-sm text-slate-600 text-center">
              Enter the code sent to {email} and your new password.
            </p>
            <div>
              <label htmlFor="code" className={authLabelClassName}>
                Verification Code
              </label>
              <Input
                id="code"
                type="text"
                placeholder="Enter code"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className={authInputClassName}
              />
            </div>
            <div>
              <label htmlFor="new-password" className={authLabelClassName}>
                New Password
              </label>
              <PasswordInput
                id="new-password"
                placeholder="Enter new password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {displayError && (
              <p className="text-red-500 text-center text-sm">{displayError}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className={authPrimaryButtonClassName}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setView("login")
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="text-sm text-teal-700 hover:text-teal-600 hover:underline transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </form>
      )}
    </AuthPanel>
  )
}
