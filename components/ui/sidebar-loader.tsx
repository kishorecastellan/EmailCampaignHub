"use client"

import { Loader } from "@/components/ui/loader"

export function SidebarLoader() {
  return (
    <div className="flex flex-col items-center justify-center px-3 py-12">
      <Loader size="md" label="Loading menu" />
    </div>
  )
}
