"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { TrainerSidebar } from "@/components/layout/trainer-sidebar"
import { TrainerHeader } from "@/components/layout/trainer-header"
import { cn } from "@/lib/utils"
// ...
export default function TrainerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const pathname = usePathname()
    const isHallsPage = pathname?.startsWith("/trainer/halls")

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50" dir="rtl">
            {/* Premium Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl opacity-50 mix-blend-multiply right-[-100px] top-[-100px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl opacity-50 mix-blend-multiply left-[-150px] bottom-[-150px]" />
            </div>

            <div className="flex relative z-10 h-screen overflow-hidden">
                {/* Mobile Drawer Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar Wrapper */}
                <div
                    className={cn(
                        "fixed lg:sticky top-0 h-screen transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 lg:z-40 lg:translate-x-0 w-[280px]",
                        isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
                    )}
                >
                    <TrainerSidebar />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 h-screen overflow-hidden relative">
                    <TrainerHeader
                        isSidebarOpen={isSidebarOpen}
                        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    />

                    <main className={cn("flex-1 overflow-y-auto no-scrollbar pb-10", isHallsPage ? "px-6 pb-8 pt-0 md:px-8 md:pt-0" : "p-6 md:p-8")}>
                        <div className="container mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
