"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Amplify } from "aws-amplify"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify/data/resource"
import outputs from "@/amplify_outputs.json"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"

Amplify.configure(outputs, { ssr: true })

const client = generateClient<Schema>({ authMode: "apiKey" })

function UnsubscribeInner() {
  const searchParams = useSearchParams()
  const contactId = searchParams.get("contactId") || ""
  const campaignId = searchParams.get("campaignId") || ""
  const email = searchParams.get("email") || ""
  const actionParam = (searchParams.get("action") || "unsubscribe").toLowerCase()
  const action = actionParam === "subscribe" ? "subscribe" : "unsubscribe"

  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">(
    "idle"
  )
  const [message, setMessage] = React.useState("")

  const run = React.useCallback(async () => {
    if (!contactId) {
      setStatus("error")
      setMessage("Missing contact information.")
      return
    }
    setStatus("loading")
    try {
      const { data, errors } = await client.mutations.updateSubscriptionPreference({
        contactId,
        campaignId: campaignId || undefined,
        email: email || undefined,
        action,
      })
      if (errors?.length) {
        throw new Error(errors.map((e) => e.message).join(", "))
      }
      setStatus("done")
      setMessage(
        action === "unsubscribe"
          ? "You have been unsubscribed successfully."
          : "You have been subscribed successfully."
      )
      if (data) {
        console.log(data)
      }
    } catch (error) {
      setStatus("error")
      setMessage(
        error instanceof Error ? error.message : "Unable to update preference."
      )
    }
  }, [action, campaignId, contactId, email])

  React.useEffect(() => {
    void run()
  }, [run])

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#f4f7f8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Email preference
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {action === "unsubscribe"
            ? "Updating your unsubscribe request…"
            : "Updating your subscribe request…"}
        </p>
        <div className="mt-6">
          {status === "loading" || status === "idle" ? (
            <Loader size="md" label="Updating preference" />
          ) : (
            <p
              className={
                status === "done"
                  ? "text-sm text-emerald-700"
                  : "text-sm text-rose-700"
              }
            >
              {message}
            </p>
          )}
        </div>
        {status === "error" ? (
          <Button className="mt-4" onClick={() => void run()}>
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[#f4f7f8]">
          <Loader size="lg" label="Loading" />
        </div>
      }
    >
      <UnsubscribeInner />
    </React.Suspense>
  )
}
