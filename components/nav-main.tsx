"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { InlineLoader } from "@/components/ui/loader"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  mode,
  onApplicationNavigate,
}: {
  items: {
    id?: string
    title: string
    url: string
    navigateUrl?: string
    icon?: LucideIcon
    iconClassName?: string
    iconBgClassName?: string
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[] | {
      phase: string
      items: {
        title: string
        url: string
      }[]
    }[]
  }[]
  mode?: "view" | "edit" | "new" | null
  onApplicationNavigate?: () => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Track open state for Application menu - auto-expand when form is open
  const [isApplicationOpen, setIsApplicationOpen] = useState(() => {
    // Initialize based on mode
    return mode ? true : false
  })

  // Track open state for User Guide menu - auto-expand when on user-guide page
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(() => {
    return pathname === "/user-guide"
  })

  // Update open state when mode changes
  useEffect(() => {
    if (mode) {
      setIsApplicationOpen(true)
    } else {
      // Close the menu when form is closed
      setIsApplicationOpen(false)
    }
  }, [mode])

  // Update User Guide open state when pathname changes
  useEffect(() => {
    setIsUserGuideOpen(pathname === "/user-guide")
  }, [pathname])


  const notifySidebarNavigation = (url: string) => {
    if (typeof window === "undefined") return
    window.dispatchEvent(
      new CustomEvent("sidebar:navigate", {
        detail: { url, timestamp: new Date().toISOString() },
      })
    )
  }

  const isItemActive = (url: string): boolean => {
    try {
      const hasQuery = url.includes("?")
      const base = url.split("?")[0]

      // ✅ Check if pathname matches the base URL
      // Normalize: /dashboard, /admin/dashboard, /dashboard/table should all match correctly
      const pathnameMatches = pathname === base

      if (!pathnameMatches) {
        return false
      }

      // ✅ Check if this is a step item (has ?step= parameter)
      const isStepItem = url.includes("?step=")

      // If no query params in URL, check if current URL has no step or step=1
      if (!hasQuery) {
        const stepParam = searchParams?.get("step")
        return !stepParam || stepParam === "1"
      }

      // Parse query parameters from both URL and current search params
      const targetParams = new URLSearchParams(url.split("?")[1])
      const currentStepParam = searchParams?.get("step")
      const targetStepParam = targetParams.get("step")

      // ✅ For step items, step parameter is the PRIMARY determinant
      // Other query params (mode, id, userId) are secondary and can differ
      if (isStepItem && targetStepParam) {
        // For step items, only compare the step parameter
        if (currentStepParam) {
          // Both have step params - they must match exactly
          return targetStepParam === currentStepParam
        } else {
          // Target has step but current doesn't - only match if step is 1
          return targetStepParam === "1"
        }
      }

      // ✅ Special handling for step=1: treat no step param as step 1
      // This ensures "Introduction" (step=1) is active when URL is /dashboard (no step param)
      if (targetStepParam === "1" && !currentStepParam) {
        // Check if all other params match (if any)
        let allMatch = true
        targetParams.forEach((value, key) => {
          if (key !== "step" && searchParams?.get(key) !== value) {
            allMatch = false
          }
        })
        return allMatch
      }

      // ✅ For non-step items, compare all query parameters
      let allMatch = true
      targetParams.forEach((value, key) => {
        if (searchParams?.get(key) !== value) {
          allMatch = false
        }
      })

      return allMatch
    } catch {
      return false
    }
  }

  // Check if an item is a step form step (non-clickable)
  const isStepItem = (url: string): boolean => {
    return url.includes("?step=")
  }

  // Type guard to check if items are grouped by phases
  const isPhaseGrouped = (items: any): items is { phase: string; items: { title: string; url: string }[] }[] => {
    return Array.isArray(items) && items.length > 0 && typeof items[0] === 'object' && 'phase' in items[0]
  }

  const renderIcon = (
    item: {
      icon?: LucideIcon
      iconClassName?: string
      iconBgClassName?: string
    },
    active = false
  ) => {
    if (!item.icon) return null
    const Icon = item.icon
    return (
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-md ${
          active
            ? "bg-white/20 text-white"
            : item.iconBgClassName || "bg-teal-500/15"
        }`}
      >
        <Icon
          className={`size-4 ${
            active ? "text-white" : item.iconClassName || "text-teal-200"
          }`}
        />
      </span>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-teal-200/70">
        Campaign workspace
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isStep = isStepItem(item.url)
          return (
            <SidebarMenuItem key={item.title}>
              {item.items && item.items.length > 0 ? (
                <Collapsible
                  asChild
                  open={
                    (item.id === "application" || item.title === "Application")
                      ? isApplicationOpen
                      : (item.id === "user-guide" || item.title === "User Guide")
                        ? isUserGuideOpen
                        : (mode ? true : isItemActive(item.url))
                  }
                  onOpenChange={
                    (item.id === "application" || item.title === "Application")
                      ? setIsApplicationOpen
                      : (item.id === "user-guide" || item.title === "User Guide")
                        ? setIsUserGuideOpen
                        : undefined
                  }
                  className="group/collapsible"
                >
                  <div>
                    {(item.id === "application" || item.title === "Application") && mode ? (
                      // When form is open, split behavior: label navigates, chevron toggles
                      <div className="flex items-center w-full">
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isItemActive(item.url)}
                          className={`flex-1 ${isItemActive(item.url)
                            ? "text-white bg-teal-600 hover:bg-teal-500"
                            : "hover:bg-teal-800/50"
                            }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Close the collapsible menu immediately
                            setIsApplicationOpen(false)
                            if (onApplicationNavigate) {
                              onApplicationNavigate()
                            } else {
                              const cleanUrl = item.navigateUrl ?? item.url
                              if (typeof window !== 'undefined') {
                                window.history.replaceState({}, '', cleanUrl)
                              }
                              router.push(cleanUrl, { scroll: false })
                            }
                            notifySidebarNavigation(item.url)
                          }}
                        >
                          {renderIcon(item, isItemActive(item.url))}
                          <span className="flex items-center gap-2">
                            {item.title}
                            {isItemActive(item.url) && <InlineLoader className="border-white/40 border-t-white" />}
                          </span>
                        </SidebarMenuButton>
                        <CollapsibleTrigger asChild>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          >
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </button>
                        </CollapsibleTrigger>
                      </div>
                    ) : (
                      // Default behavior - collapsible trigger
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isItemActive(item.url)}
                          className={
                            isItemActive(item.url)
                              ? "text-white bg-teal-600 hover:bg-teal-500"
                              : "hover:bg-teal-800/50"
                          }
                        >
                          {renderIcon(item, isItemActive(item.url))}
                          <span className="flex items-center gap-2">
                            {item.title}
                            {isItemActive(item.url) && <InlineLoader className="border-white/40 border-t-white" />}
                          </span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    )}
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items && item.items.length > 0 && (
                          // Check if items are grouped by phases (Application menu)
                          (item.id === "application" || item.title === "Application") && mode && isPhaseGrouped(item.items) ? (
                            // Render grouped phases
                            item.items.map((phaseGroup) => (
                              <div key={phaseGroup.phase}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  {phaseGroup.phase}
                                </div>
                                {phaseGroup.items.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                      isActive={isItemActive(subItem.url)}
                                      className={`${isItemActive(subItem.url)
                                        ? "!text-white bg-[#3F51B5]"
                                        : ""
                                        } ${mode === "view" ? "cursor-pointer" : "cursor-default"}`}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        if (mode === "view") {
                                          // Preserve current query parameters (id, userId, mode) while updating step
                                          const params = new URLSearchParams(
                                            searchParams?.toString() ?? ""
                                          )
                                          const subItemUrl = new URL(subItem.url, window.location.origin)
                                          const stepParam = subItemUrl.searchParams.get("step")

                                          if (stepParam) {
                                            params.set("step", stepParam)
                                          } else {
                                            params.delete("step")
                                          }

                                          router.push(`${pathname}?${params.toString()}`)
                                        }
                                      }}
                                    >
                                      <span>{subItem.title}</span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </div>
                            ))
                          ) : (
                            // Render flat list (for other menus)
                            (item.items as { title: string; url: string }[]).map((subItem) => {
                              const isTocItem = (item.id === "user-guide" || item.title === "User Guide") && subItem.url.includes("#")
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    isActive={isItemActive(subItem.url)}
                                    className={`${isItemActive(subItem.url)
                                      ? "text-white bg-teal-600"
                                      : "hover:bg-teal-800/50"
                                      } ${isTocItem ? "cursor-pointer" : "cursor-default"}`}
                                    onClick={(e) => {
                                      if (isTocItem) {
                                        e.preventDefault()
                                        const hash = subItem.url.split("#")[1]
                                        if (hash) {
                                          const element = document.getElementById(hash)
                                          if (element) {
                                            // Account for fixed header (64px = 16 * 4 = h-16)
                                            const headerOffset = 64
                                            const elementPosition = element.getBoundingClientRect().top
                                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

                                            window.scrollTo({
                                              top: offsetPosition,
                                              behavior: "smooth"
                                            })
                                          }
                                        }
                                      } else {
                                        e.preventDefault()
                                      }
                                    }}
                                  >
                                    <span>{subItem.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })
                          )
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ) : (
                isStep ? (
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isItemActive(item.url)}
                    className={`${
                      isItemActive(item.url)
                        ? "text-white bg-teal-600"
                        : "hover:bg-teal-800/50"
                    } cursor-default`}
                    onClick={(e) => e.preventDefault()}
                  >
                    {renderIcon(item, isItemActive(item.url))}
                    <span className="flex items-center gap-2">
                      {item.title}
                      {isItemActive(item.url) && (
                        <InlineLoader className="border-white/40 border-t-white" />
                      )}
                    </span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isItemActive(item.url)}
                    className={
                      isItemActive(item.url)
                        ? "text-white bg-teal-600 hover:bg-teal-500"
                        : "hover:bg-teal-800/50"
                    }
                    onClick={(e) => {
                      e.preventDefault()
                      const targetUrl = item.navigateUrl ?? item.url
                      notifySidebarNavigation(targetUrl)
                      router.push(targetUrl)
                    }}
                  >
                    {renderIcon(item, isItemActive(item.url))}
                    <span className="flex items-center gap-2">
                      {item.title}
                      {isItemActive(item.url) && (
                        <InlineLoader className="border-white/40 border-t-white" />
                      )}
                    </span>
                  </SidebarMenuButton>
                )
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
