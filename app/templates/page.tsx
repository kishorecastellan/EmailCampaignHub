"use client"

import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify/data/resource"
import { useState, useEffect, useMemo } from "react"
import { Pencil, Trash2 } from "lucide-react"
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
import { CreateFormDialog } from "@/components/forms/create-form-dialog"
import { PageLoader } from "@/components/ui/page-loader"
import {
  PageHero,
  TemplatesArt,
} from "@/components/illustrations/product-art"

const client = generateClient<Schema>()

type Template = Schema["EmailTemplateMetadata"]["type"]

function toSesTemplateName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const sub = client.models.EmailTemplateMetadata.observeQuery().subscribe({
      next: (data) => {
        setTemplates([...data.items])
        setLoading(false)
      },
      error: () => setLoading(false),
    })
    return () => sub.unsubscribe()
  }, [])

  const createFields = useMemo(
    () => [
      {
        name: "templateName",
        label: "Template name",
        placeholder: "Welcome-email",
        required: true,
      },
      {
        name: "subject",
        label: "Subject line",
        placeholder: "Welcome aboard",
        required: true,
      },
      {
        name: "htmlContent",
        label: "HTML content",
        type: "textarea" as const,
        placeholder: "<p>Hello {{name}}</p>",
        required: true,
        defaultValue: "<p>Hello {{name}}</p>",
      },
    ],
    []
  )

  const editFields = useMemo(
    () => [
      {
        name: "templateName",
        label: "Template name",
        placeholder: "Welcome-email",
        required: true,
        defaultValue: editing?.templateName ?? "",
      },
      {
        name: "subject",
        label: "Subject line",
        placeholder: "Welcome aboard",
        required: true,
        defaultValue: editing?.subject ?? "",
      },
      {
        name: "htmlContent",
        label: "HTML content",
        type: "textarea" as const,
        placeholder: "<p>Hello {{name}}</p>",
        required: true,
        defaultValue: editing?.htmlContent ?? "",
      },
    ],
    [editing]
  )

  const handleCreate = async (values: Record<string, string>) => {
    const name = values.templateName.trim()
    const sesTemplateName = toSesTemplateName(name)
    if (!sesTemplateName) {
      throw new Error(
        "Template name must include letters, numbers, '_' or '-' for SES."
      )
    }

    const { data: sesResult, errors: sesErrors } =
      await client.mutations.createSesTemplate({
        templateName: sesTemplateName,
        subject: values.subject.trim(),
        htmlContent: values.htmlContent,
      })
    if (sesErrors?.length) {
      throw new Error(sesErrors[0].message)
    }
    if (!sesResult) {
      throw new Error("Failed to create SES template")
    }

    const { errors } = await client.models.EmailTemplateMetadata.create({
      templateName: name,
      subject: values.subject.trim(),
      sesTemplateName,
      htmlContent: values.htmlContent,
    })
    if (errors?.length) {
      throw new Error(errors[0].message)
    }
  }

  const handleEdit = async (values: Record<string, string>) => {
    if (!editing?.id) {
      throw new Error("Template not found")
    }

    const name = values.templateName.trim()
    const sesTemplateName = editing.sesTemplateName
    const subject = values.subject.trim()
    const htmlContent = values.htmlContent

    const { data: sesResult, errors: sesErrors } =
      await client.mutations.updateSesTemplate({
        templateName: sesTemplateName,
        subject,
        htmlContent,
      })
    if (sesErrors?.length) {
      throw new Error(sesErrors[0].message)
    }
    if (!sesResult) {
      throw new Error("Failed to update SES template")
    }

    const { errors } = await client.models.EmailTemplateMetadata.update({
      id: editing.id,
      templateName: name,
      subject,
      sesTemplateName,
      htmlContent,
    })
    if (errors?.length) {
      throw new Error(errors[0].message)
    }

    setEditing(null)
  }

  const handleDelete = async (template: Template) => {
    if (!template.id) return
    const confirmed = window.confirm(
      `Delete template "${template.templateName}"? This removes it from SES and DynamoDB.`
    )
    if (!confirmed) return

    setDeletingId(template.id)
    try {
      const { errors: sesErrors } = await client.mutations.deleteSesTemplate({
        templateName: template.sesTemplateName,
      })
      if (sesErrors?.length) {
        throw new Error(sesErrors[0].message)
      }

      const { errors } = await client.models.EmailTemplateMetadata.delete({
        id: template.id,
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

  return (
    <div className="space-y-6">
      <PageHero
        title="Templates"
        description="Design reusable email templates for campaigns."
        tone="emerald"
        art={<TemplatesArt />}
        actions={
          <CreateFormDialog
            title="Create template"
            description="Save HTML in DynamoDB and publish the SES template."
            triggerLabel="Create template"
            fields={createFields}
            htmlPreviewField="htmlContent"
            onSubmit={handleCreate}
          />
        }
      />

      {loading ? (
        <PageLoader label="Loading templates" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All templates</CardTitle>
            <CardDescription>
              Templates available for campaign sends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template name</TableHead>
                  <TableHead>Template key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No templates yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.templateName}
                      </TableCell>
                      <TableCell>{template.sesTemplateName}</TableCell>
                      <TableCell>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                            onClick={() => {
                              setEditing(template)
                              setEditOpen(true)
                            }}
                            aria-label={`Edit ${template.templateName}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            disabled={deletingId === template.id}
                            onClick={() => handleDelete(template)}
                            aria-label={`Delete ${template.templateName}`}
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

      <CreateFormDialog
        title="Edit template"
        description="Update DynamoDB HTML and remap the SES template body."
        fields={editFields}
        submitLabel="Save changes"
        showPlusIcon={false}
        htmlPreviewField="htmlContent"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditing(null)
        }}
        onSubmit={handleEdit}
      />
    </div>
  )
}
