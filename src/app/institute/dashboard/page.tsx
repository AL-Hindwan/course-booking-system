"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, MapPin, Clock, TrendingUp, Plus, Loader2 } from "lucide-react"
import { instituteService } from "@/lib/institute-service"
import { format } from "date-fns"

export default function InstituteDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const result = await instituteService.getDashboard()
        setData(result)
      } catch (err: any) {
        setError(err?.response?.data?.message || "فشل في تحميل لوحة التحكم")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل لوحة التحكم...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { institute, stats, recentBookings, upcomingCourses } = data

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">مقبول</Badge>
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">قيد المراجعة</Badge>
      case 'pending_payment':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">بانتظار الدفع</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">مرفوض</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">ملغي</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Premium Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl mix-blend-overlay" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6">
          <div className="space-y-3 text-center md:text-right max-w-2xl">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                مرحباً بك، {institute.adminName} 👋
              </h1>
              <p className="text-purple-100 text-sm md:text-base opacity-90">
                إدارة {institute.name} - لديك <span className="font-bold text-white">{stats.roomBookingsToday} حجوزات اليوم</span> وإجمالي <span className="font-bold text-white">{stats.totalCourses} دورات</span>.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md rounded-full px-5 h-9" asChild>
                <Link href="/institute/courses/create">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة دورة
                </Link>
              </Button>
              <Button variant="secondary" size="sm" className="bg-white text-purple-700 hover:bg-purple-50 shadow-sm border-0 rounded-full px-5 h-9" asChild>
                <Link href="/institute/room-bookings">
                  <Calendar className="ml-2 h-4 w-4" />
                  جدول القاعات
                </Link>
              </Button>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="hidden lg:flex gap-4">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 min-w-[90px]">
              <div className="text-2xl font-bold mb-0.5">{stats.totalStudents}</div>
              <div className="text-[10px] font-medium text-purple-200 uppercase tracking-wider">طالب</div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 min-w-[90px]">
              <div className="text-2xl font-bold mb-0.5">{stats.totalCourses}</div>
              <div className="text-[10px] font-medium text-purple-200 uppercase tracking-wider">دورة</div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 min-w-[120px]">
              <div className="text-2xl font-bold mb-0.5">{stats.totalEarnings.toLocaleString()}</div>
              <div className="text-[10px] font-medium text-purple-200 uppercase tracking-wider">الأرباح (ر.ي)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Main Content */}
        <div className="space-y-6">

          {/* Recent Room Bookings */}
          <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-gray-100 rounded-xl">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                <Clock className="h-4 w-4 text-purple-600" />
                أحدث طلبات حجز القاعات
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                <Link href="/institute/room-bookings">عرض الكل</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentBookings.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  لا توجد حجوزات حتى الآن
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentBookings.map((booking: any) => (
                    <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{booking.courseTitle}</p>
                            <p className="text-xs text-gray-500 mb-1">{booking.trainer}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-medium text-gray-700">{booking.room}</span>
                              <span>•</span>
                              {format(new Date(booking.startDate), 'yyyy-MM-dd')} → {format(new Date(booking.endDate), 'yyyy-MM-dd')}
                            </div>
                          </div>
                        </div>
                        {getBookingStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Courses */}
          <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-gray-100 rounded-xl">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-gray-900">
                <BookOpen className="h-4 w-4 text-purple-600" />
                الدورات القادمة
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                <Link href="/institute/courses">إدارة الدورات</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingCourses.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  لا توجد دورات قادمة
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {upcomingCourses.map((course: any) => (
                    <div key={course.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{course.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">المدرب: {course.trainer}</p>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {course.enrolledStudents}/{course.maxStudents} طالب
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <Calendar className="h-3 w-3" />
                        يبدأ في: {format(new Date(course.startDate), 'yyyy-MM-dd')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}