"use client"

import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify/data/resource"
import { useState, useEffect, useMemo, type FormEvent } from "react"
import { Check, Circle, Loader2, Maximize2, Pencil, Plus, Send, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageLoader } from "@/components/ui/page-loader"
import { cn } from "@/lib/utils"
import {
  CampaignsArt,
  PageHero,
} from "@/components/illustrations/product-art"

const client = generateClient<Schema>()

type Campaign = Schema["Campaign"]["type"]
type Segment = Schema["Segment"]["type"]
type Template = Schema["EmailTemplateMetadata"]["type"]

type SendStage = "confirm" | "preparing" | "sending" | "success" | "error"

type SendProgressState = {
  campaign: Campaign
  contactCount: number
  useQueue: boolean
  stage: SendStage
  message: string
}

const SEND_STEPS = [
  { id: "preparing", label: "Preparing" },
  { id: "sending", label: "Sending" },
  { id: "success", label: "Sent" },
] as const

function sendStepIndex(stage: SendStage): number {
  if (stage === "confirm" || stage === "preparing") return 0
  if (stage === "sending") return 1
  if (stage === "success") return 2
  return -1
}

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-teal-500 focus-visible:ring-[3px] focus-visible:ring-teal-500/30"
)

function parseSegmentContactCount(criteria: unknown): number {
  let value = criteria
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return 0
    }
  }
  if (!value || typeof value !== "object") return 0
  const ids = (value as { contactIds?: unknown }).contactIds
  return Array.isArray(ids) ? ids.filter(Boolean).length : 0
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sendProgress, setSendProgress] = useState<SendProgressState | null>(
    null
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [segmentId, setSegmentId] = useState("")
  const [previewExpanded, setPreviewExpanded] = useState(false)

  useEffect(() => {
    const campaignSub = client.models.Campaign.observeQuery().subscribe({
      next: (data) => {
        setCampaigns([...data.items])
        setLoading(false)
      },
      error: () => setLoading(false),
    })
    const templateSub = client.models.EmailTemplateMetadata.observeQuery().subscribe({
      next: (data) => setTemplates([...data.items]),
    })
    const segmentSub = client.models.Segment.observeQuery().subscribe({
      next: (data) => setSegments([...data.items]),
    })
    return () => {
      campaignSub.unsubscribe()
      templateSub.unsubscribe()
      segmentSub.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setError(null)
    setPreviewExpanded(false)
    if (editing) {
      setName(editing.name ?? "")
      setDescription(editing.description ?? "")
      setSubject(editing.subject ?? "")
      setTemplateId(editing.templateId ?? "")
      setSegmentId(editing.segmentId ?? "")
      return
    }
    setName("")
    setDescription("")
    setSubject("")
    setTemplateId("")
    setSegmentId("")
  }, [open, editing])

  const templateById = useMemo(() => {
    const map = new Map<string, Template>()
    templates.forEach((template) => {
      if (template.id) map.set(template.id, template)
    })
    return map
  }, [templates])

  const segmentById = useMemo(() => {
    const map = new Map<string, Segment>()
    segments.forEach((segment) => {
      if (segment.id) map.set(segment.id, segment)
    })
    return map
  }, [segments])

  const selectedTemplate = templateId
    ? templateById.get(templateId) ?? null
    : null

  const handleTemplateChange = (nextTemplateId: string) => {
    setTemplateId(nextTemplateId)
    const template = templateById.get(nextTemplateId)
    if (template?.subject) {
      setSubject(template.subject)
    }
  }

  const closeDialog = () => {
    setOpen(false)
    setEditing(null)
    setPreviewExpanded(false)
  }

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (campaign: Campaign) => {
    setEditing(campaign)
    setOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error("Campaign name is required")
      }
      if (!templateId) {
        throw new Error("Select an email template")
      }
      if (!segmentId) {
        throw new Error("Select a segment")
      }

      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
        subject: subject.trim() || selectedTemplate?.subject || undefined,
        templateId,
        segmentId,
      }

      if (editing?.id) {
        const { errors } = await client.models.Campaign.update({
          id: editing.id,
          ...payload,
        })
        if (errors?.length) {
          throw new Error(errors[0].message)
        }
      } else {
        const { errors } = await client.models.Campaign.create({
          ...payload,
          status: "DRAFT",
        })
        if (errors?.length) {
          throw new Error(errors[0].message)
        }
      }
      closeDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (campaign: Campaign) => {
    if (!campaign.id) return
    const confirmed = window.confirm(
      `Delete campaign "${campaign.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(campaign.id)
    try {
      const { errors } = await client.models.Campaign.delete({
        id: campaign.id,
      })
      if (errors?.length) {
        throw new Error(errors[0].message)
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSend = (campaign: Campaign) => {
    if (!campaign.id) return
    if (!campaign.templateId) {
      setSendProgress({
        campaign,
        contactCount: 0,
        useQueue: false,
        stage: "error",
        message: "Select an email template before sending.",
      })
      return
    }
    if (!campaign.segmentId) {
      setSendProgress({
        campaign,
        contactCount: 0,
        useQueue: false,
        stage: "error",
        message: "Select a segment before sending.",
      })
      return
    }
    if (campaign.status === "SENDING") {
      setSendProgress({
        campaign,
        contactCount: 0,
        useQueue: false,
        stage: "error",
        message: "This campaign is already sending.",
      })
      return
    }

    const segment = segmentById.get(campaign.segmentId)
    const contactCount = segment
      ? parseSegmentContactCount(segment.criteria)
      : 0

    setSendProgress({
      campaign,
      contactCount,
      useQueue: contactCount > 25,
      stage: "confirm",
      message: "",
    })
  }

  const closeSendProgress = () => {
    if (sendProgress?.stage === "preparing" || sendProgress?.stage === "sending") {
      return
    }
    setSendProgress(null)
    setSendingId(null)
  }

  const confirmSendCampaign = async () => {
    if (!sendProgress?.campaign.id || !sendProgress.campaign.segmentId) return

    const campaign = sendProgress.campaign
    setSendingId(campaign.id)
    setSendProgress((prev) =>
      prev
        ? {
            ...prev,
            stage: "preparing",
            message: "Validating template, segment, and contacts…",
          }
        : prev
    )

    await new Promise((resolve) => setTimeout(resolve, 650))

    setSendProgress((prev) =>
      prev
        ? {
            ...prev,
            stage: "sending",
            message: prev.useQueue
              ? "Queueing emails for delivery…"
              : "Sending emails…",
          }
        : prev
    )

    try {
      const { data, errors } = await client.mutations.startCampaign({
        campaignId: campaign.id,
        segmentId: campaign.segmentId as string,
      })
      if (errors?.length) {
        throw new Error(errors[0].message)
      }

      await new Promise((resolve) => setTimeout(resolve, 350))

      setSendProgress((prev) =>
        prev
          ? {
              ...prev,
              stage: "success",
              message:
                data ||
                (prev.useQueue
                  ? `Queued ${prev.contactCount} emails successfully.`
                  : `Sent ${prev.contactCount} emails successfully.`),
            }
          : prev
      )
    } catch (err) {
      setSendProgress((prev) =>
        prev
          ? {
              ...prev,
              stage: "error",
              message:
                err instanceof Error ? err.message : "Failed to send campaign",
            }
          : prev
      )
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Campaigns"
        description="Create campaigns with a template, segment, and live preview."
        tone="orange"
        art={<CampaignsArt />}
        actions={
          <Button
            className="bg-teal-700 hover:bg-teal-600"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            Create campaign
          </Button>
        }
      />
      <Dialog
          open={open}
          onOpenChange={(next) => {
            if (!next) closeDialog()
            else setOpen(true)
          }}
        >
          <DialogContent className="flex h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-1rem)]">
            <form
              onSubmit={handleSubmit}
              className="flex h-full min-h-0 flex-col"
            >
              {previewExpanded ? (
                <>
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-6 py-3 pr-12">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        Template preview
                        {selectedTemplate?.templateName
                          ? ` · ${selectedTemplate.templateName}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fit to screen view
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewExpanded(false)}
                    >
                      <X className="size-4" />
                      Close preview
                    </Button>
                  </div>
                  <div className="min-h-0 flex-1 bg-slate-50 p-4">
                    <div className="h-full overflow-hidden rounded-md border border-slate-200 bg-white">
                      {selectedTemplate?.htmlContent ? (
                        <iframe
                          title="Email template preview fullscreen"
                          sandbox=""
                          srcDoc={selectedTemplate.htmlContent}
                          className="h-full w-full bg-white"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                          Select a template to preview its HTML.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <DialogHeader className="shrink-0 space-y-1.5 border-b border-slate-100 px-6 py-4 pr-12">
                    <DialogTitle>
                      {editing ? "Edit campaign" : "Create campaign"}
                    </DialogTitle>
                    <DialogDescription>
                      Select an email template and segment, then preview the HTML
                      before saving.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                    <div className="grid h-full min-h-[560px] gap-4 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="campaign-name">Campaign name</Label>
                          <Input
                            id="campaign-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Spring promo"
                            required
                            className="border-slate-200 focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="campaign-description">
                            Description
                          </Label>
                          <Textarea
                            id="campaign-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional notes about this campaign"
                            className="min-h-20 max-h-28 border-slate-200 focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="campaign-template">
                            Email template
                          </Label>
                          <select
                            id="campaign-template"
                            value={templateId}
                            onChange={(e) =>
                              handleTemplateChange(e.target.value)
                            }
                            required
                            className={selectClassName}
                          >
                            <option value="" disabled>
                              Select a template
                            </option>
                            {templates.map((template) => (
                              <option
                                key={template.id}
                                value={template.id as string}
                              >
                                {template.templateName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="campaign-segment">Segment</Label>
                          <select
                            id="campaign-segment"
                            value={segmentId}
                            onChange={(e) => setSegmentId(e.target.value)}
                            required
                            className={selectClassName}
                          >
                            <option value="" disabled>
                              Select a segment
                            </option>
                            {segments.map((segment) => (
                              <option
                                key={segment.id}
                                value={segment.id as string}
                              >
                                {segment.name} (
                                {parseSegmentContactCount(segment.criteria)}{" "}
                                contacts)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="campaign-subject">Email subject</Label>
                          <Input
                            id="campaign-subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Don't miss this update"
                            className="border-slate-200 focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
                          />
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-col space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label>Template preview</Label>
                          <div className="flex min-w-0 items-center gap-2">
                            {selectedTemplate ? (
                              <span className="truncate text-xs text-muted-foreground">
                                {selectedTemplate.templateName}
                              </span>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!selectedTemplate?.htmlContent}
                              onClick={() => setPreviewExpanded(true)}
                            >
                              <Maximize2 className="size-4" />
                              Fit to screen
                            </Button>
                          </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-slate-200 bg-white">
                          {selectedTemplate?.htmlContent ? (
                            <iframe
                              title="Email template preview"
                              sandbox=""
                              srcDoc={selectedTemplate.htmlContent}
                              className="h-full min-h-[420px] w-full bg-white"
                            />
                          ) : (
                            <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                              {templates.length === 0
                                ? "No templates yet. Create one first."
                                : "Select a template to preview its HTML."}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {error ? (
                      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                      </p>
                    ) : null}
                  </div>

                  <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeDialog}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-teal-700 hover:bg-teal-600"
                    >
                      {saving
                        ? "Saving..."
                        : editing
                          ? "Save changes"
                          : "Create campaign"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </form>
          </DialogContent>
        </Dialog>

      {loading ? (
        <PageLoader label="Loading campaigns" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent campaigns</CardTitle>
            <CardDescription>
              Draft and sent campaigns in your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Unsub</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No campaigns yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        {campaign.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{campaign.status}</Badge>
                      </TableCell>
                      <TableCell>{campaign.deliveredCount || 0}</TableCell>
                      <TableCell>{campaign.openedCount || 0}</TableCell>
                      <TableCell>{campaign.clickedCount || 0}</TableCell>
                      <TableCell>{campaign.unsubscribedCount || 0}</TableCell>
                      <TableCell>
                        {campaign.templateId
                          ? templateById.get(campaign.templateId)
                              ?.templateName || campaign.templateId
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {campaign.segmentId
                          ? segmentById.get(campaign.segmentId)?.name ||
                            campaign.segmentId
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                            disabled={
                              sendingId === campaign.id ||
                              campaign.status === "SENDING" ||
                              !campaign.templateId ||
                              !campaign.segmentId
                            }
                            onClick={() => handleSend(campaign)}
                            aria-label={`Send ${campaign.name}`}
                            title="Send email"
                          >
                            {sendingId === campaign.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Send className="size-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                            onClick={() => openEdit(campaign)}
                            aria-label={`Edit ${campaign.name}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            disabled={deletingId === campaign.id}
                            onClick={() => handleDelete(campaign)}
                            aria-label={`Delete ${campaign.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={Boolean(sendProgress)}
        onOpenChange={(next) => {
          if (!next) closeSendProgress()
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          {sendProgress ? (
            <div className="space-y-5 px-6 py-5">
              <DialogHeader className="space-y-1.5 pr-8 text-left">
                <DialogTitle>
                  {sendProgress.stage === "confirm"
                    ? "Send campaign"
                    : sendProgress.stage === "success"
                      ? "Campaign sent"
                      : sendProgress.stage === "error"
                        ? "Send failed"
                        : "Sending campaign"}
                </DialogTitle>
                <DialogDescription>
                  {sendProgress.campaign.name}
                  {sendProgress.contactCount > 0
                    ? ` · ${sendProgress.contactCount} contacts`
                    : ""}
                </DialogDescription>
              </DialogHeader>

              {sendProgress.stage !== "confirm" &&
              sendProgress.stage !== "error" ? (
                <div className="animate-send-step-in space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    {SEND_STEPS.map((step, index) => {
                      const activeIndex = sendStepIndex(sendProgress.stage)
                      const done =
                        activeIndex > index ||
                        sendProgress.stage === "success"
                      const active = activeIndex === index
                      return (
                        <div
                          key={step.id}
                          className="flex flex-1 flex-col items-center gap-2"
                        >
                          <div
                            className={cn(
                              "relative flex size-9 items-center justify-center rounded-full border transition-all duration-300",
                              done
                                ? "border-teal-600 bg-teal-600 text-white"
                                : active
                                  ? "border-teal-500 bg-teal-50 text-teal-700"
                                  : "border-slate-200 bg-white text-slate-400"
                            )}
                          >
                            {done ? (
                              <Check className="size-4 animate-send-check-pop" />
                            ) : active ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Circle className="size-3.5" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-xs font-medium transition-colors duration-300",
                              done || active
                                ? "text-teal-800"
                                : "text-slate-400"
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      key={sendProgress.stage}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 animate-send-progress-fill",
                        sendProgress.stage === "preparing" && "w-1/3",
                        sendProgress.stage === "sending" && "w-2/3",
                        sendProgress.stage === "success" && "w-full"
                      )}
                    />
                  </div>
                </div>
              ) : null}

              {sendProgress.stage === "confirm" ? (
                <div className="animate-send-step-in space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {sendProgress.useQueue
                      ? `This segment has ${sendProgress.contactCount} contacts. Emails will be queued for delivery.`
                      : `Send this campaign to ${sendProgress.contactCount || "segment"} contacts.`}
                  </div>
                  <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeSendProgress}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="bg-teal-700 hover:bg-teal-600"
                      onClick={confirmSendCampaign}
                    >
                      <Send className="size-4" />
                      Start sending
                    </Button>
                  </DialogFooter>
                </div>
              ) : null}

              {sendProgress.stage === "preparing" ||
              sendProgress.stage === "sending" ? (
                <div className="animate-send-step-in flex flex-col items-center gap-3 py-2 text-center">
                  <div className="relative flex size-16 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border border-teal-200 animate-send-ring-pulse" />
                    <Loader2 className="size-8 animate-spin text-teal-700" />
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {sendProgress.stage === "preparing"
                      ? "In progress"
                      : "Sending"}
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {sendProgress.message}
                  </p>
                </div>
              ) : null}

              {sendProgress.stage === "success" ? (
                <div className="animate-send-step-in flex flex-col items-center gap-3 py-2 text-center">
                  <div className="relative flex size-16 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-teal-100 animate-send-ring-pulse" />
                    <div className="relative flex size-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm animate-send-check-pop">
                      <Check className="size-7" strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-teal-800">
                    Successfully sent
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {sendProgress.message}
                  </p>
                  <DialogFooter className="w-full sm:justify-center">
                    <Button
                      type="button"
                      className="bg-teal-700 hover:bg-teal-600"
                      onClick={closeSendProgress}
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </div>
              ) : null}

              {sendProgress.stage === "error" ? (
                <div className="animate-send-step-in space-y-4">
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {sendProgress.message}
                  </p>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeSendProgress}
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
