"use client"

import * as React from "react"
import {
  Bell,
  CheckCheck,
  Mail,
  Send,
  Users,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type NotificationItem = {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  icon: React.ElementType
  iconClassName: string
  iconBgClassName: string
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Campaign sent",
    description: "Spring Promo finished sending to 2,480 contacts.",
    time: "2m ago",
    read: false,
    icon: Send,
    iconClassName: "text-orange-600",
    iconBgClassName: "bg-orange-50",
  },
  {
    id: "2",
    title: "New subscribers",
    description: "34 contacts joined the Newsletter segment.",
    time: "18m ago",
    read: false,
    icon: Users,
    iconClassName: "text-cyan-700",
    iconBgClassName: "bg-cyan-50",
  },
  {
    id: "3",
    title: "Template approved",
    description: "Welcome Series email is ready to use.",
    time: "1h ago",
    read: false,
    icon: Mail,
    iconClassName: "text-teal-700",
    iconBgClassName: "bg-teal-50",
  },
  {
    id: "4",
    title: "Bounce rate alert",
    description: "Flash Sale campaign bounce rate rose above 3%.",
    time: "Yesterday",
    read: true,
    icon: AlertCircle,
    iconClassName: "text-rose-600",
    iconBgClassName: "bg-rose-50",
  },
]

export function NotificationSection() {
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(initialNotifications)
  const [open, setOpen] = React.useState(false)

  const unreadCount = notifications.filter((item) => !item.read).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 text-white hover:bg-white/15 hover:text-white"
          aria-label="Open notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold leading-none text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 border-slate-200 p-0 shadow-lg"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs text-teal-700 hover:bg-teal-50 hover:text-teal-800"
              onClick={markAllAsRead}
            >
              <CheckCheck className="size-3.5" />
              Mark all
            </Button>
          ) : null}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                    !item.read && "bg-teal-50/40"
                  )}
                  onClick={() => markAsRead(item.id)}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                      item.iconBgClassName
                    )}
                  >
                    <Icon className={cn("size-4", item.iconClassName)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {item.title}
                      </span>
                      {!item.read ? (
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-600" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </span>
                    <span className="mt-1 block text-[11px] text-slate-400">
                      {item.time}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="h-8 w-full text-xs text-teal-700 hover:bg-teal-50 hover:text-teal-800"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
