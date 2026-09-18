"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export type FormFieldOption = {
  label: string
  value: string
}

export type FormField = {
  name: string
  label: string
  type?: "text" | "email" | "password" | "textarea" | "select"
  placeholder?: string
  required?: boolean
  defaultValue?: string
  disabled?: boolean
  options?: FormFieldOption[]
  helperText?: string
  maxLength?: number
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  pattern?: string
  digitsOnly?: boolean
}

export function CreateFormDialog({
  title,
  description,
  triggerLabel,
  fields,
  submitLabel = "Create",
  onSubmit,
  open: controlledOpen,
  onOpenChange,
  trigger,
  showPlusIcon = true,
  htmlPreviewField,
}: {
  title: string
  description?: string
  triggerLabel?: string
  fields: FormField[]
  submitLabel?: string
  onSubmit: (values: Record<string, string>) => Promise<void> | void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  showPlusIcon?: boolean
  htmlPreviewField?: string
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""]))
  )

  const hasWideContent = fields.some(
    (field) => field.type === "textarea" || field.type === "select"
  )
  const showHtmlPreview = Boolean(htmlPreviewField)
  const previewHtml = htmlPreviewField
    ? (values[htmlPreviewField] ?? "").trim()
    : ""

  React.useEffect(() => {
    if (open) {
      setError(null)
      setValues(
        Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""]))
      )
    }
  }, [open, fields])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(values)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const setValue = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const renderField = (field: FormField) => (
    <div key={field.name} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={field.name}>{field.label}</Label>
        {field.maxLength ? (
          <span className="text-[11px] text-muted-foreground">
            {(values[field.name] ?? "").length}/{field.maxLength}
          </span>
        ) : null}
      </div>
      {field.helperText ? (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      ) : null}
      {field.type === "textarea" ? (
        <Textarea
          id={field.name}
          name={field.name}
          placeholder={field.placeholder}
          required={field.required}
          disabled={field.disabled}
          maxLength={field.maxLength}
          value={values[field.name] ?? ""}
          onChange={(e) => setValue(field.name, e.target.value)}
          className={cn(
            "border-slate-200 font-mono text-xs focus-visible:border-teal-500 focus-visible:ring-teal-500/30",
            showHtmlPreview && field.name === htmlPreviewField
              ? "min-h-[320px] max-h-[50vh]"
              : "min-h-28 max-h-40"
          )}
        />
      ) : field.type === "select" ? (
        <select
          id={field.name}
          name={field.name}
          required={field.required}
          disabled={field.disabled}
          value={values[field.name] ?? ""}
          onChange={(e) => setValue(field.name, e.target.value)}
          className={cn(
            "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow]",
            "focus-visible:border-teal-500 focus-visible:ring-[3px] focus-visible:ring-teal-500/30",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <option value="" disabled>
            {field.placeholder || "Select an option"}
          </option>
          {(field.options ?? []).map((option) => (
            <option
              key={`${option.value}-${option.label}`}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={field.name}
          name={field.name}
          type={field.type ?? "text"}
          placeholder={field.placeholder}
          required={field.required}
          disabled={field.disabled}
          maxLength={field.maxLength}
          inputMode={field.inputMode}
          pattern={field.pattern}
          value={values[field.name] ?? ""}
          onChange={(e) => {
            const next = field.digitsOnly
              ? e.target.value.replace(/\D/g, "")
              : e.target.value
            setValue(
              field.name,
              field.maxLength ? next.slice(0, field.maxLength) : next
            )
          }}
          className="border-slate-200 focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
        />
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : triggerLabel ? (
        <DialogTrigger asChild>
          <Button className="bg-teal-700 hover:bg-teal-600">
            {showPlusIcon ? <Plus className="size-4" /> : null}
            {triggerLabel}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          showHtmlPreview
            ? "h-[calc(100vh-1rem)] max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-1rem)]"
            : hasWideContent
              ? "max-h-[85vh] sm:max-w-xl"
              : "max-h-[85vh] sm:max-w-md"
        )}
      >
        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex min-h-0 flex-col",
            showHtmlPreview ? "h-full" : "max-h-[85vh]"
          )}
        >
          <DialogHeader className="shrink-0 space-y-1.5 border-b border-slate-100 px-6 py-4 pr-12">
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {showHtmlPreview ? (
              <div className="grid h-full min-h-[520px] gap-4 lg:grid-cols-2">
                <div className="space-y-4">{fields.map(renderField)}</div>
                <div className="flex min-h-0 flex-col space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Live preview</Label>
                    <span className="text-xs text-muted-foreground">
                      Updates as you type
                    </span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-slate-200 bg-white">
                    {previewHtml ? (
                      <iframe
                        title="HTML template preview"
                        sandbox=""
                        srcDoc={previewHtml}
                        className="h-full min-h-[420px] w-full bg-white"
                      />
                    ) : (
                      <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                        Paste HTML on the left to preview the email.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              fields.map(renderField)
            )}

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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-teal-700 hover:bg-teal-600"
            >
              {loading ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
