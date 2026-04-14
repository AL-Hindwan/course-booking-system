"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Cairo } from "next/font/google"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { studentService } from "@/lib/student-service"
import { formatDate, formatTime, getFileUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Calendar,
  Clock,
  FileText,
  PlayCircle,
  Award,
  MessageSquare,
  Video,
  Globe,
  MapPin,
  Ban,
  Lock,
  AlertCircle,
  Phone,
  Mail,
  ShieldCheck,
  GraduationCap,
  ImageIcon,
  X,
  Play,
  CheckCircle2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Layout,
  BookOpen,
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  MoreVertical,
  LogOut,
  User,
  ExternalLink,
  Download,
  Upload,
  Heart,
  Eye,
  Star,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  FileIcon,
  HelpCircle,
  Info,
  Check,
  Filter,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Edit,
  BarChart,
  PieChart,
  Home,
  Briefcase,
  CreditCard
} from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
})

function StudentCourseContent() {
  const params = useParams()
  const courseId = params.id as string
  const router = useRouter()
  const searchParams = useSearchParams()

  const [courseData, setCourseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hall Information Modal
  const [isHallModalOpen, setIsHallModalOpen] = useState(false)
  const [hallData, setHallData] = useState<any>(null)
  const [isLoadingHall, setIsLoadingHall] = useState(false)
  const [hallImageError, setHallImageError] = useState(false)
  
  const formatWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    return `https://wa.me/${cleanPhone}`
  }

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

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true)
        const data = await studentService.getCourseDetails(courseId)
        setCourseData(data)
      } catch (err: any) {
        console.error("Error fetching course details:", err)
        setError(err.message || "حدث خطأ أثناء جلب بيانات الدورة")
        toast.error("خطأ في جلب بيانات الدورة")
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourseDetails()
    }
  }, [courseId])

  if (loading) {
    return (
      <div className={`${cairo.className} min-h-screen bg-slate-50 pb-20`} dir="rtl" lang="ar">
        <div className="bg-blue-950 p-12">
          <Skeleton className="h-10 w-1/3 mb-4 bg-white/20" />
          <Skeleton className="h-6 w-1/2 bg-white/10" />
        </div>
        <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !courseData) {
    return (
      <div className={`${cairo.className} min-h-screen flex items-center justify-center`} dir="rtl">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">{error || "لم يتم العثور على الدورة"}</h2>
          <Button asChild>
            <Link href="/student/my-courses">العودة إلى دوراتي</Link>
          </Button>
        </Card>
      </div>
    )
  }

  // Simplified enrollment check based on what we fetched
  // If the API returned it, the user is authorized.
  // We can further check the enrollment status if we want to redirect to the public page.
  const isEnrolled = !!courseData
  const isCompleted = courseData.enrollmentStatus === 'COMPLETED' || courseData.enrollmentStatus === 'completed' || searchParams.get('status') === 'completed'
  const isCancelled = courseData.enrollmentStatus === 'CANCELLED' || courseData.enrollmentStatus === 'cancelled' || searchParams.get('status') === 'cancelled'
  const isPreliminary = courseData.enrollmentStatus === 'PRELIMINARY' || courseData.enrollmentStatus === 'preliminary'
  const isPendingPayment = courseData.enrollmentStatus === 'PENDING_PAYMENT' || courseData.enrollmentStatus === 'pending_payment'
  const isPending = isPreliminary || isPendingPayment
  const isActive = courseData.enrollmentStatus === 'ACTIVE' || courseData.enrollmentStatus === 'active'
  const shouldLockContent = isCancelled || isPending

  const safeText = (value: string | undefined | null, fallback: string) => {
    if (typeof value !== "string") return fallback
    const trimmed = value.trim()
    return trimmed.length ? trimmed : fallback
  }

  const courseTitle = safeText(courseData.title, "عنوان الدورة")
  const courseDescription = safeText(courseData.description, "لا يوجد وصف للدورة حالياً.")
  const courseShortDescription = safeText(courseData.shortDescription, courseDescription)
  const courseDeliveryType = safeText(courseData.deliveryType, "أونلاين")
  const coursePlatform = courseDeliveryType === "حضوري" 
    ? safeText(courseData.locationName, "القاعة التدريبية")
    : safeText(courseData.onlinePlatform, "Zoom")
  const courseImage = getFileUrl(courseData.image) || "/images/course-abstract.svg"

  const instructor = courseData.instructor || {}
  const instructorName = safeText(instructor.name, "مدرب الدورة")
  const instructorRole = safeText(instructor.role, "")
  const instructorAvatar = getFileUrl(instructor.avatar) || "/images/avatar-1.png"

  const sessions = courseData.sessions || []
  const sessionDates = sessions.map((s: any) => s.startTime ? formatDate(s.startTime) : "").filter(Boolean)

  const dateRangeLabel = (() => {
    if (!courseData.startDate || !courseData.endDate) return "غير محدد"
    return `${formatDate(courseData.startDate)} - ${formatDate(courseData.endDate)}`
  })()

  const DEFAULT_SESSION_MINUTES = 60
  const lessonOrderLabels = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"]

  // ... (rest of helper functions same)
  const getSessionTimeLabel = (session: any) => {
    if (session.startTime && session.endTime) {
      return `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`
    }
    return session.startTime ? formatTime(session.startTime) : "غير محدد"
  }

  const firstSessionTimeLabel = sessions.length > 0 ? getSessionTimeLabel(sessions[0]) : "غير محدد"
  const totalSessions = sessions.length

  const getSessionDurationMinutes = (session: any) => {
    if (!session.startTime || !session.endTime) return DEFAULT_SESSION_MINUTES
    const start = new Date(session.startTime).getTime()
    const end = new Date(session.endTime).getTime()
    return Math.round((end - start) / (1000 * 60))
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    if (remainder === 0) {
      if (hours === 1) return "ساعة"
      if (hours === 2) return "ساعتين"
      return `${hours} ساعات`
    }
    return `${hours} ساعة و ${remainder} دقيقة`
  }

  const getLessonLabel = (index: number) => `الدرس ${lessonOrderLabels[index] || index + 1}`

  const nextUpcomingSessionData = courseData.nextSession
  const nextJoinLink = nextUpcomingSessionData?.meetingLink
  const nextLessonTitle = nextUpcomingSessionData?.topic || "الدرس القادم"

  // Find index of next session in the list
  const nextUpcomingIndex = sessions.findIndex((s: any) => s.id === nextUpcomingSessionData?.id)

  return (
    <div className={`${cairo.className} min-h-screen bg-slate-50 pb-20`} dir="rtl" lang="ar">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-l from-blue-950 via-blue-900 to-slate-900 text-white">
        <div className="container mx-auto px-4 pt-6 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="h-8 rounded-full px-4 text-xs transition-all duration-200 hover:shadow-md active:scale-[0.99]"
            >
              <Link href="/student/my-courses">العودة إلى دوراتي</Link>
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_240px] items-center">
            <div className="space-y-3 text-right">
              <h2 className="text-2xl md:text-3xl font-semibold leading-tight line-clamp-2">
                {courseTitle}
              </h2>
              <p className="text-sm text-blue-100/70 leading-relaxed line-clamp-2 max-w-2xl">
                {courseShortDescription}
              </p>

              <div className="grid gap-x-6 gap-y-3 pt-4 text-sm text-blue-100 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span>النوع: {courseDeliveryType}</span>
                </div>
                <div className="flex items-center gap-2">
                  {courseDeliveryType === "حضوري" ? (
                    <MapPin className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Video className="h-4 w-4 text-blue-400" />
                  )}
                  <span>
                    {courseDeliveryType === "حضوري" ? "القاعة/المكان:" : "المنصة:"}{" "}
                    {(courseDeliveryType === "حضوري" || courseDeliveryType === "هجين") && courseData.sessions?.[0]?.roomId ? (
                      <button
                        type="button"
                        onClick={() => openHallModal(courseData.sessions[0].roomId)}
                        className="text-right hover:text-blue-200 hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 rounded px-1 -mx-1"
                      >
                        {coursePlatform}
                      </button>
                    ) : (
                      coursePlatform
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>{dateRangeLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-400" />
                  <span>عدد الدروس: {totalSessions}</span>
                </div>
              </div>
            </div>

            <div className="relative w-[240px] h-[240px] overflow-hidden rounded-2xl border border-white/15 bg-white/5 mx-auto lg:mx-0">
              <Image
                src={courseImage}
                alt={courseTitle}
                fill
                className="object-cover"
                sizes="240px"
                unoptimized={true}
              />
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-slate-50" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Right Column (Main) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Banners */}
            {isCompleted ? (
              <Card className="rounded-2xl border border-green-100 bg-green-50 shadow-sm">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="p-4 bg-white rounded-full shadow-sm text-green-500 border border-green-100">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-xl text-green-900 mb-2">مبروك! لقد أتممت الدورة بنجاح</h3>
                    <p className="text-green-700">تم الانتهاء من كافة المتطلبات التعليمية للدورة بنجاح. نتمنى لك التوفيق.</p>
                  </div>
                </CardContent>
              </Card>
            ) : isCancelled ? (
              <Card className="rounded-2xl border border-red-100 bg-red-50 shadow-sm">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="p-4 bg-white rounded-full shadow-sm text-red-500 border border-red-100">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-xl text-red-900 mb-2">عذراً، تم إلغاء اشتراكك في هذه الدورة</h3>
                    <p className="text-red-700">لم يعد بإمكانك الوصول لمحتوى الدورة أو الجدول الدراسي. يرجى مراجعة الإدارة.</p>
                  </div>
                </CardContent>
              </Card>
            ) : isPreliminary ? (
              <Card className="rounded-2xl border border-amber-100 bg-amber-50 shadow-sm">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="p-4 bg-white rounded-full shadow-sm text-amber-500 border border-amber-100">
                    <Info className="w-10 h-10" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-xl text-amber-900 mb-2">طلب التسجيل قيد المراجعة</h3>
                    <p className="text-amber-700">طلبك حالياً قيد التدقيق من قبل الإدارة. سيتم إشعارك وتفعيل المحتوى فور القبول.</p>
                  </div>
                </CardContent>
              </Card>
            ) : isPendingPayment ? (
              <Card className="rounded-2xl border border-indigo-100 bg-indigo-50 shadow-sm">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="p-4 bg-white rounded-full shadow-sm text-indigo-500 border border-indigo-100">
                    <CreditCard className="w-10 h-10" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-xl text-indigo-900 mb-2">بانتظار إتمام عملية الدفع</h3>
                    <p className="text-indigo-700">تم قبول طلبك المبدئي! يرجى سداد رسوم الدورة لتتمكن من الوصول للجدول والإعلانات.</p>
                  </div>
                </CardContent>
              </Card>
            ) : nextUpcomingSessionData && isActive ? (
              <Card className="rounded-2xl border border-blue-200 bg-blue-50 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-2 text-right">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {nextLessonTitle}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      <span dir="rtl">{formatDate(nextUpcomingSessionData.startTime)}</span>
                      <span dir="rtl">{formatTime(nextUpcomingSessionData.startTime)}</span>
                    </div>
                  </div>

                  {nextJoinLink && (
                    <Button
                      className="h-9 rounded-full bg-white text-blue-600 hover:bg-blue-50 font-semibold gap-2 px-5 shadow-sm text-sm border-2 border-transparent hover:border-blue-100 transition-all font-cairo"
                      asChild
                    >
                      <a href={nextJoinLink} target="_blank" rel="noopener noreferrer">
                        <Play className="w-4 h-4 fill-current" />
                        انضمام للدرس
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Tabs defaultValue="schedule" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-auto p-1 bg-slate-100/80 rounded-full gap-1">
                <TabsTrigger
                  value="schedule"
                  className="rounded-full py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  الجدول الدراسي
                </TabsTrigger>
                <TabsTrigger
                  value="announcements"
                  className="rounded-full py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  الإعلانات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="mt-6 relative">
                {shouldLockContent && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center px-4">
                    <Lock className="w-12 h-12 text-slate-400 mb-2" />
                    <h3 className="font-bold text-lg text-slate-900">الجدول الدراسي مقفل</h3>
                    <p className="text-slate-500 text-sm max-w-xs">يجب إتمام عملية التسجيل وتفعيل الحساب لتتمكن من عرض جدول المحاضرات.</p>
                  </div>
                )}
                <div className={shouldLockContent ? "opacity-40 pointer-events-none blur-sm" : ""}>
                  <Card className="rounded-2xl border border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-slate-900 text-lg">جدول الدروس</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sessions.map((session: any, index: number) => {
                        const durationMinutes = getSessionDurationMinutes(session)
                        const sessionTimeLabel = getSessionTimeLabel(session)

                        // Status logic
                        let sessionState = "upcoming"
                        const nowMs = Date.now()
                        const startMs = new Date(session.startTime).getTime()
                        const endMs = new Date(session.endTime).getTime()

                        if (isCompleted || endMs < nowMs) {
                          sessionState = "completed"
                        } else if (nowMs >= startMs && nowMs <= endMs) {
                          sessionState = "current"
                        }

                        const isSessionCompleted = sessionState === "completed"
                        const canJoin = sessionState === "current" && !!session.meetingLink
                        const actionLabel = isSessionCompleted ? "انتهى الدرس" : canJoin ? "انضمام" : "قادم"

                        return (
                          <div
                            key={session.id}
                            className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all ${isSessionCompleted ? "bg-slate-50 opacity-75" : "bg-white hover:border-blue-200"
                              }`}
                          >
                            <div className="flex-1 space-y-2 text-right">
                              <h4 className={`font-bold ${isSessionCompleted ? "text-slate-500" : "text-slate-900"}`}>
                                {session.topic || getLessonLabel(index)}
                              </h4>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                <span className="flex items-center gap-1.5 text-slate-600">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatDate(session.startTime)}
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-600" dir="ltr">
                                  <Clock className="w-3.5 h-3.5" />
                                  {sessionTimeLabel}
                                </span>
                                <span className="text-slate-500">
                                  المدة: {formatDuration(durationMinutes)}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              disabled={!canJoin}
                              className={`rounded-full px-6 text-xs font-bold ${canJoin ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-100 text-slate-400"
                                }`}
                              asChild={canJoin}
                            >
                              {canJoin ? (
                                <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                                  <PlayCircle className="w-4 h-4 ml-1.5" />
                                  {actionLabel}
                                </a>
                              ) : (
                                <span>{actionLabel}</span>
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="announcements" className="mt-6 relative px-1">
                {shouldLockContent && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center px-4">
                    <Bell className="w-12 h-12 text-slate-400 mb-2" />
                    <h3 className="font-bold text-lg text-slate-900">الإعلانات مقفلة</h3>
                    <p className="text-slate-500 text-sm max-w-xs">سيتم إتاحة الوصول للإعلانات والتعميمات بعد تفعيل اشتراكك في الدورة.</p>
                  </div>
                )}
                <div className={shouldLockContent ? "opacity-40 pointer-events-none blur-sm h-[200px]" : "space-y-4"}>
                  {courseData.announcements?.length > 0 ? (
                    courseData.announcements.map((announcement: any) => (
                    <Card key={announcement.id} className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <CardHeader className="bg-slate-50/50 py-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold flex items-center gap-2 text-slate-900">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            {announcement.title}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium" dir="rtl">
                            {formatDate(announcement.createdAt)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4">
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                          {announcement.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-500">لا توجد إعلانات حالياً</div>
                )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

            {/* Trainer & Institute Info - Redesigned Sidebar */}
            <div className="space-y-6">
              {/* Instructor Card */}
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    مدرب الدور
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-6">
                  {/* Master Instructor or Multiple Staff */}
                  {courseData.staffTrainers?.length > 0 ? (
                    <div className="space-y-6">
                      {courseData.staffTrainers.map((t: any) => (
                        <div key={t.id} className="space-y-3 group">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0 group-hover:bg-blue-100 transition-colors">
                              {t.name?.charAt(0) || "م"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{t.name}</p>
                              {t.specialties?.length > 0 && (
                                <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                                  {t.specialties[0]}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {t.bio && (
                            <p className="text-xs text-slate-600 leading-relaxed border-r-2 border-blue-200 pr-2 mr-1 line-clamp-3">
                              {t.bio}
                            </p>
                          )}

                          <div className="flex flex-col gap-1.5 pt-1">
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
                                <span className="truncate hover:underline decoration-blue-200 underline-offset-4">{t.email}</span>
                              </a>
                            )}
                          </div>
                          {courseData.staffTrainers.length > 1 && <Separator className="mt-4 opacity-50" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Single Instructor View */
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 relative rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                          <Image
                            src={instructorAvatar}
                            alt={instructorName}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-900">{instructorName}</p>
                          <p className="text-xs text-blue-600 font-bold">{instructorRole}</p>
                        </div>
                      </div>

                      {instructor.bio && (
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-100/30 p-3 rounded-xl border border-slate-200">
                          {instructor.bio}
                        </p>
                      )}

                      {instructor.specialties?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {instructor.specialties.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <Separator className="my-2 opacity-50" />

                      <div className="space-y-2.5">
                        {instructor.phone && (
                          <a
                            href={formatWhatsAppLink(instructor.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-all group/link"
                          >
                            <div className="rounded-full bg-emerald-50 p-2 group-hover/link:bg-emerald-100">
                              <Phone className="h-4 w-4" />
                            </div>
                            <span className="dir-ltr hover:underline decoration-emerald-200 underline-offset-4">{instructor.phone}</span>
                          </a>
                        )}
                        {instructor.email && (
                          <a
                            href={`mailto:${instructor.email}`}
                            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-all group/link"
                          >
                            <div className="rounded-full bg-blue-50 p-2 group-hover/link:bg-blue-100">
                              <Mail className="h-4 w-4" />
                            </div>
                            <span className="hover:underline decoration-blue-200 underline-offset-4">{instructor.email}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Institute Card */}
              {courseData.institute && (
                <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:bg-blue-100/50" />
                  <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 relative">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      المعهد المستضيف
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4 relative">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm p-1">
                        <Image
                          src={getFileUrl(courseData.institute.logo) || "/images/institute-logo.png"}
                          alt={courseData.institute.name}
                          fill
                          className="object-contain"
                          unoptimized={true}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{courseData.institute.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">مؤسسة تعليمية معتمدة</p>
                      </div>
                    </div>

                    {courseData.institute.description && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {courseData.institute.description}
                      </p>
                    )}

                    <Separator className="my-2 opacity-30" />

                    <div className="space-y-2.5">
                      {courseData.institute.phone && (
                        <a
                          href={formatWhatsAppLink(courseData.institute.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-all group/link"
                        >
                          <div className="rounded-full bg-emerald-50 p-1.5 group-hover/link:bg-emerald-100">
                            <Phone className="h-3.5 w-3.5" />
                          </div>
                          <span className="dir-ltr hover:underline decoration-emerald-200 underline-offset-4">{courseData.institute.phone}</span>
                        </a>
                      )}
                      {courseData.institute.email && (
                        <a
                          href={`mailto:${courseData.institute.email}`}
                          className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-all group/link"
                        >
                          <div className="rounded-full bg-blue-50 p-1.5 group-hover/link:bg-blue-100">
                            <Mail className="h-3.5 w-3.5" />
                          </div>
                          <span className="hover:underline decoration-blue-200 underline-offset-4">{courseData.institute.email}</span>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
        </div>
      </div>
      {/* Hall Information Modal */}
      <Dialog open={isHallModalOpen} onOpenChange={setIsHallModalOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0 rounded-2xl border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>معلومات القاعة التدريبية</DialogTitle>
          </DialogHeader>

          {hallData && (
            <div className="flex flex-col text-right" dir="rtl">
              {/* Hall Header/Image */}
              <div className="relative h-48 w-full bg-slate-100">
                {hallData.image && !hallImageError ? (
                  <Image
                    src={getFileUrl(hallData.image) || ""}
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
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-right">
                    <p className="text-[10px] text-slate-500 mb-1">نوع القاعة</p>
                    <p className="text-sm font-bold text-slate-900">{hallData.type || "—"}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-right">
                    <p className="text-[10px] text-slate-500 mb-1">السعة الاستيعابية</p>
                    <p className="text-sm font-bold text-slate-900">{hallData.capacity} مقعد</p>
                  </div>
                </div>

                {/* Location Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-right">
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

                  <div className="flex items-start gap-3 text-right">
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
                      className="rounded-full border-slate-200 h-11 font-cairo shadow-sm"
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

export default function StudentCourseDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جاري تحميل الدورة...</div>}>
      <StudentCourseContent />
    </Suspense>
  )
}

