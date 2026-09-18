"use client"

import * as React from "react"
import { CheckCircle2, Copy, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"

export interface AdminMfaSetupProps extends React.ComponentProps<"div"> {
  secret?: string | null
  qrImageUrl?: string | null
  issuerLabel?: string
  loading?: boolean
  error?: string | null
  done?: boolean
  onConfirm: (code: string) => Promise<void> | void
  onCopySecret?: () => void
}

export function AdminMfaSetup({
  secret,
  qrImageUrl,
  loading = false,
  error = null,
  done = false,
  onConfirm,
  onCopySecret,
  className,
  ...props
}: AdminMfaSetupProps) {
  const [verifyCode, setVerifyCode] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const displayError = error ?? localError

  const handleCopy = () => {
    if (!secret) return
    void navigator.clipboard.writeText(secret)
    setCopied(true)
    onCopySecret?.()
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setLocalError("Enter the 6-digit code from your app.")
      return
    }
    setLocalError(null)
    setSubmitting(true)
    try {
      await onConfirm(verifyCode)
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : "Verification failed. Check the code and try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-slate-50 p-4",
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-700" />
            Admin MFA setup
          </CardTitle>
          <CardDescription>
            Multi-factor authentication is required for admin accounts. Set up an
            authenticator app (e.g. Google Authenticator, Authy).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {displayError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {displayError}
            </div>
          )}

          {done ? (
            <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm text-center">
              MFA setup complete.
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  1. Scan QR code or add key manually
                </p>
                {qrImageUrl && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-lg border shadow-sm">
                      <img
                        src={qrImageUrl}
                        alt="MFA QR Code"
                        className="w-44 h-44"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Manual entry key:</p>
                  <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-md font-mono text-sm break-all">
                    {secret ?? "Unable to load secret."}
                    {secret && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={handleCopy}
                        aria-label="Copy secret"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  2. Verify setup
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verifyCode}
                    onChange={setVerifyCode}
                  >
                    <InputOTPGroup className="gap-1">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full bg-teal-700 hover:bg-teal-600 text-white"
                  disabled={loading || submitting || verifyCode.length !== 6}
                  onClick={handleVerify}
                >
                  {loading || submitting ? "Confirming..." : "Confirm"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
