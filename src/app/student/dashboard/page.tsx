"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Play, TrendingUp, Users, Bell, ChevronLeft, Search, Heart, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { studentService, StudentDashboardData } from "@/lib/student-service"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { NotificationMessage } from "@/components/notifications/notification-message"

const courseImagePlaceholder = "/images/course-abstract.svg"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function resolveImage(src: string | null | undefined): string {
  if (!src) return courseImagePlaceholder
  if (src.startsWith("http")) return src
  const cleanSrc = src.replace(/\\/g, "/")
  const separator = cleanSrc.startsWith("/") ? "" : "/"
  return `${API_BASE}${separator}${cleanSrc}`
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  useEffect(() => {
    studentService.getDashboard()
      .then(dashboardData => {
        setData(dashboardData)
        setFavoriteIds(dashboardData.favoriteIds)
      })
      .catch(() => setError("فشل تحميل بيانات لوحة التحكم"))
      .finally(() => setLoading(false))
  }, [])

  const toggleFavorite = async (id: string) => {
    try {
      const result = await studentService.toggleWishlist(id)
      setFavoriteIds((prev) =>
        result.added ? [...prev, id] : prev.filter((item) => item !== id)
      )
      if (result.added) {
        toast.success("تم إضافة الدورة إلى قائمة الرغبات")
      } else {
        toast.success("تم إزالة الدورة من قائمة الرغبات")
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث قائمة الرغبات")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="h-7 w-7 animate-spin ml-3" />
        <span className="text-lg">جاري تحميل لوحة التحكم...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-red-500">
        <AlertCircle className="h-10 w-10" />
        <p className="text-lg">{error || "حدث خطأ غير متوقع"}</p>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true)
            setError(null)
            studentService.getDashboard()
              .then(dashboardData => {
                setData(dashboardData)
                setFavoriteIds(dashboardData.favoriteIds)
              })
              .catch(() => setError("فشل تحميل بيانات لوحة التحكم"))
              .finally(() => setLoading(false))
          }}
        >
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  const { user: dashboardUser, currentCourses, recentNotifications, stats } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Compact Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl mix-blend-overlay" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6">
          <div className="space-y-3 text-center md:text-right max-w-2xl">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                مرحباً بك، {dashboardUser.name} 👋
              </h1>
              <p className="text-blue-100 text-sm md:text-base opacity-90">
                لديك <span className="font-bold text-white">{stats.activeCourses} دورات نشطة</span> في حسابك.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md rounded-full px-5 h-9" asChild>
                <Link href="/student/my-courses">
                  <BookOpen className="ml-2 h-4 w-4" />
                  دوراتي
                </Link>
              </Button>
              <Button variant="secondary" size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm border-0 rounded-full px-5 h-9" asChild>
                <Link href="/student/courses">
                  <Search className="ml-2 h-4 w-4" />
                  تصفح الدورات
                </Link>
              </Button>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="hidden lg:flex gap-4">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 min-w-[90px]">
              <div className="text-2xl font-bold mb-0.5">{stats.activeCourses}</div>
              <div className="text-[10px] font-medium text-blue-200 uppercase">دورات نشطة</div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 min-w-[90px]">
              <div className="text-2xl font-bold mb-0.5">{stats.completedCourses}</div>
              <div className="text-[10px] font-medium text-blue-200 uppercase">دورات مكتملة</div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Right Column: Courses */}
        <div className="lg:col-span-2 space-y-6">

          {/* Current Courses List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                دوراتي الحالية
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 h-8" asChild>
                <Link href="/student/my-courses">
                  عرض الكل <ChevronLeft className="mr-1 h-3 w-3" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {currentCourses.map((course) => (
                <div key={course.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden md:h-[260px]">
                  <div className="flex flex-col md:flex-row h-full">
                    {/* Course Image */}
                    <div className="relative w-full md:w-[260px] h-[260px] shrink-0 overflow-hidden">
                      <Image
                        src={resolveImage(course.image)}
                        alt={course.title}
                        fill
                        sizes="(min-width: 768px) 260px, 100vw"
                        className="object-cover"
                        style={{ display: "block" }}
                        unoptimized={true}
                      />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(course.id)}
                        aria-pressed={favoriteIds.includes(course.id)}
                        aria-label={favoriteIds.includes(course.id) ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                        className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm ring-1 ring-slate-200/60 transition-all duration-150 ${favoriteIds.includes(course.id)
                          ? "text-red-600 scale-105"
                          : "hover:text-red-600"
                          }`}
                      >
                        <Heart
                          className={`h-4 w-4 transition-opacity ${favoriteIds.includes(course.id) ? "fill-current" : ""
                            }`}
                        />
                      </button>
                    </div>

                    <div className="flex-1 p-4 flex flex-col text-right">
                      <div className="space-y-2">
                        <Badge className="w-fit bg-slate-100 text-slate-600 hover:bg-slate-100 border-0 text-[10px] px-2 py-0.5 h-5">
                          {course.category}
                        </Badge>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {course.shortDescription}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium">المدرب:</span> {course.trainer}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-end pt-3 border-t border-gray-50">
                        <Button size="sm" className="rounded-full px-5 h-8 text-xs bg-gray-900 hover:bg-indigo-600 text-white transition-colors shadow-none hover:shadow-md" asChild>
                          <Link href={`/student/courses/${course.id}`}>
                            <Play className="ml-1.5 h-3 w-3 fill-current" />
                            متابعة التعلم
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left Column: Sidebar */}
        <div className="space-y-6">

          {/* Wishlist Summary */}
          <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-gray-100 rounded-xl">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                <Heart className="h-4 w-4 text-rose-500" />
                قائمة الرغبات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">عدد الدورات المحفوظة</p>
                  <div className="text-2xl font-bold text-gray-900">{favoriteIds.length}</div>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-8" asChild>
                  <Link href="/student/wishlist">
                    عرض الكل
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-gray-100 rounded-xl">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                <Bell className="h-4 w-4 text-orange-500" />
                آخر الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {recentNotifications.map((notification) => (
                  <Link key={notification.id} href={(notification as any).actionUrl || "/student/notifications"} className="p-3 hover:bg-orange-50/30 transition-colors flex gap-3 items-start group">
                    <div className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 shadow-sm transition-transform group-hover:scale-125 ${notification.type === 'material' ? 'bg-blue-500 shadow-blue-200' : 'bg-orange-500 shadow-orange-200'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900 group-hover:text-orange-700 transition-colors line-clamp-1 flex items-center justify-between">
                        {notification.title}
                        {(notification as any).actionUrl && <ExternalLink className="h-2.5 w-2.5 text-orange-400 group-hover:text-orange-600 transition-colors" />}
                      </h4>
                      <NotificationMessage message={notification.message} />
                      <span className="text-[9px] text-gray-400 mt-1 block font-medium">
                        {notification.time ? formatDate(new Date(notification.time)) : 'منذ فترة'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="p-3 bg-gray-50/50 border-t border-gray-100">
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-gray-900 hover:bg-white h-8" asChild>
                  <Link href="/student/notifications">
                    عرض كل الإشعارات
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
