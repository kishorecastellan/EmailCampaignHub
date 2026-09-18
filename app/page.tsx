"use client"

import * as React from "react"
import Link from "next/link"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify/data/resource"
import {
  ArrowRight,
  FileText,
  Filter,
  Mail,
  MousePointerClick,
  Send,
  UserMinus,
  UserPlus,
  Users,
  Eye,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { cn } from "@/lib/utils"
import {
  HomeArt,
  ModuleMiniArt,
  PageHero,
} from "@/components/illustrations/product-art"

const client = generateClient<Schema>()

type Campaign = Schema["Campaign"]["type"]
type Contact = Schema["Contact"]["type"]

const modules = [
  {
    title: "Contacts",
    description: "Organize subscribers and attributes.",
    href: "/contacts",
    icon: Users,
    variant: "contacts" as const,
    tone: "bg-cyan-50 text-cyan-700",
  },
  {
    title: "Segments",
    description: "Filter audiences for each send.",
    href: "/segments",
    icon: Filter,
    variant: "segments" as const,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "Templates",
    description: "Design and preview HTML emails.",
    href: "/templates",
    icon: FileText,
    variant: "templates" as const,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Campaigns",
    description: "Launch and track email delivery.",
    href: "/campaigns",
    icon: Mail,
    variant: "campaigns" as const,
    tone: "bg-orange-50 text-orange-700",
  },
]

function sum(campaigns: Campaign[], key: keyof Campaign): number {
  return campaigns.reduce((total, campaign) => {
    const value = campaign[key]
    return total + (typeof value === "number" ? value : 0)
  }, 0)
}

export default function HomePage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const campaignSub = client.models.Campaign.observeQuery().subscribe({
      next: ({ items }) => setCampaigns([...items]),
    })
    const contactSub = client.models.Contact.observeQuery().subscribe({
      next: ({ items }) => {
        setContacts([...items])
        setLoading(false)
      },
    })
    return () => {
      campaignSub.unsubscribe()
      contactSub.unsubscribe()
    }
  }, [])

  const delivered = sum(campaigns, "deliveredCount")
  const opened = sum(campaigns, "openedCount")
  const clicked = sum(campaigns, "clickedCount")
  const unsubscribedEvents = sum(campaigns, "unsubscribedCount")
  const subscribedEvents = sum(campaigns, "subscribedCount")
  const subscribedContacts = contacts.filter((contact) => {
    const value = (contact.subscription || contact.status || "").toLowerCase()
    return value === "subscribed" || value === "active"
  }).length
  const unsubscribedContacts = contacts.filter((contact) => {
    const value = (contact.subscription || "").toLowerCase()
    return value === "unsubscribed"
  }).length

  const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0
  const clickRate = delivered > 0 ? Math.round((clicked / delivered) * 100) : 0

  const metrics = [
    {
      label: "Delivered",
      value: delivered,
      hint: "Successful inbox deliveries",
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      label: "Opened",
      value: opened,
      hint: `${openRate}% of delivered`,
      icon: Eye,
      tone: "bg-sky-50 text-sky-700 border-sky-100",
    },
    {
      label: "Clicked",
      value: clicked,
      hint: `${clickRate}% of delivered`,
      icon: MousePointerClick,
      tone: "bg-orange-50 text-orange-700 border-orange-100",
    },
    {
      label: "Subscribed",
      value: subscribedContacts,
      hint: `${subscribedEvents} preference events`,
      icon: UserPlus,
      tone: "bg-teal-50 text-teal-700 border-teal-100",
    },
    {
      label: "Unsubscribed",
      value: unsubscribedContacts,
      hint: `${unsubscribedEvents} preference events`,
      icon: UserMinus,
      tone: "bg-rose-50 text-rose-700 border-rose-100",
    },
  ]

  const recentCampaigns = [...campaigns]
    .sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return bTime - aTime
    })
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-2">
      <PageHero
        title="Pleasant email marketing from one calm workspace"
        description="Create audiences, design templates, and send campaigns with clear visuals and a smooth flow for every teammate."
        tone="teal"
        art={<HomeArt />}
        actions={
          <>
            <Button asChild size="sm" className="bg-teal-700 hover:bg-teal-600">
              <Link href="/campaigns">
                Start campaign
                <Send className="size-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-teal-200 bg-white text-teal-800 hover:bg-teal-50"
            >
              <Link href="/templates">
                Browse templates
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Engagement dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Delivery, opens, clicks, and subscription changes across campaigns.
            </p>
          </div>
          {loading ? <Loader size="sm" label="Syncing" /> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                "rounded-2xl border bg-white p-4 shadow-sm",
                metric.tone
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  {metric.label}
                </p>
                <metric.icon className="size-4 opacity-80" />
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{metric.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Campaign performance
          </h2>
          <p className="text-sm text-muted-foreground">
            Latest campaigns with delivered, open, click, and unsubscribe counts.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Delivered</th>
                  <th className="px-4 py-3 font-semibold">Opened</th>
                  <th className="px-4 py-3 font-semibold">Clicked</th>
                  <th className="px-4 py-3 font-semibold">Unsub</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No campaign metrics yet. Send a campaign to start tracking.
                    </td>
                  </tr>
                ) : (
                  recentCampaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {campaign.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {campaign.status}
                      </td>
                      <td className="px-4 py-3">{campaign.deliveredCount || 0}</td>
                      <td className="px-4 py-3">{campaign.openedCount || 0}</td>
                      <td className="px-4 py-3">{campaign.clickedCount || 0}</td>
                      <td className="px-4 py-3">
                        {campaign.unsubscribedCount || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Quick modules
          </h2>
          <p className="text-sm text-muted-foreground">
            Compact cards with a unique illustration for each area.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
            >
              <div className="h-24 overflow-hidden p-2">
                <ModuleMiniArt variant={item.variant} />
              </div>
              <div className="space-y-2 px-3.5 pb-3.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-lg",
                      item.tone
                    )}
                  >
                    <item.icon className="size-3.5" />
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-slate-500">
                  {item.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
                  Open
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-teal-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:px-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Ready when you are
          </h2>
          <p className="text-sm text-muted-foreground">
            Open campaigns to pair a segment with a template and send.
          </p>
        </div>
        <Button asChild size="sm" className="bg-teal-700 hover:bg-teal-600">
          <Link href="/campaigns">
            Go to campaigns
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </section>
    </div>
  )
}
