"use client"

import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify/data/resource"
import { useState, useEffect, useMemo, type FormEvent } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
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
  PageHero,
  SegmentsArt,
} from "@/components/illustrations/product-art"

const client = generateClient<Schema>()

type Contact = Schema["Contact"]["type"]
type ContactGroup = Schema["ContactGroup"]["type"]
type Segment = Schema["Segment"]["type"]

type SegmentCriteria = {
  groupId?: string
  groupName?: string
  subscription?: string
  marketingContact?: string
  contactIds: string[]
}

const SUBSCRIPTION_FILTERS = [
  { label: "All subscriptions", value: "all" },
  { label: "Subscribed", value: "Subscribed" },
  { label: "Unsubscribed", value: "Unsubscribed" },
  { label: "Pending", value: "Pending" },
]

const MARKETING_FILTERS = [
  { label: "All marketing statuses", value: "all" },
  { label: "Is marketing contact", value: "Is marketing contact" },
  { label: "Bounced", value: "Bounced" },
  { label: "Pending", value: "Pending" },
]

const selectClassName = cn(
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
  "focus-visible:border-teal-500 focus-visible:ring-[3px] focus-visible:ring-teal-500/30"
)

function parseCriteria(criteria: unknown): SegmentCriteria {
  let value = criteria
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return { contactIds: [] }
    }
  }
  if (!value || typeof value !== "object") return { contactIds: [] }
  const parsed = value as SegmentCriteria
  return {
    groupId: parsed.groupId,
    groupName: parsed.groupName,
    subscription: parsed.subscription,
    marketingContact: parsed.marketingContact,
    contactIds: Array.isArray(parsed.contactIds)
      ? parsed.contactIds.filter(Boolean)
      : [],
  }
}

function getSubscriptionValue(contact: Contact) {
  if (contact.subscription) return contact.subscription
  if (contact.status === "ACTIVE") return "Subscribed"
  if (contact.status === "INACTIVE") return "Unsubscribed"
  return ""
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Segment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [groupId, setGroupId] = useState("")
  const [subscriptionFilter, setSubscriptionFilter] = useState("all")
  const [marketingFilter, setMarketingFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    const segmentSub = client.models.Segment.observeQuery().subscribe({
      next: (data) => {
        setSegments([...data.items])
        setLoading(false)
      },
      error: () => setLoading(false),
    })
    const contactSub = client.models.Contact.observeQuery().subscribe({
      next: (data) => setContacts([...data.items]),
    })
    const groupSub = client.models.ContactGroup.observeQuery().subscribe({
      next: (data) => setGroups([...data.items]),
    })
    return () => {
      segmentSub.unsubscribe()
      contactSub.unsubscribe()
      groupSub.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setError(null)
    setSearch("")
    if (editing) {
      const criteria = parseCriteria(editing.criteria)
      setName(editing.name ?? "")
      setDescription(editing.description ?? "")
      setGroupId(criteria.groupId ?? "")
      setSubscriptionFilter(criteria.subscription ?? "all")
      setMarketingFilter(criteria.marketingContact ?? "all")
      setSelectedIds(criteria.contactIds)
      return
    }
    setName("")
    setDescription("")
    setGroupId("")
    setSubscriptionFilter("all")
    setMarketingFilter("all")
    setSelectedIds([])
  }, [open, editing])

  const contactById = useMemo(() => {
    const map = new Map<string, Contact>()
    contacts.forEach((contact) => {
      if (contact.id) map.set(contact.id, contact)
    })
    return map
  }, [contacts])

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === groupId) ?? null,
    [groups, groupId]
  )

  const groupContacts = useMemo(() => {
    if (!selectedGroup) return []
    return (selectedGroup.contactIds ?? [])
      .filter((id): id is string => Boolean(id))
      .map((id) => contactById.get(id))
      .filter((contact): contact is Contact => Boolean(contact))
  }, [selectedGroup, contactById])

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return groupContacts.filter((contact) => {
      const subscription = getSubscriptionValue(contact)
      const marketing = contact.marketingContact || ""
      if (
        subscriptionFilter !== "all" &&
        subscription !== subscriptionFilter
      ) {
        return false
      }
      if (marketingFilter !== "all" && marketing !== marketingFilter) {
        return false
      }
      if (!query) return true
      const haystack = [
        contact.name,
        contact.email,
        contact.firstName,
        contact.lastName,
        contact.companyName,
        subscription,
        marketing,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [groupContacts, search, subscriptionFilter, marketingFilter])

  const allFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((contact) =>
      selectedIds.includes(contact.id as string)
    )

  const toggleContact = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleAllFiltered = () => {
    const ids = filteredContacts
      .map((contact) => contact.id)
      .filter((id): id is string => Boolean(id))
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      return
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])))
  }

  const closeDialog = () => {
    setOpen(false)
    setEditing(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error("Segment name is required")
      }
      if (!groupId || !selectedGroup) {
        throw new Error("Select a contact group first")
      }
      if (selectedIds.length === 0) {
        throw new Error(
          "Select at least one contact matching the subscription/marketing filters"
        )
      }

      const criteria = JSON.stringify({
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        subscription: subscriptionFilter,
        marketingContact: marketingFilter,
        contactIds: selectedIds,
      } satisfies SegmentCriteria)

      if (editing?.id) {
        const { errors } = await client.models.Segment.update({
          id: editing.id,
          name: trimmedName,
          description: description.trim() || undefined,
          criteria,
        })
        if (errors?.length) {
          throw new Error(errors[0].message)
        }
      } else {
        const { errors } = await client.models.Segment.create({
          name: trimmedName,
          description: description.trim() || undefined,
          criteria,
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

  const handleDelete = async (segment: Segment) => {
    if (!segment.id) return
    const confirmed = window.confirm(
      `Delete segment "${segment.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(segment.id)
    try {
      const { errors } = await client.models.Segment.delete({
        id: segment.id,
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

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (segment: Segment) => {
    setEditing(segment)
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Segments"
        description="Build audiences from a contact group using subscription and marketing filters."
        tone="teal"
        art={<SegmentsArt />}
        actions={
          <Button
            className="bg-teal-700 hover:bg-teal-600"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            Create segment
          </Button>
        }
      />
      <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) setEditing(null)
          }}
        >
          <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
            <form
              onSubmit={handleSubmit}
              className="flex max-h-[85vh] min-h-0 flex-col"
            >
              <DialogHeader className="shrink-0 space-y-1.5 border-b border-slate-100 px-6 py-4 pr-12">
                <DialogTitle>
                  {editing ? "Edit segment" : "Create segment"}
                </DialogTitle>
                <DialogDescription>
                  Choose a contact group, filter by attributes, then select
                  contacts.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="segment-name">Segment name</Label>
                  <Input
                    id="segment-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Active subscribers"
                    required
                    className="border-slate-200 focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segment-description">Description</Label>
                  <Textarea
                    id="segment-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Who belongs in this audience?"
                    className="min-h-20 max-h-28 border-slate-200 focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segment-group">Contact group</Label>
                  <select
                    id="segment-group"
                    value={groupId}
                    onChange={(e) => {
                      setGroupId(e.target.value)
                      setSelectedIds([])
                    }}
                    required
                    className={selectClassName}
                  >
                    <option value="" disabled>
                      Select a contact group
                    </option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id as string}>
                        {group.name} ({(group.contactIds ?? []).length}{" "}
                        contacts)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subscription-filter">Subscription</Label>
                    <select
                      id="subscription-filter"
                      value={subscriptionFilter}
                      onChange={(e) => setSubscriptionFilter(e.target.value)}
                      disabled={!groupId}
                      className={selectClassName}
                    >
                      {SUBSCRIPTION_FILTERS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marketing-filter">Marketing contact</Label>
                    <select
                      id="marketing-filter"
                      value={marketingFilter}
                      onChange={(e) => setMarketingFilter(e.target.value)}
                      disabled={!groupId}
                      className={selectClassName}
                    >
                      {MARKETING_FILTERS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Contacts in group</Label>
                    <span className="text-xs text-muted-foreground">
                      {selectedIds.length} selected
                    </span>
                  </div>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search filtered contacts"
                    disabled={!groupId}
                    className="border-slate-200 focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
                  />
                  <div className="overflow-hidden rounded-md border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleAllFiltered}
                          disabled={filteredContacts.length === 0}
                          className="size-4 rounded border-slate-300 accent-teal-700"
                        />
                        Select all filtered
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {filteredContacts.length} shown
                      </span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {!groupId ? (
                        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                          Select a contact group to load its contacts.
                        </p>
                      ) : groups.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                          No contact groups yet. Create a group first.
                        </p>
                      ) : groupContacts.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                          This group has no contacts.
                        </p>
                      ) : filteredContacts.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                          No contacts match the selected filters.
                        </p>
                      ) : (
                        filteredContacts.map((contact) => {
                          const id = contact.id as string
                          const checked = selectedIds.includes(id)
                          const subscription = getSubscriptionValue(contact)
                          const marketing = contact.marketingContact || "—"
                          return (
                            <label
                              key={id}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0 hover:bg-teal-50/40",
                                checked && "bg-teal-50/60"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleContact(id)}
                                className="mt-0.5 size-4 rounded border-slate-300 accent-teal-700"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-slate-900">
                                  {contact.email}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {[contact.firstName, contact.lastName]
                                    .filter(Boolean)
                                    .join(" ") || "No name"}
                                </span>
                                <span className="mt-1 flex flex-wrap gap-1.5">
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                    {subscription || "No subscription"}
                                  </span>
                                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-800">
                                    {marketing}
                                  </span>
                                </span>
                              </span>
                            </label>
                          )
                        })
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
                      : "Create segment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      {loading ? (
        <PageLoader label="Loading segments" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All segments</CardTitle>
            <CardDescription>
              Audience groups available for targeting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No segments yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  segments.map((segment) => {
                    const criteria = parseCriteria(segment.criteria)
                    const filters = [
                      criteria.subscription &&
                      criteria.subscription !== "all"
                        ? `Sub: ${criteria.subscription}`
                        : null,
                      criteria.marketingContact &&
                      criteria.marketingContact !== "all"
                        ? `Mkt: ${criteria.marketingContact}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                    return (
                      <TableRow key={segment.id}>
                        <TableCell className="font-medium">
                          {segment.name}
                        </TableCell>
                        <TableCell>{criteria.groupName || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {filters || "All attributes"}
                        </TableCell>
                        <TableCell>{criteria.contactIds.length}</TableCell>
                        <TableCell>
                          {new Date(segment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                              onClick={() => openEdit(segment)}
                              aria-label={`Edit ${segment.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              disabled={deletingId === segment.id}
                              onClick={() => handleDelete(segment)}
                              aria-label={`Delete ${segment.name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
