"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { PanelRightClose, PanelRightOpen } from "lucide-react"
import { cn, getFileUrl } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function StudentProfileSummary() {
    const { user } = useAuth()

    if (!user) return null

    return (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={getFileUrl(user.avatar)} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
            </div>
        </div>
    )
}

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background" dir="rtl">
            <Navbar />
            <div className="flex relative">
                <div
                    className={cn(
                        "sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto transition-all duration-300 ease-in-out border-l border-gray-200 dark:border-gray-800",
                        isSidebarOpen ? "w-64 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-10 overflow-hidden border-none"
                    )}
                >
                    <div className="bg-white dark:bg-slate-900 h-full w-64 flex flex-col">
                        <StudentProfileSummary />
                        <div className="flex-1 overflow-y-auto">
                            <Sidebar role="STUDENT" className="h-full border-none w-64 min-h-0" />
                        </div>
                    </div>
                </div>
                <main className="flex-1 p-8 transition-all duration-300 min-w-0">
                    <div className="mb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            title={isSidebarOpen ? "إخفاء القائمة الجانبية" : "إظهار القائمة الجانبية"}
                        >
                            {isSidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                        </Button>
                    </div>
                    {children}
                </main>
            </div>
        </div>
    )
}
