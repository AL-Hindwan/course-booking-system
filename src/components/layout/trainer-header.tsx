"use client"

import Link from "next/link"
import { Bell, User, Menu, LogOut, Sun, Moon, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notification-context"

interface TrainerHeaderProps {
  isSidebarOpen: boolean
  onMenuClick: () => void
}

export function TrainerHeader({ isSidebarOpen, onMenuClick }: TrainerHeaderProps) {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const avatarSrc = user?.avatar
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${user.avatar}?t=${Date.now()}`
    : undefined

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 shadow-sm transition-all duration-300">
      {/* Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 dark:hover:bg-slate-800"
        title={isSidebarOpen ? "إخفاء القائمة الجانبية" : "إظهار القائمة الجانبية"}
      >
        <Menu className={cn("h-5 w-5 transition-transform duration-300", isSidebarOpen ? "rotate-90" : "rotate-0")} />
        <span className="sr-only">القائمة</span>
      </Button>

      {/* Left Side: Profile & Notifications - As requested, keeping them on the left */}
      <div className="mr-auto flex items-center gap-2">

        {/* Wishlist */}
        <Button variant="ghost" size="icon" asChild className="rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50">
          <Link href="/trainer/wishlist" title="قائمة الرغبات">
            <Heart className="h-5 w-5" />
            <span className="sr-only">قائمة الرغبات</span>
          </Link>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" asChild className="relative rounded-full text-gray-500 hover:text-primary hover:bg-primary/10">
          <Link href="/trainer/notifications" title="الإشعارات">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
            )}
            <span className="sr-only">الإشعارات</span>
          </Link>
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-2 pr-1 py-1 h-auto rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all dark:hover:bg-slate-800 dark:border-transparent dark:hover:border-slate-700">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-gray-200 dark:border-slate-700">
                  <AvatarImage src={avatarSrc} alt={user?.name ?? ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {user?.name?.charAt(0) ?? "؟"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900 leading-none mb-1 dark:text-slate-100">{user?.name ?? "—"}</p>
                  <p className="text-[10px] text-blue-600 font-bold leading-none uppercase">مدرب</p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name ?? "—"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email ?? "—"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/trainer/profile">الملف الشخصي</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/trainer/notifications">الإشعارات</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
