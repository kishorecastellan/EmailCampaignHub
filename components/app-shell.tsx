"use client"

import * as React from "react"
import { Suspense } from "react"
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signOut,
} from "aws-amplify/auth"
import { Hub } from "aws-amplify/utils"
import {
  LayoutDashboard,
  Send,
  Users,
  Target,
  FileText,
  Megaphone,
} from "lucide-react"
import { Loader } from "@/components/ui/loader"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationSection } from "@/components/notification-section"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const campaignNavItems = [
  {
    title: "Home",
    url: "/",
    icon: LayoutDashboard,
    iconClassName: "text-sky-300",
    iconBgClassName: "bg-sky-500/20",
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: Send,
    iconClassName: "text-orange-300",
    iconBgClassName: "bg-orange-500/20",
  },
  {
    title: "Segments",
    url: "/segments",
    icon: Target,
    iconClassName: "text-teal-300",
    iconBgClassName: "bg-teal-500/20",
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: Users,
    iconClassName: "text-cyan-300",
    iconBgClassName: "bg-cyan-500/20",
  },
  {
    title: "Templates",
    url: "/templates",
    icon: FileText,
    iconClassName: "text-emerald-300",
    iconBgClassName: "bg-emerald-500/20",
  },
]

type DisplayUser = {
  name: string
  email: string
  avatar: string
}

async function loadDisplayUser(): Promise<DisplayUser | null> {
  const session = await fetchAuthSession()
  if (!session.tokens?.accessToken) return null

  const current = await getCurrentUser()
  const attrs = await fetchUserAttributes().catch(() => ({} as Record<string, string>))
  const email =
    attrs.email ||
    current.signInDetails?.loginId ||
    current.username ||
    ""
  const name =
    attrs.given_name ||
    attrs.name ||
    (email.includes("@") ? email.split("@")[0] : "") ||
    current.username ||
    "User"

  return { name, email, avatar: "" }
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [displayUser, setDisplayUser] = React.useState<DisplayUser | null>(null)
  const [ready, setReady] = React.useState(false)

  const refreshUser = React.useCallback(async () => {
    try {
      const user = await loadDisplayUser()
      setDisplayUser(user)
    } catch {
      setDisplayUser(null)
    } finally {
      setReady(true)
    }
  }, [])

  React.useEffect(() => {
    void refreshUser()
    const unsub = Hub.listen("auth", ({ payload }) => {
      if (
        payload.event === "signedIn" ||
        payload.event === "signedOut" ||
        payload.event === "tokenRefresh"
      ) {
        void refreshUser()
      }
    })
    return () => unsub()
  }, [refreshUser])

  React.useEffect(() => {
    if (ready && !displayUser) {
      void signOut().catch(() => undefined)
    }
  }, [ready, displayUser])

  if (!ready || !displayUser) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f4f7f8]">
        <Loader
          size="lg"
          label={!ready ? "Loading workspace" : "Redirecting to sign in"}
        />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar
        role="admin"
        items={campaignNavItems}
        user={displayUser}
        brand={{
          name: "Campaign Hub",
          logo: Megaphone,
          plan: "Email Studio",
        }}
        onLogout={() => signOut()}
      />
      <SidebarInset className="bg-[#f4f7f8]">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-teal-900/10 bg-gradient-to-r from-[#0b3b3a] via-[#0f766e] to-[#ea580c] px-4 text-white shadow-sm">
          <SidebarTrigger className="-ml-1 text-white hover:bg-white/10 hover:text-white" />
          <Separator
            orientation="vertical"
            className="mr-1 h-6 bg-white/30"
          />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-wide">
                Email Campaign Hub
              </p>
              <p className="truncate text-xs text-teal-50/80">
                Plan, personalize, and send campaigns
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur sm:inline-flex">
                Outbound Studio
              </span>
              <NotificationSection />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[#f4f7f8]">
          <Loader size="lg" label="Loading workspace" />
        </div>
      }
    >
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  )
}
