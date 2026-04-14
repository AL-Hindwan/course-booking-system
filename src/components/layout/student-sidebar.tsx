"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Book, BookOpen, Home, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/student/dashboard", label: "الصفحة الرئيسية", icon: Home },
  { href: "/student/courses", label: "تصفح الدورات", icon: BookOpen },
  { href: "/student/my-courses", label: "دوراتي", icon: Book },
  { href: "/student/schedule", label: "الجدول", icon: Calendar },
]

export function StudentSidebar() {
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
          let isActive = false;
          if (link.href === "/student/courses") {
            // Browse Courses: Active on exact match OR when viewing a course in explore mode
            isActive = pathname === link.href || pathname.startsWith("/student/explore/course/");
          } else if (link.href === "/student/my-courses") {
            // My Courses: Active on /student/my-courses OR /student/courses/[id]
            // We verify it is NOT the explore path
            isActive = pathname.startsWith(link.href) || (pathname.startsWith("/student/courses/") && pathname !== "/student/courses");
          } else {
            isActive = pathname.startsWith(link.href);
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
