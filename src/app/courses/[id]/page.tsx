"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate, formatTime } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Check,
  Clock,
  FileText,
  Globe,
  Heart,
  Loader2,
  MapPin,
  Tag,
  UploadCloud,
  Users,
  X,
  ImageIcon,
  Mail,
  Phone,
  Building2
} from "lucide-react"
import { toast } from "sonner"
import { trainerService, CourseDetail } from "@/lib/trainer-service"
import { studentService } from "@/lib/student-service"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function resolveImage(src: string | null | undefined): string {
  if (!src) return "/images/course-web.png"
  if (src.startsWith("http")) return src
  const cleanSrc = src.replace(/\\/g, "/")
  const separator = cleanSrc.startsWith("/") ? "" : "/"
  return `${API_BASE}${separator}${cleanSrc}`
}

const deliveryLabels: Record<string, string> = {
  online: "أونلاين",
  in_person: "حضوري",
  hybrid: "مدمج",
  capacity_based: "تحديد القاعة عند اكتمال العدد"
}

function formatWhatsAppLink(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${cleanPhone}`
}

type RegistrationStatus =
  | "NONE"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PAYMENT_PENDING"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_REJECTED"
  | "ENROLLED"
  | "REJECTED"

const FAVORITES_KEY = "courseFavorites"
const REGISTRATION_KEY_PREFIX = "exploreRegistration"
const ENROLLMENTS_KEY = "myCoursesEnrollments"
const RECEIPT_KEY_PREFIX = "exploreReceipt"
const steps = [
  { id: 1, label: "تسجيل مبدئي" },
  { id: 2, label: "انتظار موافقة المدرب" },
  { id: 3, label: "تأكيد الدفع" },
  { id: 4, label: "تم التسجيل" }
]

export default function CourseDetailsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const courseId = typeof params.id === "string" ? params.id : ""

  // ── Real data fetching ───────────────────────────────────────────────────────
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [courseLoading, setCourseLoading] = useState(true)
  const [courseError, setCourseError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) return
    setCourseLoading(true)
    trainerService
      .getPublicCourseById(courseId)
      .then(setCourse)
      .catch(() => setCourseError("الدورة غير موجودة أو غير متاحة"))
      .finally(() => setCourseLoading(false))
  }, [courseId])
  // ────────────────────────────────────────────────────────────────────────────
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>("NONE")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRegistration, setIsLoadingRegistration] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptInfo, setReceiptInfo] = useState<{ name: string; note: string }>({
    name: "",
    note: ""
  })
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const [expandedBankId, setExpandedBankId] = useState<string | null>(null)
  const paymentFileRef = useRef<HTMLInputElement | null>(null)
  const [formErrors, setFormErrors] = useState<{
    name?: string
    email?: string
    phone?: string
    submit?: string
  }>({})
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  })
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Hall Information Modal
  const [isHallModalOpen, setIsHallModalOpen] = useState(false)
  const [hallData, setHallData] = useState<any>(null)
  const [isLoadingHall, setIsLoadingHall] = useState(false)
  const [hallImageError, setHallImageError] = useState(false)

  const openHallModal = async (hallId: string) => {
    try {
      setIsLoadingHall(true)
      setHallImageError(false)
      const data = await studentService.getHallById(hallId)
      setHallData(data)
      setIsHallModalOpen(true)
    } catch (err: any) {
      toast.error(err.message || "فشل تحميل بيانات القاعة")
    } finally {
      setIsLoadingHall(false)
    }
  }

  // surveyLink and bank accounts are not in the DB model yet
  const shouldShowSurvey = false
  const bankAccounts = useMemo(() => {
    if (course?.instructor?.bankAccounts && course.instructor.bankAccounts.length > 0) {
      return course.instructor.bankAccounts.map(b => ({
        id: b.id,
        bankName: b.bankName,
        iban: b.iban,
        accountNumber: b.accountNumber,
        beneficiary: b.accountName || course.instructor.name,
        isActive: b.isActive
      })).filter(b => b.isActive)
    }

    // Default fallback if no bank accounts are found
    return [
      {
        id: "primary",
        bankName: "—",
        iban: "—",
        accountNumber: "—",
        beneficiary: course?.instructor?.name ?? "—",
        isActive: true
      }
    ]
  }, [course])

  const formatFileSize = (size?: number) => {
    if (!size || Number.isNaN(size)) return ""
    if (size < 1024) return `${size} B`
    const kb = size / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  const registrationStorageKey = useMemo(
    () => `${REGISTRATION_KEY_PREFIX}:${user?.id ?? "guest"}:${courseId}`,
    [courseId, user?.id]
  )
  const registrationFormKey = useMemo(
    () => `${REGISTRATION_KEY_PREFIX}:form:${user?.id ?? "guest"}:${courseId}`,
    [courseId, user?.id]
  )
  const receiptStorageKey = useMemo(
    () => `${RECEIPT_KEY_PREFIX}:${user?.id ?? "guest"}:${courseId}`,
    [courseId, user?.id]
  )

  const formatYER = (value: number) =>
    `${new Intl.NumberFormat("en-US").format(value)} ر.ي`

  const readRegistrationForm = () => {
    if (typeof window === "undefined") return null
    try {
      const stored = window.localStorage.getItem(registrationFormKey)
      if (!stored) return null
      return JSON.parse(stored) as typeof formData
    } catch {
      return null
    }
  }

  const persistRegistrationForm = (data: typeof formData) => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(registrationFormKey, JSON.stringify(data))
  }

  const openRegistrationDialog = async (mode: "create" | "edit") => {
    setIsEditMode(mode === "edit")
    setFormErrors({})
    setIsDialogOpen(true)
    if (mode === "create") {
      setRegistrationId(null)
      // Pre-fill with user info if available
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || ""
      })
    }
    if (mode === "edit") {
      setIsLoadingRegistration(true)
      const stored = readRegistrationForm()
      if (stored) {
        setFormData(stored)
        setIsLoadingRegistration(false)
        return
      }
      if (!user?.id) {
        setIsLoadingRegistration(false)
        return
      }
      try {
        const response = await fetch(`/api/enrollments/${courseId}/me`, {
          method: "GET",
          cache: "no-store"
        })
        if (!response.ok) {
          setIsLoadingRegistration(false)
          return
        }
        const payload = await response.json()
        setRegistrationId(payload?.id ?? null)
        setFormData({
          name: payload?.fullName ?? "",
          email: payload?.email ?? "",
          phone: payload?.phone ?? ""
        })
      } catch {
        // ignore fetch errors, allow manual edit
      } finally {
        setIsLoadingRegistration(false)
      }
    }
  }

  const toggleFavorite = async () => {
    if (!user?.id) {
      toast.error("يرجى تسجيل الدخول لإضافة الدورة إلى قائمة الرغبات");
      return;
    }

    try {
      const result = await studentService.toggleWishlist(courseId);
      setIsFavorite(result.added);
      if (result.added) {
        toast.success("تم إضافة الدورة إلى قائمة الرغبات");
      } else {
        toast.success("تم إزالة الدورة من قائمة الرغبات");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث قائمة الرغبات");
    }
  }

  const handleReceiptFile = (file: File | null) => {
    setReceiptFile(file)
    if (file) {
      setReceiptInfo((prev) => ({ ...prev, name: file.name }))
    }
    setPaymentError("")
  }

  const readReceiptInfo = () => {
    if (typeof window === "undefined") return null
    try {
      const stored = window.localStorage.getItem(receiptStorageKey)
      if (!stored) return null
      return JSON.parse(stored) as { name?: string; note?: string }
    } catch {
      return null
    }
  }

  const persistReceiptInfo = (info: { name: string; note: string }) => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(receiptStorageKey, JSON.stringify(info))
  }

  const handleCopyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`تم نسخ ${label}`)
    } catch {
      toast.error(`تعذر نسخ ${label}`)
    }
  }

  const persistRegistrationStatus = (status: RegistrationStatus) => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(registrationStorageKey, status)
  }

  const saveEnrollment = () => {
    if (!course || typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(ENROLLMENTS_KEY)
      const list = stored ? (JSON.parse(stored) as any[]) : []
      const exists = list.some((item) => item?.courseId === course.id)
      if (exists) return

      list.unshift({
        courseId: course.id,
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription,
        category: course.category,
        price: course.price,
        image: course.image,
        startDate: course.startDate,
        endDate: course.endDate,
        maxStudents: course.maxStudents,
        instructorName: course.instructor.name,
        instructorAvatar: course.instructor.avatar,
        createdAt: new Date().toISOString()
      })

      window.localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(list))
      window.dispatchEvent(new Event("enrollments-updated"))
    } catch {
      // ignore storage errors
    }
  }

  const getStepState = (stepId: number) => {
    if (registrationStatus === "NONE") {
      return stepId === 1 ? "active" : "upcoming"
    }
    if (registrationStatus === "PENDING_APPROVAL") {
      if (stepId === 1) return "completed"
      if (stepId === 2) return "active"
      return "upcoming"
    }
    if (registrationStatus === "APPROVED") {
      if (stepId <= 2) return "completed"
      if (stepId === 3) return "active"
      return "upcoming"
    }
    if (registrationStatus === "PAYMENT_PENDING") {
      if (stepId <= 2) return "completed"
      if (stepId === 3) return "active"
      return "upcoming"
    }
    if (registrationStatus === "PAYMENT_CONFIRMED") {
      if (stepId <= 3) return "completed"
      if (stepId === 4) return "active"
      return "upcoming"
    }
    if (registrationStatus === "PAYMENT_REJECTED") {
      if (stepId <= 2) return "completed"
      if (stepId === 3) return "rejected"
      return "upcoming"
    }
    if (registrationStatus === "ENROLLED") {
      return "completed"
    }
    if (registrationStatus === "REJECTED") {
      if (stepId === 1) return "completed"
      if (stepId === 2) return "rejected"
      return "upcoming"
    }
    return "upcoming"
  }

  const getConnectorClass = (stepId: number) => {
    const state = getStepState(stepId)
    if (state === "completed") return "bg-emerald-500"
    if (state === "rejected") return "bg-red-500"
    return "bg-white/20"
  }


  const handlePaymentConfirmation = async () => {
    if (!receiptFile && !receiptInfo.name) {
      setPaymentError("يرجى رفع سند الدفع قبل التأكيد.")
      return
    }
    setPaymentError("")

    if (!user?.id) {
      toast.error("يرجى تسجيل الدخول أولًا")
      return
    }

    if (receiptFile) {
      setIsUpdatingStatus(true)
      try {
        const data = await studentService.submitPaymentProof(courseId, receiptFile)
        const nextStatus = (data?.status as RegistrationStatus) || "PAYMENT_PENDING"
        setRegistrationStatus(nextStatus)
        persistRegistrationStatus(nextStatus)

        const nextInfo = {
          name: receiptFile.name,
          note: receiptInfo.note
        }
        setReceiptInfo(nextInfo)
        persistReceiptInfo(nextInfo)
        setIsPaymentDialogOpen(false)
        toast.success("تم رفع سند الدفع وسيتم مراجعته من الإدارة.")
      } catch (error: any) {
        toast.error(error.message || "فشل رفع السند. حاول مرة أخرى.")
      } finally {
        setIsUpdatingStatus(false)
      }
    } else {
      // Just mock success if they already uploaded something previously
      setIsPaymentDialogOpen(false)
      toast.success("تم التأكيد (سبق رفع السند).")
    }
  }

  const handleRegister = async () => {
    if (isEditMode) {
      const errors: typeof formErrors = {}
      if (!formData.name.trim()) {
        errors.name = "الاسم الكامل مطلوب"
      }
      if (!formData.email.trim()) {
        errors.email = "البريد الإلكتروني مطلوب"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "البريد الإلكتروني غير صالح"
      }
      if (!formData.phone.trim()) {
        errors.phone = "رقم الهاتف مطلوب"
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }

      if (!user?.id) {
        setFormErrors({ submit: "يرجى تسجيل الدخول أولًا." })
        return
      }

      setIsSubmitting(true)
      setFormErrors({})
      try {
        const response = await fetch(`/api/enrollments/${courseId}/me`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollmentId: registrationId,
            userId: user.id,
            courseId,
            fullName: formData.name,
            email: formData.email,
            phone: formData.phone
          })
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          setFormErrors({
            submit: payload?.message || "تعذر تحديث البيانات الآن"
          })
          return
        }
      } catch {
        // ignore network error for demo flow
      } finally {
        setIsSubmitting(false)
      }

      persistRegistrationForm(formData)
      setIsDialogOpen(false)
      toast.success("تم تحديث بيانات التسجيل المبدئي")
      return
    }

    const errors: typeof formErrors = {}
    if (!formData.name.trim()) {
      errors.name = "الاسم الكامل مطلوب"
    }
    if (!formData.email.trim()) {
      errors.email = "البريد الإلكتروني مطلوب"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "البريد الإلكتروني غير صالح"
    }
    if (!formData.phone.trim()) {
      errors.phone = "رقم الهاتف مطلوب"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    if (!user?.id) {
      setFormErrors({ submit: "يرجى تسجيل الدخول لإرسال الطلب." })
      return
    }

    setIsSubmitting(true)
    setFormErrors({})
    try {
      const data = await studentService.preRegisterCourse(courseId, {
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone
      })

      const nextStatus = (data?.status as RegistrationStatus) || "PENDING_APPROVAL"
      persistRegistrationForm(formData)
      setRegistrationStatus(nextStatus)
      persistRegistrationStatus(nextStatus)
      setIsDialogOpen(false)
      toast.success("تم إرسال طلب التسجيل المبدئي", {
        description: "سيتم مراجعته من قبل إدارة المنصة."
      })
    } catch (error: any) {
      setFormErrors({
        submit: error.message || "تعذر إرسال الطلب الآن"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEnrollment = async () => {
    if (!registrationId) {
      toast.error("لا يمكن العثور على معلومات التسجيل لإلغائها.")
      return
    }

    if (!confirm("هل أنت متأكد من رغبتك في إلغاء التسجيل في هذه الدورة؟")) {
      return
    }

    setIsUpdatingStatus(true)
    try {
      await studentService.cancelEnrollment(registrationId)
      setRegistrationStatus("NONE")
      persistRegistrationStatus("NONE")
      setRegistrationId(null)
      toast.success("تم إلغاء التسجيل بنجاح")
    } catch (error: any) {
      toast.error(error.message || "فشل إلغاء التسجيل. حاول مرة أخرى.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    const loadStatus = async () => {
      // If user is logged in, ALWAYS fetch from API to get the latest trainer approval status
      if (!user?.id) {
        if (typeof window !== "undefined") {
          const savedStatus = window.localStorage.getItem(registrationStorageKey)
          if (savedStatus) {
            setRegistrationStatus(savedStatus as RegistrationStatus)
            return
          }
        }
        return
      }

      try {
        const [enrollmentData, wishlistData] = await Promise.all([
          studentService.getEnrollmentStatus(courseId),
          studentService.getWishlist()
        ]);

        if (enrollmentData?.status) {
          setRegistrationStatus(enrollmentData.status as RegistrationStatus)
          persistRegistrationStatus(enrollmentData.status as RegistrationStatus)
          if (enrollmentData.id) {
            setRegistrationId(enrollmentData.id)
          }
        } else {
          setRegistrationStatus("NONE")
        }

        // Check if current course is in wishlist
        const isInWishlist = wishlistData.some((item: any) => item.id === courseId);
        setIsFavorite(isInWishlist);
      } catch {
        // ignore
      }
    }

    loadStatus()
    return () => controller.abort()
  }, [courseId, registrationStorageKey, user?.id])

  useEffect(() => {
    if (!isDialogOpen) {
      setIsEditMode(false)
      setIsLoadingRegistration(false)
    }
  }, [isDialogOpen])

  useEffect(() => {
    if (
      registrationStatus !== "APPROVED" &&
      registrationStatus !== "PAYMENT_PENDING" &&
      registrationStatus !== "PAYMENT_REJECTED"
    ) {
      setReceiptFile(null)
      setPaymentError("")
    }
  }, [registrationStatus])

  useEffect(() => {
    if (!isPaymentDialogOpen) return
    const stored = readReceiptInfo()
    if (stored) {
      setReceiptInfo({
        name: stored?.name ?? "",
        note: stored?.note ?? ""
      })
    } else {
      setReceiptInfo({ name: "", note: "" })
    }
    if (!expandedBankId && bankAccounts.length) {
      setExpandedBankId(bankAccounts[0].id)
    }
  }, [bankAccounts, expandedBankId, isPaymentDialogOpen])

  useEffect(() => {
    // We removed the IntersectionObserver logic and replaced it with pure CSS animations
    // to prevent race conditions that keep cards hidden.
  }, [])
  // ── Loading / error guards ───────────────────────────────────────────────
  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-lg">جاري تحميل تفاصيل الدورة...</span>
      </div>
    )
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p className="text-xl">{courseError ?? "الدورة غير موجودة"}</p>
        <Button variant="outline" onClick={() => router.back()}>العودة</Button>
      </div>
    )
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden bg-gradient-to-l from-blue-950 via-blue-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 pt-6 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="rounded-full transition-all duration-200 hover:shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950"
            >
              <Link href="/student/courses">
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة للاستكشاف
              </Link>
            </Button>
            <Badge className="bg-white/10 text-white border border-white/20">
              {course.category}
            </Badge>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
            <div className="flex flex-col gap-4 text-right">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
                {course.title}
              </h1>
              <p className="text-lg text-blue-100 leading-relaxed motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:delay-100">
                {course.shortDescription}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-200">سعر الدورة</span>
                <span className="text-2xl font-bold">{formatYER(course.price)}</span>
              </div>
              <div className="grid gap-3 text-sm text-blue-100 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(course.startDate)} - {formatDate(course.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>المقاعد المتاحة: {course.maxStudents}</span>
                </div>
                <div className="flex items-center gap-2">
                  {course.deliveryType === "online" || course.deliveryType === "hybrid" ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  <span>{deliveryLabels[course.deliveryType] ?? course.deliveryType}</span>
                </div>
                {course.sessions[0]?.room && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <button
                      type="button"
                      onClick={() => {
                        const roomId = course.sessions[0]?.room?.id;
                        if (roomId) openHallModal(roomId);
                      }}
                      className="text-right hover:text-blue-200 hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1 -mx-1"
                    >
                      {course.sessions[0].room.name}
                    </button>
                  </div>
                )}
              </div>
              {(() => {
                const firstMeetingLink = course.sessions.find(s => s.meetingLink)?.meetingLink
                return firstMeetingLink && (
                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      href={firstMeetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-200 underline underline-offset-4 self-start"
                    >
                      رابط الاجتماع
                    </a>
                  </div>
                )
              })()}
              <div className="flex flex-wrap gap-2">
                {(course.tags ?? []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-white/10 text-white border border-white/10 transition-all duration-150 hover:bg-white/15 hover:-translate-y-0.5"
                  >
                    <Tag className="ml-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                {registrationStatus === "NONE" && (
                  <Button
                    className="w-full rounded-full bg-white text-blue-900 hover:bg-blue-50 text-base font-semibold h-12 sm:w-auto sm:px-10 transition-all duration-200 hover:shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-950 animate-cta-pop"
                    onClick={() => openRegistrationDialog("create")}
                  >
                    التسجيل
                  </Button>
                )}
                {registrationStatus === "PENDING_APPROVAL" && (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full rounded-full border-white/60 bg-white text-blue-900 text-base font-semibold h-12 sm:w-auto sm:px-10 transition-all duration-200 opacity-70 cursor-not-allowed"
                  >
                    تم التسجيل مبدئيًا
                  </Button>
                )}
                {registrationStatus === "REJECTED" && (
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-white/60 bg-white text-blue-900 hover:bg-blue-50 text-base font-semibold h-12 sm:w-auto sm:px-10 transition-all duration-200"
                    onClick={() => openRegistrationDialog("edit")}
                  >
                    تعديل التسجيل المبدئي
                  </Button>
                )}
                {registrationStatus === "APPROVED" && (
                  <Button
                    className="w-full rounded-full bg-white text-blue-900 hover:bg-blue-50 text-base font-semibold h-12 sm:w-auto sm:px-10 transition-all duration-200"
                    onClick={() => setIsPaymentDialogOpen(true)}
                  >
                    تأكيد الدفع
                  </Button>
                )}
                {registrationStatus === "PAYMENT_PENDING" && (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full rounded-full border-white/60 bg-white text-blue-900 text-base font-semibold h-12 sm:w-auto sm:px-10 transition-all duration-200 opacity-70 cursor-not-allowed"
                  >
                    تم إرسال الدفع
                  </Button>
                )}
                {registrationStatus === "PAYMENT_REJECTED" && (
                  <Button
                    className="w-full rounded-full bg-white text-blue-900 hover:bg-blue-50 text-base font-semibold h-12 sm:w-auto sm:px-10 transition-all duration-200"
                    onClick={() => setIsPaymentDialogOpen(true)}
                  >
                    تعديل سند الدفع
                  </Button>
                )}
                {registrationStatus === "ENROLLED" && (
                  <Button
                    className="w-full rounded-full bg-white text-blue-900 hover:bg-blue-50 text-base font-semibold h-12 sm:w-auto sm:px-10 transition-all duration-200"
                    onClick={() => {
                      saveEnrollment()
                      router.push(`/student/courses/${courseId}`)
                    }}
                  >
                    الانتقال إلى الدورة
                  </Button>
                )}
                <DialogContent
                  dir="rtl"
                  className="[&>button[data-dialog-close='default']]:hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4"
                >
                  <DialogClose className="absolute left-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30">
                    <X className="h-4 w-4" />
                    <span className="sr-only">إغلاق</span>
                  </DialogClose>
                  <DialogHeader className="space-y-3 text-right sm:text-right">
                    <DialogTitle>
                      {isEditMode ? "تعديل التسجيل المبدئي" : "التسجيل المبدئي"}
                    </DialogTitle>
                    <DialogDescription className="text-right">
                      {isEditMode
                        ? "حدّث بيانات التسجيل المبدئي قبل إكمال الخطوات."
                        : "أدخل بياناتك للتواصل وتأكيد التسجيل المبدئي."}
                    </DialogDescription>
                  </DialogHeader>
                  {formErrors.submit && (
                    <p className="text-sm text-red-500 text-right">{formErrors.submit}</p>
                  )}
                  {isLoadingRegistration ? (
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <div className="h-4 w-24 rounded bg-slate-200/60" />
                        <div className="h-10 w-full rounded-lg bg-slate-200/60 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-28 rounded bg-slate-200/60" />
                        <div className="h-10 w-full rounded-lg bg-slate-200/60 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-24 rounded bg-slate-200/60" />
                        <div className="h-10 w-full rounded-lg bg-slate-200/60 animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم الكامل</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="اكتب اسمك"
                        />
                        {formErrors.name && (
                          <p className="text-xs text-red-500 text-right">{formErrors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@email.com"
                        />
                        {formErrors.email && (
                          <p className="text-xs text-red-500 text-right">{formErrors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">رقم الهاتف</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="05xxxxxxxx"
                        />
                        {formErrors.phone && (
                          <p className="text-xs text-red-500 text-right">{formErrors.phone}</p>
                        )}
                      </div>
                      {shouldShowSurvey && (
                        <div className="space-y-2">
                          <Label>الاستبيان (اختياري)</Label>
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
                            <p className="text-sm text-slate-600">
                              الاستبيان اختياري، لكنه يساعدنا في تحسين تجربتك التعليمية.
                            </p>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-full px-4"
                            >
                              <a href="#" target="_blank" rel="noopener noreferrer">
                                فتح الاستبيان
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      onClick={handleRegister}
                      disabled={isLoadingRegistration || isSubmitting}
                      className="w-full transition-all duration-200 hover:shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:ring-offset-2"
                    >
                      {isSubmitting
                        ? "جارٍ الإرسال..."
                        : isEditMode
                          ? "حفظ التعديلات"
                          : "تأكيد التسجيل"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {registrationStatus === "PENDING_APPROVAL" && (
                <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-right text-sm text-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.18)] backdrop-blur">
                  <p className="font-semibold">طلبك قيد المراجعة</p>
                  <p className="mt-1 text-xs text-white/70">
                    سيتم إشعارك عند اعتماد التسجيل من المدرب.
                  </p>
                </div>
              )}
              {registrationStatus === "PAYMENT_PENDING" && (
                <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-right text-sm text-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.18)] backdrop-blur">
                  <p className="font-semibold">تم إرسال سند الدفع</p>
                  <p className="mt-1 text-xs text-white/70">
                    جاري مراجعة الدفع من المدرب. سيتم إشعارك بعد التأكيد.
                  </p>
                </div>
              )}
              {registrationStatus === "PAYMENT_REJECTED" && (
                <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-right text-sm text-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.18)] backdrop-blur">
                  <p className="font-semibold text-red-200">تم رفض الدفع</p>
                  <p className="mt-1 text-xs text-red-100/80">
                    يرجى تعديل سند الدفع وإعادة الإرسال.
                  </p>
                </div>
              )}

              {registrationStatus !== "NONE" && (
                <div
                  key={registrationStatus}
                  dir="rtl"
                  className={`mt-4 rounded-2xl border p-4 text-right text-sm backdrop-blur animate-stepper-reveal ${registrationStatus === "PENDING_APPROVAL"
                    ? "border-white/10 bg-white/5 text-white/70 shadow-none opacity-75"
                    : "border-white/15 bg-white/10 text-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.2)]"
                    }`}
                >
                  <div className="relative flex flex-nowrap items-start gap-0 overflow-x-auto pb-1">
                    {steps.map((step, index) => {
                      const state = getStepState(step.id)
                      const isLast = index === steps.length - 1
                      const circleClass =
                        state === "completed"
                          ? "bg-emerald-500 text-white"
                          : state === "active"
                            ? "bg-blue-500 text-white ring-4 ring-blue-400/30"
                            : state === "rejected"
                              ? "bg-red-500 text-white"
                              : "border border-white/30 bg-slate-900/80 text-white/70"

                      return (
                        <Fragment key={step.id}>
                          <div className="relative z-10 flex min-w-[88px] flex-col items-center text-center">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ease-in-out ${circleClass} ${state === "active" ? "animate-stepper-pop" : ""
                                }`}
                            >
                              {state === "completed" && <Check className="h-4 w-4" />}
                              {state === "rejected" && <X className="h-4 w-4" />}
                              {state !== "completed" && state !== "rejected" && step.id}
                            </div>
                            <span className="mt-2 text-xs font-medium text-white/90">
                              {step.label}
                            </span>
                          </div>
                          {!isLast && (
                            <div className="relative z-0 flex-1 -mx-5">
                              <div
                                className={`pointer-events-none absolute top-5 h-1 w-full -translate-y-1/2 rounded-full transition-colors duration-300 ${getConnectorClass(step.id)}`}
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </Fragment>
                      )
                    })}
                  </div>

                </div>
              )}
            </div>

            <div className="relative -mt-4 aspect-square w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-lg animate-image-reveal">
              <button
                type="button"
                onClick={toggleFavorite}
                aria-label="إضافة إلى المفضلة"
                aria-pressed={isFavorite}
                className={`absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-white/90 shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 text-red-500`}
              >
                <Heart
                  className={`h-5 w-5 transition-transform duration-200 ${isFavorite ? "fill-current text-red-500 scale-110" : ""}`}
                />
              </button>
              <Image
                src={resolveImage(course.image)}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 360px, 420px"
                unoptimized={true}
              />
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-slate-50" />
      </div>

      <div className="container mx-auto px-4 py-10">
        <Card
          dir="rtl"
          className="mb-6 w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
          data-reveal
          style={{ "--reveal-delay": "0ms" } as CSSProperties}
        >
          <div className="text-right space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {((course as any).staffTrainers?.length ?? 0) > 1 ? "المدربون" : "معلومات المدرب"}
            </h3>

            {/* Multi-trainer support: show all trainers if staffTrainers available */}
            {(course as any).staffTrainers?.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {(course as any).staffTrainers.map((t: any) => (
                  <div key={t.id} className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:bg-white hover:shadow-md hover:border-blue-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-200 shadow-sm transition-transform group-hover:scale-105">
                        <div className="flex h-full w-full items-center justify-center text-xl font-black text-blue-600 bg-blue-50">
                          {t.name?.charAt(0) ?? "م"}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-base font-bold text-slate-900 truncate">{t.name}</h4>
                        {t.specialties?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {t.specialties.slice(0, 2).map((s: string) => (
                              <span key={s} className="inline-block rounded-lg bg-blue-100/50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {t.bio && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 border-r-2 border-blue-200 pr-2 mr-1">
                        {t.bio}
                      </p>
                    )}

                    <div className="mt-auto flex flex-col gap-1.5 pt-2">
                      {t.phone && (
                        <a
                          href={formatWhatsAppLink(t.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group/link"
                        >
                          <div className="rounded-full bg-emerald-50 p-1 group-hover/link:bg-emerald-100">
                             <Phone className="h-3 w-3" />
                          </div>
                          <span className="dir-ltr hover:underline decoration-emerald-200 underline-offset-4">{t.phone}</span>
                        </a>
                      )}
                      {t.email && (
                        <a
                          href={`mailto:${t.email}`}
                          className="flex items-center gap-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors group/link"
                        >
                          <div className="rounded-full bg-blue-50 p-1 group-hover/link:bg-blue-100">
                            <Mail className="h-3 w-3" />
                          </div>
                          <span className="truncate max-w-[180px] hover:underline decoration-blue-200 underline-offset-4">{t.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Legacy single instructor fallback */
              <div className="flex flex-col sm:flex-row items-start gap-5 p-2">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md bg-slate-100">
                  <Image
                    src={resolveImage(course.instructor.avatar)}
                    alt={course.instructor.name}
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
                <div className="space-y-3 flex-1">
                  <h4 className="text-xl font-black text-slate-900">
                    {course.instructor.name}
                  </h4>
                  
                  {course.instructor.bio && (
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 max-w-[600px] bg-slate-100/30 p-3 rounded-xl border border-slate-200">
                      {course.instructor.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 pt-1">
                    {course.instructor.phone && (
                      <a
                        href={formatWhatsAppLink(course.instructor.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-all group/link"
                      >
                        <div className="rounded-full bg-emerald-50 p-2 group-hover/link:bg-emerald-100">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span className="dir-ltr hover:underline decoration-emerald-200 underline-offset-4">{course.instructor.phone}</span>
                      </a>
                    )}
                    {course.instructor.email && (
                      <a
                        href={`mailto:${course.instructor.email}`}
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-all group/link"
                      >
                        <div className="rounded-full bg-blue-50 p-2 group-hover/link:bg-blue-100">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="hover:underline decoration-blue-200 underline-offset-4">{course.instructor.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Institute Info Section */}
        {(course as any).institute && (
          <Card
            dir="rtl"
            className="mb-8 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08)] overflow-hidden relative"
            data-reveal
            style={{ "--reveal-delay": "50ms" } as CSSProperties}
          >
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-600" />
            <div className="text-right space-y-4 pr-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                المعهد المستضيف
              </h3>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition-transform hover:scale-105 duration-300">
                  {(course as any).institute.logo ? (
                    <Image
                      src={resolveImage((course as any).institute.logo)}
                      alt={(course as any).institute.name}
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <Building2 className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="space-y-4 flex-1 text-center sm:text-right w-full">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                    <h4 className="text-2xl font-black text-slate-900">{(course as any).institute.name}</h4>
                  </div>
                  
                  {(course as any).institute.description && (
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 max-w-[90%] bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {(course as any).institute.description}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                    {(course as any).institute.phone && (
                      <a
                        href={formatWhatsAppLink((course as any).institute.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-all group/link"
                      >
                        <div className="rounded-full bg-emerald-50 p-2 group-hover/link:bg-emerald-100">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span className="dir-ltr hover:underline decoration-emerald-200 underline-offset-4">{(course as any).institute.phone}</span>
                      </a>
                    )}
                    {(course as any).institute.email && (
                      <a
                        href={`mailto:${(course as any).institute.email}`}
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-all group/link"
                      >
                        <div className="rounded-full bg-blue-50 p-2 group-hover/link:bg-blue-100">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="hover:underline decoration-blue-200 underline-offset-4">{(course as any).institute.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            className="h-full transition-shadow duration-200 hover:shadow-md reveal-card"
            data-reveal
            style={{ "--reveal-delay": "0ms" } as CSSProperties}
          >
            <CardHeader>
              <CardTitle>عن الدورة</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-700">
              {course.description}
            </CardContent>
          </Card>

          <Card
            className="h-full transition-shadow duration-200 hover:shadow-md reveal-card"
            data-reveal
            style={{ "--reveal-delay": "100ms" } as CSSProperties}
          >
            <CardHeader>
              <CardTitle>أهداف الدورة</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {(course.objectives ?? []).map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card
            className="h-full transition-shadow duration-200 hover:shadow-md reveal-card"
            data-reveal
            style={{ "--reveal-delay": "200ms" } as CSSProperties}
          >
            <CardHeader>
              <CardTitle>المتطلبات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(course.prerequisites ?? []).map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card
            className="h-full transition-shadow duration-200 hover:shadow-md reveal-card"
            data-reveal
            style={{ "--reveal-delay": "300ms" } as CSSProperties}
          >
            <CardHeader>
              <CardTitle>الجدول الزمني</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(course.sessions ?? []).map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>{formatDate(item.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(item.startTime).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(item.endTime).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {item.topic && (
                    <div className="text-slate-500">{item.topic}</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent
          dir="rtl"
          className="max-w-3xl [&>button[data-dialog-close='default']]:hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4"
        >
          <DialogClose className="absolute left-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30">
            <X className="h-4 w-4" />
            <span className="sr-only">إغلاق</span>
          </DialogClose>
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="text-right">
              {registrationStatus === "PAYMENT_REJECTED" ? "تعديل سند الدفع" : "تأكيد الدفع"}
            </DialogTitle>
            <DialogDescription className="text-right">
              يرجى تحويل المبلغ وإرفاق سند الدفع لإكمال الخطوة.
            </DialogDescription>
          </DialogHeader>

          {/* Payment Summary */}
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-right">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-blue-600 font-medium">المبلغ المطلوب سداده</span>
                <span className="text-2xl font-bold text-blue-900">{formatYER(course.price)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block mb-1">بيانات الدورة</span>
                <span className="text-sm font-semibold text-slate-900 truncate max-w-[200px] block">
                  {course.title}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-col gap-6">
              {/* Bank Accounts Section (Now at the top) */}
              <div className="space-y-4 text-right">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-slate-900">الحسابات البنكية</h4>
                    <span className="text-xs text-slate-500">اختر بنكًا لعرض التفاصيل</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {bankAccounts.map((bank) => {
                      const isOpen = expandedBankId === bank.id
                      const hasIban = Boolean(bank.iban)
                      const hasAccountNumber = Boolean(bank.accountNumber)
                      return (
                        <div key={bank.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-200">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBankId((prev) => (prev === bank.id ? null : bank.id))
                            }
                            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors ${isOpen ? "bg-slate-50" : "hover:bg-slate-50/50"}`}
                            aria-expanded={isOpen}
                          >
                            <span className="text-sm font-semibold text-slate-900">
                              {bank.bankName}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="border-t border-slate-200 px-4 py-4 text-right text-sm space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">اسم المستفيد</p>
                                <p className="text-sm font-bold text-slate-900">{bank.beneficiary}</p>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                {hasAccountNumber && (
                                  <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">رقم الحساب</p>
                                    <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                      <span className="font-mono text-xs font-bold text-slate-700">{bank.accountNumber}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyValue(bank.accountNumber ?? "", "رقم الحساب")}
                                        className="text-blue-600 hover:text-blue-700 transition"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {hasIban && (
                                  <div className="space-y-1.5">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">رقم IBAN</p>
                                    <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                      <span className="font-mono text-xs font-bold text-slate-700">{bank.iban}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyValue(bank.iban ?? "", "رقم الآيبان")}
                                        className="text-blue-600 hover:text-blue-700 transition"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Payment Upload Section (Now at the bottom) */}
              <div className="space-y-4 text-right">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-slate-900">رفع سند الدفع</h4>
                    <span className="text-xs text-slate-500 font-medium">صور أو ملفات PDF</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_200px]">
                    <div
                      onDragOver={(event) => {
                        event.preventDefault()
                        setIsDraggingFile(true)
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(event) => {
                        event.preventDefault()
                        setIsDraggingFile(false)
                        const file = event.dataTransfer.files?.[0] ?? null
                        handleReceiptFile(file)
                      }}
                      onClick={() => paymentFileRef.current?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-sm transition-all duration-200 ${isDraggingFile ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                    >
                      <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-700">اسحب الملف هنا</p>
                        <p className="text-xs text-slate-400 mt-1">أو انقر لاختيار ملف من جهازك</p>
                      </div>
                      <Input
                        ref={paymentFileRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null
                          handleReceiptFile(file)
                        }}
                      />
                    </div>

                    {/* Image Preview Area */}
                    <div className="relative aspect-[4/5] md:aspect-auto md:h-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                      {receiptFile && receiptFile.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(receiptFile)}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : receiptFile ? (
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                          <FileText className="h-8 w-8 text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-500 break-all">{receiptFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-300">
                          <ImageIcon className="h-8 w-8 opacity-20" />
                          <span className="text-[10px] font-medium">لا يوجد معاينة</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(receiptFile?.name || receiptInfo.name) && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-white p-2 border border-blue-100">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                              {receiptFile?.name ?? receiptInfo.name}
                            </p>
                            {receiptFile && (
                              <p className="text-[10px] text-slate-500 font-medium">
                                {receiptFile.type.split('/')[1].toUpperCase()} · {formatFileSize(receiptFile.size)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReceiptFile(null)
                            setReceiptInfo((prev) => ({ ...prev, name: "" }))
                          }}
                          className="h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {!receiptFile?.name && !receiptInfo.name && (
                    <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-xs font-medium">بانتظار رفع سند الدفع...</p>
                    </div>
                  )}
                  {paymentError && <p className="mt-2 text-xs font-bold text-red-500">{paymentError}</p>}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              onClick={handlePaymentConfirmation}
              disabled={isUpdatingStatus || (!receiptFile?.name && !receiptInfo.name)}
              className="w-full"
            >
              تأكيد الدفع
            </Button>
            {!receiptFile?.name && !receiptInfo.name && (
              <p className="mt-2 text-xs text-red-500 text-right">
                ارفع السند أولاً لتفعيل زر التأكيد.
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes cta-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        @keyframes image-reveal {
          0% { opacity: 0; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }

        .animate-cta-pop {
          animation: cta-pop 260ms ease-out 1;
        }

        .animate-image-reveal {
          animation: image-reveal 320ms ease-out 1;
        }

        @keyframes reveal {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .reveal-card {
          animation: reveal 400ms ease forwards;
          animation-delay: var(--reveal-delay, 0ms);
          opacity: 0; /* starts hidden, animation makes it visible */
        }


        @keyframes stepper-reveal {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-stepper-reveal {
          animation: stepper-reveal 320ms ease-out 1;
        }

        @keyframes stepper-pop {
          0% { transform: scale(1); }
          60% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }

        .animate-stepper-pop {
          animation: stepper-pop 320ms ease-in-out 1;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal-card {
            opacity: 1;
            animation: none;
          }
          .animate-cta-pop,
          .animate-image-reveal {
            animation: none;
          }
        }
      `}</style>

      {/* Hall Information Modal */}
      <Dialog open={isHallModalOpen} onOpenChange={setIsHallModalOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0 rounded-2xl border-none shadow-2xl [&>button[data-dialog-close='default']]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>معلومات القاعة التدريبية</DialogTitle>
          </DialogHeader>

          {hallData && (
            <div className="flex flex-col text-right" dir="rtl">
              {/* Hall Header/Image */}
              <div className="relative h-48 w-full bg-slate-100">
                {hallData.image && !hallImageError ? (
                  <Image
                    src={resolveImage(hallData.image)}
                    alt={hallData.name}
                    fill
                    className="object-cover"
                    unoptimized={true}
                    onError={() => setHallImageError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 right-4 text-white">
                  <h3 className="text-xl font-bold mb-0">{hallData.name}</h3>

                </div>
                <DialogClose className="absolute left-4 top-4 rounded-full bg-black/20 p-2 text-white hover:bg-black/40 transition-colors">
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>

              <div className="p-6 space-y-5">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-500 mb-1">نوع القاعة</p>
                    <p className="text-sm font-bold text-slate-900">{hallData.type || "—"}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-500 mb-1">السعة الاستيعابية</p>
                    <p className="text-sm font-bold text-slate-900">{hallData.capacity} مقعد</p>
                  </div>
                </div>

                {/* Location Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">الموقع</p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {hallData.location || "الموقع غير محدد بدقة"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <p className="text-[10px] text-slate-500 mb-0.5">الجهة المالكة</p>
                        <p className="text-sm font-bold text-slate-900">{hallData.instituteName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-3 text-right" dir="rtl">
                  {hallData.locationUrl && (
                    <Button
                      variant="outline"
                      className="rounded-full border-slate-200 h-11 font-cairo"
                      asChild
                    >
                      <a href={hallData.locationUrl} target="_blank" rel="noopener noreferrer">
                        خرائط جوجل
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
