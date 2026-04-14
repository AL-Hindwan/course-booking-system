"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { PanelRightClose, PanelRightOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminLayout({
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
                    <Sidebar role="PLATFORM_ADMIN" className="h-full border-none w-64" />
                </div>
                <main className="flex-1 p-6 transition-all duration-300 min-w-0">
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
