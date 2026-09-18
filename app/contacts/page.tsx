"use client"

import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify/data/resource"
import { useState, useEffect, useMemo, type FormEvent } from "react"
import { UsersRound, Pencil, Trash2 } from "lucide-react"
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
import { CreateFormDialog } from "@/components/forms/create-form-dialog"
import { PageLoader } from "@/components/ui/page-loader"
import { cn } from "@/lib/utils"
import {
  ContactsArt,
  PageHero,
} from "@/components/illustrations/product-art"

const SUBSCRIPTION_OPTIONS = [
  { label: "Unsubscribed", value: "Unsubscribed" },
  { label: "Pending", value: "Pending" },
  { label: "Subscribed", value: "Subscribed" },
]

const MARKETING_CONTACT_OPTIONS = [
  { label: "Is marketing contact", value: "Is marketing contact" },
  { label: "Bounced", value: "Bounced" },
  { label: "Pending", value: "Pending" },
]

const PHONE_COUNTRY_CODES = [
  { label: "(+1) United States", value: "+1" },
  { label: "(+1) Canada", value: "+1-CA" },
  { label: "(+44) United Kingdom", value: "+44" },
  { label: "(+91) India", value: "+91" },
  { label: "(+61) Australia", value: "+61" },
  { label: "(+49) Germany", value: "+49" },
  { label: "(+33) France", value: "+33" },
  { label: "(+81) Japan", value: "+81" },
  { label: "(+86) China", value: "+86" },
  { label: "(+55) Brazil", value: "+55" },
  { label: "(+52) Mexico", value: "+52" },
  { label: "(+971) United Arab Emirates", value: "+971" },
  { label: "(+65) Singapore", value: "+65" },
  { label: "(+27) South Africa", value: "+27" },
  { label: "(+93) Afghanistan", value: "+93" },
  { label: "(+355) Albania", value: "+355" },
  { label: "(+213) Algeria", value: "+213" },
]

function StatusBadge({
  value,
  tone,
}: {
  value?: string | null
  tone: "green" | "red" | "orange" | "slate"
}) {
  if (!value) return <span className="text-muted-foreground">—</span>
  const tones = {
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-rose-100 text-rose-800",
    orange: "bg-orange-100 text-orange-800",
    slate: "bg-slate-100 text-slate-700",
  }
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone]
      )}
    >
      {value}
    </span>
  )
}

function subscriptionTone(value?: string | null) {
  if (value === "Subscribed" || value === "ACTIVE") return "green" as const
  if (value === "Unsubscribed" || value === "INACTIVE") return "red" as const
  if (value === "Pending") return "orange" as const
  return "slate" as const
}

function marketingTone(value?: string | null) {
  if (value === "Is marketing contact") return "green" as const
  if (value === "Bounced") return "orange" as const
  if (value === "Pending") return "slate" as const
  return "slate" as const
}

const client = generateClient<Schema>()

type Contact = Schema["Contact"]["type"]
type ContactGroup = Schema["ContactGroup"]["type"]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"contacts" | "groups">("contacts")
  const [groupOpen, setGroupOpen] = useState(false)
  const [savingGroup, setSavingGroup] = useState(false)
  const [groupError, setGroupError] = useState<string | null>(null)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editing, setEditing] = useState<Contact | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null)
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)

  useEffect(() => {
    const contactSub = client.models.Contact.observeQuery().subscribe({
      next: (data) => {
        setContacts([...data.items])
        setLoading(false)
      },
      error: (err) => {
        console.error("Contact observeQuery error", err)
        setLoading(false)
      },
    })
    const groupSub = client.models.ContactGroup.observeQuery().subscribe({
      next: (data) => setGroups([...data.items]),
      error: (err) => {
        console.error("ContactGroup observeQuery error", err)
        setGroups([])
      },
    })
    return () => {
      contactSub.unsubscribe()
      groupSub.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!groupOpen) return
    setGroupError(null)
    setSearch("")
    if (editingGroup) {
      setGroupName(editingGroup.name ?? "")
      setGroupDescription(editingGroup.description ?? "")
      setSelectedIds(
        (editingGroup.contactIds ?? []).filter(
          (id): id is string => Boolean(id)
        )
      )
      return
    }
    setGroupName("")
    setGroupDescription("")
    setSelectedIds([])
  }, [groupOpen, editingGroup])

  const contactFields = useMemo(
    () => [
      {
        name: "name",
        label: "Name",
        placeholder: "Full contact name",
        maxLength: 255,
      },
      {
        name: "firstName",
        label: "First name",
        placeholder: "Alex",
        required: true,
      },
      {
        name: "lastName",
        label: "Last name",
        placeholder: "Rivera",
        required: true,
      },
      {
        name: "companyName",
        label: "Company name",
        placeholder: "Acme Inc.",
      },
      {
        name: "email",
        label: "Email",
        type: "email" as const,
        placeholder: "alex@company.com",
        required: true,
      },
      {
        name: "phoneCountryCode",
        label: "Phone country code",
        type: "select" as const,
        placeholder: "Select country code",
        defaultValue: "+1",
        options: PHONE_COUNTRY_CODES,
      },
      {
        name: "phone",
        label: "Phone",
        placeholder: "5551234567",
        maxLength: 10,
        inputMode: "numeric" as const,
        pattern: "[0-9]{10}",
        digitsOnly: true,
        helperText: "Enter a 10-digit phone number.",
      },
      {
        name: "subscription",
        label: "Subscription",
        type: "select" as const,
        placeholder: "Select subscription",
        required: true,
        defaultValue: "Subscribed",
        options: SUBSCRIPTION_OPTIONS,
      },
      {
        name: "marketingContact",
        label: "Marketing contact",
        type: "select" as const,
        placeholder: "Select marketing status",
        required: true,
        defaultValue: "Is marketing contact",
        helperText:
          "By adding this contact, I confirm that I have a lawful basis to process and send marketing communications.",
        options: MARKETING_CONTACT_OPTIONS,
      },
    ],
    []
  )

  const editFields = useMemo(
    () =>
      contactFields.map((field) => {
        const value =
          field.name === "name"
            ? editing?.name ?? ""
            : field.name === "firstName"
              ? editing?.firstName ?? ""
              : field.name === "lastName"
                ? editing?.lastName ?? ""
                : field.name === "companyName"
                  ? editing?.companyName ?? ""
                  : field.name === "email"
                    ? editing?.email ?? ""
                    : field.name === "phoneCountryCode"
                      ? editing?.phoneCountryCode || "+1"
                      : field.name === "phone"
                        ? editing?.phone ?? ""
                        : field.name === "subscription"
                          ? editing?.subscription ||
                            (editing?.status === "ACTIVE"
                              ? "Subscribed"
                              : editing?.status === "INACTIVE"
                                ? "Unsubscribed"
                                : "Subscribed")
                          : field.name === "marketingContact"
                            ? editing?.marketingContact ||
                              "Is marketing contact"
                            : field.defaultValue ?? ""
        return { ...field, defaultValue: value }
      }),
    [contactFields, editing]
  )

  const buildContactPayload = (values: Record<string, string>) => {
    const firstName = values.firstName.trim()
    const lastName = values.lastName.trim()
    const displayName =
      values.name.trim() || [firstName, lastName].filter(Boolean).join(" ")
    const subscription = values.subscription
    const phoneCountryCode = values.phoneCountryCode
      .replace(/-CA$/, "")
      .trim()
    const phone = values.phone.replace(/\D/g, "").slice(0, 10)
    if (values.phone.trim() && phone.length !== 10) {
      throw new Error("Phone number must be exactly 10 digits.")
    }
    return {
      name: displayName || undefined,
      firstName,
      lastName,
      companyName: values.companyName.trim() || undefined,
      email: values.email.trim(),
      phoneCountryCode: phoneCountryCode || undefined,
      phone: phone || undefined,
      subscription: subscription || undefined,
      marketingContact: values.marketingContact || undefined,
      status: subscription === "Subscribed" ? "ACTIVE" : "INACTIVE",
    }
  }

  const handleCreateContact = async (values: Record<string, string>) => {
    const { errors } = await client.models.Contact.create(
      buildContactPayload(values)
    )
    if (errors?.length) {
      throw new Error(errors[0].message)
    }
  }

  const handleEditContact = async (values: Record<string, string>) => {
    if (!editing?.id) {
      throw new Error("Contact not found")
    }
    const { errors } = await client.models.Contact.update({
      id: editing.id,
      ...buildContactPayload(values),
    })
    if (errors?.length) {
      throw new Error(errors[0].message)
    }
    setEditing(null)
  }

  const handleDeleteContact = async (contact: Contact) => {
    if (!contact.id) return
    const label =
      contact.name ||
      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
      contact.email
    const confirmed = window.confirm(
      `Delete contact "${label}"? This removes them from DynamoDB and any groups.`
    )
    if (!confirmed) return

    setDeletingId(contact.id)
    try {
      for (const group of groups) {
        if (!group.id || !group.contactIds?.includes(contact.id)) continue
        const nextIds = (group.contactIds ?? []).filter(
          (id) => id && id !== contact.id
        )
        const { errors: groupErrors } = await client.models.ContactGroup.update(
          {
            id: group.id,
            contactIds: nextIds,
          }
        )
        if (groupErrors?.length) {
          throw new Error(groupErrors[0].message)
        }
      }

      const { errors } = await client.models.Contact.delete({
        id: contact.id,
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

  const contactById = useMemo(() => {
    const map = new Map<string, Contact>()
    contacts.forEach((contact) => {
      if (contact.id) map.set(contact.id, contact)
    })
    return map
  }, [contacts])

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return contacts
    return contacts.filter((contact) => {
      const haystack = [
        contact.name,
        contact.email,
        contact.firstName,
        contact.lastName,
        contact.companyName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [contacts, search])

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

  const closeGroupDialog = () => {
    setGroupOpen(false)
    setEditingGroup(null)
  }

  const openCreateGroup = () => {
    setEditingGroup(null)
    setGroupOpen(true)
  }

  const openEditGroup = (group: ContactGroup) => {
    setEditingGroup(group)
    setGroupOpen(true)
    setTab("groups")
  }

  const handleSubmitGroup = async (e: FormEvent) => {
    e.preventDefault()
    setSavingGroup(true)
    setGroupError(null)
    try {
      const name = groupName.trim()
      if (!name) {
        throw new Error("Group name is required")
      }
      if (selectedIds.length === 0) {
        throw new Error("Select at least one contact for this group")
      }

      if (editingGroup?.id) {
        const { errors } = await client.models.ContactGroup.update({
          id: editingGroup.id,
          name,
          description: groupDescription.trim() || undefined,
          contactIds: selectedIds,
        })
        if (errors?.length) {
          throw new Error(errors[0].message)
        }
      } else {
        const { errors } = await client.models.ContactGroup.create({
          name,
          description: groupDescription.trim() || undefined,
          contactIds: selectedIds,
        })
        if (errors?.length) {
          throw new Error(errors[0].message)
        }
      }
      closeGroupDialog()
      setTab("groups")
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSavingGroup(false)
    }
  }

  const handleDeleteGroup = async (group: ContactGroup) => {
    if (!group.id) return
    const confirmed = window.confirm(
      `Delete group "${group.name}"? Contacts stay in your list, but this group is removed.`
    )
    if (!confirmed) return

    setDeletingGroupId(group.id)
    try {
      const { errors } = await client.models.ContactGroup.delete({
        id: group.id,
      })
      if (errors?.length) {
        throw new Error(errors[0].message)
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeletingGroupId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Contacts"
        description="Manage subscribers and organize them into groups."
        tone="cyan"
        art={<ContactsArt />}
        actions={
          <>
            <Button
              variant="outline"
              className="border-teal-200 text-teal-800"
              onClick={openCreateGroup}
            >
              <UsersRound className="size-4" />
              Create group
            </Button>
            <CreateFormDialog
              title="New contact"
              description="Add a marketing contact with subscription details."
              triggerLabel="Add contact"
              fields={contactFields}
              submitLabel="Save"
              onSubmit={handleCreateContact}
            />
          </>
        }
      />

      <Dialog
            open={groupOpen}
            onOpenChange={(next) => {
              setGroupOpen(next)
              if (!next) setEditingGroup(null)
            }}
          >
            <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
              <form
                onSubmit={handleSubmitGroup}
                className="flex max-h-[85vh] min-h-0 flex-col"
              >
                <DialogHeader className="shrink-0 space-y-1.5 border-b border-slate-100 px-6 py-4 pr-12">
                  <DialogTitle>
                    {editingGroup ? "Edit contact group" : "Create contact group"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingGroup
                      ? "Update the group name and remapped contacts."
                      : "Add multiple contacts from your list into one group."}
                  </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Group name</Label>
                    <Input
                      id="group-name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Newsletter list"
                      required
                      className="border-slate-200 focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group-description">Description</Label>
                    <Textarea
                      id="group-description"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="What is this group for?"
                      className="min-h-20 max-h-28 border-slate-200 focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Contacts</Label>
                      <span className="text-xs text-muted-foreground">
                        {selectedIds.length} selected
                      </span>
                    </div>
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search contacts"
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
                          Select all
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {filteredContacts.length} shown
                        </span>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {contacts.length === 0 ? (
                          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                            No contacts yet. Add contacts first.
                          </p>
                        ) : filteredContacts.length === 0 ? (
                          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                            No contacts match your search.
                          </p>
                        ) : (
                          filteredContacts.map((contact) => {
                            const id = contact.id as string
                            const checked = selectedIds.includes(id)
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
                                </span>
                              </label>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {groupError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {groupError}
                    </p>
                  ) : null}
                </div>

                <DialogFooter className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeGroupDialog}
                    disabled={savingGroup}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingGroup}
                    className="bg-teal-700 hover:bg-teal-600"
                  >
                    {savingGroup
                      ? "Saving..."
                      : editingGroup
                        ? "Save changes"
                        : "Create group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("contacts")}
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab === "contacts"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          All contacts
        </button>
        <button
          type="button"
          onClick={() => setTab("groups")}
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab === "groups"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Groups
        </button>
      </div>

      {loading ? (
        <PageLoader label="Loading contacts" />
      ) : tab === "contacts" ? (
        <Card>
          <CardHeader>
            <CardTitle>All contacts</CardTitle>
            <CardDescription>
              People you can add into contact groups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>First name</TableHead>
                  <TableHead>Last name</TableHead>
                  <TableHead>Company name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Marketing contact</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No contacts yet. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => {
                    const displayName =
                      contact.name ||
                      [contact.firstName, contact.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                      contact.email
                    const phoneDisplay = [contact.phoneCountryCode, contact.phone]
                      .filter(Boolean)
                      .join(" ")
                    return (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {displayName}
                        </TableCell>
                        <TableCell>{contact.firstName || "—"}</TableCell>
                        <TableCell>{contact.lastName || "—"}</TableCell>
                        <TableCell>{contact.companyName || "—"}</TableCell>
                        <TableCell>
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-teal-700 hover:underline"
                          >
                            {contact.email}
                          </a>
                        </TableCell>
                        <TableCell>{phoneDisplay || "—"}</TableCell>
                        <TableCell>
                          <StatusBadge
                            value={contact.subscription || contact.status}
                            tone={subscriptionTone(
                              contact.subscription || contact.status
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            value={contact.marketingContact}
                            tone={marketingTone(contact.marketingContact)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                              onClick={() => {
                                setEditing(contact)
                                setEditOpen(true)
                              }}
                              aria-label={`Edit ${displayName}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              disabled={deletingId === contact.id}
                              onClick={() => handleDeleteContact(contact)}
                              aria-label={`Delete ${displayName}`}
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contact groups</CardTitle>
            <CardDescription>
              Groups of contacts ready for segments and campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No groups yet. Create one and add contacts.
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => {
                    const ids = (group.contactIds ?? []).filter(
                      (id): id is string => Boolean(id)
                    )
                    const memberPreview = ids
                      .slice(0, 3)
                      .map((id) => contactById.get(id)?.email ?? id)
                      .join(", ")
                    const extra =
                      ids.length > 3 ? ` +${ids.length - 3} more` : ""
                    return (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">
                          {group.name}
                        </TableCell>
                        <TableCell>{group.description || "—"}</TableCell>
                        <TableCell>{ids.length}</TableCell>
                        <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                          {memberPreview}
                          {extra}
                        </TableCell>
                        <TableCell>
                          {new Date(group.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                              onClick={() => openEditGroup(group)}
                              aria-label={`Edit ${group.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              disabled={deletingGroupId === group.id}
                              onClick={() => handleDeleteGroup(group)}
                              aria-label={`Delete ${group.name}`}
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

      <CreateFormDialog
        title="Edit contact"
        description="Update contact details and remap subscription status."
        fields={editFields}
        submitLabel="Save changes"
        showPlusIcon={false}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditing(null)
        }}
        onSubmit={handleEditContact}
      />
    </div>
  )
}
