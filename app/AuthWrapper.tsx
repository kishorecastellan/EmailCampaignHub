"use client"

import * as React from "react"
import {
  signIn,
  confirmSignIn,
  resetPassword,
  confirmResetPassword,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth"
import { Hub } from "aws-amplify/utils"
import { Authenticator } from "@aws-amplify/ui-react"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { Loader } from "@/components/ui/loader"

function AuthScreens({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<"login" | "signup">("login")
  const [authed, setAuthed] = React.useState<boolean | null>(null)

  const refreshAuth = React.useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      if (!session.tokens?.accessToken) {
        setAuthed(false)
        return
      }
      await getCurrentUser()
      setAuthed(true)
    } catch {
      setAuthed(false)
    }
  }, [])

  React.useEffect(() => {
    void refreshAuth()
    const unsub = Hub.listen("auth", ({ payload }) => {
      if (
        payload.event === "signedIn" ||
        payload.event === "signedOut" ||
        payload.event === "tokenRefresh" ||
        payload.event === "tokenRefresh_failure"
      ) {
        void refreshAuth()
      }
    })
    return () => unsub()
  }, [refreshAuth])

  if (authed === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f4f7f8]">
        <Loader size="lg" label="Preparing sign in" />
      </div>
    )
  }

  if (authed) {
    return <>{children}</>
  }

  return (
    <AuthPageShell brandTitle="Email Campaign Hub" mode={mode}>
      {mode === "login" ? (
        <LoginForm
          onSignIn={async ({ email, password }) => {
            try {
              const output = await signIn({ username: email, password })
              const step = output.nextStep?.signInStep
              if (step === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
                return { status: "mfa", method: "totp" }
              }
              if (step === "CONFIRM_SIGN_IN_WITH_SMS_CODE") {
                return { status: "mfa", method: "sms" }
              }
              if (String(step).includes("EMAIL_CODE")) {
                return { status: "mfa", method: "sms" }
              }
              if (output.isSignedIn) {
                await fetchAuthSession()
                setAuthed(true)
                return { status: "success" }
              }
              return { status: "error", message: "Additional verification required." }
            } catch (err) {
              return {
                status: "error",
                message:
                  err instanceof Error ? err.message : "Sign in failed.",
              }
            }
          }}
          onVerifyMfa={async ({ code }) => {
            try {
              const output = await confirmSignIn({ challengeResponse: code })
              if (output.isSignedIn) {
                await fetchAuthSession()
                setAuthed(true)
                return { status: "success" }
              }
              return { status: "error", message: "Verification incomplete." }
            } catch (err) {
              return {
                status: "error",
                message:
                  err instanceof Error ? err.message : "Verification failed.",
              }
            }
          }}
          onForgotPassword={async ({ email }) => {
            try {
              await resetPassword({ username: email })
              return {
                status: "success",
                message: "Reset code sent to your email.",
              }
            } catch (err) {
              return {
                status: "error",
                message:
                  err instanceof Error
                    ? err.message
                    : "Failed to send reset code.",
              }
            }
          }}
          onResetPassword={async ({ email, code, newPassword }) => {
            try {
              await confirmResetPassword({
                username: email,
                confirmationCode: code,
                newPassword,
              })
              return {
                status: "success",
                message: "Password reset successfully. Please sign in.",
              }
            } catch (err) {
              return {
                status: "error",
                message:
                  err instanceof Error
                    ? err.message
                    : "Failed to reset password.",
              }
            }
          }}
          onSignUpClick={() => setMode("signup")}
        />
      ) : (
        <SignupForm
          onSubmit={async ({ firstName, lastName, email, password }) => {
            try {
              const result = await signUp({
                username: email,
                password,
                options: {
                  userAttributes: {
                    email,
                    given_name: firstName,
                    family_name: lastName,
                  },
                },
              })
              if (result.isSignUpComplete) {
                return {
                  status: "confirmed",
                  message: "Account created. You can now sign in.",
                }
              }
              return {
                status: "needs_verification",
                message: "Check your email for a verification code.",
              }
            } catch (err) {
              return {
                status: "error",
                message:
                  err instanceof Error ? err.message : "Sign up failed.",
              }
            }
          }}
          onVerifyOtp={async ({ email, code }) => {
            try {
              await confirmSignUp({ username: email, confirmationCode: code })
              setMode("login")
              return {
                status: "success",
                message: "Email verified. Please sign in.",
              }
            } catch (err) {
              return {
                status: "error",
                message:
                  err instanceof Error
                    ? err.message
                    : "Verification failed.",
              }
            }
          }}
          onResendOtp={async ({ email }) => {
            try {
              await resendSignUpCode({ username: email })
              return {
                status: "success",
                message: "A new verification code has been sent.",
              }
            } catch (err) {
              return {
                status: "error",
                message:
                  err instanceof Error
                    ? err.message
                    : "Failed to resend code.",
              }
            }
          }}
          onSignInClick={() => setMode("login")}
        />
      )}
    </AuthPageShell>
  )
}

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Authenticator.Provider>
      <AuthScreens>{children}</AuthScreens>
    </Authenticator.Provider>
  )
}
