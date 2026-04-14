"use client"

import React, { useMemo, useState, useEffect, ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Search, Users, Wifi, Projector, Monitor, Loader2, ImageOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { cn, getFileUrl } from "@/lib/utils"
import { HallImage } from "@/components/halls/HallImage"
import { trainerService } from "@/lib/trainer-service" // Using trainer service to fetch halls

const hallTypes = [
    "الكل",
    "قاعة محاضرات",
    "قاعة اجتماعات",
    "معمل"
]

const capacityOptions = [
    "كل السعات",
    "حتى 20",
    "21 - 40",
    "41 - 60",
    "أكثر من 60"
]

const locationOptions = [
    "كل المواقع",
    "الدور الأرضي",
    "الدور الأول",
    "الدور الثاني",
    "الجناح الشرقي",
    "الجناح الغربي"
]

const featureMap: Record<string, { label: string; icon: ReactNode }> = {
    wifi: { label: "WiFi", icon: <Wifi className="h-4 w-4" /> },
    projector: { label: "بروجكتر", icon: <Projector className="h-4 w-4" /> },
    screen: { label: "شاشة", icon: <Monitor className="h-4 w-4" /> },
    computers: { label: "أجهزة", icon: <Monitor className="h-4 w-4" /> }
}

// Local HallImage component removed in favor of shared component

export default function TrainerHallsPage({
    hideTitle = false,
    basePath = "/trainer/halls",
    actionLabel = "عرض التفاصيل",
    onSelectHall,
    hallsData,
    stickyHeader = false,
}: {
    hideTitle?: boolean
    basePath?: string
    actionLabel?: string
    onSelectHall?: (hallId: string) => void
    hallsData?: any[]
    stickyHeader?: boolean
}) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedType, setSelectedType] = useState("الكل")
    const [selectedCapacity, setSelectedCapacity] = useState("كل السعات")
    const [selectedLocation, setSelectedLocation] = useState("كل المواقع")
    const searchParams = useSearchParams()
    const isSelectMode = searchParams.get("mode") === "select"
    const effectiveActionLabel = isSelectMode ? "اختيار القاعة" : actionLabel

    const [dbHalls, setDbHalls] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Fetch halls from backend if not provided via props
    useEffect(() => {
        if (hallsData) return

        const fetchHalls = async () => {
            try {
                setLoading(true)
                const responseData = await trainerService.getHalls()
                const mapped = responseData.map((h: any) => ({
                    ...h,
                    id: h.id,
                    name: h.name,
                    type: h.type || "قاعة محاضرات",
                    location: h.location || "غير محدد",
                    capacity: h.capacity || 0,
                    hourlyRate: Number(h.pricePerHour || 0),
                    image: getFileUrl(h.image),
                    features: h.facilities || [],
                    description: h.description || "لا يوجد وصف"
                }))
                setDbHalls(mapped)
            } catch (e) {
                console.error("Failed to fetch halls", e)
            } finally {
                setLoading(false)
            }
        }
        fetchHalls()
    }, [hallsData])

    const sourceHalls = hallsData ?? dbHalls

    const filteredHalls = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return sourceHalls.filter((hall) => {
            const matchesSearch =
                query.length === 0 ||
                hall.name.toLowerCase().includes(query) ||
                hall.description?.toLowerCase().includes(query)

            const matchesType = selectedType === "الكل" || hall.type === selectedType

            const matchesLocation =
                selectedLocation === "كل المواقع" || hall.location?.includes(selectedLocation)

            const matchesCapacity =
                selectedCapacity === "كل السعات" ||
                (selectedCapacity === "حتى 20" && hall.capacity <= 20) ||
                (selectedCapacity === "21 - 40" && hall.capacity >= 21 && hall.capacity <= 40) ||
                (selectedCapacity === "41 - 60" && hall.capacity >= 41 && hall.capacity <= 60) ||
                (selectedCapacity === "أكثر من 60" && hall.capacity > 60)

            return matchesSearch && matchesType && matchesLocation && matchesCapacity
        })
    }, [searchQuery, selectedCapacity, selectedLocation, selectedType, sourceHalls])

    const handleSelectHall = (hall: any) => {
        if (isSelectMode) {
            if (typeof window === "undefined") return
            const message = {
                type: "hall-selected",
                payload: {
                    id: hall.id,
                    name: hall.name,
                    type: hall.type,
                    location: hall.location,
                    capacity: hall.capacity,
                    hourlyRate: hall.hourlyRate,
                    image: hall.image,
                    description: hall.description
                }
            }
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(message, window.location.origin)
            }
            window.close()
            return
        }

        if (onSelectHall) {
            onSelectHall(hall.id)
        }
    }

    const usesSelectButton = isSelectMode || Boolean(onSelectHall)

    if (loading && !hallsData) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <section dir="rtl" className="w-full text-right animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!hideTitle && (
                <div className="w-full max-w-[1200px] mr-0 ml-auto text-right">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-right leading-tight mb-1">
                        دليل القاعات
                    </h1>
                </div>
            )}

            <div className="w-full max-w-[1200px] mr-0 ml-auto mt-2 space-y-3">
                <div
                    className={cn(
                        "flex flex-wrap items-center justify-start gap-3 text-right border-b border-slate-100 pb-2",
                        stickyHeader && "sticky top-0 z-20 bg-white/95 backdrop-blur-sm pt-3"
                    )}
                >
                    <div className="relative flex-1 min-w-[260px] max-w-[520px]">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="ابحث باسم القاعة..."
                            className="h-11 rounded-full bg-white pr-4 pl-10 text-sm text-right"
                        />
                    </div>

                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="نوع القاعة" />
                        </SelectTrigger>
                        <SelectContent>
                            {hallTypes.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedCapacity} onValueChange={setSelectedCapacity}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="السعة" />
                        </SelectTrigger>
                        <SelectContent>
                            {capacityOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="الموقع" />
                        </SelectTrigger>
                        <SelectContent>
                            {locationOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <span className="text-sm text-slate-500 whitespace-nowrap text-right ml-auto flex-shrink-0">
                        تم العثور على{" "}
                        <span className="font-semibold text-slate-900">{filteredHalls.length}</span>{" "}
                        قاعة
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 justify-items-end">
                    {filteredHalls.map((hall) => (
                        <div
                            key={hall.id}
                            dir="rtl"
                            className="w-[592px] max-w-full h-[292px] justify-self-end rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] text-right flex items-start gap-5"
                        >
                            <div className="relative h-[260px] w-[260px] shrink-0 overflow-hidden rounded-2xl">
                                <HallImage src={hall.image} alt={hall.name} />
                            </div>

                            <div className="flex h-[260px] flex-1 min-w-0 flex-col text-right">
                                <div className="space-y-2">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                        {hall.type}
                                    </span>
                                    <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                                        {hall.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[42px]">
                                        {hall.description}
                                    </p>
                                </div>

                                <div className="mt-3 flex items-center justify-start gap-2 text-sm text-slate-600">
                                    <MapPin className="h-4 w-4" />
                                    <span>{hall.location}</span>
                                </div>

                                <div className="mt-2 flex items-center justify-start gap-2 text-sm text-slate-600">
                                    <Users className="h-4 w-4" />
                                    <span>السعة: {hall.capacity} شخص</span>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-start gap-2 text-xs text-slate-600">
                                    {hall.features?.slice(0, 3).map((feature: string) => (
                                        <span
                                            key={feature}
                                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"
                                        >
                                            {featureMap[feature]?.icon}
                                            {featureMap[feature]?.label}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-auto flex w-full items-center justify-between pt-3">
                                    <span className="inline-flex h-9 items-center rounded-full bg-blue-50 px-3 text-sm font-bold text-blue-700">
                                        {hall.hourlyRate} ر.ي / ساعة
                                    </span>
                                    {usesSelectButton ? (
                                        <Button
                                            type="button"
                                            onClick={() => handleSelectHall(hall)}
                                            className="h-9 rounded-full bg-blue-600 px-5 text-sm text-white hover:bg-blue-700"
                                        >
                                            {effectiveActionLabel}
                                        </Button>
                                    ) : (
                                        <Button asChild className="h-9 rounded-full bg-blue-600 px-5 text-sm text-white hover:bg-blue-700">
                                            <Link href={`${basePath}/${hall.id}`}>{effectiveActionLabel}</Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredHalls.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
                        لا توجد قاعات مطابقة لخيارات البحث الحالية.
                    </div>
                )}
            </div>
        </section>
    )
}
