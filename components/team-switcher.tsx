"use client"

import * as React from "react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const activeTeam = teams[0]

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="pointer-events-none hover:bg-transparent"
        >
          <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-orange-500 text-white shadow-md shadow-teal-950/30">
            <activeTeam.logo className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-teal-50">
              {activeTeam.name}
            </span>
            {activeTeam.plan ? (
              <span className="truncate text-xs text-teal-200/80">
                {activeTeam.plan}
              </span>
            ) : null}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
