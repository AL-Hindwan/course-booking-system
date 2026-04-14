"use client"

import Link from "next/link"
import Image from "next/image"
import { Bell, User, LogOut, Menu, Building2, Sun, Moon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getFileUrl } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { UserRole } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "next-themes"
import { useNotifications } from "@/contexts/notification-context"

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { unreadCount } = useNotifications()

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'STUDENT': return 'طالب'
      case 'TRAINER': return 'مدرّب'
      case 'INSTITUTE_ADMIN': return 'مسؤول معهد'
      case 'PLATFORM_ADMIN': return 'مسؤول منصّة'
      default: return role
    }
  }

  const getProfileLink = (role: UserRole) => {
    switch (role) {
      case 'STUDENT': return '/student/profile'
      case 'TRAINER': return '/trainer/profile'
      case 'INSTITUTE_ADMIN': return '/institute/profile'
      case 'PLATFORM_ADMIN': return '/admin/profile'
      default: return '/'
    }
  }

  const getNotificationsLink = (role: UserRole) => {
    switch (role) {
      case 'STUDENT': return '/student/notifications'
      case 'TRAINER': return '/trainer/notifications'
      case 'INSTITUTE_ADMIN': return '/institute/notifications'
      case 'PLATFORM_ADMIN': return '/admin/announcements'
      default: return '/'
    }
  }

  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 shadow-sm dark:bg-background dark:border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Menu Button */}
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            {onMenuClick ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuClick}
              >
                <Menu className="h-5 w-5" />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/">الرئيسية</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/courses">الدورات التدريبية</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/institutes">المعاهد</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user?.role === 'TRAINER' && (
                    <DropdownMenuItem asChild>
                      <Link href="/trainer/dashboard">لوحة التحكم</Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'INSTITUTE_ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link href="/institute/dashboard">لوحة التحكم</Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'PLATFORM_ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard">لوحة التحكم</Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'STUDENT' && (
                    <DropdownMenuItem asChild>
                      <Link href="/student/dashboard">لوحة التحكم</Link>
                    </DropdownMenuItem>
                  )}
                  {!user && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/login">تسجيل الدخول</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/auth/register">إنشاء حساب</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative w-16 h-16 group-hover:scale-105 transition-transform duration-300">
              <Image src="/images/logo.png" alt="منصة د" fill className="object-contain" />
            </div>
            <span className="font-extrabold text-3xl block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">منصة د</span>
          </Link>
        </div>

        {/* Center Search Bar - Hidden on mobile, visible on md+ */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="ماذا تريد أن تتعلم اليوم؟"
              className="w-full h-10 pr-10 pl-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Navigation Links - Hidden on mobile, now part of right side or condensed */}
        <div className="hidden lg:flex items-center gap-1">
          <Button variant="ghost" asChild className="font-semibold text-foreground hover:text-primary hover:bg-primary/5 dark:text-foreground dark:hover:text-primary dark:hover:bg-primary/10">
            <Link href="/courses">الدورات</Link>
          </Button>
          <Button variant="ghost" asChild className="font-semibold text-foreground hover:text-primary hover:bg-primary/5 dark:text-foreground dark:hover:text-primary dark:hover:bg-primary/10">
            <Link href="/institutes">المعاهد</Link>
          </Button>

          {/* Role specific links... */}

          {user?.role === 'TRAINER' && (
            <Button variant="ghost" asChild className="font-semibold text-foreground hover:text-primary hover:bg-primary/5 dark:text-foreground dark:hover:text-primary dark:hover:bg-primary/10">
              <Link href="/trainer/dashboard">لوحة التحكم</Link>
            </Button>
          )}
          {user?.role === 'INSTITUTE_ADMIN' && (
            <Button variant="ghost" asChild className="font-semibold text-foreground hover:text-primary hover:bg-primary/5 dark:text-foreground dark:hover:text-primary dark:hover:bg-primary/10">
              <Link href="/institute/dashboard">لوحة التحكم</Link>
            </Button>
          )}
          {user?.role === 'PLATFORM_ADMIN' && (
            <Button variant="ghost" asChild className="font-semibold text-foreground hover:text-primary hover:bg-primary/5 dark:text-foreground dark:hover:text-primary dark:hover:bg-primary/10">
              <Link href="/admin/dashboard">لوحة التحكم</Link>
            </Button>
          )}
          {user?.role === 'STUDENT' && (
            <Button variant="ghost" asChild className="font-semibold text-foreground hover:text-primary hover:bg-primary/5 dark:text-foreground dark:hover:text-primary dark:hover:bg-primary/10">
              <Link href="/student/dashboard">لوحة التحكم</Link>
            </Button>
          )}
        </div>

        {/* User Menu and Notifications */}
        <div className="flex items-center gap-3">


          {user ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" asChild>
                <Link href={getNotificationsLink(user.role)}>
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
                  )}
                </Link>
              </Button>

              {/* User Profile Trigger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="pl-2 pr-1 py-1 h-auto rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all dark:hover:bg-slate-800 dark:border-transparent dark:hover:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                        <AvatarImage src={getFileUrl(user.avatar)} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900 leading-none mb-1 dark:text-slate-100">{user.name}</p>
                        <p className="text-xs text-primary font-medium leading-none">{getRoleLabel(user.role)}</p>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getProfileLink(user.role)} className="cursor-pointer">
                      <User className="ml-2 h-4 w-4" />
                      الملف الشخصي
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={getNotificationsLink(user.role)} className="cursor-pointer">
                      <Bell className="ml-2 h-4 w-4" />
                      الإشعارات
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:text-red-400 dark:focus:bg-red-950/50"
                    onClick={() => logout()}
                  >
                    <LogOut className="ml-2 h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="font-medium text-slate-600 hover:text-primary hover:bg-primary/5 dark:text-slate-300 dark:hover:text-primary dark:hover:bg-primary/10">
                <Link href="/auth/login">تسجيل الدخول</Link>
              </Button>
              <Button asChild className="font-medium shadow-sm">
                <Link href="/auth/register">إنشاء حساب</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}