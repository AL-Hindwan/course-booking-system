"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { PanelRightClose, PanelRightOpen, Building2, CheckCircle, Clock, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { instituteService } from "@/lib/institute-service"


interface InstituteProfile {
    name: string
    adminName: string
    verificationStatus: string
    logoUrl?: string
}

function InstituteProfileCard({ profile, loading }: { profile: InstituteProfile | null; loading: boolean }) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case "APPROVED":
                return { label: "موثّق", icon: CheckCircle, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400" }
            case "PENDING":
                return { label: "قيد المراجعة", icon: Clock, className: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400" }
            case "REJECTED":
                return { label: "مرفوض", icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400" }
            default:
                return { label: status, icon: Clock, className: "text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400" }
        }
    }

    if (loading) {
        return (
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                </div>
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
        )
    }

    if (!profile) return null

    const status = getStatusConfig(profile.verificationStatus)
    const StatusIcon = status.icon

    return (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.adminName}</p>
                </div>
            </div>
            <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", status.className)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
            </span>
        </div>
    )
}

export default function InstituteLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [profile, setProfile] = useState<InstituteProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        instituteService.getDashboard()
            .then((data) => {
                setProfile({
                    name: data.institute.name,
                    adminName: data.institute.adminName,
                    verificationStatus: data.institute.verificationStatus,
                })
            })
            .catch(() => {
                // Silently fail — layout should still render without data
            })
            .finally(() => setLoading(false))
    }, [])

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
                        <InstituteProfileCard profile={profile} loading={loading} />
                        <div className="flex-1 overflow-y-auto">
                            <Sidebar role="INSTITUTE_ADMIN" className="h-full border-none w-64 min-h-0" />
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
