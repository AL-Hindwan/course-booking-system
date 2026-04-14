"use client"

import React, { useMemo, useRef, useState, ReactNode } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Facebook, FileText, Globe, Instagram, Loader2, Lock, Mail, MapPin, Monitor, Phone, Projector, UploadCloud, Users, Wifi, X, ImageOff, Landmark, Check, Clock, AlertTriangle } from "lucide-react"
import { cn, getFileUrl } from "@/lib/utils"
import { HallImage } from "@/components/halls/HallImage"
import { trainerService } from "@/lib/trainer-service"
import { useEffect } from "react"
import { toast } from "sonner"

// Local HallImage component removed in favor of shared component

const timeSlots = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00"
]

const halls = [
  {
    id: "hall-1",
    name: "القاعة الرئيسية",
    type: "قاعة محاضرات",
    location: "الشرج، الشارع الأول",
    locationUrl: "https://maps.app.goo.gl/4mZb9Y6WgS7",
    capacity: 80,
    hourlyRate: 18000,
    image: "https://images.unsplash.com/photo-1760121788536-9797394e210e?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    gallery: [
      "https://images.unsplash.com/photo-1760121788536-9797394e210e?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
      "https://images.unsplash.com/photo-1685955011121-1ef868d21c99?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000"
    ],
    features: ["wifi", "projector", "screen"],
    description: "قاعة واسعة للمحاضرات والفعاليات الكبرى مع تجهيزات عرض متكاملة."
  },
  {
    id: "hall-2",
    name: "قاعة الاجتماعات الذكية",
    type: "قاعة اجتماعات",
    location: "الشرج، الشارع الأول",
    locationUrl: "https://maps.app.goo.gl/4mZb9Y6WgS7",
    capacity: 18,
    hourlyRate: 12000,
    image: "https://images.unsplash.com/photo-1766802981801-4b4a9a1d8f1c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    gallery: [
      "https://images.unsplash.com/photo-1766802981801-4b4a9a1d8f1c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
      "https://images.unsplash.com/photo-1685955011121-1ef868d21c99?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000"
    ],
    features: ["wifi", "screen"],
    description: "مساحة مريحة لاجتماعات الفرق مع شاشة تفاعلية وإضاءة هادئة."
  },
  {
    id: "hall-3",
    name: "معمل الحاسب المتقدم",
    type: "معمل",
    location: "الشرج، الشارع الأول",
    locationUrl: "https://maps.app.goo.gl/4mZb9Y6WgS7",
    capacity: 30,
    hourlyRate: 15000,
    image: "https://images.unsplash.com/photo-1725274032244-9a8f0fa1e9a7?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    gallery: [
      "https://images.unsplash.com/photo-1725274032244-9a8f0fa1e9a7?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
      "https://images.unsplash.com/photo-1760121788536-9797394e210e?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000"
    ],
    features: ["wifi", "projector", "computers"],
    description: "معمل مجهز لأعمال التدريب العملي مع أجهزة حديثة وشبكة قوية."
  },
  {
    id: "hall-4",
    name: "قاعة التدريب (ج)",
    type: "قاعة محاضرات",
    location: "الشرج، الشارع الأول",
    locationUrl: "https://maps.app.goo.gl/4mZb9Y6WgS7",
    capacity: 40,
    hourlyRate: 14000,
    image: "https://images.unsplash.com/photo-1670348060135-d4c6662b4138?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    gallery: [
      "https://images.unsplash.com/photo-1670348060135-d4c6662b4138?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
      "https://images.unsplash.com/photo-1685955011121-1ef868d21c99?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000"
    ],
    features: ["wifi", "projector"],
    description: "قاعة متوسطة مناسبة للدورات وورش العمل القصيرة."
  }
]

const featureMap: Record<string, { label: string; icon: ReactNode }> = {
  wifi: { label: "WiFi", icon: <Wifi className="h-4 w-4" /> },
  projector: { label: "بروجكتر", icon: <Projector className="h-4 w-4" /> },
  screen: { label: "شاشة", icon: <Monitor className="h-4 w-4" /> },
  computers: { label: "أجهزة", icon: <Monitor className="h-4 w-4" /> }
}



interface Hall {
  id: string
  name: string
  type: string
  description: string
  hourlyRate: number
  image: string
  features: string[]
  location: string
  locationUrl?: string
  capacity: number
  gallery?: string[]
  institute?: {
    name: string
    description: string
    logo: string
    phone: string
    email: string
    address: string
    website: string
  }
  bankAccounts?: any[]
}

export default function HallDetailsPage() {
  const params = useParams()
  const hallId = typeof params.id === "string" ? params.id : ""

  const [hall, setHall] = useState<Hall | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHall = async () => {
      try {
        setLoading(true)
        const data = await trainerService.getHallById(hallId)
        // Map database fields to UI fields
        const mappedHall = {
          ...data,
          hourlyRate: Number(data.pricePerHour),
          image: getFileUrl(data.image),
          features: data.facilities || [],
          location: data.location || "غير محدد",
          type: data.type || "قاعة محاضرات",
          institute: {
            name: data.institute?.name || "معهد غير مسمى",
            description: data.instituteDescription || data.institute?.description || "لا يوجد وصف متاح لهذا المعهد حالياً.",
            logo: getFileUrl(data.instituteLogo) || "/images/logo.png",
            phone: data.institute?.phone || "",
            email: data.institute?.email || "",
            address: data.institute?.address || "",
            website: data.institute?.website || "",
          }
        }
        setHall(mappedHall)
      } catch (err: any) {
        console.error("Failed to fetch hall details", err)
        setError("فشل في تحميل تفاصيل القاعة")
      } finally {
        setLoading(false)
      }
    }

    if (hallId) fetchHall()
  }, [hallId])

  const locationText = hall?.location?.trim() ?? ""
  const locationUrl = hall?.locationUrl?.trim() ?? ""
  const locationLabel = locationText || "عرض الموقع على الخريطة"

  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptInfo, setReceiptInfo] = useState({ name: "" })
  const [paymentError, setPaymentError] = useState("")
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [expandedBankId, setExpandedBankId] = useState<string | null>(null)
  const paymentFileRef = useRef<HTMLInputElement | null>(null)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [selectedSlotsByDate, setSelectedSlotsByDate] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // For storing dynamic availability fetched from backend
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isFetchingSlots, setIsFetchingSlots] = useState(false)
  const [hallAvailabilityData, setHallAvailabilityData] = useState<any>(null)

  // Global availability fetch removed. Per-date fetch in handleDateSelect.
  useEffect(() => {
    // Reset selection when hallId changes
    setSelectedSlotsByDate({})
    setActiveDate(null)
    setAvailableSlots([])
  }, [hallId])

  // Cleanup receipt preview URL
  useEffect(() => {
    return () => {
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview)
      }
    }
  }, [receiptPreview])

  const today = new Date()
  const [monthOffset, setMonthOffset] = useState(0)
  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const currentYear = displayDate.getFullYear()
  const currentMonth = displayDate.getMonth()
  const monthStart = new Date(currentYear, currentMonth, 1)
  const monthEnd = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = monthEnd.getDate()
  const leadingBlanks = monthStart.getDay()
  const dayLabels = ["ح", "ن", "ث", "ر", "خ", "ج", "س"]

  const formatDateKey = (date: Date) => {
    // Standardize to local date string to avoid timezone shifts
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  const formatTime = (hour: number) => `${String(hour).padStart(2, "0")}:00`
  const formatDateLabel = (dateKey: string) => {
    const date = new Date(`${dateKey}T00:00:00`)
    return date.toLocaleDateString("ar-YE", { weekday: "short", day: "numeric", month: "long", year: "numeric" })
  }
  const formatSlotRanges = (slotList: string[]) => {
    if (!slotList.length) return []
    // Convert "HH:00 - HH:00" to starting hour numbers for sorting/ranging
    const hourList = slotList.map(s => parseInt(s.split(":")[0])).sort((a, b) => a - b)
    const ranges: Array<{ start: number; end: number }> = []
    hourList.forEach((hour) => {
      const last = ranges[ranges.length - 1]
      if (!last || hour !== last.end) {
        ranges.push({ start: hour, end: hour + 1 })
        return
      }
      last.end = hour + 1
    })
    return ranges.map((range) => `${formatTime(range.start)} - ${formatTime(range.end)}`)
  }
  const isPastDate = (date: Date) => date.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)

  const handleDateSelect = async (dateKey: string) => {
    setActiveDate(dateKey)
    setAvailableSlots([])

    if (!selectedSlotsByDate[dateKey]) {
      setSelectedSlotsByDate(prev => ({ ...prev, [dateKey]: [] }))
    }

    try {
      setIsFetchingSlots(true)
      const data = await trainerService.getHallAvailability(hallId, dateKey)
      setHallAvailabilityData(data)

      const [yearStr, monthStr, dayStr] = dateKey.split("-")
      const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
      const dayOfWeekMap = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
      const dayName = dayOfWeekMap[dateObj.getDay()]

      const allowedPeriods = data.availability?.filter((a: any) => a.day === dayName) || []
      const hasAvailabilityDefined = data.availability && data.availability.length > 0
      const booked = data.bookedSessions || []

      const openSlots = timeSlots.filter(slot => {
        const [startHourStr, endHourStr] = slot.split(" - ")

        // 1. Check against base availability (working hours)
        if (hasAvailabilityDefined) {
          const isWithinWorkingHours = allowedPeriods.some((period: any) => {
            const pStart = period.startTime.substring(0, 5)
            const pEnd = period.endTime.substring(0, 5)
            return startHourStr >= pStart && endHourStr <= pEnd
          })
          if (!isWithinWorkingHours) return false
        }

        // 2. Check against booked sessions
        const slotStart = new Date(`${dateKey}T${startHourStr}:00`)
        const slotEnd = new Date(`${dateKey}T${endHourStr}:00`)

        const isOverlap = booked.some((b: any) => {
          const bStart = new Date(b.startTime)
          const bEnd = new Date(b.endTime)
          return slotStart < bEnd && slotEnd > bStart
        })

        return !isOverlap
      })

      setAvailableSlots(openSlots)
    } catch (e) {
      console.error("Failed to fetch slots", e)
    } finally {
      setIsFetchingSlots(false)
    }
  }

  const handleSlotToggle = (slot: string) => {
    if (!activeDate) return
    setSelectedSlotsByDate((prev) => {
      const current = prev[activeDate] ?? []
      if (current.includes(slot)) {
        return { ...prev, [activeDate]: current.filter((v) => v !== slot) }
      }
      return { ...prev, [activeDate]: [...current, slot].sort() }
    })
  }

  const totalHours = Object.values(selectedSlotsByDate).reduce((sum, slots) => sum + slots.length, 0)
  const totalPrice = totalHours * (hall?.hourlyRate ?? 0)
  const selectedDateCount = Object.keys(selectedSlotsByDate).filter((date) => (selectedSlotsByDate[date] ?? []).length > 0).length

  const handleInitialBooking = () => {
    if (Object.keys(selectedSlotsByDate).length === 0 || totalHours === 0) return
    // Directly go to payment review if paying immediately, or pending if not paying immediately. Let's force payment receipt collection first.
    setIsPaymentOpen(true)
  }

  const handleReceiptFile = (file: File | null) => {
    if (!file) return

    // Cleanup previous preview
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview)
      setReceiptPreview(null)
    }

    setReceiptFile(file)
    setReceiptInfo({ name: file.name })
    setPaymentError("")

    // Generate preview if it's an image
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setReceiptPreview(url)
    }
  }

  const handlePaymentConfirmation = async () => {
    if (!receiptFile?.name && !receiptInfo.name) {
      setPaymentError("يرجى رفع سند الدفع قبل التأكيد.")
      return
    }

    try {
      setIsSubmitting(true)

      // Transform selectedSlotsByDate to flat array
      const flatSessions: { date: string; slot: number }[] = []
      Object.entries(selectedSlotsByDate).forEach(([date, slotArr]) => {
        slotArr.forEach(slotStr => {
          const startHour = parseInt(slotStr.split(":")[0])
          flatSessions.push({ date, slot: startHour })
        })
      })

      await trainerService.bookHall(
        hallId,
        flatSessions,
        receiptFile || undefined,
        "حجز مباشر للقاعة من قبل المدرب"
      );

      toast.success("تم إرسال طلب الحجز بنجاح 🎉")
      setIsSuccess(true)
    } catch (err: any) {
      setPaymentError(err?.response?.data?.message || err.message || "فشل في إرسال الحجز");
    } finally {
      setIsSubmitting(false)
    }
  }



  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-lg font-medium text-slate-600">جاري تحميل تفاصيل القاعة...</p>
        </div>
      </div>
    )
  }

  if (error || !hall) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <X className="h-12 w-12 text-red-500 bg-red-50 rounded-full p-2" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-2">{error || "القاعة غير موجودة"}</p>
          <p className="text-slate-500 mb-6">حدث خطأ أثناء محاولة جلب تفاصيل القاعة من قاعدة البيانات.</p>
          <Button
            className="w-full rounded-full"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-l from-blue-950 via-blue-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 pt-6 pb-16">
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
            <div className="flex flex-col gap-4 text-right">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/10 text-white border border-white/20">
                  {hall.type}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {hall.name}
              </h1>
              <p className="text-lg text-blue-100 leading-relaxed">
                {hall.description}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-200">السعر بالساعة</span>
                <span className="text-2xl font-bold">{hall.hourlyRate} ر.ي</span>
              </div>
              <div className="grid gap-3 text-sm text-blue-100 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {locationUrl ? (
                    <a
                      href={locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-white/40 underline-offset-4 hover:text-white"
                    >
                      {locationLabel}
                    </a>
                  ) : (
                    <span className="text-blue-100/60 cursor-not-allowed">
                      {locationLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>السعة: {hall.capacity} شخص</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>يتوفر الحجز حسب الجدولة</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {hall.features.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/90"
                  >
                    {featureMap[feature]?.icon}
                    {featureMap[feature]?.label}
                  </span>
                ))}
              </div>
              <div className="w-full mt-4">
                <Button
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full rounded-full bg-white text-blue-900 hover:bg-blue-50 text-base font-semibold h-12 px-10 transition-all duration-200 hover:shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950 animate-cta-pop"
                >
                  حجز القاعة
                </Button>
              </div>
            </div>

            <div className="relative -mt-4 aspect-square w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-lg">
              <HallImage
                src={hall.image}
                alt={hall.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 360px, 420px"
              />
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-slate-50" />
      </div>

      <Dialog open={isBookingOpen} onOpenChange={(open) => {
        setIsBookingOpen(open)
        if (!open) {
          // Reset success state when closing
          setTimeout(() => setIsSuccess(false), 300)
        }
      }}>
        <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-slate-50/50 backdrop-blur-xl">
          <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">حجز القاعة</DialogTitle>
                <DialogDescription className="mt-1 text-slate-500">اختر المواعيد وأكمل عملية الدفع لتأكيد حجزك.</DialogDescription>
              </div>
              <DialogClose className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
                  <Check className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">تم استلام طلب حجزك!</h3>
                <p className="text-slate-500 max-w-sm mb-8">
                  تم إرسال طلب الحجز وسند الدفع بنجاح. سيقوم المعهد بمراجعة طلبك والموافقة عليه في أقرب وقت.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <Button
                    className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                    onClick={() => window.location.href = "/trainer/room-bookings"}
                  >
                    عرض طلبات الحجز
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-bold"
                    onClick={() => setIsBookingOpen(false)}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Selection Section */}
                <div className="grid gap-6 lg:grid-cols-[1.1fr_1.2fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-slate-800">
                        {new Date(currentYear, currentMonth).toLocaleDateString("ar-YE", { month: "long", year: "numeric" })}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setMonthOffset((prev) => prev - 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => setMonthOffset((prev) => prev + 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {dayLabels.map((label) => <span key={label}>{label}</span>)}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: leadingBlanks + daysInMonth }, (_, idx) => {
                        if (idx < leadingBlanks) return <div key={`blank-${idx}`} />
                        const day = idx - leadingBlanks + 1
                        const date = new Date(currentYear, currentMonth, day)
                        const dateKey = formatDateKey(date)
                        const disabled = isPastDate(date) // removed hasAvailableSlots check as it's fetched per-date now
                        const isSelected = activeDate === dateKey
                        const isToday = formatDateKey(new Date()) === dateKey
                        const hasSelection = (selectedSlotsByDate[dateKey]?.length ?? 0) > 0

                        return (
                          <button
                            key={dateKey}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleDateSelect(dateKey)}
                            className={`h-10 rounded-xl text-sm font-medium transition-all relative ${isSelected
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 z-10"
                              : disabled
                                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                                : hasSelection
                                  ? "bg-blue-50 text-blue-700 border-2 border-blue-200"
                                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                              }`}
                          >
                            {day}
                            {isToday && !isSelected && (
                              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600"></span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      الفترات المتاحة
                    </h3>
                    {!activeDate ? (
                      <div className="h-[240px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                        <Calendar className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">اختر يومًا من التقويم</p>
                      </div>
                    ) : (
                      <div className="flex flex-col h-[240px]">
                        {isFetchingSlots ? (
                          <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          </div>
                        ) : availableSlots.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1">
                            {availableSlots.map((slot) => {
                              const selected = (selectedSlotsByDate[activeDate] ?? []).includes(slot)
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleSlotToggle(slot)}
                                  className={`rounded-xl border p-3 text-xs font-medium transition-all ${selected
                                    ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100"
                                    : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                    }`}
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{slot}</span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                            <Lock className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">لا توجد فترات متاحة لهذا اليوم</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary & Payment Section */}
                {totalHours > 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="bg-blue-600 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl shadow-blue-100">
                      <div className="space-y-1 text-center md:text-right">
                        <p className="text-blue-100 text-sm">إجمالي الحجز</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">{totalPrice.toLocaleString()}</span>
                          <span className="text-blue-100">ر.ي</span>
                        </div>
                      </div>
                      <div className="h-px w-full md:h-10 md:w-px bg-white/20" />
                      <div className="flex-1 text-center md:text-right">
                        <p className="text-blue-100 text-xs mb-2">الفترات المختارة ({totalHours} ساعة)</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                          {Object.entries(selectedSlotsByDate)
                            .filter(([, slots]) => slots.length > 0)
                            .map(([date, slots]) => (
                              <Badge key={date} variant="secondary" className="bg-white/10 text-white border-none hover:bg-white/20 whitespace-nowrap">
                                {formatDateLabel(date)}: {slots.length} س
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          <Landmark className="h-5 w-5 text-blue-600" />
                          الحسابات البنكية للمعهد
                        </h4>
                        <div className="grid gap-3">
                          {(hall?.bankAccounts || []).map((bank: any) => (
                            <div key={bank.id} className="relative overflow-hidden group p-4 border rounded-2xl bg-white shadow-sm border-slate-200">
                              <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600"></div>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                  <Landmark className="h-5 w-5" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-900">{bank.bankName}</h5>
                                  <p className="text-xs text-slate-500">مستفيد: {bank.accountName}</p>
                                </div>
                              </div>
                              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] uppercase font-bold text-slate-400">رقم الحساب</span>
                                  <span className="font-mono font-bold text-blue-900" dir="ltr">{bank.accountNumber}</span>
                                </div>
                                {bank.iban && (
                                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">IBAN</span>
                                    <span className="font-mono text-xs text-slate-600" dir="ltr">{bank.iban}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          <UploadCloud className="h-5 w-5 text-blue-600" />
                          رفع إثبات الدفع
                        </h4>
                        <div
                          onClick={() => paymentFileRef.current?.click()}
                          className={`relative group h-full min-h-[200px] flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${receiptFile ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30"
                            }`}
                        >
                          <input
                            ref={paymentFileRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => handleReceiptFile(e.target.files?.[0] ?? null)}
                          />
                          {receiptPreview ? (
                            <div className="relative w-full h-[200px] rounded-xl overflow-hidden bg-slate-50 group">
                              <Image
                                src={receiptPreview}
                                alt="Receipt Preview"
                                fill
                                className="object-contain"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <UploadCloud className="h-6 w-6 text-white" />
                                <span className="text-white text-xs font-bold">انقر لتغيير الملف</span>
                              </div>
                            </div>
                          ) : receiptFile ? (
                            <>
                              <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                <Check className="h-6 w-6" />
                              </div>
                              <div className="text-center px-4">
                                <p className="font-bold text-emerald-900 text-sm truncate max-w-[200px]">{receiptFile.name}</p>
                                <p className="text-emerald-600 text-[10px]">انقر لتغيير الملف</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <UploadCloud className="h-6 w-6" />
                              </div>
                              <div className="text-center px-4">
                                <p className="font-bold text-slate-700 text-sm">ارفع صورة السند</p>
                                <p className="text-slate-400 text-xs mt-1">يمكنك سحب وإفلات الملف هنا أو النقر للاختيار</p>
                              </div>
                            </>
                          )}
                        </div>
                        {paymentError && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 animate-in fade-in zoom-in-95">
                            <AlertTriangle className="h-4 w-4" />
                            {paymentError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t sticky bottom-0 bg-slate-50/80 backdrop-blur-md pb-6">
                      <Button
                        onClick={handlePaymentConfirmation}
                        disabled={!receiptFile || isSubmitting}
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>جاري إرسال الطلب...</span>
                          </div>
                        ) : (
                          "تأكيد الحجز والدفع"
                        )}
                      </Button>
                      {!receiptFile && (
                        <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-2">
                          <Lock className="h-3 w-3" />
                          يجب رفع سند الدفع لتفعيل زر التأكيد
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {hall && (
        <div className="container mx-auto px-4 py-10">
          <div className="grid gap-6 lg:grid-cols-1">
            <Card className="w-full rounded-2xl border border-slate-100 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
              <CardContent className="p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex items-center justify-start md:justify-end">
                    <div className="relative h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                      <Image
                        src={hall.institute?.logo || "/images/logo.png"}
                        alt={`شعار ${hall.institute?.name || "المعهد"}`}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                  </div>

                  <div className="flex-1 text-right">
                    <h2 className="text-lg font-bold text-slate-900">{hall.institute?.name || "المعهد غير متاح"}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {hall.institute?.description || "معهد تدريبي متخصص في القاعات التعليمية والدورات الاحترافية."}
                    </p>

                    <div className="mt-4 space-y-2 text-sm">
                      {hall.institute?.phone && (
                        <a href={`tel:${hall.institute.phone}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-700">
                          <Phone className="h-4 w-4" />
                          <span className="text-slate-500">رقم التواصل:</span>
                          <span className="font-semibold">{hall.institute.phone}</span>
                        </a>
                      )}
                      {hall.institute?.email && (
                        <a href={`mailto:${hall.institute.email}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-700">
                          <Mail className="h-4 w-4" />
                          <span className="text-slate-500">البريد الإلكتروني:</span>
                          <span className="font-semibold">{hall.institute.email}</span>
                        </a>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {hall.institute?.address ? (
                        <span className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 px-3 text-sm text-slate-600 w-auto gap-2">
                          <MapPin className="h-4 w-4" />
                          {hall.institute.address}
                        </span>
                      ) : (
                        hall.locationUrl ? (
                          <a
                            href={hall.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 px-3 gap-2"
                            aria-label="الموقع على الخريطة"
                          >
                            <MapPin className="h-4 w-4" />
                            عرض على الخريطة
                          </a>
                        ) : (
                          <span
                            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 text-slate-300 cursor-not-allowed px-3 gap-2"
                            aria-label="الموقع غير متوفر"
                          >
                            <MapPin className="h-4 w-4" />
                            الموقع غير متوفر
                          </span>
                        ))}
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:-translate-y-0.5 hover:border-pink-200 hover:text-pink-600"
                        aria-label="انستقرام"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
                        aria-label="فيسبوك"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                      {((hall as any).institute?.website) && (
                        <a
                          href={(hall as any).institute.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
                          aria-label="الموقع الإلكتروني"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
