"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, Calendar, Clock, Award, FileText, Download, X, CheckCircle, AlertCircle, Play, ArrowLeft, Users, CreditCard, CheckCircle2, Info } from "lucide-react"
import { Course, Enrollment, User } from "@/types"
import { studentService } from "@/lib/student-service"
import { formatDate, formatTime, getFileUrl } from "@/lib/utils"
import { toast } from "sonner"

type EnrollmentWithCourse = {
  id: string
  status: string
  progress: number
  enrolledAt: Date
  course: Course & { 
    image: string,
    trainers?: { id: string, name: string, avatar: string | null }[]
  }
  nextSession?: {
    startTime: string
    endTime: string
    topic: string | null
    type: string
  }
}

const statusVariants = {
  active: {
    label: "سارية",
    activeClass: "bg-white text-slate-900 shadow-sm",
    inactiveClass: "text-slate-600 hover:text-slate-900"
  },
  pending: {
    label: "معلقة",
    activeClass: "bg-white text-slate-900 shadow-sm",
    inactiveClass: "text-slate-600 hover:text-slate-900"
  },
  completed: {
    label: "مكتملة",
    activeClass: "bg-white text-slate-900 shadow-sm",
    inactiveClass: "text-slate-600 hover:text-slate-900"
  },
  cancelled: {
    label: "ملغاة",
    activeClass: "bg-white text-slate-900 shadow-sm",
    inactiveClass: "text-slate-600 hover:text-slate-900"
  },
  pending_payment: {
    label: "قيد الدفع",
    activeClass: "bg-white text-slate-900 shadow-sm",
    inactiveClass: "text-slate-600 hover:text-slate-900"
  },
  preliminary: {
    label: "قيد المراجعة",
    activeClass: "bg-white text-slate-900 shadow-sm",
    inactiveClass: "text-slate-600 hover:text-slate-900"
  }
} as const

type StatusKey = keyof typeof statusVariants

function StatusPill({
  status,
  isActive,
  onClick
}: {
  status: string
  isActive: boolean
  onClick?: () => void
}) {
  const styles = statusVariants[status as StatusKey] || {
    label: status,
    activeClass: "bg-white text-slate-900 shadow-sm",
    inactiveClass: "text-slate-600 hover:text-slate-900"
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 w-full rounded-full px-4 text-sm font-medium text-center transition ${isActive ? styles.activeClass : styles.inactiveClass
        }`}
    >
      {styles.label}
    </button>
  )
}

export default function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState("active")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      const data = await studentService.getMyCourses()
      // Map backend responses if necessary (naming conventions)
      const mapped = data.map((e: any) => ({
        ...e,
        enrolledAt: new Date(e.enrolledAt),
        status: e.status.toLowerCase()
      }))
      setEnrollments(mapped)
    } catch (error) {
      console.error("Failed to fetch courses", error)
      toast.error("فشل في تحميل الدورات")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const getEnrollmentsByStatus = (status: string) => {
    if (status === 'active') {
      return enrollments.filter(e => e.status === 'active')
    }
    if (status === 'pending') {
      return enrollments.filter(e => ['pending_payment', 'preliminary'].includes(e.status))
    }
    return enrollments.filter(enrollment => enrollment.status === status)
  }

  const handleCancelEnrollment = (enrollmentId: string) => {
    setSelectedEnrollment(enrollmentId)
    setShowCancelDialog(true)
  }

  const confirmCancellation = async () => {
    if (!selectedEnrollment) return

    try {
      setIsUpdating(true)
      await studentService.cancelEnrollment(selectedEnrollment)
      toast.success("تم إلغاء التسجيل بنجاح")
      fetchCourses()
      setShowCancelDialog(false)
      setSelectedEnrollment(null)
    } catch (error: any) {
      console.error("Failed to cancel enrollment", error)
      toast.error(error.message || "حدث خطأ أثناء إلغاء التسجيل")
    } finally {
      setIsUpdating(false)
    }
  }

    const renderCourseCard = (enrollment: EnrollmentWithCourse) => {
    const courseLink = `/student/courses/${enrollment.course.id}`

    const isActive = enrollment.status === 'active'
    const hasUpcomingSession = isActive && enrollment.nextSession
    const nextDate = hasUpcomingSession ? new Date(enrollment.nextSession!.startTime) : null

    // Status Message Config
    const statusInfo: Record<string, { icon: any, message: string, color: string, textColor: string, iconColor: string }> = {
      preliminary: { 
        icon: Info, 
        message: "طلب التسجيل قيد المراجعة الجارية من قبل الإدارة وسيتم إشعارك عند القبول", 
        color: "bg-amber-50/50", 
        textColor: "text-amber-800",
        iconColor: "text-amber-600"
      },
      pending_payment: { 
        icon: CreditCard, 
        message: "تم طلب التسجيل بنجاح! يرجى إتمام عملية الدفع لتفعيل الدورة والمباشرة", 
        color: "bg-indigo-50/50", 
        textColor: "text-indigo-800",
        iconColor: "text-indigo-600"
      },
      completed: { 
        icon: CheckCircle2, 
        message: "لقد أكملت هذه الدورة بنجاح وتحصيل نتائجك التعليمية", 
        color: "bg-green-50/50", 
        textColor: "text-green-800",
        iconColor: "text-green-600"
      },
      cancelled: { 
        icon: AlertCircle, 
        message: "تم إلغاء هذا الالتحاق، يمكنك التواصل مع الدعم للمزيد من المعلومات", 
        color: "bg-red-50/50", 
        textColor: "text-red-800",
        iconColor: "text-red-600"
      }
    }

    const currentStatus = statusInfo[enrollment.status]

    return (
      <Card key={enrollment.id} className="w-full overflow-hidden border border-slate-200/60 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl group">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row-reverse gap-6 items-stretch">
            <Link
              href={courseLink}
              className="group relative w-full aspect-square md:w-[240px] md:h-[240px] rounded-xl overflow-hidden bg-muted shrink-0"
            >
              <Image
                src={getFileUrl(enrollment.course.image) || "/images/course-placeholder.png"}
                alt={enrollment.course.title}
                fill
                unoptimized
                sizes="(min-width: 768px) 240px, 100vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            <div className="flex-1 flex flex-col gap-4 text-right">
              <div className="space-y-2">
                <Link href={courseLink} className="hover:text-primary transition-colors">
                  <h3 className="text-lg sm:text-xl font-bold leading-snug">{enrollment.course.title}</h3>
                </Link>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                  {enrollment.course.shortDescription || enrollment.course.description}
                </p>
                <div className="flex flex-wrap items-center justify-start gap-2 pt-1" dir="rtl">
                  <div className="flex items-center gap-1.5 text-muted-foreground ml-1">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">المدربين:</span>
                  </div>
                  {(enrollment.course.trainers || [enrollment.course.trainer]).map((t, idx) => (
                    <div 
                      key={t.id + idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100/50 text-blue-700 text-xs font-bold shadow-sm"
                    >
                      {t.avatar ? (
                        <div className="relative h-4 w-4 rounded-full overflow-hidden border border-blue-200">
                          <Image src={getFileUrl(t.avatar) || "/images/avatar-placeholder.png"} alt={t.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-blue-200 flex items-center justify-center text-[10px] text-blue-700">
                          {t.name.charAt(0)}
                        </div>
                      )}
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isActive ? (
                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm space-y-1">
                  <div className="flex items-center justify-end gap-2 text-primary">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">الدرس القادم</span>
                  </div>
                  <div className="text-foreground flex items-center gap-2" dir="rtl">
                    {nextDate ? (
                      <>
                        <span className="whitespace-nowrap">{formatDate(nextDate)}</span>
                        <span className="text-muted-foreground select-none">•</span>
                        <span className="whitespace-nowrap">{formatTime(nextDate)}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">لا توجد جلسات قادمة</span>
                    )}
                  </div>
                </div>
              ) : currentStatus ? (
                <div className={`rounded-xl border border-transparent ${currentStatus.color} px-4 py-3 text-sm flex items-center gap-3`} dir="rtl">
                  <currentStatus.icon className={`h-5 w-5 ${currentStatus.iconColor} shrink-0`} />
                  <p className={`${currentStatus.textColor} font-medium leading-relaxed`}>
                    {currentStatus.message}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row-reverse gap-2 pt-1">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link href={courseLink}>تفاصيل الدورة</Link>
                </Button>

                {['active', 'preliminary', 'pending_payment'].includes(enrollment.status) && (
                  <Dialog open={showCancelDialog && selectedEnrollment === enrollment.id} onOpenChange={(open) => {
                    setShowCancelDialog(open)
                    if (!open) setSelectedEnrollment(null)
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleCancelEnrollment(enrollment.id)}
                        disabled={isUpdating}
                      >
                        <X className="ml-2 h-4 w-4" />
                        إلغاء
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>تأكيد إلغاء التسجيل</DialogTitle>
                        <DialogDescription>
                          هل أنت متأكد من رغبتك في إلغاء تسجيلك في دورة {enrollment.course.title}؟
                          سيتم استرداد المبلغ وفقًا لسياسة الاسترداد.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-2 justify-end mt-4">
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isUpdating}>
                          تراجع
                        </Button>
                        <Button variant="destructive" onClick={confirmCancellation} disabled={isUpdating}>
                          {isUpdating ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeCourses = getEnrollmentsByStatus('active')
  const pendingCourses = getEnrollmentsByStatus('pending')
  const completedCourses = getEnrollmentsByStatus('completed')
  const cancelledCourses = getEnrollmentsByStatus('cancelled')

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">دوراتي التعليمية</h1>
        <p className="text-muted-foreground">
          تابع تقدمك في الدورات وقم بإدارة رحلتك التعليمية
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card className="border border-border/60 shadow-sm bg-blue-50/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">دورات سارية</p>
              <p className="text-2xl font-bold">{activeCourses.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-amber-50/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">طلبات معلقة</p>
              <p className="text-2xl font-bold">{pendingCourses.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-green-50/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">دورات مكتملة</p>
              <p className="text-2xl font-bold">{completedCourses.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-red-50/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">دورات ملغاة</p>
              <p className="text-2xl font-bold">{cancelledCourses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="grid w-full grid-cols-4 gap-2 rounded-full bg-muted/50 p-1 mb-8">
          <StatusPill
            status="active"
            isActive={activeTab === "active"}
            onClick={() => setActiveTab("active")}
          />
          <StatusPill
            status="pending"
            isActive={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
          />
          <StatusPill
            status="completed"
            isActive={activeTab === "completed"}
            onClick={() => setActiveTab("completed")}
          />
          <StatusPill
            status="cancelled"
            isActive={activeTab === "cancelled"}
            onClick={() => setActiveTab("cancelled")}
          />
        </div>

        <TabsContent value="active" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeCourses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="لا توجد دورات سارية"
              description="لم تقم بالتسجيل في أي دورة حالياً. ابدأ رحلتك التعليمية اليوم!"
              actionLabel="استعراض الدورات"
              actionLink="/courses"
            />
          ) : (
            activeCourses.map(renderCourseCard)
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {pendingCourses.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="لا توجد طلبات معلقة"
              description="جميع طلباتك تمت معالجتها بنجاح."
            />
          ) : (
            pendingCourses.map(renderCourseCard)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {completedCourses.length === 0 ? (
            <EmptyState
              icon={Award}
              title="لا توجد دورات مكتملة"
              description="أكمل دوراتك لتحصل على الشهادات وتطور مهاراتك."
            />
          ) : (
            completedCourses.map(renderCourseCard)
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {cancelledCourses.length === 0 ? (
            <EmptyState
              icon={X}
              title="لا توجد دورات ملغاة"
              description="سجل الدورات الملغاة سيظهر هنا."
            />
          ) : (
            cancelledCourses.map(renderCourseCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, actionLabel, actionLink }: any) {
  return (
    <Card className="glass-card border-dashed border-2 border-muted-foreground/20">
      <CardContent className="pt-12 pb-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          {description}
        </p>
        {actionLabel && (
          <Button asChild>
            <Link href={actionLink}>{actionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}


