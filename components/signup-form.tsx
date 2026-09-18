"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  AuthPanel,
  authInputClassName,
  authLabelClassName,
  authLinkClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/auth-panel"
import { PasswordInput } from "@/components/auth/password-input"
import { OTPForm } from "@/components/otp-form"

export type SignupResult =
  | { status: "confirmed"; message?: string }
  | { status: "needs_verification"; message?: string }
  | { status: "error"; message: string }

export interface SignupFormProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  initialFirstName?: string
  initialLastName?: string
  initialEmail?: string
  initialGroup?: string
  initialProject?: string
  onSubmit: (payload: {
    firstName: string
    lastName: string
    email: string
    password: string
    group?: string
    project?: string
  }) => Promise<SignupResult> | SignupResult
  onSignInClick?: () => void
  onVerifyOtp: React.ComponentProps<typeof OTPForm>["onVerify"]
  onResendOtp: React.ComponentProps<typeof OTPForm>["onResend"]
  onOtpSuccess?: () => void
}

export function SignupForm({
  className,
  initialFirstName,
  initialLastName,
  initialEmail,
  initialGroup,
  initialProject,
  onSubmit,
  onSignInClick,
  onVerifyOtp,
  onResendOtp,
  onOtpSuccess,
  ...props
}: SignupFormProps) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null)
  const [firstName, setFirstName] = React.useState(initialFirstName || "")
  const [lastName, setLastName] = React.useState(initialLastName || "")
  const [emailValue, setEmailValue] = React.useState(initialEmail || "")
  const [group, setGroup] = React.useState(initialGroup || "")
  const [project, setProject] = React.useState(initialProject || "")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  React.useEffect(() => {
    if (initialFirstName) setFirstName(initialFirstName)
    if (initialLastName) setLastName(initialLastName)
    if (initialEmail) setEmailValue(initialEmail)
    if (initialGroup) setGroup(initialGroup)
    if (initialProject) setProject(initialProject)
  }, [
    initialFirstName,
    initialLastName,
    initialEmail,
    initialGroup,
    initialProject,
  ])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!firstName || !lastName) {
      setError("First Name and Last Name are required")
      setLoading(false)
      return
    }
    if (lastName.trim().length < 2) {
      setError("Last Name must be at least 2 characters long")
      setLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters long")
      setLoading(false)
      return
    }

    try {
      const result = await onSubmit({
        firstName,
        lastName,
        email: emailValue,
        password,
        group: group || undefined,
        project: project || undefined,
      })
      if (result.status === "error") {
        setError(result.message)
      } else if (result.status === "confirmed") {
        setSuccess(
          result.message ??
            "Account created and confirmed successfully! You can now sign in."
        )
      } else {
        setSuccess(
          result.message ?? "Signup successful! Check your email for verification."
        )
        setPendingEmail(emailValue)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  if (pendingEmail) {
    return (
      <OTPForm
        email={pendingEmail}
        group={group || undefined}
        onVerify={onVerifyOtp}
        onResend={onResendOtp}
        onSuccess={onOtpSuccess}
      />
    )
  }

  return (
    <AuthPanel title="Sign Up" className={cn(className)} {...props}>
      <form onSubmit={handleSubmit}>
        {group ? <input type="hidden" name="group" value={group} /> : null}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className={authLabelClassName}>
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                readOnly={!!initialFirstName}
                className={
                  initialFirstName
                    ? "bg-muted cursor-not-allowed"
                    : authInputClassName
                }
              />
            </div>
            <div>
              <label htmlFor="lastName" className={authLabelClassName}>
                Last Name
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                readOnly={!!initialLastName}
                className={
                  initialLastName
                    ? "bg-muted cursor-not-allowed"
                    : authInputClassName
                }
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className={authLabelClassName}>
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              autoComplete="username"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              readOnly={!!initialEmail}
              className={
                initialEmail ? "bg-muted cursor-not-allowed" : authInputClassName
              }
            />
          </div>

          <div>
            <label htmlFor="password" className={authLabelClassName}>
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 12 characters long.
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className={authLabelClassName}>
              Confirm Password
            </label>
            <PasswordInput
              id="confirm-password"
              name="confirm-password"
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          {success && (
            <p className="text-green-500 text-center text-sm">{success}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className={authPrimaryButtonClassName}
          >
            {loading ? "Creating..." : "Sign Up"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            {onSignInClick ? (
              <button
                type="button"
                onClick={onSignInClick}
                className={authLinkClassName}
              >
                Sign In
              </button>
            ) : (
              <span className={authLinkClassName}>Sign In</span>
            )}
          </div>
        </div>
      </form>
    </AuthPanel>
  )
}
