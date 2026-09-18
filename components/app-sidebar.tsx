"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Table,
  Folder,
  User,
  Users,
  Wallet,
  Package,
  Car,
  Edit,
  Shield,
  SquareTerminal,
  LayoutDashboard,
  UserPlus,
  Grid3x3,
  FileText,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SidebarLoader } from "@/components/ui/sidebar-loader"

export type AppSidebarRole = "admin" | "superagent" | "agent" | "applicant"
export type AppSidebarMode = "view" | "edit" | "new" | null
export type ApplicationType = "standard" | "recertification"

const phase1Steps = [
  { title: "Introduction", step: 1, icon: FileText },
  { title: "Applicant Details", step: 2, icon: User },
  { title: "Household Members", step: 3, icon: Users },
  { title: "Income and Verification", step: 4, icon: Wallet },
]

const phase2Steps = [
  { title: "Assets & Verification", step: 5, icon: Package },
  { title: "General Information", step: 6, icon: Car },
  { title: "Applicant Amendment", step: 7, icon: Edit },
  { title: "Supporting Documents", step: 8, icon: Folder },
  { title: "Privacy", step: 9, icon: Shield },
]

const recertSteps = [
  { title: "Instructions", step: 1, icon: FileText },
  { title: "Applicant Details", step: 2, icon: User },
  { title: "Household Information", step: 3, icon: Users },
  { title: "Household Income", step: 4, icon: Wallet },
  { title: "Household Asset", step: 5, icon: Package },
]

export function AppSidebar({
  role = "applicant",
  mode = null,
  applicationType,
  showPhase2,
  applicantStatus,
  user = { name: "User", email: "", avatar: "" },
  brand = {
    name: "Email Campaign Hub",
    logo: SquareTerminal,
    plan: "",
  },
  items,
  onNavigateToApplication,
  onLogout,
  onNavigate,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  role?: AppSidebarRole
  mode?: AppSidebarMode
  applicationType?: ApplicationType
  showPhase2?: boolean
  applicantStatus?: string | null
  user?: { name: string; email: string; avatar: string }
  brand?: { name: string; logo: LucideIcon; plan?: string }
  items?: {
    id?: string
    title: string
    url: string
    navigateUrl?: string
    icon?: LucideIcon
    iconClassName?: string
    iconBgClassName?: string
    isActive?: boolean
    items?:
      | { title: string; url: string }[]
      | { phase: string; items: { title: string; url: string }[] }[]
  }[]
  onNavigateToApplication?: () => void
  onLogout?: () => void | Promise<void>
  onNavigate?: (url: string) => void
}) {
  const [isPageLoading, setIsPageLoading] = React.useState(true)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prevPathnameRef = React.useRef<string | null>(null)
  const pendingPathRef = React.useRef<string | null>(null)
  const navTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearNavTimeout = React.useCallback(() => {
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current)
      navTimeoutRef.current = null
    }
  }, [])

  const getPathBase = React.useCallback((url: string) => {
    try {
      if (url.startsWith("http")) return new URL(url).pathname
      return url.split("?")[0].split("#")[0] || "/"
    } catch {
      return url.split("?")[0].split("#")[0] || "/"
    }
  }, [])

  React.useEffect(() => {
    const onSidebarNavigate = (event: Event) => {
      const custom = event as CustomEvent<{ url?: string }>
      const targetUrl = custom.detail?.url
      if (!targetUrl) return
      const targetPath = getPathBase(targetUrl)
      if (targetPath === (pathname || "/")) return
      pendingPathRef.current = targetPath
      setIsPageLoading(true)
      clearNavTimeout()
      navTimeoutRef.current = setTimeout(() => {
        pendingPathRef.current = null
        setIsPageLoading(false)
      }, 2500)
      onNavigate?.(targetUrl)
    }
    window.addEventListener("sidebar:navigate", onSidebarNavigate as EventListener)
    return () => {
      window.removeEventListener(
        "sidebar:navigate",
        onSidebarNavigate as EventListener
      )
      clearNavTimeout()
    }
  }, [pathname, getPathBase, clearNavTimeout, onNavigate])

  React.useEffect(() => {
    if (prevPathnameRef.current === null) {
      const timer = setTimeout(() => {
        setIsPageLoading(false)
        prevPathnameRef.current = pathname
      }, 200)
      return () => clearTimeout(timer)
    }
    const pending = pendingPathRef.current
    if (pending && pathname === pending) {
      clearNavTimeout()
      navTimeoutRef.current = setTimeout(() => {
        pendingPathRef.current = null
        setIsPageLoading(false)
        prevPathnameRef.current = pathname
      }, 180)
      return () => clearNavTimeout()
    }
    if (!pending && prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
    }
  }, [pathname, clearNavTimeout])

  const currentStep = React.useMemo(() => {
    const stepParam = searchParams?.get("step")
    if (!stepParam) return null
    const stepNum = parseInt(stepParam, 10)
    return !isNaN(stepNum) && stepNum >= 1 && stepNum <= 9 ? stepNum : null
  }, [searchParams])

  const isRecertification =
    applicationType === "recertification" ||
    searchParams?.get("type") === "Re-Certification"

  const navMain = React.useMemo(() => {
    if (items) return items

    const baseUrl = pathname?.startsWith("/admin")
      ? "/admin/dashboard"
      : pathname?.startsWith("/superagent")
        ? "/superagent/dashboard"
        : "/dashboard"

    let filteredStepFormItems:
      | { phase: string; items: { title: string; url: string }[] }[]
      | undefined

    if (mode) {
      const normalizedStatus = applicantStatus
        ? String(applicantStatus).toLowerCase().trim()
        : ""
      const isPhase2Accessible =
        showPhase2 === true ||
        normalizedStatus === "phase 1 approved" ||
        normalizedStatus === "phase 2 pending" ||
        normalizedStatus === "phase 2 draft" ||
        normalizedStatus === "submitted" ||
        (currentStep !== null && currentStep >= 5)

      if (isRecertification) {
        filteredStepFormItems = [
          {
            phase: "Phase 1",
            items: recertSteps.map((item) => ({
              title: item.title,
              url: `${baseUrl}?type=Re-Certification&step=${item.step}`,
            })),
          },
        ]
      } else if (isPhase2Accessible) {
        filteredStepFormItems = [
          {
            phase: "Phase 1",
            items: phase1Steps.map((item) => ({
              title: item.title,
              url: `${baseUrl}?step=${item.step}`,
            })),
          },
          {
            phase: "Phase 2",
            items: phase2Steps.map((item) => ({
              title: item.title,
              url: `${baseUrl}?step=${item.step}`,
            })),
          },
        ]
      } else {
        filteredStepFormItems = [
          {
            phase: "Phase 1",
            items: phase1Steps.map((item) => ({
              title: item.title,
              url: `${baseUrl}?step=${item.step}`,
            })),
          },
        ]
      }
    }

    return [
      ...(role === "superagent"
        ? [
            {
              title: "Superagent Dashboard",
              url: "/superagent/dashboard",
              icon: LayoutDashboard,
            },
          ]
        : []),
      ...(role === "admin"
        ? [
            {
              title: "Admin Dashboard",
              url: "/admin/dashboard",
              icon: LayoutDashboard,
            },
            { title: "Users", url: "/users", icon: UserPlus },
            {
              title: "Eligibility Matrices",
              url: "/admin/eligibility-matrices",
              icon: Grid3x3,
            },
            {
              title: "Documents",
              url: "/admin/documents",
              icon: FileText,
            },
            {
              title: "Auth Failures",
              url: "/admin/auth-failures",
              icon: ShieldAlert,
            },
          ]
        : []),
      {
        id: "application",
        title: "Application",
        url: "/dashboard",
        navigateUrl:
          role === "admin" || role === "superagent" ? "/dashboard" : baseUrl,
        icon: Table,
        items: mode ? filteredStepFormItems : undefined,
      },
      ...(role === "admin"
        ? [{ title: "Property", url: "/projects", icon: Folder }]
        : []),
      {
        title: "Required Documents",
        url: "/required-documents",
        icon: Folder,
      },
    ]
  }, [
    items,
    mode,
    role,
    applicantStatus,
    pathname,
    currentStep,
    isRecertification,
    showPhase2,
  ])

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <TeamSwitcher
            teams={[
              {
                name: brand.name,
                logo: brand.logo,
                plan: brand.plan ?? "",
              },
            ]}
          />
        </SidebarHeader>
        <SidebarContent>
          {isPageLoading ? (
            <SidebarLoader />
          ) : (
            <NavMain
              items={navMain}
              mode={mode}
              onApplicationNavigate={onNavigateToApplication}
            />
          )}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} onLogout={onLogout} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  )
}
