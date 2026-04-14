"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Award, Book, LayoutDashboard, Calendar, BookOpen, Home, Users, CheckSquare, UserCheck, Megaphone, MapPin, Building, FileText, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/trainer/dashboard", label: "الصفحة الرئيسية", icon: Home },
  { href: "/trainer/explore", label: "استعراض الدورات", icon: BookOpen },
  { href: "/trainer/courses", label: "إدارة الدورات", icon: GraduationCap },
  { href: "/trainer/students", label: "الطلاب", icon: Users },
  { href: "/trainer/enrollments", label: "طلبات التسجيل", icon: UserCheck },
  { href: "/trainer/announcements", label: "الإعلانات", icon: Megaphone },

  { href: "/trainer/halls", label: "القاعات", icon: Building },
  { href: "/trainer/room-bookings", label: "حجوزاتي", icon: Calendar },
]

export function TrainerSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[280px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-l-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-screen flex flex-col">
      {/* App Logo/Header Area */}
      <div className="p-6 h-16 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800">
        <div className="relative w-10 h-10">
          <Image src="/images/logo.png" alt="منصة د" fill className="object-contain" />
        </div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
          منصة د
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {links.map((link) => {
          // Precise active logic
          let isActive = false
          if (link.href === "/trainer/dashboard") {
            isActive = pathname === link.href
          } else if (link.href === "/trainer/explore") {
            isActive = pathname.startsWith("/trainer/explore")
          } else {
            isActive = pathname.startsWith(link.href)
          }

          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group",
                isActive
                  ? "bg-blue-700 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                {/* Icon Right, Text Left due to RTL global dir, but flex-row is standard. 
                      Let's rely on standard flow. In RTL:
                      Item 1 (Icon) is Right. Item 2 (Text) is Left. 
                   */}
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600")} />
                <span className="flex-1 text-right">{link.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
