"use client"

import { usePathname } from "next/navigation"
import ConfigureAmplifyClientSide from "@/app/ConfigureAmplifyClientSide"
import AuthWrapper from "@/app/AuthWrapper"
import { AppShell } from "@/components/app-shell"

const PUBLIC_PREFIXES = ["/unsubscribe"]

export function RootProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/"
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isPublic) {
    return (
      <>
        <ConfigureAmplifyClientSide />
        {children}
      </>
    )
  }

  return (
    <>
      <ConfigureAmplifyClientSide />
      <AuthWrapper>
        <AppShell>{children}</AppShell>
      </AuthWrapper>
    </>
  )
}
